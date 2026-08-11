import json
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils.deprecation import MiddlewareMixin
from decouple import config
from django.contrib.auth.models import AnonymousUser


User = get_user_model()

class OAuthClientInfectionMiddleware(MiddlewareMixin):
    def process_request(self, request):
        PATHS = ['/o/token/', '/o/revoke_token/']
        if request.path not in PATHS or request.method != 'POST':
            return

        data = json.loads(request.body)
        data['client_id'] = config('OAUTH_CLIENT_ID')
        data['client_secret'] = config('OAUTH_CLIENT_SECRET')
        request._body = json.dumps(data).encode('utf-8')


@database_sync_to_async
def get_user_from_ticket(ticket):
    ticket_key = f"ws_ticket:{ticket}"
    user_id = cache.get(ticket_key)

    if user_id:
        cache.delete(ticket_key)
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return AnonymousUser()

    return AnonymousUser()


class WebSocketAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        qs = scope.get("query_string", b"").decode("utf-8")
        query_params = parse_qs(qs)

        ticket = query_params.get("ticket", [None])[0]

        if ticket:
            scope["user"] = await get_user_from_ticket(ticket) # type:ignore
        else:
            scope["user"] = AnonymousUser() # type:ignore

        return await super().__call__(scope, receive, send)