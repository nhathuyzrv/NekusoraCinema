import random
import string
from datetime import date
from django.core.cache import cache
from django.db.models import Prefetch
from django.db.models.aggregates import Avg, Count
from rest_framework import viewsets, generics, parsers, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from nekusoracinema import serializers, paginators, perms, utils
from nekusoracinema.models import *
from nekusoracinema.tasks import send_otp_email


class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    parser_classes = [parsers.MultiPartParser, parsers.JSONParser]

    @action(methods=['get', 'patch'], url_path='current-user', detail=False,
            permission_classes=[permissions.IsAuthenticated])
    def current_user(self, request):
        user = request.user
        if request.method.__eq__('PATCH'):
            serializer = serializers.UserUpdateSerializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()

        return Response(serializers.UserSerializer(user).data, status=status.HTTP_200_OK)


def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

class AuthViewSet(viewsets.ViewSet):
    @action(methods=['post'], url_path='forgot-password', detail=False)
    def forgot_password(self, request):
        email = request.data.get('email', None)
        if not email:
            return Response({'message': 'Vui lòng cung cấp địa chỉ email'}, status=status.HTTP_400_BAD_REQUEST)
        email = email.strip().lower()

        try:
            User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'Email không tồn tại'}, status=status.HTTP_400_BAD_REQUEST)

        send_otp_email(email)
        return Response({'message': 'Mã xác nhận đã được gửi'}, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='verify-otp', detail=False)
    def verify_otp(self, request):
        email = request.data.get('email', None)
        if not email:
            return Response({'message': 'Vui lòng cung cấp địa chỉ email'}, status=status.HTTP_400_BAD_REQUEST)
        email = email.strip().lower()

        otp_input = request.data.get('otp', None)
        if not otp_input:
            return Response({'message': 'Vui lòng cung cấp OTP'}, status=status.HTTP_400_BAD_REQUEST)
        otp_input = otp_input.strip()

        cache_key = f"password_reset_otp:{email}"
        cached_otp = cache.get(cache_key)

        if not cached_otp or cached_otp != otp_input:
            return Response({'message': 'OTP không hợp lệ hoặc đã hết hạn'}, status=status.HTTP_400_BAD_REQUEST)

        cache.delete(cache_key)

        reset_token = generate_otp(32)
        cache.set(f"password_reset_verified:{email}", reset_token, timeout=600)

        return Response({'reset_token': reset_token}, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='reset-password', detail=False)
    def reset_password(self, request):
        email = request.data.get('email', None)
        if not email:
            return Response({'message': 'Vui lòng cung cấp địa chỉ email'}, status=status.HTTP_400_BAD_REQUEST)
        email = email.strip().lower()

        new_password = request.data.get('new_password', None)
        if not new_password:
            return Response({'message': 'Vui lòng cung cấp mật khẩu mới'}, status=status.HTTP_400_BAD_REQUEST)

        cache_key = f"password_reset_verified:{email}"

        reset_token = request.data.get('reset_token', None)
        stored_token = cache.get(cache_key)
        if not reset_token or not stored_token or stored_token != reset_token:
            return Response({'message': 'Token không hợp lệ hoặc đã hết hạn'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'Email không tồn tại'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        cache.delete(cache_key)

        return Response({'message': 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập để tiếp tục.'}, status=status.HTTP_200_OK)


class GenreViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Genre.objects.filter(active=True)
    serializer_class = serializers.GenreSerializer


class MovieViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Movie.objects.filter(active=True)
    pagination_class = paginators.MovieItemPaginator

    def get_permissions(self):
        if self.action in ['ratings'] and self.request.method in ['POST']:
            return [perms.IsCustomer()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.action in ['retrieve']:
            return serializers.MovieDetailsSerializer
        return serializers.SimpleMovieSerializer

    def get_queryset(self):
        query = self.queryset.annotate(avg_rating=Avg('ratings__score'), rating_count=Count('ratings'))
        if self.action in ['retrieve']:
            query = query.prefetch_related('genres','actors',
                                           Prefetch('ratings', queryset=Rating.objects.filter(active=True)))

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
    def ratings(self, request, pk):
        movie = self.get_object()

        if request.method in ['POST']:
            s = serializers.RatingSerializer(data={
                **request.data,
                'movie': movie.pk,
                'user': request.user.pk,
            }, context={'request': request})
            s.is_valid(raise_exception=True)
            rating = s.save()
            return Response(serializers.RatingSerializer(rating).data, status=status.HTTP_201_CREATED)

        ratings = (movie.ratings.filter(active=True).order_by('-created_at')
                   .select_related('user'))
        paginator = paginators.RatingItemPaginator()
        page = paginator.paginate_queryset(ratings, request, view=self)

        return paginator.get_paginated_response(serializers.RatingSerializer(page, many=True).data)

    @action(methods=['get'], url_path='ratings/my', detail=True)
    def my_rating(self, request, pk):
        movie = self.get_object()
        user = request.user
        rating = Rating.objects.filter(movie=movie, user=user).first()
        if not rating:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(serializers.RatingSerializer(rating).data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path='showtimes', detail=True)
    def showtimes(self, request, pk):
        movie = self.get_object()
        today = date.today()
        today_p_5 = utils.get_date_calc(today, 5)
        showtimes = (movie.showtimes.filter(active=True, show_date__range=[today, today_p_5]).order_by('start_time')
                     .select_related('screening_format', 'room__branch__location'))

        return Response(serializers.ShowtimeSerializer(showtimes, many=True).data, status=status.HTTP_200_OK)


class RatingViewSet(viewsets.ViewSet, generics.UpdateAPIView):
    queryset = Rating.objects.filter(active=True)
    serializer_class = serializers.RatingSerializer
    permission_classes = [perms.RatingOwner]


class LocationViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Location.objects.filter(active=True).order_by('name')
    serializer_class = serializers.LocationSerializer

    @action(methods=['get'], url_path='branches', detail=True)
    def branches(self, request, pk):
        location = self.get_object()
        branches = location.branches.filter(active=True).order_by('name')


        return Response(serializers.BranchSerializer(branches, many=True).data, status=status.HTTP_200_OK)


class BranchViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Branch.objects.filter(active=True).order_by('name')
    serializer_class = serializers.BranchSerializer

    @action(methods=['get'], url_path='rooms', detail=True)
    def rooms(self, request, pk):
        branch = self.get_object()
        rooms = branch.rooms.filter(active=True).order_by('name')

        return Response(serializers.CinemaRoomSerializer(rooms, many=True).data, status=status.HTTP_200_OK)


class ScreeningFormatViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = ScreeningFormat.objects.filter(active=True).order_by('code')
    serializer_class = serializers.ScreeningFormatSerializer


class CinemaRoomViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = CinemaRoom.objects.filter(active=True).order_by('branch')
    serializer_class = serializers.CinemaRoomSerializer

    @action(methods=['get'], url_path='seats', detail=True)
    def seats(self, request, pk):
        room = self.get_object()
        seats = room.seats.filter(active=True).order_by('seat_code')

        return Response(serializers.SeatSerializer(seats, many=True).data, status=status.HTTP_200_OK)