from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.core.cache import cache
import random, string
from django.template.loader import render_to_string
from nekusoracinema import services
from nekusoracinema.models import *


def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def send_otp_email(self, email, mode):
    try:
        otp = generate_otp()
        cache.set(f"otp:{mode}:{email}", otp, timeout=300)

        template_map = {
            'register': ('email/otp_register.html', '[Nekusora Cinema] Xác nhận đăng ký'),
            'reset_password': ('email/otp_reset_pw.html', '[Nekusora Cinema] Đặt lại mật khẩu'),
        }
        template, subject = template_map[mode]
        html_content = render_to_string(template, {'otp_code': otp})

        msg = EmailMultiAlternatives(
            subject=subject,
            body=f'Bạn đang yêu cầu mã xác nhận từ Nekusora Cinema.\nMã OTP của bạn là: {otp}\nMã có hiệu lực trong 5 phút, vui lòng không chia sẻ mã này với bất kỳ ai.',
            from_email=None,
            to=[email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task
def auto_cancel_booking(booking_id):
    try:
        booking = Booking.objects.get(pk=booking_id, status=BookingStatus.HOLDING)
    except Booking.DoesNotExist:
        return

    services.cancel_booking(booking, 'EXPIRED')