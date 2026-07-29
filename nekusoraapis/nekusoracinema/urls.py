from django.urls import path, include
from rest_framework.routers import DefaultRouter
from nekusoracinema import views

r = DefaultRouter()
r.register(r'users', views.UserViewSet, 'user')
r.register(r'movies', views.MovieViewSet, 'movie')
r.register(r'movies/(?P<id>[^/.]+)/ratings', views.MovieRatingViewSet, 'movie-ratings')

urlpatterns = [
    path('', include(r.urls)),
]