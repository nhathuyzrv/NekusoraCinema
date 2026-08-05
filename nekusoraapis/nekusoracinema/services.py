import redis
from decimal import Decimal
from datetime import timedelta
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from nekusoracinema import tasks
from nekusoracinema.models import *
from django.utils import timezone
from django.db import models


# Seat hold
redis_client = redis.Redis(host='127.0.0.1', port=6379, db=1, decode_responses=True, socket_keepalive=True, socket_connect_timeout=5)
SEAT_HOLD_MINUTES = getattr(settings, 'SEAT_HOLD_MINUTES', 20)


def _seat_hold_key(showtime_id, seat_id):
    return f"seat_hold:{showtime_id}:{seat_id}"


def hold_seats(showtime_id, seat_ids, user_id, ttl=SEAT_HOLD_MINUTES * 60):
    held_now = []
    conflict = []

    for seat_id in seat_ids:
        key = _seat_hold_key(showtime_id, seat_id)
        acquired = redis_client.set(key, str(user_id), nx=True, ex=ttl)
        if acquired:
            held_now.append(seat_id)
        elif redis_client.get(key) != str(user_id):
            conflict.append(seat_id)

    if conflict:
        release_seats(showtime_id, held_now, user_id)
        return False, conflict

    return True, held_now


def release_seats(showtime_id, seat_ids, user_id=None):
    for seat_id in seat_ids:
        key = _seat_hold_key(showtime_id, seat_id)
        if user_id is None or redis_client.get(key) == str(user_id):
            redis_client.delete(key)


def get_held_seat_ids(showtime_id):
    keys = redis_client.keys(_seat_hold_key(showtime_id, '*'))
    return [int(k.rsplit(':', 1)[-1]) for k in keys]


# Broadcast for each time seat status update
def broadcast_seat_update(showtime_id):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    booked = list(Ticket.objects.filter(showtime_id=showtime_id, status=TicketStatus.BOOKED).values_list('seat_id', flat=True))
    held = get_held_seat_ids(showtime_id)

    group_channel = async_to_sync(channel_layer.group_send)
    group_channel(f"showtime_{showtime_id}", {
        "type": "seat_update",
        "booked": booked,
        "held": held
    })


def calculate_promotion_discount(promotion, base_amount):
    if promotion.discount_type == PromotionDiscountType.PERCENT:
        discount = base_amount * promotion.discount_value / Decimal(100)
    else:
        discount = promotion.discount_value

    if promotion.max_discount_amount:
        discount = min(discount, promotion.max_discount_amount)

    return min(discount, base_amount)


# Booking Service
POINTS_TO_VND = Decimal(200)
VND_TO_POINTS = Decimal(10000)
MAX_SEATS_PER_BOOKING = 8


def recalculate(booking):
    total = (booking.seat_amount + booking.product_amount - booking.discount_amount - booking.points_used_amount)
    booking.final_amount = max(total, Decimal(0))
    booking.save(update_fields=['product_amount', 'discount_amount', 'points_used', 'points_used_amount', 'final_amount'])
    return booking


def create_holding_booking(user, showtime_id, seat_ids):
    existing_holding_bookings = Booking.objects.filter(active=True, customer=user, status=BookingStatus.HOLDING)
    if existing_holding_bookings.exists():
        raise ValidationError({'booking': 'Bạn đang có một đơn đặt vé chưa hoàn tất, vui lòng hoàn tất hoặc hủy bỏ đơn trước đó nếu bạn muốn đặt đơn khác'})

    if not seat_ids:
        raise ValidationError({'seats': 'Vui lòng chọn ít nhất 1 ghế'})
    if len(seat_ids) > MAX_SEATS_PER_BOOKING:
        raise ValidationError({'seats': f'Bạn chỉ được chọn tối đa {MAX_SEATS_PER_BOOKING} ghế'})

    showtime = get_object_or_404(Showtime, pk=showtime_id, active=True, status=ShowtimeStatus.SCHEDULED)

    success, result = hold_seats(showtime_id, seat_ids, user.pk, ttl=SEAT_HOLD_MINUTES * 60)
    if not success:
        broadcast_seat_update(showtime_id)
        raise ValidationError({'seats': f'Ghế vừa được người khác chọn, vui lòng thử lại'})

    try:
        with transaction.atomic():
            seats = Seat.objects.filter(pk__in=seat_ids, room_id=showtime.room.pk, active=True)
            if seats.count() != len(seat_ids):
                raise ValidationError({'seats': 'Một số ghế không hợp lệ'})

            seat_amount = showtime.price * len(seat_ids)
            held_until = timezone.now() + timedelta(minutes=SEAT_HOLD_MINUTES)

            booking = Booking.objects.create(customer=user, showtime=showtime, seat_amount=seat_amount, final_amount=seat_amount, held_until=held_until)
            Ticket.objects.bulk_create([
                Ticket(booking=booking, showtime=showtime, seat=seat, price=showtime.price)
                for seat in seats
            ])

            tasks.auto_cancel_booking.apply_async((booking.pk,), eta=held_until)

    except Exception:
        release_seats(showtime_id, seat_ids, user.pk)
        raise

    broadcast_seat_update(showtime_id)
    return booking


def cancel_booking(booking, status):
    if booking.status != BookingStatus.HOLDING:
        raise ValidationError('Đơn đặt vé không thể huỷ ở trạng thái hiện tại')

    seat_ids = list(booking.booking_tickets.values_list('seat_id', flat=True))
    release_seats(booking.showtime_id, seat_ids, booking.customer_id)
    booking.booking_tickets.update(status=TicketStatus.CANCELLED)
    booking.status = BookingStatus.CANCELLED if status == 'CANCELLED' else BookingStatus.HOLDING
    booking.save(update_fields=['status'])

    broadcast_seat_update(booking.showtime_id)
    return booking


def set_products(booking, items):
    booking.booking_products.all().delete()

    if not items:
        booking.product_amount = Decimal(0)
    else:
        product_ids = [i['product'] for i in items]
        products = {p.pk: p for p in Product.objects.filter(pk__in=product_ids, active=True)}

        rows = []
        total = Decimal(0)
        for item in items:
            product = products.get(item['product'])
            if not product:
                raise ValidationError({'items': f"Sản phẩm #{item['product']} không hợp lệ"})

            qty = item['quantity']
            subtotal = product.price * qty
            rows.append(BookingProduct(booking=booking, product=product, quantity=qty, unit_price=product.price, subtotal=subtotal))
            total += subtotal

        BookingProduct.objects.bulk_create(rows)
        booking.product_amount = total

    new_base = booking.seat_amount + booking.product_amount

    try:
        bp = booking.booking_promotion
        promo = bp.promotion
        if new_base < promo.min_order_amount or not promo.active:
            bp.delete()
            booking.discount_amount = Decimal(0)
        else:
            new_discount = calculate_promotion_discount(promo, new_base)
            bp.discount_amount = new_discount
            bp.save(update_fields=['discount_amount'])
            booking.discount_amount = new_discount
    except BookingPromotion.DoesNotExist:
        pass

    available_after_discount = new_base - booking.discount_amount
    if booking.points_used_amount > available_after_discount:
        booking.points_used = 0
        booking.points_used_amount = Decimal(0)

    return recalculate(booking)


def apply_promotion_code(booking, code):
    try:
        promo = Promotion.objects.get(code__iexact=code.strip(), active=True)
    except Promotion.DoesNotExist:
        raise ValidationError({'code': 'Mã khuyến mãi không hợp lệ'})

    now = timezone.now()
    if not (promo.start_date <= now <= promo.end_date):
        raise ValidationError({'code': 'Mã khuyến mãi đã hết hạn hoặc chưa bắt đầu'})
    if promo.usage_limit and promo.used_count >= promo.usage_limit:
        raise ValidationError({'code': 'Mã khuyến mãi đã hết lượt sử dụng'})

    user_used_count = PromotionUsage.objects.filter(promotion=promo, user=booking.customer).count()
    if user_used_count >= promo.per_user_limit:
        limit_msg = ("1 lần" if promo.per_user_limit == 1 else f"tối đa {promo.per_user_limit} lần")
        raise ValidationError({'code': f'Tài khoản của bạn chỉ được áp dụng mã này {limit_msg}'})

    base_amount = booking.seat_amount + booking.product_amount
    if base_amount < promo.min_order_amount:
        raise ValidationError({'code': f'Đơn đặt vé cần tối thiểu {promo.min_order_amount:,.0f}đ để áp dụng mã này'})

    discount = calculate_promotion_discount(promo, base_amount)

    _delete_booking_promotion(booking)
    BookingPromotion.objects.create(booking=booking, promotion=promo, discount_amount=discount)

    booking.discount_amount = discount
    return recalculate(booking)


def _delete_booking_promotion(booking):
    try:
        booking.booking_promotion.delete()
    except BookingPromotion.DoesNotExist:
        pass


def remove_promotion(booking):
    _delete_booking_promotion(booking)
    booking.discount_amount = Decimal(0)
    return recalculate(booking)


def redeem_points(booking, points):
    user = booking.customer
    if points < 0:
        raise ValidationError({'points': 'Số điểm không hợp lệ'})
    if points > user.loyalty_points:
        raise ValidationError({'points': f'Bạn không thể quy đổi quá {user.loyalty_points} điểm'})

    base_after_discount = booking.seat_amount + booking.product_amount - booking.discount_amount
    max_points_amount = max(base_after_discount, Decimal(0))
    requested_amount = Decimal(points) * POINTS_TO_VND
    if requested_amount > max_points_amount:
        max_allowed_points = int(max_points_amount // POINTS_TO_VND)
        raise ValidationError({'points': f'Bạn chỉ có thể quy đổi tối đa {max_allowed_points} điểm cho đơn này'})

    booking.points_used = points
    booking.points_used_amount = requested_amount
    return recalculate(booking)


def clear_points(booking):
    booking.points_used = 0
    booking.points_used_amount = Decimal(0)
    return recalculate(booking)


def confirm_booking_payment_success(booking, payment):
    with transaction.atomic():
        booking.status = BookingStatus.CONFIRMED
        booking.confirmed_at = timezone.now()

        points_earned = int(booking.final_amount // VND_TO_POINTS)
        booking.points_earned = points_earned
        booking.save(update_fields=['status', 'confirmed_at', 'points_earned'])

        booking.booking_tickets.filter(status=TicketStatus.HELD).update(status=TicketStatus.BOOKED)

        user = booking.customer
        net_points = points_earned - booking.points_used
        if net_points != 0:
            user.loyalty_points = max(user.loyalty_points + net_points, 0)
            user.save(update_fields=['loyalty_points'])

        if booking.points_used > 0:
            PointTransaction.objects.create(user=user, booking=booking, points=-booking.points_used, transaction_type=PointTransactionType.REDEEM, description=f'Quy đổi điểm cho đơn {booking.booking_code}')
        if points_earned > 0:
            PointTransaction.objects.create(user=user, booking=booking, points=points_earned, transaction_type=PointTransactionType.EARN, description=f'Tích điểm từ đơn {booking.booking_code}')

        try:
            bp = booking.booking_promotion
            PromotionUsage.objects.create(promotion=bp.promotion, user=booking.customer, booking=booking)
            Promotion.objects.filter(pk=bp.promotion_id).update(used_count=models.F('used_count') + 1)
        except BookingPromotion.DoesNotExist:
            pass

    broadcast_seat_update(booking.showtime_id)
    # TODO: gửi email vé điện tử (tasks.send_ticket_email.delay(booking.pk))
    return booking