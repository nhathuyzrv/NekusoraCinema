from functools import wraps

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from nekusoracinema import serializers
from nekusoracinema.models import *


# STRATEGY OTP
class OTPMode:
    mode_key = None
    email_template = None
    email_subject = None

    @classmethod
    def validate_request(cls, data):
        raise NotImplementedError

    @classmethod
    def complete(cls, email, data):
        raise NotImplementedError


class RegisterMode(OTPMode):
    mode_key = 'register'
    email_template = 'email/otp_register.html'
    email_subject = '[Nekusora Cinema] Xác nhận đăng ký tài khoản mới'

    @classmethod
    def validate_request(cls, data):
        email = data.get('email', '').strip().lower()
        phone_number = data.get('phone_number', '').strip()
        if not email:
            return None, 'Vui lòng cung cấp email'
        if User.objects.filter(email=email).exists():
            return None, 'Email đã được sử dụng'
        if User.objects.filter(phone_number=phone_number).exists():
            return None, 'Số điện thoại đã được sử dụng'
        return email, None

    @classmethod
    def complete(cls, email, data):
        s = serializers.UserSerializer(data={**data, 'email': email})
        s.is_valid(raise_exception=True)
        user = s.save()
        return Response(serializers.UserSerializer(user).data, status=status.HTTP_201_CREATED)


class ResetPasswordMode(OTPMode):
    mode_key = 'reset_password'
    email_template = 'email/otp_reset_pw.html'
    email_subject = '[Nekusora Cinema] Xác nhận đặt lại mật khẩu'

    @classmethod
    def validate_request(cls, data):
        email = data.get('email', '').strip().lower()
        if not email:
            return None, 'Vui lòng cung cấp email'
        if not User.objects.filter(email=email).exists():
            return None, 'Email không tồn tại'
        return email, None

    @classmethod
    def complete(cls, email, data):
        new_password = data.get('new_password', '')
        if not new_password:
            return Response({'message': 'Vui lòng cung cấp mật khẩu mới'}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Đặt lại mật khẩu thành công'}, status=status.HTTP_200_OK)


OTP_MODE = {cls.mode_key: cls for cls in [RegisterMode, ResetPasswordMode]}

# DECORATOR BOOKING
def require_holding_booking(view_func):
    @wraps(view_func)
    def wrapper(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        booking = get_object_or_404(Booking, booking_code=pk, customer=request.user)

        if booking.held_until < timezone.now() or booking.status != BookingStatus.HOLDING:
            return Response({'message': 'Đã hết thời gian giữ ghế, vui lòng đặt lại đơn mới'}, status=status.HTTP_400_BAD_REQUEST)

        kwargs['booking'] = booking
        return view_func(self, request, *args, **kwargs)

    return wrapper