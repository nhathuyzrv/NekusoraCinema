from django.db.models import Prefetch
from django.db.models.aggregates import Avg, Count
from rest_framework import viewsets, generics, parsers, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from nekusoracinema import serializers, paginators
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
    lookup_field = 'slug'

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

        return query


class MovieRatingViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Rating.objects.filter(active=True)
    serializer_class = serializers.RatingSerializer
    pagination_class = paginators.RatingItemPaginator

    def get_queryset(self):
        slug = self.kwargs['slug']
        query = self.queryset.filter(moview_slug=slug).select_related('user').order_by('-created_at')

        return query