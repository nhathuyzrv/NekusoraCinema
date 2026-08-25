import { useState, useEffect, useRef } from "react";
import { ScanLine, Search, CheckCircle, XCircle, Film, Calendar, Armchair, Popcorn, AlertCircle } from "lucide-react";
import { useBookingDetails, useCheckinBooking } from "../../hooks/useBooking";
import Configs from "../../configs/Configs";
import { formatDate, formatShortWeekday } from "../../utils/DateTime";

const STATUS_CONFIG = {
    CONFIRMED: { label: "Đã xác nhận", icon: CheckCircle, cls: "text-success", badgeCls: "badge-success" },
    CANCELLED: { label: "Đã huỷ", icon: XCircle, cls: "text-error", badgeCls: "badge-error" },
    EXPIRED: { label: "Đã hết hạn", icon: AlertCircle, cls: "text-info", badgeCls: "badge-info" },
    HOLDING: { label: "Chưa hoàn tất", icon: AlertCircle, cls: "text-warning", badgeCls: "badge-warning" },
};

function InfoRow({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2 border-b border-base-200 last:border-0">
            <span className="text-sm text-base-content/50 shrink-0 w-32">{label}</span>
            <span className="text-sm font-medium text-right flex-1">{value ?? "-"}</span>
        </div>
    );
}

function BookingPreview({ booking, onCheckin, isCheckinPending }) {
    const statusCfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.HOLDING;
    const StatusIcon = statusCfg.icon;
    const movie = booking.movie;
    const showtime = booking.showtime;

    const canCheckin = booking.status === "CONFIRMED" && !booking.is_checked_in;

    return (
        <div className="space-y-4 mt-6">
            <div className="bg-base-100 border border-base-300 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <StatusIcon size={28} className={statusCfg.cls} />
                    <div>
                        <p className="font-bold text-base">{statusCfg.label}</p>
                        <p className="text-xs text-base-content/50 font-mono mt-0.5">{booking.booking_code}</p>
                    </div>
                </div>
                {booking.is_checked_in && (
                    <span className="badge badge-soft badge-success badge-md gap-1 font-semibold">
                        Đã check-in
                    </span>
                )}
            </div>

            <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-base-200">
                    <Film size={16} className="text-primary" />
                    <p className="font-semibold text-sm">Thông tin phim</p>
                </div>
                <div className="p-5">
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
                                    <span className={`badge badge-outline badge-sm font-semibold ${Configs.AGE_BADGE[movie.age_rating] ?? "badge-neutral"}`}>
                                        {movie.age_rating}
                                    </span>
                                )}
                                {showtime?.screening_format?.name && (
                                    <span className="badge badge-outline badge-sm font-semibold">{showtime.screening_format.name}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-base-200">
                    <Calendar size={16} className="text-primary" />
                    <p className="font-semibold text-sm">Suất chiếu</p>
                </div>
                <div className="p-5">
                    <InfoRow
                        label="Ngày chiếu"
                        value={showtime ? `${formatShortWeekday(showtime.show_date)}, ${formatDate(showtime.show_date)}` : "-"}
                    />
                    <InfoRow
                        label="Giờ chiếu"
                        value={showtime?.start_time ? `${showtime.start_time.slice(0, 5)} - ${showtime.end_time?.slice(0, 5) ?? ""}` : "-"}
                    />
                    <InfoRow label="Chi nhánh" value={showtime?.branch?.name} />
                    <InfoRow label="Rạp" value={showtime?.room?.name} />
                </div>
            </div>

            <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-base-200">
                    <Armchair size={16} className="text-primary" />
                    <p className="font-semibold text-sm">Ghế đã đặt</p>
                </div>
                <div className="p-5">
                    <div className="flex flex-wrap gap-1.5">
                        {booking.tickets?.map(t => (
                            <span key={t.id} className="badge badge-primary font-semibold text-xs">
                                {t.seat?.seat_code}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {booking.products?.length > 0 && (
                <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-base-200">
                        <Popcorn size={16} className="text-primary" />
                        <p className="font-semibold text-sm">Bắp / Nước</p>
                    </div>
                    <div className="p-5 space-y-2">
                        {booking.products.map((bp, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    {bp.product?.image && (
                                        <img src={bp.product.image} alt={bp.product.name} className="w-9 h-9 rounded-lg object-cover" />
                                    )}
                                    <span className="text-base-content/80">
                                        {bp.product?.name} <span className="text-base-content/40 ml-1">x{bp.quantity}</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="pt-2 pb-6">
                {!canCheckin && booking.is_checked_in && (
                    <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-success/10 text-success font-semibold text-sm">
                        <CheckCircle size={18} />
                        Vé này đã được check-in
                    </div>
                )}
                {!canCheckin && !booking.is_checked_in && (
                    <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-error/10 text-error font-semibold text-sm">
                        <XCircle size={18} />
                        Vé không hợp lệ để check-in ({statusCfg.label})
                    </div>
                )}
                {canCheckin && (
                    <button
                        className="btn btn-primary btn-md w-full gap-2"
                        onClick={onCheckin}
                        disabled={isCheckinPending}
                    >
                        {isCheckinPending && <span className="loading loading-spinner loading-sm" />}
                        Xác nhận check-in
                    </button>
                )}
            </div>
        </div>
    );
}

const CheckinBooking = () => {
    const [inputCode, setInputCode] = useState("");
    const [activeCode, setActiveCode] = useState(null);
    const inputRef = useRef(null);

    const { data: booking, isLoading, isError, isFetched } = useBookingDetails(activeCode);
    const { mutate: checkin, isPending: isCheckinPending } = useCheckinBooking({ bookingCode: activeCode });

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = () => {
        const trimmed = inputCode.trim();
        if (!trimmed) return;
        setActiveCode(trimmed);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSubmit();
    };

    const handleCheckin = () => {
        checkin({ is_checked_in: true });
    };

    const handleReset = () => {
        setInputCode("");
        setActiveCode(null);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="px-2 mb-6">
                <div>
                    <h1 className="font-bold text-xl leading-tight mb-1">Soát vé</h1>
                    <p className="text-sm text-base-content/70">Nhân viên quét barcode hoặc nhập mã vé thủ công</p>
                    <p className="text-sm text-base-content/70">Chỉ được thực hiện check-in mỗi vé 1 lần duy nhất, vui lòng kiểm tra kỹ thông tin khách hàng trước khi thao tác</p>
                </div>
            </div>

            <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-base-200">
                    <ScanLine size={16} className="text-primary" />
                    <p className="font-semibold text-sm">Quét / Nhập mã vé</p>
                </div>
                <div className="p-5 space-y-3">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            className="input input-bordered w-full pr-12 font-mono tracking-widest text-sm"
                            placeholder="Nhập mã vé 12 ký tự..."
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                            onKeyDown={handleKeyDown}
                            autoComplete="off"
                            autoCapitalize="characters"
                        />
                        <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/30 pointer-events-none" />
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-primary flex-1"
                            onClick={handleSubmit}
                            disabled={!inputCode.trim() || isLoading}
                        >
                            {isLoading
                                ? <span className="loading loading-spinner loading-sm" />
                                : <Search size={16} />
                            }
                            Tra cứu
                        </button>
                        {activeCode && (
                            <button className="btn btn-ghost" onClick={handleReset}>
                                Làm mới
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isLoading && activeCode && (
                <div className="flex min-h-40 items-center justify-center mt-6">
                    <span className="loading loading-bars loading-lg text-primary" />
                </div>
            )}

            {isFetched && (isError || !booking) && (
                <div className="flex flex-col items-center justify-center gap-3 text-center mt-10">
                    <XCircle size={36} className="text-error/50" />
                    <p className="font-semibold">Không tìm thấy vé</p>
                    <p className="text-sm text-base-content/50">Mã vé <span className="font-bold">{activeCode}</span> không tồn tại hoặc không hợp lệ.</p>
                </div>
            )}

            {!isLoading && booking && (
                <BookingPreview
                    booking={booking}
                    onCheckin={handleCheckin}
                    isCheckinPending={isCheckinPending}
                />
            )}
        </div>
    );
};

export default CheckinBooking;