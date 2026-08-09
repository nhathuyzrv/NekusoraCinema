from datetime import date

from django.core.cache import cache
from django.db.models import Prefetch
from django.db.models.aggregates import Avg, Count
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, generics, parsers, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from nekusoracinema import serializers, paginators, perms, utils, tasks, services
from nekusoracinema.models import *
from nekusoracinema.patterns import OTP_MODE, require_holding_booking_not_expired, require_holding_booking, PAYMENT_STRATEGY


class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    parser_classes = [parsers.MultiPartParser, parsers.JSONParser]

    @action(methods=['get', 'patch'], url_path='current-user', detail=False,
            permission_classes=[permissions.IsAuthenticated])
    def current_user(self, request):
        user = request.user
        if request.method == 'PATCH':
            serializer = serializers.UserUpdateSerializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()

        return Response(serializers.UserSerializer(user).data, status=status.HTTP_200_OK)


class AuthViewSet(viewsets.ViewSet):

    def _get_mode(self, request):
        key = request.data.get('mode', '').strip()
        mode = OTP_MODE.get(key)
        if not mode:
            return None, Response({'message': 'mode không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)
        return mode, None

    @action(methods=['post'], url_path='send-otp', detail=False)
    def auth_send_otp(self, request):
        mode, err = self._get_mode(request)
        if err:
            return err

        email, error_msg = mode.validate_request(request.data)
        if error_msg:
            return Response({'message': error_msg}, status=status.HTTP_400_BAD_REQUEST)

        tasks.send_otp_email.delay(email, mode.mode_key)
        return Response({'message': 'Mã xác nhận đã được gửi'}, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='verify-otp', detail=False)
    def auth_verify_otp(self, request):
        mode, err = self._get_mode(request)
        if err:
            return err

        email = request.data.get('email', '').strip().lower()
        otp_input = request.data.get('otp', '').strip()
        print(email, otp_input)
        if not email or not otp_input:
            return Response({'message': 'Vui lòng cung cấp đầy đủ thông tin'}, status=status.HTTP_400_BAD_REQUEST)

        cached_otp = cache.get(f"otp:{mode.mode_key}:{email}")
        if not cached_otp or cached_otp != otp_input:
            return Response({'message': 'OTP không hợp lệ hoặc đã hết hạn'}, status=status.HTTP_400_BAD_REQUEST)

        cache.delete(f"otp:{mode.mode_key}:{email}")
        token = utils.generate_otp(32)
        cache.set(f"verified:{mode.mode_key}:{email}", token, timeout=600)
        return Response({'token': token}, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='complete', detail=False)
    def auth_complete(self, request):
        mode, err = self._get_mode(request)
        if err:
            return err

        email = request.data.get('email', '').strip().lower()
        token = request.data.get('token', '').strip()
        if not email or not token:
            return Response({'message': 'Vui lòng cung cấp đầy đủ thông tin'}, status=status.HTTP_400_BAD_REQUEST)

        stored_token = cache.get(f"verified:{mode.mode_key}:{email}")
        if not stored_token or stored_token != token:
            return Response({'message': 'Token không hợp lệ hoặc đã hết hạn'}, status=status.HTTP_400_BAD_REQUEST)

        cache.delete(f"verified:{mode.mode_key}:{email}")
        return mode.complete(email, request.data)


class GenreViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Genre.objects.filter(active=True)
    serializer_class = serializers.GenreSerializer


class MovieViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Movie.objects.filter(active=True)
    pagination_class = paginators.MovieItemPaginator

    def get_permissions(self):
        if self.action in ['movie_ratings_view'] and self.request.method in ['POST']:
            return [perms.IsCustomer()]
        if self.action in ['movie_my_rating_view']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.action in ['retrieve']:
            return serializers.MovieDetailsSerializer
        return serializers.SimpleMovieSerializer

    def get_queryset(self):
        query = self.queryset.annotate(avg_rating=Avg('movie_ratings__score'), rating_count=Count('movie_ratings'))
        if self.action in ['retrieve']:
            query = query.prefetch_related('genres','actors',
                                           Prefetch('movie_ratings', queryset=Rating.objects.filter(active=True)))

        q_title = self.request.query_params.get('title')
        if q_title:
            query = query.filter(title__icontains=q_title)

        q_status = self.request.query_params.get('status')
        if q_status:
            query = query.filter(status=q_status)

        q_genres = self.request.query_params.getlist('genre')
        if q_genres:
            query = (query.filter(genres__id__in=q_genres)
                     .annotate(num_matches=Count('genres__id', distinct=True))
                     .filter(num_matches=len(q_genres)))

        return query

    @action(methods=['get', 'post'], url_path='ratings', detail=True)
    def movie_ratings_view(self, request, pk):
        movie = self.get_object()

        if request.method == 'POST':
            s = serializers.RatingSerializer(data={
                **request.data,
                'movie': movie.pk,
                'user': request.user.pk,
            }, context={'request': request})
            s.is_valid(raise_exception=True)
            rating = s.save()
            return Response(serializers.RatingSerializer(rating).data, status=status.HTTP_201_CREATED)

        ratings = (movie.movie_ratings.filter(active=True).order_by('-created_at')
                   .select_related('user'))
        paginator = paginators.RatingItemPaginator()
        page = paginator.paginate_queryset(ratings, request, view=self)

        return paginator.get_paginated_response(serializers.RatingSerializer(page, many=True).data)

    @action(methods=['get'], url_path='ratings/my', detail=True)
    def movie_my_rating_view(self, request, pk):
        movie = self.get_object()
        user = request.user
        rating = get_object_or_404(Rating, movie=movie, user=user)

        return Response(serializers.RatingSerializer(rating).data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path='showtimes', detail=True)
    def movie_showtimes_view(self, request, pk):
        movie = self.get_object()
        showtimes = (movie.movie_showtimes.filter(active=True, status__in=[ShowtimeStatus.SCHEDULED, ShowtimeStatus.COMPLETED]).order_by('start_time')
                     .select_related('screening_format', 'room__branch__location'))

        q_date = request.query_params.get('date')
        if q_date:
            showtimes = showtimes.filter(show_date=q_date)

        q_location = request.query_params.get('location')
        if q_location:
            showtimes = showtimes.filter(room__branch__location_id=q_location)

        return Response(serializers.ShowtimeSerializer(showtimes, many=True).data, status=status.HTTP_200_OK)


class RatingViewSet(viewsets.ViewSet, generics.UpdateAPIView):
    queryset = Rating.objects.filter(active=True)
    serializer_class = serializers.RatingSerializer
    permission_classes = [perms.RatingOwner]


class LocationViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Location.objects.filter(active=True).order_by('name')
    serializer_class = serializers.LocationSerializer

    @action(methods=['get'], url_path='branches', detail=True)
    def location_branches_view(self, request, pk):
        location = self.get_object()
        branches = location.branches.filter(active=True).order_by('name')

        return Response(serializers.BranchSerializer(branches, many=True).data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path='movies', detail=True)
    def location_movies_view(self, request, pk):
        location = self.get_object()
        today = date.today()
        movies = Movie.objects.filter(
            movie_showtimes__room__branch__location_id=location.pk,
            movie_showtimes__show_date__gte=today,
            movie_showtimes__active=True
        ).distinct()

        paginator = paginators.MovieItemPaginator()
        page = paginator.paginate_queryset(movies, request, view=self)

        return paginator.get_paginated_response(serializers.MovieLocationSerializer(page, many=True).data)


class BranchViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Branch.objects.filter(active=True).order_by('name')
    serializer_class = serializers.BranchSerializer

    @action(methods=['get'], url_path='rooms', detail=True)
    def branch_rooms_view(self, request, pk):
        branch = self.get_object()
        rooms = branch.rooms.filter(active=True).order_by('name')

        return Response(serializers.CinemaRoomSerializer(rooms, many=True).data, status=status.HTTP_200_OK)


class ScreeningFormatViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = ScreeningFormat.objects.filter(active=True).order_by('code')
    serializer_class = serializers.ScreeningFormatSerializer


class CinemaRoomViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = CinemaRoom.objects.filter(active=True).order_by('branch')
    serializer_class = serializers.CinemaRoomSerializer

    def get_queryset(self):
        query = self.queryset
        q_branch = self.request.query_params.get('branch')
        if q_branch:
            query = self.queryset.filter(branch=q_branch)

        return query

    @action(methods=['get'], url_path='seats', detail=True)
    def room_seats_view(self, request, pk):
        room = self.get_object()
        seats = room.seats.filter(active=True).order_by('seat_code')

        return Response(serializers.SeatSerializer(seats, many=True).data, status=status.HTTP_200_OK)


class ProductViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Product.objects.filter(active=True).order_by('product_type', 'name')
    serializer_class = serializers.SimpleProductSerializer

    def get_serializer_class(self):
        if self.action in ['retrieve']:
            return serializers.SimpleProductDetailSerializer
        return serializers.SimpleProductSerializer


class PaymentMethodViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = PaymentMethod.objects.filter(active=True)
    serializer_class = serializers.PaymentMethodSerializer


class BookingsViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView, generics.CreateAPIView, generics.DestroyAPIView):
    queryset = Booking.objects.filter(active=True)
    lookup_field = 'booking_code'
    lookup_url_kwarg = 'pk'

    def get_permissions(self):
        if self.action in ['create']:
            return [perms.IsCustomer()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ['create']:
            return serializers.HoldSeatsInputSerializer
        return serializers.BookingSerializer

    def get_queryset(self):
        query = (self.queryset.filter(customer=self.request.user)
                 .select_related('showtime__movie', 'showtime__room__branch__location', 'showtime__screening_format')
                 .prefetch_related('booking_tickets__seat', 'booking_products__product', 'booking_promotion__promotion', 'payment__method'))

        if self.action in ['list']:
            q_status = self.request.query_params.get('status')
            if q_status:
                query = query.filter(status=q_status)

        return query

    def create(self, request, *args, **kwargs):
        s = serializers.HoldSeatsInputSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        booking = services.create_holding_booking(request.user, s.validated_data['showtime'], s.validated_data['seats'])

        return Response(serializers.BookingSerializer(booking).data, status=status.HTTP_201_CREATED)

    @require_holding_booking
    def destroy(self, request, pk=None, booking=None, *args, **kwargs):
        delete_status = BookingStatus.CANCELLED if booking.held_until >= timezone.now() else BookingStatus.EXPIRED
        services.delete_booking(booking, delete_status)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(methods=['put'], url_path='products', detail=True)
    @require_holding_booking_not_expired
    def products(self, request, pk=None, booking=None):
        s = serializers.SetProductsInputSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        booking = services.set_products(booking, s.validated_data['items'])
        return Response(serializers.BookingSerializer(booking).data, status=status.HTTP_200_OK)

    @action(methods=['post', 'delete'], url_path='promotion', detail=True)
    @require_holding_booking_not_expired
    def promotion(self, request, pk=None, booking=None):
        if request.method == 'DELETE':
            booking = services.remove_promotion(booking)
        else:
            s = serializers.ApplyPromotionInputSerializer(data=request.data)
            s.is_valid(raise_exception=True)
            booking = services.apply_promotion_code(booking, s.validated_data['code'])

        return Response(serializers.BookingSerializer(booking).data, status=status.HTTP_200_OK)

    @action(methods=['post', 'delete'], url_path='points', detail=True)
    @require_holding_booking_not_expired
    def points(self, request, pk=None, booking=None):
        if request.method == 'DELETE':
            booking = services.clear_points(booking)
        else:
            s = serializers.RedeemPointsInputSerializer(data=request.data)
            s.is_valid(raise_exception=True)
            booking = services.redeem_points(booking, s.validated_data['points'])

        return Response(serializers.BookingSerializer(booking).data, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='payment', detail=True)
    @require_holding_booking_not_expired
    def payment(self, request, pk=None, booking=None):
        s = serializers.CreatePaymentInputSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        method = get_object_or_404(PaymentMethod, pk=s.validated_data['method'], active=True)

        payment_strategy = PAYMENT_STRATEGY.get(method.code)
        if not payment_strategy:
            return Response({'message': f'Phương thức thanh toán "{method.name}" đang được cập nhật'},
                            status=status.HTTP_400_BAD_REQUEST)

        payment = payment_strategy.create(booking, method, s.validated_data)
        return Response(serializers.PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class PayOSWebhookViewSet(viewsets.ViewSet):

    def create(self, request):
        try:
            services.handle_payos_webhook(data=request.data)
        except Exception:
            pass
        return Response(status=status.HTTP_200_OK)