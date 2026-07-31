import threading
from django.core.mail import EmailMultiAlternatives
from django.core.cache import cache
import random, string

from django.template.loader import render_to_string


def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

def _send_email_thread(email):
    try:
        otp = generate_otp()
        cache.set(f"password_reset_otp:{email}", otp, timeout=300)

        html_content = render_to_string('email/otp.html', {
            'otp_code': otp,
        })

        email = EmailMultiAlternatives(
            subject='[Nekusora Cinema] Yêu cầu đặt lại mật khẩu',
            body=f'Bạn đang yêu cầu đặt lại mật khẩu cho tài khoản Nekusora Cinema.\nMã OTP của bạn là: {otp}\nMã OTP có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.\nNếu bạn không phải là người yêu cầu, vui lòng bỏ qua email này.',
            from_email=None,
            to=[email],
        )
        email.attach_alternative(html_content, "text/html")
        email.send()

    except Exception as exc:
        raise

def send_otp_email(email):
    thread = threading.Thread(target=_send_email_thread, args=(email,))
    thread.start()