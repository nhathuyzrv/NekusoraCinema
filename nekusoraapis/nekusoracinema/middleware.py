import json
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.utils.deprecation import MiddlewareMixin
from decouple import config
from django.contrib.auth.models import AnonymousUser
from oauth2_provider.models import AccessToken


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
def get_user(access_token):
    try:
        token = AccessToken.objects.select_related("user").get(token=access_token)
        if token.is_expired():
            return AnonymousUser()
        return token.user
    except Exception:
        return AnonymousUser()


class OAuthTokenMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query = parse_qs(scope["query_string"].decode())
        access_token = query.get("token", [None])[0]
        scope["user"] = await get_user(access_token) if access_token else AnonymousUser()
        return await super().__call__(scope, receive, send)