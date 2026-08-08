from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from celery import shared_task
from django.core.mail import EmailMultiAlternatives, get_connection
from django.core.cache import cache
from django.template.loader import render_to_string

from nekusoraapis import settings
from nekusoracinema import services, utils
from nekusoracinema.models import *
from babel.numbers import format_decimal


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def send_otp_email(self, email, mode):
    try:
        otp = utils.generate_otp()
        cache.set(f"otp:{mode}:{email}", otp, timeout=300)

        template_map = {
            'register': ('email/otp_register.html', '[Nekusora Cinema] Xác nhận đăng ký tài khoản mới'),
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


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def send_ticket_email(self, email, booking_id):
    try:
        booking = (Booking.objects.select_related('showtime__movie', 'showtime__room__branch', 'showtime__screening_format', 'customer')
                   .prefetch_related('booking_tickets__seat', 'booking_products__product')
                   .get(pk=booking_id))

        full_name = f'{booking.customer.last_name} {booking.customer.first_name}'.strip()

        html_content = render_to_string('email/ticket.html', {
            'booking': booking,
            'full_name': full_name or booking.customer.email,
            'final_amount': format_decimal(booking.final_amount, locale='vi_VN'),
        })

        msg = MIMEMultipart('related')
        msg['Subject'] = '[Nekusora Cinema] Đơn đặt vé của bạn đã được xử lý'
        msg['From'] = settings.DEFAULT_FROM_EMAIL
        msg['To'] = email

        msg.attach(MIMEText(html_content, 'html', 'utf-8'))

        barcode_img = MIMEImage(utils.generate_barcode_bytes(booking.booking_code))
        barcode_img.add_header('Content-ID', '<barcode>')
        barcode_img.add_header('Content-Disposition', 'inline')
        msg.attach(barcode_img)

        connection = get_connection()
        connection.open()
        connection.connection.sendmail(settings.DEFAULT_FROM_EMAIL, [email], msg.as_string())
        connection.close()

    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task
def auto_expire_booking(booking_id):
    try:
        booking = Booking.objects.get(pk=booking_id, status=BookingStatus.HOLDING)
    except Booking.DoesNotExist:
        return

    services.delete_booking(booking, 'EXPIRED')