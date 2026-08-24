import { Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatMoney } from "../utils/Money";
import { QRCodeSVG } from "qrcode.react";

function InfoRow({ label, value }) {
    return (
        <div className="flex justify-between">
            <span className="text-base-content/60">{label}</span>
            <span className="font-bold">{value}</span>
        </div>
    )
}

function usePaymentCountdown(expiredAt) {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!expiredAt) return;
        const tick = () => {
            const diff = Math.max(0, Math.floor((new Date(expiredAt) - Date.now()) / 1000));
            setTimeLeft(diff);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expiredAt]);

    return timeLeft;
}

function fmt(s) {
    if (s === null || s === undefined) return "--:--";
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
}

const PaymentPayOS = ({ booking }) => {
    const payment = booking?.payment;
    const timeLeft = usePaymentCountdown(payment?.expired_at);
    const isExpired = timeLeft === 0;

    return (
        <div className="space-y-4">
            <div className="bg-base-100 border border-base-300 rounded-2xl p-5 flex flex-col items-center gap-4">
                <p className="text-sm font-semibold">Quét mã QR để thanh toán</p>

                {payment?.qr_code_url ? (
                    <div className={`transition-opacity ${isExpired ? "opacity-30 pointer-events-none" : ""}`}>
                        <QRCodeSVG value={payment.qr_code_url} size={208} />
                    </div>
                ) : (
                    <div className="w-52 h-52 rounded-xl border border-base-300 bg-base-200 flex items-center justify-center">
                        <Loader2 size={28} className="animate-spin text-base-content/30" />
                    </div>
                )}

                {timeLeft !== null && (
                    <div className={`flex items-center gap-2 text-sm font-semibold ${isExpired ? "text-error" : "text-warning"}`}>
                        <Clock size={14} />
                        {isExpired ? "Mã QR đã hết hạn" : `Hết hạn sau: ${fmt(timeLeft)}`}
                    </div>
                )}
            </div>

            <div className="bg-base-100 border border-base-300 rounded-2xl p-5 space-y-3">
                <p className="text-sm font-semibold">Thông tin chuyển khoản</p>
                <div className="space-y-2 text-sm">
                    <InfoRow label="Tài khoản thụ hưởng" value={booking?.payment?.provider_response?.account_name || ""} />
                    <InfoRow label="Số tiền" value={formatMoney(booking?.payment?.provider_response?.amount)} />
                    <InfoRow label="Nội dung chuyển khoản" value={booking?.payment?.provider_response?.description || ""} />
                </div>
            </div>

            <p className="text-xs text-base-content/70 text-center px-4">
                Vui lòng không tự ý thay đổi nội dung chuyển khoản. Sau khi thanh toán, xin chờ một chút để hệ tống xử lý giao dịch.
            </p>
        </div>
    );
}

const PaymentMoMo = ({ booking }) => {
    const payment = booking?.payment;
    const timeLeft = usePaymentCountdown(payment?.expired_at);
    const isExpired = timeLeft === 0;

    return (
        <div className="space-y-4">
            <div className="bg-base-100 border border-base-300 rounded-2xl p-5 flex flex-col items-center gap-4">
                <p className="text-sm font-semibold">Thanh toán qua MoMo</p>

                <div className="w-16 h-16 rounded-2xl bg-[#ae2070] flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">M</span>
                </div>

                {timeLeft !== null && (
                    <div className={`flex items-center gap-2 text-sm font-semibold ${isExpired ? "text-error" : "text-warning"}`}>
                        <Clock size={14} />
                        {isExpired ? "Liên kết đã hết hạn" : `Hết hạn sau: ${fmt(timeLeft)}`}
                    </div>
                )}

                {payment?.checkout_url ? (
                    <a
                        href={isExpired ? undefined : payment.checkout_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`btn btn-primary w-full gap-2 ${isExpired ? "btn-disabled" : ""}`}
                    >
                        Thanh toán ngay
                    </a>
                ) : (
                    <div className="btn btn-disabled w-full gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Đang tạo liên kết...
                    </div>
                )}
            </div>

            <div className="bg-base-100 border border-base-300 rounded-2xl p-5 space-y-3">
                <p className="text-sm font-semibold">Thông tin đơn hàng</p>
                <div className="space-y-2 text-sm">
                    <InfoRow label="Số tiền" value={formatMoney(payment?.amount)} />
                    <InfoRow label="Nội dung" value={payment?.provider_response?.orderInfo || ""} />
                </div>
            </div>

            <p className="text-xs text-base-content/70 text-center px-4">
                Nhấn "Thanh toán ngay" để chuyển đến trang MoMo và nhập thông tin thẻ ATM. Sau khi hoàn tất, vui lòng chờ hệ thống xác nhận đơn đặt vé của bạn.
            </p>
        </div>
    );
}

const PaymentPayPal = ({ booking }) => {
    const payment = booking?.payment;
    const timeLeft = usePaymentCountdown(payment?.expired_at);
    const isExpired = timeLeft === 0;

    return (
        <div className="space-y-4">
            <div className="bg-base-100 border border-base-300 rounded-2xl p-5 flex flex-col items-center gap-4">
                <p className="text-sm font-semibold">Thanh toán qua PayPal</p>

                <div className="w-16 h-16 rounded-2xl bg-[#003087] flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">P</span>
                </div>

                {timeLeft !== null && (
                    <div className={`flex items-center gap-2 text-sm font-semibold ${isExpired ? "text-error" : "text-warning"}`}>
                        <Clock size={14} />
                        {isExpired ? "Liên kết đã hết hạn" : `Hết hạn sau: ${fmt(timeLeft)}`}
                    </div>
                )}

                {payment?.checkout_url ? (
                    <a
                        href={isExpired ? undefined : payment.checkout_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`btn btn-primary w-full gap-2 ${isExpired ? "btn-disabled" : ""}`}
                    >
                        Thanh toán ngay
                    </a>
                ) : (
                    <div className="btn btn-disabled w-full gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Đang tạo liên kết...
                    </div>
                )}
            </div>

            <div className="bg-base-100 border border-base-300 rounded-2xl p-5 space-y-3">
                <p className="text-sm font-semibold">Thông tin đơn hàng</p>
                <div className="space-y-2 text-sm">
                    <InfoRow label="Số tiền (USD)" value={`$${(payment?.amount / 25000).toFixed(2)}`} />
                    <InfoRow label="Nội dung" value={payment?.provider_response?.purchase_units?.[0]?.description || ""} />
                </div>
            </div>

            <p className="text-xs text-base-content/70 text-center px-4">
                Nhấn "Thanh toán ngay" để chuyển đến trang PayPal. Sau khi hoàn tất, vui lòng chờ hệ thống xác nhận đơn đặt vé của bạn.
            </p>
        </div>
    );
}

const PaymentNotFound = () => {
    return (
        <div className="bg-base-100 border border-base-300 rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
            <p className="font-semibold text-error">Phương thức thanh toán không hỗ trợ</p>
        </div>
    );
}

const PaymentSelector = ({ booking, methodCode }) => {
    switch (methodCode) {
        case "BANK_QR":
            return <PaymentPayOS booking={booking} />;
        case "MOMO":
            return <PaymentMoMo booking={booking} />;
        case "PAYPAL":
            return <PaymentPayPal booking={booking} />;
        default:
            return <PaymentNotFound />;
    }
}

export default PaymentSelector;