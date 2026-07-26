from django.urls import path, include
from rest_framework.routers import DefaultRouter
from nekusoracinema import views

r = DefaultRouter()
r.register(r'users', views.UserViewSet, 'user')
r.register(r'movies', views.MovieViewSet, 'movie')

urlpatterns = [
    path('', include(r.urls)),
]