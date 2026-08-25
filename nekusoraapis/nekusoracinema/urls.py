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
r.register(r'bookings', views.BookingViewSet, 'booking')
r.register(r'products', views.ProductViewSet, 'product')
r.register(r'payment-methods', views.PaymentMethodViewSet, 'payment_method')
r.register(r'payos/webhook', views.PayOSWebhookViewSet, 'payos-webhook')
r.register(r'momo/ipn', views.MoMoIPNViewSet, 'momo-ipn')
r.register(r'paypal/capture', views.PayPalCaptureViewSet, 'paypal-capture')
r.register(r'manage/staffs', views.ManageStaffViewSet, 'mange_staff')
r.register(r'manage/genres', views.ManageGenreViewSet, 'manage_genre')
r.register(r'manage/screenings', views.ManageScreeningFormatViewSet, 'manage_screening')
r.register(r'manage/movies', views.ManageMovieViewSet, 'manage_movie')
r.register(r'manage/showtimes', views.ManageShowtimeViewSet, 'manage_showtime')
r.register(r'manage/locations', views.ManageLocationViewSet, 'manage_location')
r.register(r'manage/branches', views.ManageBranchViewSet, 'manage_branch')
r.register(r'manage/rooms', views.ManageCinemaRoomViewSet, 'manage_room')
r.register(r'manage/products', views.ManageProductViewSet, 'manage_product')
r.register(r'manage/promotions', views.ManagePromotionViewSet, 'manage_promotion')
r.register(r'manage/stats', views.ManageStatsViewSet, 'manage_stat')

urlpatterns = [
    path('', include(r.urls)),
]