import hashlib
import json
import redis.asyncio as aioredis
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from nekusoracinema.models import Ticket, TicketStatus


def _seat_hold_key(showtime_id, seat_id):
    return f"seat_hold:{showtime_id}:{seat_id}"


_redis_pool = aioredis.ConnectionPool.from_url(
    "redis://127.0.0.1:6379/1",
    decode_responses=True,
    socket_keepalive=True,
    socket_connect_timeout=5,
    socket_timeout=5,
)


class SeatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.showtime_id = self.scope["url_route"]["kwargs"]["showtime_id"]
        self.group_name = f"showtime_{self.showtime_id}"

        self.redis = aioredis.Redis(connection_pool=_redis_pool)

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        try:
            payload = await self.get_seat_status()
        except Exception:
            payload = {"booked": [], "held": []}

        await self.send(text_data=json.dumps({"type": "seat_status", **payload}))

    async def disconnect(self, close_code):
        try:
            await self.redis.aclose(close_connection_pool=False)
        except Exception:
            pass
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def seat_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "seat_status",
            "booked": event["booked"],
            "held": event["held"],
        }))

    async def get_seat_status(self):
        booked = await self.get_booked_seats()
        held = await self.get_held_seats()
        return {"booked": booked, "held": held}

    @database_sync_to_async
    def get_booked_seats(self):
        return list(Ticket.objects.filter(showtime_id=self.showtime_id, status=TicketStatus.BOOKED).values_list("seat_id", flat=True))

    async def get_held_seats(self):
        pattern = _seat_hold_key(self.showtime_id, '*')
        try:
            keys = await self.redis.keys(pattern)
            return [int(k.rsplit(':', 1)[-1]) for k in keys]
        except Exception:
            return []


class UserConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        self.group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_booking_notification(self, event):
        await self.send(text_data=json.dumps({
            "type": "booking_confirmed",
            "booking_code": event["booking_code"],
        }))