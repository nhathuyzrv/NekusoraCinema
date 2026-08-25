from datetime import datetime, timedelta
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from django.core.exceptions import ValidationError
from nekusoracinema.models import *
from django.db import transaction

class ImageURLMixin:
    image_fields = ['image']
    def to_representation(self, instance):
        data = super().to_representation(instance)
        for field in getattr(self, 'image_fields', []):
            image = getattr(instance, field, None)
            if image and hasattr(image, 'url'):
                try:
                    data[field] = image.url
                except ValueError:
                    data[field] = None
        return data


class UserLiteSerializer(ImageURLMixin, serializers.ModelSerializer):
    image_fields = ['avatar']

    class Meta:
        model = User
        fields = ['avatar', 'first_name', 'last_name']


class SimpleUserSerializer(UserLiteSerializer):
    class Meta:
        model = UserLiteSerializer.Meta.model
        fields = UserLiteSerializer.Meta.fields + ['email', 'role', 'gender', 'loyalty_points', 'date_of_birth', 'phone_number']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.role.value in ['MANAGER', 'STAFF']:
            staff_profile = getattr(instance, 'staff_profile', None)
            if staff_profile:
                data['staff_profile'] = SimpleStaffProfileSerializer(staff_profile, context=self.context).data

        return data


class UserSerializer(SimpleUserSerializer):
    staff_profile = serializers.JSONField(write_only=True, required=False)

    class Meta:
        model = SimpleUserSerializer.Meta.model
        fields = SimpleUserSerializer.Meta.fields + ['password', 'staff_profile']
        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }

    def validate_password(self, value):
        try:
            validate_password(password=value)
        except ValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def create(self, validated_data):
        staff_profile = validated_data.pop('staff_profile', None)

        with transaction.atomic():
            user = User(**validated_data)
            user.username = user.email
            user.set_password(user.password)
            user.save()

            if user.role in [UserRole.STAFF, UserRole.MANAGER]:
                if not staff_profile:
                    raise serializers.ValidationError({'staff_profile': 'Thiếu thông tin tài khoản nhân viên'})

                s = SimpleStaffProfileSerializer(data=staff_profile)
                s.is_valid(raise_exception=True)
                s.save(user=user)

        return user


class UserUpdateSerializer(ImageURLMixin, serializers.ModelSerializer):
    image_fields = ['avatar']

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'gender', 'date_of_birth', 'phone_number', 'avatar']


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name', 'slug']


class ManageGenreCreateUpdateSerializer(GenreSerializer):
    class Meta:
        model = GenreSerializer.Meta.model
        fields = GenreSerializer.Meta.fields + ['updated_at']
        read_only_fields = ['updated_at']


class ActorSerializer(ImageURLMixin, serializers.ModelSerializer):
    image_fields = ['photo']

    class Meta:
        model = Actor
        fields = ['id', 'name', 'photo']


class SimpleMovieSerializer(ImageURLMixin, serializers.ModelSerializer):
    image_fields = ['poster']

    class Meta:
        model = Movie
        fields = ['id', 'title', 'age_rating' ,'poster', 'trailer_url', 'status', 'slug']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        avg_rating = getattr(instance, 'avg_rating')
        rating_count = getattr(instance, 'rating_count')

        data['avg_rating'] = round(avg_rating, 1) if avg_rating else None
        data['rating_count'] = rating_count if rating_count else None
        return data


class MovieDetailsSerializer(SimpleMovieSerializer):
    genres = GenreSerializer(many=True, read_only=True)
    actors = ActorSerializer(many=True, read_only=True)
    class Meta:
        model = SimpleMovieSerializer.Meta.model
        fields = SimpleMovieSerializer.Meta.fields + ['duration', 'release_date', 'country', 'director', 'description', 'genres', 'actors']


class MovieLocationSerializer(ImageURLMixin, serializers.ModelSerializer):
    image_fields = ['poster']
    class Meta:
        model = Movie
        fields = ['id', 'title', 'age_rating', 'duration', 'poster', 'status']


class RatingSerializer(serializers.ModelSerializer):
    user = UserLiteSerializer(read_only=True)

    class Meta:
        model = Rating
        fields = ['id', 'user', 'movie', 'verified_booking', 'score', 'comment', 'created_at']


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'name']


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name', 'location', 'address', 'phone_number', 'opening_time', 'closing_time']


class ManageBranchUpdateSerializer(BranchSerializer):
    class Meta:
        model = BranchSerializer.Meta.model
        fields = BranchSerializer.Meta.fields + ['updated_at']
        read_only_fields = ['updated_at']


class ScreeningFormatSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScreeningFormat
        fields = ['id', 'code', 'name']


class ManageScreeningFormatCreateUpdateSerializer(ScreeningFormatSerializer):
    class Meta:
        model = ScreeningFormatSerializer.Meta.model
        fields = ScreeningFormatSerializer.Meta.fields + ['updated_at']
        read_only_fields = ['updated_at']


class CinemaRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = CinemaRoom
        fields = ['id', 'name', 'branch', 'total_rows', 'seats_per_row']


class ManageCinemaRoomCreateUpdateSerializer(serializers.ModelSerializer):
    force_update = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = CinemaRoom
        fields = ['id', 'branch', 'name', 'total_rows', 'seats_per_row', 'active', 'updated_at', 'force_update']
        read_only_fields = ['updated_at']


class SeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seat
        fields = ['id', 'room', 'row_label', 'seat_number', 'seat_code']


class ShowtimeSerializer(serializers.ModelSerializer):
    branch = BranchSerializer(source='room.branch', read_only=True)
    location = LocationSerializer(source='room.branch.location', read_only=True)
    screening_format = ScreeningFormatSerializer(read_only=True)
    room = CinemaRoomSerializer(read_only=True)

    class Meta:
        model = Showtime
        fields = ['id', 'show_date', 'start_time', 'end_time', 'price', 'status', 'movie', 'room', 'branch', 'location', 'screening_format']


class TicketSerializer(serializers.ModelSerializer):
    seat = SeatSerializer(read_only=True)

    class Meta:
        model = Ticket
        fields = ['id', 'seat', 'price', 'status']


class SimpleProductSerializer(ImageURLMixin, serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'image', 'price', 'product_type']


class ComboItemSerializer(serializers.ModelSerializer):
    item = SimpleProductSerializer(read_only=True)

    class Meta:
        model = ComboItem
        fields = ['id', 'item', 'quantity']


class SimpleProductDetailSerializer(SimpleProductSerializer):
    combo_items = ComboItemSerializer(many=True, read_only=True)

    class Meta:
        model = SimpleProductSerializer.Meta.model
        fields = SimpleProductSerializer.Meta.fields + ['combo_items']


class BookingProductSerializer(serializers.ModelSerializer):
    product = SimpleProductSerializer(read_only=True)

    class Meta:
        model = BookingProduct
        fields = ['id', 'product', 'quantity', 'unit_price', 'subtotal']


class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = ['id', 'code', 'name', 'description', 'discount_type', 'discount_value', 'min_order_amount', 'max_discount_amount']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['name'] = instance.name + f' - Giảm {instance.discount_value}'
        data['name'] += '%' if instance.discount_type == PromotionDiscountType.PERCENT else 'đ'
        if instance.max_discount_amount:
            data['name'] += f', tối đa {instance.max_discount_amount}đ'

        return data


class ManagePromotionCreateSerializer(PromotionSerializer):
    class Meta:
        model = PromotionSerializer.Meta.model
        fields = PromotionSerializer.Meta.fields + ['start_date', 'end_date', 'usage_limit', 'per_user_limit', 'active']


class BookingPromotionSerializer(serializers.ModelSerializer):
    promotion = PromotionSerializer(read_only=True)

    class Meta:
        model = BookingPromotion
        fields = ['id', 'promotion', 'discount_amount']


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ['id', 'code', 'name']


class PaymentSerializer(serializers.ModelSerializer):
    method = PaymentMethodSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'order_code', 'method', 'amount', 'status', 'transaction_ref', 'paid_at', 'checkout_url', 'qr_code_url', 'deeplink', 'expired_at', 'cancelled_at', 'created_at', 'provider_response']


class BookingSerializer(serializers.ModelSerializer):
    showtime = ShowtimeSerializer(read_only=True)
    movie = MovieLocationSerializer(source='showtime.movie', read_only=True)
    tickets = TicketSerializer(source='booking_tickets', many=True, read_only=True)
    products = BookingProductSerializer(source='booking_products', many=True, read_only=True)
    promotion = BookingPromotionSerializer(source='booking_promotion', read_only=True)
    payment = PaymentSerializer(read_only=True)
    checked_in_by = UserLiteSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_code', 'status', 'showtime', 'movie', 'tickets', 'products', 'promotion', 'payment', 'seat_amount', 'product_amount',
            'discount_amount', 'points_used', 'points_used_amount', 'points_earned', 'final_amount', 'held_until', 'confirmed_at',
            'is_checked_in', 'checked_in_at', 'checked_in_by', 'created_at'
        ]


class CheckinBookingSerializer(serializers.Serializer):
    is_checked_in = serializers.BooleanField()


class HoldSeatsInputSerializer(serializers.Serializer):
    showtime = serializers.IntegerField()
    seats = serializers.ListField(child=serializers.IntegerField(), min_length=1, max_length=8)


class ProductItemInputSerializer(serializers.Serializer):
    product = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class SetProductsInputSerializer(serializers.Serializer):
    items = ProductItemInputSerializer(many=True, required=False, default=list)


class ApplyPromotionInputSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=30)


class RedeemPointsInputSerializer(serializers.Serializer):
    points = serializers.IntegerField(min_value=0)


class CreatePaymentInputSerializer(serializers.Serializer):
    method = serializers.IntegerField()
    email = serializers.EmailField()


class SimpleStaffProfileSerializer(serializers.ModelSerializer):
    branch = BranchSerializer(read_only=True)
    class Meta:
        model = StaffProfile
        fields = ['id', 'branch', 'position', 'hire_date']


POSITION_TO_ROLE = {
    StaffPosition.COUNTER_STAFF: UserRole.STAFF,
    StaffPosition.CHECKER_STAFF: UserRole.STAFF,
    StaffPosition.BRANCH_MANAGER: UserRole.MANAGER,
    StaffPosition.SYSTEM_MANAGER: UserRole.MANAGER,
}

class StaffProfileSerializer(SimpleStaffProfileSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = SimpleStaffProfileSerializer.Meta.model
        fields = SimpleStaffProfileSerializer.Meta.fields + ['user', 'active', 'updated_at']
        read_only_fields = ['updated_at']

    def validate(self, attrs):
        updated_position = attrs.get('position')
        if updated_position and self.instance:
            request = self.context.get('request')
            cur_position = self.instance.position
            is_self = request and request.user == self.instance.user

            if not is_self and cur_position in [StaffPosition.BRANCH_MANAGER, StaffPosition.SYSTEM_MANAGER]:
                raise serializers.ValidationError({'position': 'Bạn không thể thay đổi thông tin của quản lý khác'})

        return attrs

    def update(self, instance, validated_data):
        updated_position = validated_data.get('position')
        if updated_position and updated_position != instance.position:
            mapped_role = POSITION_TO_ROLE.get(StaffPosition(updated_position))
            if mapped_role:
                instance.user.role = mapped_role.value
                instance.user.save(update_fields=['role'])
        return super().update(instance, validated_data)


class ManageMovieSerializer(ImageURLMixin, serializers.ModelSerializer):
    image_fields = ['poster']
    genres = GenreSerializer(many=True, read_only=True)
    actors = ActorSerializer(many=True)

    class Meta:
        model = Movie
        fields = ['id', 'title', 'poster', 'status', 'release_date', 'slug', 'updated_at', 'age_rating', 'duration', 'country', 'director', 'description', 'trailer_url', 'genres', 'actors']
        read_only_fields = ['updated_at']


class ManageShowtimeSerializer(serializers.ModelSerializer):
    movie = ManageMovieSerializer(read_only=True)
    room = CinemaRoomSerializer(read_only=True)
    branch = BranchSerializer(source='room.branch', read_only=True)
    screening_format = ScreeningFormatSerializer(read_only=True)
    created_by = UserLiteSerializer(read_only=True)

    class Meta:
        model = Showtime
        fields = ['id', 'movie', 'room', 'branch', 'screening_format', 'show_date', 'start_time', 'end_time', 'price', 'status', 'created_by', 'updated_at']


class ManageShowtimeCreateUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Showtime
        fields = ['movie', 'room', 'screening_format', 'show_date', 'start_time', 'end_time', 'price', 'status']
        read_only_fields = ['updated_at', 'end_time']

    def validate(self, attrs):
        movie = attrs.get('movie') or (self.instance.movie if self.instance else None)
        room = attrs.get('room') or (self.instance.room if self.instance else None)
        show_date = attrs.get('show_date') or (self.instance.show_date if self.instance else None)
        start_time = attrs.get('start_time') or (self.instance.start_time if self.instance else None)

        if movie and not movie.active:
            raise serializers.ValidationError({'movie': 'Phim này đã ngừng hoạt động'})

        if room and not room.active:
            raise serializers.ValidationError({'room': 'Phòng chiếu này đã ngừng hoạt động'})

        today = utils.get_timezone_now().date()
        if show_date <= today:
            raise ValidationError({'show_date': 'Ngày chiếu phải sau ngày hôm nay'})

        if movie and start_time:
            start_dt = datetime.combine(today, start_time)
            end_dt = start_dt + timedelta(minutes=movie.duration)

            end_time = end_dt.time()
            attrs['end_time'] = end_time
        else:
            end_time = getattr(self.instance, 'end_time', None)

        if room and show_date and start_time and end_time:
            query = Showtime.objects.filter(active=True, room=room, show_date=show_date, status__in=[ShowtimeStatus.SCHEDULED], start_time__lt=end_time, end_time__gt=start_time)

            if self.instance:
                has_bookings = self.instance.showtime_bookings.filter(status__in=[BookingStatus.CONFIRMED, BookingStatus.HOLDING]).exists()
                if has_bookings:
                    raise ValidationError({'detail': 'Không thể chỉnh sửa chiếu đang có đơn đặt vé'})
                query = query.exclude(pk=self.instance.pk)

            if query.exists():
                conflict = query.first()
                raise serializers.ValidationError({'start_time': f'Khung giờ bị trùng với suất chiếu {conflict.start_time.strftime("%H:%M")}-{conflict.end_time.strftime("%H:%M")} của phim "{conflict.movie.title}" tại {room.name}'})

        return attrs


class ManageProductSerializer(ImageURLMixin, serializers.ModelSerializer):
    items = ProductItemInputSerializer(many=True, required=False, write_only=True)
    combo_items = ComboItemSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'image', 'price', 'product_type', 'active', 'combo_items', 'items', 'updated_at']
        read_only_fields = ['updated_at']

    def validate(self, attrs):
        ptype = attrs.get('product_type', getattr(self.instance, 'product_type', ProductType.SINGLE))
        items = attrs.get('items', None)

        if ptype == ProductType.COMBO and not self.instance and not items:
            raise serializers.ValidationError({'items': 'Vui lòng chọn ít nhất 1 sản phẩm đơn cho combo'})

        return attrs


class StatsOverviewSerializer(serializers.Serializer):
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=0)
    total_bookings = serializers.IntegerField()
    total_tickets = serializers.IntegerField()
    total_product_revenue = serializers.DecimalField(max_digits=15, decimal_places=0)
    total_promotions_used = serializers.IntegerField()
    total_points_used = serializers.IntegerField()


class StatsRevenueByMonthSerializer(serializers.Serializer):
    month = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=15, decimal_places=0)
    bookings = serializers.IntegerField()


class StatsRevenueByMovieSerializer(serializers.Serializer):
    movie = serializers.CharField()
    revenue = serializers.DecimalField(max_digits=15, decimal_places=0)
    bookings = serializers.IntegerField()


class StatsRevenueByBranchSerializer(serializers.Serializer):
    branch = serializers.CharField()
    revenue = serializers.DecimalField(max_digits=15, decimal_places=0)
    bookings = serializers.IntegerField()


class StatsRevenueByShowtimeSerializer(serializers.Serializer):
    st_id = serializers.IntegerField()
    movie = serializers.CharField()
    branch = serializers.CharField()
    show_date = serializers.DateField()
    start_time = serializers.TimeField()
    revenue = serializers.DecimalField(max_digits=15, decimal_places=0)
    bookings = serializers.IntegerField()
    tickets = serializers.IntegerField()