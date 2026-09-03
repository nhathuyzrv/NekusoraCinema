"""
ASGI config for nekusoraapis project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nekusoraapis.settings')

from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application()

from nekusoracinema.middleware import WebSocketAuthMiddleware
from channels.routing import ProtocolTypeRouter, URLRouter
from nekusoracinema import routing


application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": WebSocketAuthMiddleware(URLRouter(routing.websocket_urlpatterns))
})
