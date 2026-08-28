from functools import wraps
import hashlib
import hmac
import requests
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from nekusoraapis import settings
from nekusoracinema import serializers
from nekusoracinema.models import *
from payos import PayOS
from payos.types import CreatePaymentLinkRequest, ItemData


class OTPModeStrategy:
    mode_key = None
    email_template = None
    email_subject = None

    @classmethod
    def validate_request(cls, data):
        raise NotImplementedError

    @classmethod
    def complete(cls, email, data):
        raise NotImplementedError


class RegisterModeStrategy(OTPModeStrategy):
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


class ResetPasswordModeStrategy(OTPModeStrategy):
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


OTP_MODE = {cls.mode_key: cls for cls in [RegisterModeStrategy, ResetPasswordModeStrategy]}


def require_holding_booking_not_expired(view_func):
    @wraps(view_func)
    def wrapper(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        booking = get_object_or_404(Booking, booking_code=pk, customer=request.user)

        if booking.held_until < timezone.now() or booking.status != BookingStatus.HOLDING:
            return Response({'message': 'Đã hết thời gian giữ ghế, vui lòng đặt lại đơn mới'}, status=status.HTTP_400_BAD_REQUEST)

        kwargs['booking'] = booking
        return view_func(self, request, *args, **kwargs)

    return wrapper

def require_holding_booking(view_func):
    @wraps(view_func)
    def wrapper(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        booking = get_object_or_404(Booking, booking_code=pk, customer=request.user)

        if booking.status != BookingStatus.HOLDING:
            return Response({'message': 'Đơn này không còn ở trạng thái giữ ghế, vui lòng đặt lại đơn mới'}, status=status.HTTP_400_BAD_REQUEST)

        kwargs['booking'] = booking
        return view_func(self, request, *args, **kwargs)

    return wrapper


class PaymentStrategy:
    method_code = None

    @classmethod
    def create(cls, booking, method, validated_data):
        raise NotImplementedError

    @classmethod
    def base_payment_defaults(cls, booking, method):
        return {
            "method": method,
            "amount": booking.final_amount,
            "status": PaymentStatus.PENDING,
        }


class PayOSPayment(PaymentStrategy):
    method_code = "BANK_QR"

    @classmethod
    def create(cls, booking, method, validated_data):
        try:
            existing = booking.payment
            if existing.status == PaymentStatus.PENDING:
                return existing
        except Payment.DoesNotExist:
            pass

        client = PayOS(
            client_id=settings.PAYOS_CLIENT_ID,
            api_key=settings.PAYOS_API_KEY,
            checksum_key=settings.PAYOS_CHECKSUM_KEY,
        )

        order_code = int(booking.booking_code, 16) % (10 ** 9)

        seat_codes = ", ".join(booking.booking_tickets.values_list("seat__seat_code", flat=True))

        items = [
            ItemData(
                name=f"Đơn: {order_code}. Vé: {seat_codes}",
                quantity=1,
                price=int(booking.final_amount)
            )
        ]

        response = client.payment_requests.create(
            payment_data=CreatePaymentLinkRequest(
                order_code=order_code,
                amount=int(booking.final_amount),
                description=f"NEKUSORA {booking.booking_code}",
                items=items,
                return_url=settings.PAYOS_RETURN_URL,
                cancel_url=settings.PAYOS_CANCEL_URL,
                expired_at=int(booking.held_until.timestamp())
            )
        )

        payment, _ = Payment.objects.update_or_create(
            booking=booking,
            defaults={
                **cls.base_payment_defaults(booking, method),
                "contact_email": validated_data.get("email", ""),
                "order_code": order_code,
                "payment_link_id": getattr(response, "payment_link_id", ""),
                "checkout_url": getattr(response, "checkout_url", ""),
                "qr_code_url": getattr(response, "qr_code", ""),
                "expired_at": booking.held_until,
                "provider_response": response.model_dump() if hasattr(response, "model_dump") else vars(response),
            }
        )
        return payment


class MoMoPayment(PaymentStrategy):
    method_code = "MOMO"

    @classmethod
    def create(cls, booking, method, validated_data):
        # raise ValidationError({'message': f'Phương thức thanh toán "{method.name}" đang được cập nhật'})

        try:
            existing = booking.payment
            if existing.status == PaymentStatus.PENDING:
                return existing
        except Payment.DoesNotExist:
            pass

        endpoint = settings.MOMO_BASE_URL
        partner_code = settings.MOMO_PARTNER_CODE
        access_key = settings.MOMO_ACCESS_KEY
        secret_key = settings.MOMO_SECRET_KEY

        request_id = f"{booking.booking_code}_{int(timezone.now().timestamp())}"
        order_id = request_id
        amount = str(int(booking.final_amount))
        order_info = f"NEKUSORA {booking.booking_code}"
        redirect_url = validated_data.get("return_url", settings.MOMO_RETURN_URL)
        ipn_url = settings.MOMO_IPN_URL
        request_type = "payWithATM"
        extra_data = ""

        raw = (
            f"accessKey={access_key}"
            f"&amount={amount}"
            f"&extraData={extra_data}"
            f"&ipnUrl={ipn_url}"
            f"&orderId={order_id}"
            f"&orderInfo={order_info}"
            f"&partnerCode={partner_code}"
            f"&redirectUrl={redirect_url}"
            f"&requestId={request_id}"
            f"&requestType={request_type}"
        )

        signature = hmac.new(secret_key.encode(), raw.encode(), hashlib.sha256).hexdigest()

        payload = {
            "partnerCode": partner_code,
            "accessKey": access_key,
            "requestId": request_id,
            "amount": amount,
            "orderId": order_id,
            "orderInfo": order_info,
            "redirectUrl": redirect_url,
            "ipnUrl": ipn_url,
            "extraData": extra_data,
            "requestType": request_type,
            "signature": signature,
            "lang": "vi",
        }

        response = requests.post(endpoint, json=payload, timeout=10).json()

        payment, _ = Payment.objects.update_or_create(
            booking=booking,
            defaults={
                **cls.base_payment_defaults(booking, method),
                "contact_email": validated_data.get("email", ""),
                "checkout_url": response.get("payUrl", ""),
                "deeplink": response.get("deeplink", ""),
                "qr_code_url": response.get("qrCodeUrl", ""),
                "expired_at": booking.held_until,
                "provider_response": response,
            }
        )
        return payment


class PayPalPayment(PaymentStrategy):
    method_code = "PAYPAL"

    @classmethod
    def get_access_token(cls):
        response = requests.post(
            f"{settings.PAYPAL_BASE_URL}/v1/oauth2/token",
            headers={"Accept": "application/json"},
            data={"grant_type": "client_credentials"},
            auth=(settings.PAYPAL_CLIENT_ID, settings.PAYPAL_CLIENT_SECRET),
            timeout=10,
        )
        response.raise_for_status()
        return response.json()["access_token"]

    @classmethod
    def create(cls, booking, method, validated_data):
        try:
            existing = booking.payment
            if existing.status == PaymentStatus.PENDING:
                return existing
        except Payment.DoesNotExist:
            pass

        access_token = cls.get_access_token()

        amount_usd = f"{(booking.final_amount / 26000):.2f}"

        payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": booking.booking_code,
                    "description": f"NEKUSORA {booking.booking_code}",
                    "amount": {
                        "currency_code": "USD",
                        "value": amount_usd,
                    },
                }
            ],
            "payment_source": {
                "paypal": {
                    "experience_context": {
                        "return_url": settings.PAYPAL_RETURN_URL,
                        "cancel_url": settings.PAYPAL_CANCEL_URL,
                        "user_action": "PAY_NOW",
                        "landing_page": "LOGIN",
                    }
                }
            },
        }

        response = requests.post(
            f"{settings.PAYPAL_BASE_URL}/v2/checkout/orders",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}",
            },
            json=payload,
            timeout=10,
        ).json()

        order_id = response.get("id", "")
        approve_url = next((link["href"] for link in response.get("links", []) if link["rel"] == "payer-action"), "")

        payment, _ = Payment.objects.update_or_create(
            booking=booking,
            defaults={
                **cls.base_payment_defaults(booking, method),
                "contact_email": validated_data.get("email", ""),
                "checkout_url": approve_url,
                "order_code": int(int(order_id, 36) % (10 ** 9)) if order_id.isalnum() else 0,
                "payment_link_id": order_id,
                "expired_at": booking.held_until,
                "provider_response": response,
            }
        )
        return payment

PAYMENT_STRATEGY = {cls.method_code: cls for cls in [PayOSPayment, MoMoPayment, PayPalPayment]}