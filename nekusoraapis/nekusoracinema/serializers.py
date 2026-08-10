from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from django.core.exceptions import ValidationError

from nekusoracinema.models import *


class ImageURLMixin:
    image_fields = ['image']
    def to_representation(self, instance):
        data = super().to_representation(instance)
        for field in getattr(self, 'image_fields', []):
            image_attr = getattr(instance, field, None)
            if image_attr and hasattr(image_attr, 'url'):
                try:
                    data[field] = image_attr.url
                except ValueError:
                    data[field] = None
        return data


class UserLiteSerializer(ImageURLMixin, serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['avatar', 'first_name', 'last_name']


class SimpleUserSerializer(UserLiteSerializer):
    image_fields = ['avatar']

    class Meta:
        model = UserLiteSerializer.Meta.model
        fields = UserLiteSerializer.Meta.fields + ['email', 'role', 'gender', 'loyalty_points', 'date_of_birth', 'phone_number']
        extra_kwargs = {
            'role': {
                'read_only': True,
            }
        }


class UserSerializer(SimpleUserSerializer):
    class Meta:
        model = SimpleUserSerializer.Meta.model
        fields = SimpleUserSerializer.Meta.fields + ['password']
        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }

    def validate_password(self, value):
        try:
            validate_password(password=value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def create(self, validated_data):
        user = User(**validated_data)
        user.username = user.email
        user.set_password(user.password)
        user.save()
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


class ScreeningFormatSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScreeningFormat
        fields = ['id', 'code', 'name']


class CinemaRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = CinemaRoom
        fields = ['id', 'name', 'branch', 'total_rows', 'seats_per_row']


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

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_code', 'status', 'showtime', 'movie', 'tickets', 'products', 'promotion', 'payment', 'seat_amount', 'product_amount',
            'discount_amount', 'points_used', 'points_used_amount', 'points_earned', 'final_amount', 'held_until', 'confirmed_at', 'created_at'
        ]


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