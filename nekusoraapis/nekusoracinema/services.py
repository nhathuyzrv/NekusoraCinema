import hashlib
import hmac
import redis
from decimal import Decimal
from datetime import timedelta
from nekusoraapis import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from nekusoracinema import tasks
from nekusoracinema.models import *
from django.utils import timezone
from django.db import models
from payos import PayOS
import requests

redis_client = redis.Redis(host='127.0.0.1', port=6379, db=1, decode_responses=True, socket_keepalive=True, socket_connect_timeout=5)
SEAT_HOLD_MINUTES = getattr(settings, 'SEAT_HOLD_MINUTES', 8)


class SeatRedisService:

    @staticmethod
    def seat_hold_key(showtime_id, seat_id):
        return f"seat_hold:{showtime_id}:{seat_id}"

    @classmethod
    def hold_seats(cls, showtime_id, seat_ids, user_id, ttl=SEAT_HOLD_MINUTES * 60):
        acquired_seats = []
        conflicted = []

        with redis_client.pipeline() as pipe:
            for sid in seat_ids:
                key = cls.seat_hold_key(showtime_id, sid)
                ok = redis_client.set(key, str(user_id), nx=True, ex=ttl)
                if ok:
                    acquired_seats.append(sid)
                elif redis_client.get(key) != str(user_id):
                    conflicted.append(sid)

            if conflicted:
                for sid in acquired_seats:
                    pipe.delete(cls.seat_hold_key(showtime_id, sid))
                pipe.execute()
                return False, conflicted

        return True, acquired_seats

    @classmethod
    def release_seats(cls, showtime_id, seat_ids, user_id=None):
        with redis_client.pipeline() as pipe:
            for sid in seat_ids:
                key = cls.seat_hold_key(showtime_id, sid)
                if user_id is None or redis_client.get(key) == str(user_id):
                    pipe.delete(key)
            pipe.execute()

    @classmethod
    def get_held_seat_ids(cls, showtime_id):
        pattern = cls.seat_hold_key(showtime_id, '*')
        return [int(k.rsplit(':', 1)[-1]) for k in redis_client.scan_iter(pattern)]

    @classmethod
    def broadcast_seat_update(cls, showtime_id):
        layer = get_channel_layer()
        if not layer:
            return

        booked = list(Ticket.objects.filter(showtime_id=showtime_id, status=TicketStatus.BOOKED).values_list('seat_id', flat=True))
        held = cls.get_held_seat_ids(showtime_id)

        send_group = async_to_sync(layer.group_send)
        send_group(f"showtime_{showtime_id}", {
            "type": "seat_update",
            "booked": booked,
            "held": held
        })


class PromotionCalculatorService:

    @staticmethod
    def calculate_discount(promotion, base_amount):
        if promotion.discount_type == PromotionDiscountType.PERCENT:
            discount = base_amount * promotion.discount_value / Decimal(100)
        else:
            discount = promotion.discount_value

        if promotion.max_discount_amount:
            discount = min(discount, promotion.max_discount_amount)

        return min(discount, base_amount)


class BookingNotificationService:

    @staticmethod
    def broadcast_booking_confirmed(booking):
        layer = get_channel_layer()
        if not layer:
            return

        send_group = async_to_sync(layer.group_send)
        send_group(f"user_{booking.customer.id}", {
            "type": "send_booking_notification",
            "booking_code": booking.booking_code,
        })


class PaymentGatewayService:

    @staticmethod
    def cancel_payos_payment_link(payment, cancel_status):
        if not payment or payment.status != PaymentStatus.PENDING or not payment.payment_link_id:
            return

        try:
            client = PayOS(
                client_id=settings.PAYOS_CLIENT_ID,
                api_key=settings.PAYOS_API_KEY,
                checksum_key=settings.PAYOS_CHECKSUM_KEY,
            )
            client.payment_requests.cancel(payment.order_code)
        except Exception:
            pass

        REASON_MAP = {
            BookingStatus.CANCELLED: 'Người dùng hủy đặt vé',
            BookingStatus.EXPIRED: 'Vé hết hạn thanh toán',
        }

        payment.status = PaymentStatus.FAILED
        payment.cancelled_at = timezone.now()
        payment.cancel_reason = REASON_MAP[cancel_status]
        payment.save(update_fields=['status', 'cancelled_at', 'cancel_reason'])

    @classmethod
    def handle_payos_webhook(cls, data, callback):
        client = PayOS(
            client_id=settings.PAYOS_CLIENT_ID,
            api_key=settings.PAYOS_API_KEY,
            checksum_key=settings.PAYOS_CHECKSUM_KEY,
        )

        client.webhooks.verify(data)

        webhook_data = data.get('data', {})
        code = data.get('code', '')
        order_code = webhook_data.get('orderCode')

        if order_code is None:
            raise ValidationError({'orderCode': 'Invalid orderCode'})

        payment = get_object_or_404(Payment, order_code=order_code)
        booking = payment.booking

        if payment.status in (PaymentStatus.SUCCESS, PaymentStatus.FAILED, PaymentStatus.REFUNDED) or booking.status in (BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.EXPIRED):
            return booking

        if code == '00':
            payment.transaction_ref = webhook_data.get('reference', '')
            payment.save(update_fields=['transaction_ref'])
            callback(booking=booking, payment=payment)
        elif code == '01':
            with transaction.atomic():
                payment.status = PaymentStatus.FAILED
                payment.cancelled_at = timezone.now()
                payment.cancel_reason = 'Người dùng hủy giao dịch'
                payment.save(update_fields=['status', 'cancelled_at', 'cancel_reason'])

        return booking

    @staticmethod
    def verify_momo_signature(data):
        secret_key = settings.MOMO_SECRET_KEY
        access_key = settings.MOMO_ACCESS_KEY

        raw = (
            f"accessKey={access_key}"
            f"&amount={data.get('amount')}"
            f"&extraData={data.get('extraData', '')}"
            f"&message={data.get('message', '')}"
            f"&orderId={data.get('orderId')}"
            f"&orderInfo={data.get('orderInfo', '')}"
            f"&orderType={data.get('orderType', '')}"
            f"&partnerCode={data.get('partnerCode')}"
            f"&payType={data.get('payType', '')}"
            f"&requestId={data.get('requestId')}"
            f"&responseTime={data.get('responseTime')}"
            f"&resultCode={data.get('resultCode')}"
            f"&transId={data.get('transId')}"
        )

        expected = hmac.new(secret_key.encode(), raw.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, data.get('signature', ''))

    @classmethod
    def handle_momo_ipn(cls, data, callback):
        if not cls.verify_momo_signature(data):
            raise ValidationError({'signature': 'Invalid signature'})

        order_id = data.get('orderId', '')
        result_code = int(data.get('resultCode', -1))

        booking_code = order_id.split('_')[0] if '_' in order_id else order_id
        payment = get_object_or_404(Payment, booking__booking_code=booking_code)
        booking = payment.booking

        if payment.status in (PaymentStatus.SUCCESS, PaymentStatus.FAILED, PaymentStatus.REFUNDED) or booking.status in (BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.EXPIRED):
            return booking

        if result_code == 0:
            payment.transaction_ref = str(data.get('transId', ''))
            payment.save(update_fields=['transaction_ref'])
            callback(booking=booking, payment=payment)
        else:
            with transaction.atomic():
                payment.status = PaymentStatus.FAILED
                payment.cancelled_at = timezone.now()
                payment.cancel_reason = data.get('message', 'Giao dịch thất bại')
                payment.save(update_fields=['status', 'cancelled_at', 'cancel_reason'])

        return booking


    @classmethod
    def handle_paypal_capture(cls, data, callback):
        order_id = data.get("token")
        payer_id = data.get("PayerID")

        if not order_id or not payer_id:
            raise ValidationError({"token": "Missing token or PayerID"})

        payment = get_object_or_404(Payment, payment_link_id=order_id)
        booking = payment.booking

        if payment.status in (PaymentStatus.SUCCESS, PaymentStatus.FAILED, PaymentStatus.REFUNDED) or booking.status in (BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.EXPIRED):
            return booking

        token_response = requests.post(
            f"{settings.PAYPAL_BASE_URL}/v1/oauth2/token",
            headers={"Accept": "application/json"},
            data={"grant_type": "client_credentials"},
            auth=(settings.PAYPAL_CLIENT_ID, settings.PAYPAL_CLIENT_SECRET),
            timeout=10,
        )
        token_response.raise_for_status()
        access_token = token_response.json()["access_token"]

        capture_response = requests.post(
            f"{settings.PAYPAL_BASE_URL}/v2/checkout/orders/{order_id}/capture",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}",
            },
            timeout=10,
        ).json()

        status = capture_response.get("status")

        if status == "COMPLETED":
            capture_id = capture_response.get("purchase_units", [{}])[0].get("payments", {}).get("captures", [{}])[0].get("id", "")
            payment.transaction_ref = capture_id
            payment.save(update_fields=["transaction_ref"])
            callback(booking=booking, payment=payment)
        else:
            with transaction.atomic():
                payment.status = PaymentStatus.FAILED
                payment.cancelled_at = timezone.now()
                payment.cancel_reason = f"PayPal status: {status}"
                payment.save(update_fields=["status", "cancelled_at", "cancel_reason"])

        return booking


class BookingService:
    POINTS_TO_VND = Decimal(500)
    VND_TO_POINTS = Decimal(10000)
    MAX_SEATS_PER_BOOKING = 8
    VALID_BOOKING_CUTOFF_DISTANCE = 15
    MIN_SUBTOTAL_THRESHOLD = 10000

    @staticmethod
    def recalculate(booking):
        total = (booking.seat_amount + booking.product_amount - booking.discount_amount - booking.points_used_amount)
        booking.final_amount = max(total, Decimal(0))
        booking.save(update_fields=['product_amount', 'discount_amount', 'points_used', 'points_used_amount', 'final_amount'])
        return booking

    @classmethod
    def create_holding_booking(cls, user, showtime_id, seat_ids):
        holding_bk = Booking.objects.filter(active=True, customer=user, status=BookingStatus.HOLDING)
        if holding_bk.exists():
            raise ValidationError({'booking': 'Bạn đang có một đơn đặt vé chưa hoàn tất, vui lòng hoàn tất hoặc hủy bỏ đơn trước đó nếu bạn muốn đặt đơn khác'})

        if not seat_ids:
            raise ValidationError({'seats': 'Vui lòng chọn ít nhất 1 ghế'})
        if len(seat_ids) > cls.MAX_SEATS_PER_BOOKING:
            raise ValidationError({'seats': f'Bạn chỉ được chọn tối đa {cls.MAX_SEATS_PER_BOOKING} ghế'})

        showtime = get_object_or_404(Showtime, pk=showtime_id, active=True, status=ShowtimeStatus.SCHEDULED)

        cutoff = (utils.get_timezone_now() + timedelta(minutes=cls.VALID_BOOKING_CUTOFF_DISTANCE)).time()
        if showtime.show_date == utils.get_timezone_now().date() and showtime.start_time <= cutoff:
            raise ValidationError({'start_time': f"Hiện tại là {utils.get_timezone_now().time().strftime('%H:%M')}. Hệ thống ngừng nhận đặt vé trực tuyến trước suất chiếu {cls.VALID_BOOKING_CUTOFF_DISTANCE} phút, vui lòng liên hệ CSKH để được hỗ trợ"})

        success, result = SeatRedisService.hold_seats(showtime_id, seat_ids, user.pk, ttl=SEAT_HOLD_MINUTES * 60)
        if not success:
            SeatRedisService.broadcast_seat_update(showtime_id)
            raise ValidationError({'seats': 'Ghế vừa được người khác chọn, vui lòng thử lại'})

        try:
            with transaction.atomic():
                seats = Seat.objects.filter(pk__in=seat_ids, room_id=showtime.room.pk, active=True)
                if seats.count() != len(seat_ids):
                    raise ValidationError({'seats': 'Một số ghế không hợp lệ'})

                seat_total = showtime.price * len(seat_ids)
                expiry = timezone.now() + timedelta(minutes=SEAT_HOLD_MINUTES)

                booking = Booking.objects.create(customer=user, showtime=showtime, seat_amount=seat_total, final_amount=seat_total, held_until=expiry)
                Ticket.objects.bulk_create([
                    Ticket(booking=booking, showtime=showtime, seat=seat, price=showtime.price)
                    for seat in seats
                ])

                tasks.auto_expire_booking.apply_async((booking.pk,), eta=expiry)

        except Exception:
            SeatRedisService.release_seats(showtime_id, seat_ids, user.pk)
            raise

        SeatRedisService.broadcast_seat_update(showtime_id)
        return booking

    @staticmethod
    def delete_booking(booking, target_status):
        if booking.status != BookingStatus.HOLDING:
            raise ValidationError('Đơn đặt vé không thể hủy ở trạng thái hiện tại')

        try:
            PaymentGatewayService.cancel_payos_payment_link(booking.payment, target_status)
        except Payment.DoesNotExist:
            pass

        seat_ids = list(booking.booking_tickets.values_list('seat_id', flat=True))
        SeatRedisService.release_seats(booking.showtime_id, seat_ids, booking.customer_id)
        booking.booking_tickets.update(status=TicketStatus.CANCELLED)
        booking.status = target_status
        booking.save(update_fields=['status'])

        SeatRedisService.broadcast_seat_update(booking.showtime_id)
        return booking

    @classmethod
    def set_products(cls, booking, items):
        with transaction.atomic():
            booking.booking_products.all().delete()

            if not items:
                booking.product_amount = Decimal(0)
            else:
                pids = [i['product'] for i in items]
                product_map = {p.pk: p for p in Product.objects.filter(pk__in=pids, active=True)}

            rows = []
            total = Decimal(0)
            for item in items:
                prod = product_map.get(item['product'])
                if not prod:
                    raise ValidationError({'items': f"Sản phẩm #{item['product']} không hợp lệ"})

                qty = item['quantity']
                subtotal = prod.price * qty
                rows.append(BookingProduct(booking=booking, product=prod, quantity=qty, unit_price=prod.price, subtotal=subtotal))
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
                    updated_discount = PromotionCalculatorService.calculate_discount(promo, new_base)
                    bp.discount_amount = updated_discount
                    bp.save(update_fields=['discount_amount'])
                    booking.discount_amount = updated_discount
            except BookingPromotion.DoesNotExist:
                pass

            remaining = new_base - booking.discount_amount
            if booking.points_used_amount > remaining:
                booking.points_used = 0
                booking.points_used_amount = Decimal(0)

            return cls.recalculate(booking)

    @staticmethod
    def delete_booking_promotion(booking):
        try:
            booking.booking_promotion.delete()
            booking.booking_promotion = None
        except BookingPromotion.DoesNotExist:
            pass

    @classmethod
    def apply_promotion(cls, booking, code):
        try:
            promo = Promotion.objects.get(code__iexact=code.strip().upper(), active=True)
        except Promotion.DoesNotExist:
            raise ValidationError({'code': 'Mã khuyến mãi không hợp lệ'})

        now = timezone.now()
        if not (promo.start_date <= now <= promo.end_date):
            raise ValidationError({'code': 'Mã khuyến mãi đã hết hạn hoặc chưa bắt đầu'})
        if promo.usage_limit and promo.used_count >= promo.usage_limit:
            raise ValidationError({'code': 'Mã khuyến mãi đã hết lượt sử dụng'})

        times_used = PromotionUsage.objects.filter(promotion=promo, user=booking.customer).count()
        if times_used >= promo.per_user_limit:
            limit_label = ("1 lần" if promo.per_user_limit == 1 else f"tối đa {promo.per_user_limit} lần")
            raise ValidationError({'code': f'Tài khoản của bạn chỉ được áp dụng mã này {limit_label}'})

        base_amount = booking.seat_amount + booking.product_amount
        if base_amount < promo.min_order_amount:
            raise ValidationError({'code': f'Đơn đặt vé cần tối thiểu {promo.min_order_amount:,.0f}đ để áp dụng mã này'})

        discount = PromotionCalculatorService.calculate_discount(promo, base_amount)

        cls.delete_booking_promotion(booking)
        BookingPromotion.objects.create(booking=booking, promotion=promo, discount_amount=discount)
        booking.discount_amount = discount

        remaining = base_amount - discount
        max_pts_amount = max(remaining - cls.MIN_SUBTOTAL_THRESHOLD, Decimal(0))
        if booking.points_used_amount > max_pts_amount:
            booking.points_used = 0
            booking.points_used_amount = Decimal(0)

        return cls.recalculate(booking)

    @classmethod
    def remove_promotion(cls, booking):
        cls.delete_booking_promotion(booking)
        booking.discount_amount = Decimal(0)
        return cls.recalculate(booking)

    @classmethod
    def redeem_points(cls, booking, points):
        user = booking.customer
        if points < 0:
            raise ValidationError({'points': 'Số điểm không hợp lệ'})
        if points > user.loyalty_points:
            raise ValidationError({'points': f'Bạn không thể quy đổi quá {user.loyalty_points} điểm'})

        after_discount = booking.seat_amount + booking.product_amount - booking.discount_amount
        max_pts_amount = max(after_discount - cls.MIN_SUBTOTAL_THRESHOLD, Decimal(0))
        requested_amount = Decimal(points) * cls.POINTS_TO_VND
        if requested_amount > max_pts_amount:
            max_pts = int(max_pts_amount // cls.POINTS_TO_VND)
            raise ValidationError({'points': f'Bạn chỉ có thể quy đổi tối đa {max_pts} điểm cho đơn này'})

        booking.points_used = points
        booking.points_used_amount = requested_amount
        return cls.recalculate(booking)

    @classmethod
    def clear_points(cls, booking):
        booking.points_used = 0
        booking.points_used_amount = Decimal(0)
        return cls.recalculate(booking)

    @classmethod
    def confirm_booking(cls, booking, payment):
        with transaction.atomic():
            booking.status = BookingStatus.CONFIRMED
            booking.confirmed_at = timezone.now()

            earned = int(booking.final_amount // cls.VND_TO_POINTS)
            booking.points_earned = earned
            booking.save(update_fields=['status', 'confirmed_at', 'points_earned'])

            booking.booking_tickets.filter(status=TicketStatus.HELD).update(status=TicketStatus.BOOKED)

            user = booking.customer
            net = earned - booking.points_used
            if net != 0:
                user.loyalty_points = max(user.loyalty_points + net, 0)
                user.save(update_fields=['loyalty_points'])

            if booking.points_used > 0:
                PointTransaction.objects.create(
                    user=user, booking=booking,
                    points=-booking.points_used,
                    transaction_type=PointTransactionType.REDEEM,
                    description=f'Quy đổi điểm cho đơn {booking.booking_code}'
                )
            if earned > 0:
                PointTransaction.objects.create(
                    user=user, booking=booking,
                    points=earned,
                    transaction_type=PointTransactionType.EARN,
                    description=f'Tích điểm từ đơn {booking.booking_code}'
                )

            try:
                bp = booking.booking_promotion
                PromotionUsage.objects.create(promotion=bp.promotion, user=user, booking=booking)
                Promotion.objects.filter(pk=bp.promotion_id).update(used_count=models.F('used_count') + 1)
            except BookingPromotion.DoesNotExist:
                pass

            payment.status = PaymentStatus.SUCCESS
            payment.paid_at = timezone.now()
            payment.save(update_fields=['status', 'paid_at'])

        SeatRedisService.broadcast_seat_update(booking.showtime_id)

        BookingNotificationService.broadcast_booking_confirmed(booking)

        tasks.send_ticket_email.delay(email=payment.contact_email, booking_id=booking.pk)
        return booking

    @classmethod
    def handle_payos_webhook(cls, data):
        return PaymentGatewayService.handle_payos_webhook(data=data, callback=cls.confirm_booking)

    @classmethod
    def handle_momo_ipn(cls, data):
        return PaymentGatewayService.handle_momo_ipn(data=data, callback=cls.confirm_booking)

    @classmethod
    def handle_paypal_capture(cls, data):
        return PaymentGatewayService.handle_paypal_capture(data=data, callback=cls.confirm_booking)


def generate_row_label(row_idx):
    label = ""
    while row_idx > 0:
        row_idx, r = divmod(row_idx - 1, 26)
        label = chr(65 + r) + label
    return label


class CinemaRoomService:

    @staticmethod
    def check_active_showtimes(room):
        today = utils.get_timezone_now().date()
        return Showtime.objects.filter(active=True, room=room, show_date__gte=today, status=ShowtimeStatus.SCHEDULED).exists()

    @staticmethod
    @transaction.atomic
    def generate_seats(room):
        room.seats.all().delete()

        seats = []
        for r in range(1, room.total_rows + 1):
            row_label = generate_row_label(r)
            for s in range(1, room.seats_per_row + 1):
                seat_code = f"{row_label}{s}"
                seats.append(Seat(room=room, row_label=row_label, seat_number=s, seat_code=seat_code))

        Seat.objects.bulk_create(seats)

    @classmethod
    @transaction.atomic
    def create_room(cls, branch, name, total_rows, seats_per_row):
        room = CinemaRoom.objects.create(branch=branch, name=name, total_rows=total_rows, seats_per_row=seats_per_row)
        cls.generate_seats(room)
        return room

    @classmethod
    @transaction.atomic
    def update_room(cls, room, data, force_update=False):
        new_total_rows = data.get('total_rows', room.total_rows)
        new_seats_per_row = data.get('seats_per_row', room.seats_per_row)

        layout_changed = (new_total_rows != room.total_rows or new_seats_per_row != room.seats_per_row)

        if layout_changed and cls.check_active_showtimes(room) and not force_update:
            raise ValidationError({'warning': 'Phòng chiếu này hiện đang có các suất chiếu sắp diễn ra. Việc thay đổi bố trí phòng sẽ làm lại sơ đồ ghế.'})

        for attr, val in data.items():
            setattr(room, attr, val)
        room.save()

        if layout_changed:
            cls.generate_seats(room)

        return room


class ProductService:

    @staticmethod
    def save_combo_items(combo, items_data):
        ids = [i['item'] for i in items_data]

        single_map = {p.pk: p for p in Product.objects.filter(active=True, pk__in=ids, product_type=ProductType.SINGLE)}

        combo_items = []
        for entry in items_data:
            pid = entry['item']
            qty = entry.get('quantity', 1)

            if pid not in single_map:
                raise ValidationError({'items': f'Sản phẩm đơn số {pid} không tồn tại, đã ngừng kinh doanh hoặc không phải là sản phẩm đơn lẻ'})
            if qty <= 0:
                raise ValidationError({'items': 'Số lượng sản phẩm thành phần phải lớn hơn 0'})

            combo_items.append(ComboItem(combo=combo, item=single_map[pid], quantity=qty))

        ComboItem.objects.bulk_create(combo_items)

    @staticmethod
    @transaction.atomic
    def create_product(data):
        data['product_type'] = ProductType.SINGLE
        return Product.objects.create(**data)

    @classmethod
    @transaction.atomic
    def create_combo(cls, combo_data, items_data):
        if not items_data:
            raise ValidationError({'items': 'Combo phải chứa ít nhất 1 sản phẩm đơn'})

        combo_data['product_type'] = ProductType.COMBO
        combo = Product.objects.create(**combo_data)

        cls.save_combo_items(combo, items_data)
        return combo

    @classmethod
    @transaction.atomic
    def update_product(cls, product, data, items_data=None):
        for attr, val in data.items():
            setattr(product, attr, val)
        product.save()

        if product.product_type == ProductType.COMBO and items_data is not None:
            product.combo_items.all().delete()
            cls.save_combo_items(product, items_data)

        return product


class PromotionService:

    @staticmethod
    def create_promotion(data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if start_date and end_date and end_date <= start_date:
            raise ValidationError({'end_date': 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu'})

        return Promotion.objects.create(**data)