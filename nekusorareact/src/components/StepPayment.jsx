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

const StepPaymentPayOS = ({ booking }) => {
    const payment = booking?.payment;
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!payment?.expired_at) return;
        const tick = () => {
            const diff = Math.max(0, Math.floor((new Date(payment.expired_at) - Date.now()) / 1000));
            setTimeLeft(diff);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [payment?.expired_at]);

    const fmt = (s) => {
        if (s === null || s === undefined) return "--:--";
        const m = Math.floor(s / 60).toString().padStart(2, "0");
        const sec = (s % 60).toString().padStart(2, "0");
        return `${m}:${sec}`;
    };

    const isExpired = timeLeft === 0;

    return (
        <div className="space-y-4">
            <div className="bg-base-100 border border-base-300 rounded-2xl p-5 flex flex-col items-center gap-4">
                <p className="text-sm font-semibold">Quét mã QR để thanh toán</p>

                {payment?.qr_code_url ? (
                    <div className={`transition-opacity ${isExpired ? "opacity-30 pointer-events-none" : ""}`}>
                        <QRCodeSVG
                            value={payment.qr_code_url}
                            size={208}
                        />
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

export default StepPaymentPayOS;