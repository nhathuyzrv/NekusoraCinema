from django.urls import re_path
from nekusoracinema import consumers

websocket_urlpatterns = [
    re_path(r"^ws/showtimes/(?P<showtime_id>\d+)/seats/$", consumers.SeatConsumer.as_asgi()) # noqa
]