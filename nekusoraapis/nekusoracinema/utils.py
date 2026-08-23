import io
import random
import string
import uuid
import barcode
from barcode.writer import ImageWriter
from django.utils import timezone


def generate_booking_code():
    return uuid.uuid4().hex[:12].upper()


def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))


def generate_barcode_bytes(booking_code):
    code128 = barcode.get('code128', booking_code, writer=ImageWriter())
    buffer = io.BytesIO()
    code128.write(buffer, options={
        'module_width': 0.4,
        'module_height': 10,
        'font_size': 0,
        'text_distance': 0,
        'quiet_zone': 2,
        'write_text': False,
        'background': 'white',
        'foreground': '#3a1a0a',
    })
    buffer.seek(0)
    return buffer.getvalue()


def generate_ws_ticket():
    return str(uuid.uuid4())

def get_timezone_now():
    return timezone.localtime(timezone.now())

def get_current_time():
    return get_timezone_now().time().replace(microsecond=0)