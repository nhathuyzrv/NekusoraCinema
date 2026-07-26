from django.urls import path, include
from rest_framework.routers import DefaultRouter
from nekusoracinema import views

r = DefaultRouter()
r.register(r'users', views.UserViewSet, 'user')

urlpatterns = [
    path('', include(r.urls)),
]