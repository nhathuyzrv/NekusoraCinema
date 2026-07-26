import json
from django.utils.deprecation import MiddlewareMixin
from decouple import config


class OAuthClientInfectionMiddleware(MiddlewareMixin):
    def process_request(self, request):
        PATHS = ['/o/token/', '/o/revoke_token/']
        if request.path not in PATHS or request.method != 'POST':
            return

        data = json.loads(request.body)
        data['client_id'] = config('OAUTH_CLIENT_ID')
        data['client_secret'] = config('OAUTH_CLIENT_SECRET')
        request._body = json.dumps(data).encode('utf-8')