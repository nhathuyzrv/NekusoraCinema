import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Film, Calendar, Ticket, Popcorn, Tag, CreditCard, Clock, CheckCircle, XCircle, AlertCircle, Flame } from "lucide-react";
import Barcode from "react-barcode";
import { authApis, endpoints } from "../configs/Apis";
import BackButton from "../components/BackButton";

function formatMoney(n) {
    return n != null ? Number(n).toLocaleString("vi-VN") + "đ" : "-";
}
function formatDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
    });
}
function formatDatetime(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}
function formatWeekday(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("vi-VN", { weekday: "long" });
}

const STATUS_CONFIG = {
    CONFIRMED: { label: "Đã xác nhận", icon: CheckCircle, cls: "text-success", badgeCls: "badge-success" },
    CANCELLED: { label: "Đã huỷ", icon: XCircle, cls: "text-error", badgeCls: "badge-error" },
    EXPIRED: { label: "Đã hết hạn", icon: AlertCircle, cls: "text-info", badgeCls: "badge-info" },
    HOLDING: { label: "Chưa hoàn tât", icon: AlertCircle, cls: "text-warning", badgeCls: "badge-warning" },
};

const AGE_BADGE = { P: "badge-success", K: "badge-info", T13: "badge-warning", T16: "badge-orange", T18: "badge-error" };

function Section({ title, icon: Icon, children }) {
    return (
        <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-base-200">
                <Icon size={16} className="text-primary" />
                <p className="font-semibold text-sm">{title}</p>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function InfoRow({ label, value, highlight }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2 border-b border-base-200 last:border-0">
            <span className="text-sm text-base-content/50 shrink-0 w-36">{label}</span>
            <span className={`text-sm font-medium text-right flex-1 ${highlight ? "text-primary font-bold" : ""}`}>
                {value ?? "-"}
            </span>
        </div>
    );
}

function useBookingDetail(bookingCode) {
    return useQuery({
        queryKey: ["booking", bookingCode],
        queryFn: () => authApis.get(endpoints.bookingDetails(bookingCode)).then(r => r.data),
        enabled: !!bookingCode,
        staleTime: 1000 * 60,
    });
}

const BookingDetails = () => {
    const { bookingCode } = useParams();
    const navigate = useNavigate();
    const { data: booking, isLoading, isError } = useBookingDetail(bookingCode);

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <span className="loading loading-bars loading-lg text-primary" />
            </div>
        );
    }

    if (isError || !booking) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center px-4">
                <XCircle size={40} className="text-error/50" />
                <p className="font-semibold">Không tìm thấy vé</p>
                <button className="btn btn-outline btn-sm" onClick={() => navigate("/bookings/my")}>
                    Quay lại
                </button>
            </div>
        );
    }

    const statusCfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.HOLDING;
    const StatusIcon = statusCfg.icon;
    const movie = booking.movie;
    const showtime = booking.showtime;
    const payment = booking.payment;

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
            <BackButton label={"Vé của tôi"} onClick={() => navigate("/bookings/")} />

            <div className="bg-base-100 border border-base-300 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <StatusIcon size={28} className={statusCfg.cls} />
                    <div>
                        <p className="font-bold text-base">{statusCfg.label}</p>
                        <p className="text-xs text-base-content/50 font-mono mt-0.5">{booking.booking_code}</p>
                    </div>
                </div>
            </div>

            <Section title="Thông tin phim" icon={Film}>
                <div className="flex gap-4">
                    {movie?.poster && (
                        <img
                            src={movie.poster}
                            alt={movie.title}
                            className="w-20 sm:w-24 rounded-sm object-cover aspect-2/3 shrink-0"
                        />
                    )}
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="font-bold text-base leading-snug">{movie?.title ?? "-"}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {movie?.age_rating && (
                                <span className={`badge badge-sm font-bold ${AGE_BADGE[movie.age_rating] ?? "badge-neutral"}`}>
                                    {movie.age_rating}
                                </span>
                            )}
                            {showtime?.screening_format?.name && (
                                <span className="badge badge-outline badge-sm">{showtime.screening_format.name}</span>
                            )}
                        </div>
                        {movie?.duration && (
                            <p className="flex items-center gap-1 text-xs text-base-content/60">
                                <Clock size={12} /> {movie.duration} phút
                            </p>
                        )}
                    </div>
                </div>
            </Section>

            <Section title="Thông tin suất chiếu" icon={Calendar}>
                <InfoRow
                    label="Ngày chiếu"
                    value={showtime
                        ? `${formatWeekday(showtime.show_date)}, ${formatDate(showtime.show_date)}`
                        : "-"}
                />
                <InfoRow
                    label="Giờ chiếu"
                    value={showtime?.start_time
                        ? `${showtime.start_time.slice(0, 5)} – ${showtime.end_time?.slice(0, 5) ?? ""}`
                        : "-"}
                />
                <InfoRow label="Chi nhánh" value={showtime?.branch?.name} />
                <InfoRow label="Rạp" value={showtime?.room?.name} />
                <InfoRow label="Địa chỉ" value={showtime?.branch?.address} />
                <div className="pt-3">
                    <p className="text-sm text-base-content/50 mb-2">Ghế đã đặt</p>
                    <div className="flex flex-wrap gap-1.5">
                        {booking.tickets?.map(t => (
                            <span key={t.id} className="badge badge-primary font-semibold text-xs">
                                {t.seat?.seat_code}
                            </span>
                        ))}
                    </div>
                </div>
            </Section>

            {booking.products?.length > 0 && (
                <Section title="Bắp / Nước" icon={Popcorn}>
                    <div className="space-y-2">
                        {booking.products.map((bp, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    {bp.product?.image && (
                                        <img src={bp.product.image} alt={bp.product.name}
                                            className="w-9 h-9 rounded-lg object-cover" />
                                    )}
                                    <span className="text-base-content/80">
                                        {bp.product?.name} <span className="text-base-content/40">x{bp.quantity}</span>
                                    </span>
                                </div>
                                <span className="font-medium">{formatMoney(bp.subtotal)}</span>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {booking.promotion && (
                <Section title="Khuyến mãi" icon={Tag}>
                    <div className="flex items-center justify-between text-sm">
                        <div>
                            <p className="font-medium">{booking.promotion.promotion?.name}</p>
                            <p className="text-xs text-base-content/50 font-mono mt-0.5">
                                {booking.promotion.promotion?.code}
                            </p>
                        </div>
                    </div>
                </Section>
            )}

            <Section title="Thông tin hóa đơn" icon={CreditCard}>
                <InfoRow label="Tiền vé" value={formatMoney(booking.seat_amount)} />
                {booking.product_amount > 0 && (
                    <InfoRow label="Bắp nước" value={formatMoney(booking.product_amount)} />
                )}
                {booking.discount_amount > 0 && (
                    <div className="flex justify-between py-2 border-b border-base-200 text-sm">
                        <span className="text-base-content/50">Khuyến mãi</span>
                        <span className="text-success font-medium">-{formatMoney(booking.discount_amount)}</span>
                    </div>
                )}
                {booking.points_used_amount > 0 && (
                    <div className="flex justify-between py-2 border-b border-base-200 text-sm">
                        <span className="text-base-content/50">Điểm quy đổi ({booking.points_used} pts)</span>
                        <span className="text-success font-medium">-{formatMoney(booking.points_used_amount)}</span>
                    </div>
                )}
                <div className="flex justify-between pt-3 text-base">
                    <span className="font-bold">Thành tiền</span>
                    <span className="font-black text-primary text-lg">{formatMoney(booking.final_amount)}</span>
                </div>
                {booking.points_earned > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-warning">
                        <Flame size={16} className="text-warning fill-warning" />
                        Đã tích {booking.points_earned} điểm thành viên
                    </div>
                )}

                {payment && (
                    <div className="mt-4 pt-4 border-t border-base-200 space-y-1">
                        <InfoRow label="Phương thức" value={payment.method?.name} />
                        {payment.transaction_ref && (
                            <InfoRow label="Mã giao dịch" value={payment.transaction_ref} />
                        )}
                        {payment.paid_at && (
                            <InfoRow label="Đã thanh toán lúc" value={formatDatetime(payment.paid_at)} />
                        )}
                    </div>
                )}
            </Section>

            {booking.status === "CONFIRMED" && (
                <Section title="Mã vé điện tử" icon={Ticket}>
                    <p className="text-xs text-base-content/50 mb-4 text-center">
                        Xuất trình mã này tại quầy soát vé để vào rạp
                    </p>
                    <div className="flex flex-col items-center gap-2">
                        <div className="bg-white rounded-xl p-2 w-full flex justify-center">
                            <Barcode
                                value={booking.booking_code}
                                format="CODE128"
                                width={1.8}
                                height={36}
                                displayValue={true}
                                fontSize={14}
                                background="white"
                                lineColor="#1a1a1a"
                            />
                        </div>
                    </div>

                    {booking.confirmed_at && (
                        <p className="text-center text-xs text-base-content/40 mt-3">
                            Đã xác nhận lúc: {formatDatetime(booking.confirmed_at)}
                        </p>
                    )}
                </Section>
            )}
        </div>
    );
}

export default BookingDetails;