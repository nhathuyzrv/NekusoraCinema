from django.urls import path, include
from rest_framework.routers import DefaultRouter
from nekusoracinema import views

r = DefaultRouter()
r.register(r'users', views.UserViewSet, 'user')
r.register(r'auth', views.AuthViewSet, 'auth')
r.register(r'genres', views.GenreViewSet, 'genre')
r.register(r'movies', views.MovieViewSet, 'movie')
r.register(r'ratings', views.RatingViewSet, 'rating')
r.register(r'locations', views.LocationViewSet, 'location')
r.register(r'branches', views.BranchViewSet, 'branch')
r.register(r'screenings', views.ScreeningFormatViewSet, 'screening')
r.register(r'rooms', views.CinemaRoomViewSet, 'room')
r.register(r'bookings', views.BookingsViewSet, 'booking')
r.register(r'products', views.ProductViewSet, 'product')
r.register(r'payment-methods', views.PaymentMethodViewSet, 'payment_method')
r.register(r'payos/webhook', views.PayOSWebhookViewSet, 'payos-webhook')

urlpatterns = [
    path('', include(r.urls)),
]