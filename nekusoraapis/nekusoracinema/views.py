from datetime import date, timedelta
from django.core.cache import cache
from django.db.models import Prefetch
from django.db.models.aggregates import Avg, Count
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, generics, parsers, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from nekusoracinema import serializers, paginators, perms, utils, tasks
from nekusoracinema.models import *
from nekusoracinema.patterns import OTP_MODE, require_holding_booking_not_expired, require_holding_booking, PAYMENT_STRATEGY
from nekusoracinema.services import BookingService, CinemaRoomService, PromotionService, ProductService


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

    def get_mode(self, request):
        key = request.data.get('mode', '').strip()
        mode = OTP_MODE.get(key)
        if not mode:
            return None, Response({'message': 'mode không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)
        return mode, None

    @action(methods=['post'], url_path='send-otp', detail=False)
    def auth_send_otp(self, request):
        mode, err = self.get_mode(request)
        if err:
            return err

        email, error_msg = mode.validate_request(request.data)
        if error_msg:
            return Response({'message': error_msg}, status=status.HTTP_400_BAD_REQUEST)

        tasks.send_otp_email.delay(email, mode.mode_key)
        return Response({'message': 'Mã xác nhận đã được gửi'}, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='verify-otp', detail=False)
    def auth_verify_otp(self, request):
        mode, err = self.get_mode(request)
        if err:
            return err

        email = request.data.get('email', '').strip().lower()
        otp_input = request.data.get('otp', '').strip()
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
        mode, err = self.get_mode(request)
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

    @action(methods=['post'], url_path='ws-ticket', detail=False, permission_classes=[permissions.IsAuthenticated])
    def get_ws_ticket(self, request):
        ticket = utils.generate_ws_code_str()
        user = request.user
        cache.set(f"ws_ticket:{ticket}", user.pk, timeout=5)

        return Response({'ticket': ticket}, status=status.HTTP_200_OK)


class GenreViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Genre.objects.filter(active=True)
    serializer_class = serializers.GenreSerializer


class MovieViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Movie.objects.filter(active=True)

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

        if self.action in ['list']:
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
            movie_booking = Booking.objects.filter(active=True, customer=request.user, showtime__movie=movie, is_checked_in=True).first()
            if not movie_booking:
                return Response({'message': 'Bạn cần có vé đã check-in của phim này mới có thể đánh giá'}, status=status.HTTP_400_BAD_REQUEST)

            s = serializers.RatingSerializer(data={
                **request.data,
                'movie': movie.pk,
                'user': request.user.pk,
                'verified_booking': movie_booking
            })
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
        today = utils.get_timezone_now().date()
        movie = self.get_object()
        showtimes = (movie.movie_showtimes.filter(active=True, show_date__gte=today, status__in=[ShowtimeStatus.SCHEDULED, ShowtimeStatus.COMPLETED]).order_by('start_time')
                     .select_related('screening_format', 'room__branch__location'))

        q_date = request.query_params.get('date')
        if q_date:
            showtimes = showtimes.filter(show_date=q_date)
            if q_date == str(today):
                current_time = utils.get_current_time()
                showtimes = showtimes.filter(start_time__gte=current_time)

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
        today = utils.get_timezone_now().date()
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


class BookingViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView, generics.CreateAPIView, generics.DestroyAPIView):
    queryset = Booking.objects.filter(active=True)
    pagination_class = paginators.BookingItemPaginator
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
        query = (self.queryset.filter(customer=self.request.user).order_by('-created_at')
                 .select_related('showtime__movie', 'showtime__room__branch__location', 'showtime__screening_format')
                 .prefetch_related('booking_tickets__seat', 'booking_products__product', 'booking_promotion__promotion', 'payment__method'))

        if self.action in ['list']:
            q_status = self.request.query_params.get('status')
            if q_status:
                query = query.filter(status=q_status)

            q_days = self.request.query_params.get('days')
            if q_days:
                since = utils.get_timezone_now() - timedelta(days=int(q_days))
                query = query.filter(created_at__gte=since)

            q_search = self.request.query_params.get('search')
            if q_search:
                query = query.filter(Q(showtime__movie__title__icontains=q_search) | Q(booking_code__icontains=q_search)).distinct()

        return query

    def create(self, request, *args, **kwargs):
        s = serializers.HoldSeatsInputSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        booking = BookingService.create_holding_booking(request.user, s.validated_data['showtime'], s.validated_data['seats'])

        return Response(serializers.BookingSerializer(booking).data, status=status.HTTP_201_CREATED)

    @require_holding_booking
    def destroy(self, request, pk=None, booking=None, *args, **kwargs):
        delete_status = BookingStatus.CANCELLED if booking.held_until >= timezone.now() else BookingStatus.EXPIRED
        BookingService.delete_booking(booking, delete_status)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(methods=['put'], url_path='products', detail=True)
    @require_holding_booking_not_expired
    def products(self, request, pk=None, booking=None):
        s = serializers.SetProductsInputSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        booking = BookingService.set_products(booking, s.validated_data['items'])
        return Response(serializers.BookingSerializer(booking).data, status=status.HTTP_200_OK)

    @action(methods=['post', 'delete'], url_path='promotion', detail=True)
    @require_holding_booking_not_expired
    def promotion(self, request, pk=None, booking=None):
        if request.method == 'DELETE':
            booking = BookingService.remove_promotion(booking)
        else:
            s = serializers.ApplyPromotionInputSerializer(data=request.data)
            s.is_valid(raise_exception=True)
            booking = BookingService.apply_promotion(booking, s.validated_data['code'])

        return Response(serializers.BookingSerializer(booking).data, status=status.HTTP_200_OK)

    @action(methods=['post', 'delete'], url_path='points', detail=True)
    @require_holding_booking_not_expired
    def points(self, request, pk=None, booking=None):
        if request.method == 'DELETE':
            booking = BookingService.clear_points(booking)
        else:
            s = serializers.RedeemPointsInputSerializer(data=request.data)
            s.is_valid(raise_exception=True)
            booking = BookingService.redeem_points(booking, s.validated_data['points'])

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


class PaymentViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Payment.objects.filter(active=True).order_by('-created_at')
    serializer_class = serializers.PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        query = self.queryset.select_related("booking").filter(booking__customer=self.request.user)
        q_order_code = self.request.query_params.get("orderCode")
        if q_order_code:
            query = query.filter(order_code=q_order_code)
        return query


class PayOSWebhookViewSet(viewsets.ViewSet):

    def create(self, request):
        try:
            BookingService.handle_payos_webhook(data=request.data)
        except Exception:
            pass
        return Response(status=status.HTTP_200_OK)


class ManageStaffViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.RetrieveUpdateAPIView):
    queryset = StaffProfile.objects.all().select_related('user', 'branch')
    serializer_class = serializers.StaffProfileSerializer
    permission_classes = [perms.IsBranchManager]

    def get_queryset(self):
        query = self.queryset

        q_branch = self.request.query_params.get('branch')
        if q_branch:
            query = query.filter(branch_id=q_branch)

        return query


class ManageLocationViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.RetrieveUpdateAPIView):
    queryset = Location.objects.filter(active=True).order_by('name')
    serializer_class = serializers.LocationSerializer
    permission_classes = [perms.IsBranchManager]

    @action(methods=['get', 'post'], url_path='branches', detail=True)
    def manage_branches_view(self, request, pk=None):
        location = self.get_object()

        if request.method == 'POST':
            s = serializers.BranchSerializer(data={
                **request.data,
                'location': location.pk
            })
            s.is_valid(raise_exception=True)
            branch = s.save()
            return Response(serializers.BranchSerializer(branch).data, status=status.HTTP_201_CREATED)

        return Response(serializers.LocationSerializer(location).data, status=status.HTTP_200_OK)


class ManageBranchViewSet(viewsets.ViewSet, generics.RetrieveUpdateAPIView):
    queryset = Branch.objects.filter(active=True)
    serializer_class = serializers.ManageBranchUpdateSerializer
    permission_classes = [perms.IsBranchManager]

    @action(methods=['get', 'post'], url_path='rooms', detail=True)
    def manage_rooms_view(self, request, pk=None):
        branch = self.get_object()

        if request.method == 'POST':
            s = serializers.ManageCinemaRoomCreateUpdateSerializer(data={
                **request.data,
                'branch': branch.pk
            })
            s.is_valid(raise_exception=True)
            validated_data = s.validated_data
            validated_data.pop('force_update', None)

            room = CinemaRoomService.create_room(**validated_data)

            return Response(serializers.CinemaRoomSerializer(room).data, status=status.HTTP_201_CREATED)

        return Response(serializers.CinemaRoomSerializer(branch).data, status=status.HTTP_200_OK)


class ManageCinemaRoomViewSet(viewsets.ViewSet, generics.RetrieveUpdateAPIView):
    queryset = CinemaRoom.objects.all().order_by('branch')
    serializer_class = serializers.ManageCinemaRoomCreateUpdateSerializer
    permission_classes = [perms.IsBranchManager]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        force_update = validated_data.pop('force_update', False)

        updated_room = CinemaRoomService.update_room(room=instance, data=validated_data, force_update=force_update)

        return Response(serializers.CinemaRoomSerializer(updated_room).data, status=status.HTTP_200_OK)


class ManageGenreViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.UpdateAPIView):
    queryset = Genre.objects.filter(active=True)
    serializer_class = serializers.ManageGenreCreateUpdateSerializer
    permission_classes = [perms.IsSystemManager]


class ManageMovieViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.RetrieveUpdateAPIView):
    queryset = Movie.objects.filter(active=True)
    permission_classes = [perms.IsSystemManager]
    serializer_class = serializers.ManageMovieSerializer

    def get_queryset(self):
        query = self.queryset
        if self.action in ['retrieve']:
            query = query.prefetch_related('genres', 'actors')

        if self.action in ['list']:
            q_title = self.request.query_params.get('title')
            if q_title:
                query = query.filter(title__icontains=q_title)

            q_status = self.request.query_params.get('status')
            if q_status:
                query = query.filter(status=q_status)

        return query

    @action(methods=['get', 'post'], url_path='showtimes', detail=True)
    def manage_showtimes_view(self, request, pk=None):
        movie = self.get_object()

        if request.method == 'POST':
            s = serializers.ManageShowtimeCreateUpdateSerializer(data={
                **request.data,
                'movie': movie.pk,
            })
            s.is_valid(raise_exception=True)
            showtime = s.save(created_by=self.request.user)
            return Response(serializers.ManageShowtimeSerializer(showtime).data, status=status.HTTP_201_CREATED)

        showtimes = (movie.movie_showtimes.filter(active=True, show_date__gte=utils.get_timezone_now().date())
                     .select_related('room__branch', 'screening_format', 'created_by'))

        q_status = request.query_params.get('status')
        if q_status:
            showtimes = showtimes.filter(status=q_status)

        q_date = request.query_params.get('date')
        if q_date:
            showtimes = showtimes.filter(show_date=q_date)

        return Response(serializers.ManageShowtimeSerializer(showtimes, many=True).data, status=status.HTTP_200_OK)


class ManageShowtimeViewSet(viewsets.ViewSet, generics.RetrieveUpdateDestroyAPIView):
    queryset = Showtime.objects.filter(active=True)
    permission_classes = [perms.IsSystemManager]
    serializer_class = serializers.ManageShowtimeCreateUpdateSerializer

    def perform_destroy(self, instance):
        has_active_bookings = instance.showtime_bookings.filter(status__in=[BookingStatus.CONFIRMED, BookingStatus.HOLDING]).exists()
        if has_active_bookings:
            raise ValidationError({'detail': 'Không thể xoá suất chiếu đang có đơn đặt vé'})

        instance.status = ShowtimeStatus.CANCELLED
        instance.save(update_fields=['status'])


class ManageProductViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.RetrieveUpdateAPIView):
    queryset = Product.objects.all().order_by('-id')
    serializer_class = serializers.ManageProductSerializer
    permission_classes = [perms.IsSystemManager]
    pagination_class = paginators.ManageProductItemPaginator

    def get_queryset(self):
        query = self.queryset.prefetch_related('combo_items__item')

        product_type = self.request.query_params.get('product_type')
        if product_type:
            query = query.filter(product_type=product_type)

        active = self.request.query_params.get('active')
        if active is not None:
            query = query.filter(active=active)

        return query

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        items_data = validated_data.pop('items', [])
        product_type = validated_data.get('product_type', ProductType.SINGLE)

        if product_type == ProductType.COMBO:
            product = ProductService.create_combo(combo_data=validated_data, items_data=items_data)
        else:
            product = ProductService.create_product(data=validated_data)

        return Response(self.get_serializer(product).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        items_data = validated_data.pop('items', None)

        updated_product = ProductService.update_product(product=instance, data=validated_data, items_data=items_data)

        return Response(self.get_serializer(updated_product).data, status=status.HTTP_200_OK)


class ManagePromotionViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset = Promotion.objects.filter(active=True).order_by('code')
    permission_classes = [perms.IsSystemManager]
    serializer_class = serializers.ManagePromotionCreateSerializer

    def get_queryset(self):
        query = self.queryset

        q_discount_type = self.request.query_params.get('discount_type')
        if q_discount_type:
            query = query.filter(discount_type=q_discount_type)

        return query

    def create(self, request, *args, **kwargs):
        code = request.data.get('code', '')
        s = self.get_serializer(data={
            **request.data,
            'code': code.strip().upper(),
        })
        s.is_valid(raise_exception=True)

        promotion = PromotionService.create_promotion(s.validated_data)

        output_serializer = self.get_serializer(promotion)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

