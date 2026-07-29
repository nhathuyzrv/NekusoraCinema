from django.db.models import Prefetch
from django.db.models.aggregates import Avg, Count
from rest_framework import viewsets, generics, parsers, permissions, status
from rest_framework.decorators import action
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.response import Response

from nekusoracinema import serializers, paginators, perms
from nekusoracinema.models import *


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


class MovieViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Movie.objects.filter(active=True)
    pagination_class = paginators.MovieItemPaginator

    def get_permissions(self):
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


class MovieRatingViewSet(viewsets.ViewSet, generics.ListCreateAPIView, RetrieveUpdateAPIView):
    queryset = Rating.objects.filter(active=True)
    serializer_class = serializers.RatingSerializer
    pagination_class = paginators.RatingItemPaginator

    def get_queryset(self):
        id = self.kwargs['id']
        query = self.queryset.filter(movie_id=id).select_related('user').order_by('-created_at')

        return query

    def get_permissions(self):
        if self.action in ['create']:
            return [perms.IsCustomer()]
        if self.action in ['retrieve', 'update']:
            return [perms.RatingOwner()]
        return [permissions.IsAuthenticated()]