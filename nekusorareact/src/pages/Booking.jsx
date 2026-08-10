import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, ChevronLeft, MapPin, Film, Clock, Ticket as TicketIcon, Tag, CreditCard, Loader2, X, Plus, Minus, Flame } from "lucide-react";
import { useLocations, useLocationMovies, useBookingMovieShowtimes, useRoomSeats, useProducts, usePaymentMethods, useHoldSeats, useSetProducts, useApplyPromotion, useRemovePromotion, useRedeemPoints, useClearPoints, useCreatePayment, useDeleteBooking, useBookingDetails, useBookingsStatus } from "../hooks/useBooking";
import { useSeatSocket, useBookingConfirmed } from "../hooks/useWebSockets";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import LocalLoading from "../components/LocalLoading";
import GlobalLoading from "../components/GlobalLoading";
import MyAlert from "../configs/MyAlert";
import { SeatCountdown } from "../components/SeatCountdown";
import { formatMoney, formatSignedMoney } from "../utils/Money";
import { formatDate, formatShortWeekday } from "../utils/DateTime";
import { callAuthModal } from "../utils/CallAuthModal";
import bookingService from "../services/bookingService";
import { StepPaymentPayOS } from "../components/StepPayment";


const STEPS = ["Chọn suất chiếu", "Chọn ghế", "Chọn bắp/nước", "Khuyến mãi", "Xác nhận đơn", "Thanh toán"];
const MAX_SEATS = 8;
const SEAT_HOLD_MINUTES = 8;
const POINTS_TO_VND = 500;

function todayStr() {
    return new Date().toISOString().split("T")[0];
}

function next5Days() {
    return Array.from({ length: 5 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d.toISOString().split("T")[0];
    });
}

// progress bar
function BookingStepper({ currentStep, maxUnlockedStep, onStepClick }) {
    const canGoBack = (i) => i < currentStep && [1, 3, 4].includes(currentStep) && i <= maxUnlockedStep;

    return (
        <div className="w-full mb-10 flex justify-center px-4">
            {STEPS.map((label, i) => {
                const isDone = i < currentStep;
                const isActive = i === currentStep;
                const clickable = isDone && canGoBack(currentStep);

                return (
                    <div key={label} className={`flex items-center min-w-fit ${i < STEPS.length - 1 ? "flex-1" : "flex-none"}`}>
                        <button
                            type="button"
                            disabled={!clickable}
                            onClick={() => clickable && onStepClick(i)}
                            className="flex flex-col items-center gap-1.5 shrink-0 disabled:cursor-default"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                                ${isDone ? "bg-primary text-primary-content" : ""}
                                ${isActive ? "bg-primary/15 text-primary border-2 border-primary" : ""}
                                ${!isDone && !isActive ? "bg-base-200 text-base-content/40" : ""}
                                ${clickable ? "hover:scale-105 cursor-pointer" : ""}
                            `}>
                                {isDone ? <Check size={18} /> : i + 1}
                            </div>
                            <span className={`text-[11px] whitespace-nowrap ${isActive ? "font-bold text-primary" : "text-base-content/60"}`}>
                                {label}
                            </span>
                        </button>
                        {i < STEPS.length - 1 && (
                            <div className={`h-1 flex-1 mx-1 mb-4 ${isDone ? "bg-primary" : "bg-base-300"}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// step 1
function StepShowtime({ selection, setSelection, onContinue }) {
    const { location, movie, showtime } = selection;
    const [openPanel, setOpenPanel] = useState(0);
    const [selectedDate, setSelectedDate] = useState(todayStr());

    const { data: locations, isLoading: loadingLocations } = useLocations();
    const { data: movieData, isLoading: loadingMovies } = useLocationMovies(location?.id);
    const { data: showtimes, isLoading: loadingShowtimes } = useBookingMovieShowtimes(movie?.id, selectedDate, location?.id);

    const movies = movieData?.results ?? [];

    const groupedShowtimes = useMemo(() => {
        if (!showtimes) return [];
        const byBranch = new Map();
        showtimes.forEach((st) => {
            const branchId = st.branch.id;
            if (!byBranch.has(branchId)) {
                byBranch.set(branchId, { branch: st.branch, formats: new Map() });
            }
            const entry = byBranch.get(branchId);
            const fmtId = st.screening_format.id;
            if (!entry.formats.has(fmtId)) {
                entry.formats.set(fmtId, { format: st.screening_format, showtimes: [] });
            }
            entry.formats.get(fmtId).showtimes.push(st);
        });
        return Array.from(byBranch.values());
    }, [showtimes]);

    const pickLocation = (loc) => {
        setSelection({ location: loc, movie: null, showtime: null });
        setOpenPanel(1);
    };
    const pickMovie = (m) => {
        setSelection((p) => ({ ...p, movie: m, showtime: null }));
        setOpenPanel(2);
    };
    const pickShowtime = (st) => {
        setSelection((p) => ({ ...p, showtime: st }));
    };

    return (
        <div className="space-y-4">
            <div className={`collapse collapse-arrow bg-base-100 border border-base-300 rounded-2xl ${openPanel === 0 ? "collapse-open" : "collapse-close"}`}>
                <div className="collapse-title font-semibold flex items-center gap-2 cursor-pointer" onClick={() => setOpenPanel(0)}>
                    <MapPin size={16} className="text-primary" />
                    Chọn khu vực
                    {location && <span className="badge badge-primary badge-sm ml-2">{location.name}</span>}
                </div>
                <div className="collapse-content">
                    <LocalLoading show={loadingLocations}>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {locations?.results?.map((loc) => (
                                <button
                                    key={loc.id}
                                    onClick={() => pickLocation(loc)}
                                    className={`btn btn-sm ${location?.id === loc.id ? "btn-primary" : "btn-outline"}`}
                                >
                                    {loc.name}
                                </button>
                            )) ?? locations?.map((loc) => (
                                <button
                                    key={loc.id}
                                    onClick={() => pickLocation(loc)}
                                    className={`btn btn-sm ${location?.id === loc.id ? "btn-primary" : "btn-outline"}`}
                                >
                                    {loc.name}
                                </button>
                            ))}
                        </div>
                    </LocalLoading>
                </div>
            </div>

            <div className={`collapse collapse-arrow bg-base-100 border border-base-300 rounded-2xl ${openPanel === 1 ? "collapse-open" : "collapse-close"} ${!location ? "opacity-50" : ""}`}>
                <div
                    className="collapse-title font-semibold flex items-center gap-2 cursor-pointer"
                    onClick={() => location && setOpenPanel(1)}
                >
                    <Film size={16} className="text-primary" />
                    Chọn phim
                    {movie && <span className="badge badge-primary badge-sm ml-2 truncate max-w-200">{movie.title}</span>}
                </div>
                <div className="collapse-content">
                    {!location ? (
                        <p className="text-sm text-base-content/40 pt-2">Vui lòng chọn khu vực trước</p>
                    ) : (
                        <LocalLoading show={loadingMovies}>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                                {movies.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => pickMovie(m)}
                                        className={`bg-base-200 group text-left rounded-xl overflow-hidden border-2 transition-colors
                                            ${movie?.id === m.id ? "border-primary" : "border-transparent hover:border-base-300"}`}
                                    >
                                        <img src={m.poster} alt={m.title} className="w-full aspect-2/3 object-cover" />
                                        <p className="text-xs font-medium mt-1 line-clamp-2 px-2 py-1">{m.title}</p>
                                    </button>
                                ))}
                            </div>
                        </LocalLoading>
                    )}
                </div>
            </div>

            <div className={`collapse collapse-arrow bg-base-100 border border-base-300 rounded-2xl ${openPanel === 2 ? "collapse-open" : "collapse-close"} ${!movie ? "opacity-50" : ""}`}>
                <div
                    className="collapse-title font-semibold flex items-center gap-2 cursor-pointer"
                    onClick={() => movie && setOpenPanel(2)}
                >
                    <Clock size={16} className="text-primary" />
                    Chọn suất chiếu
                    {showtime && (
                        <span className="badge badge-primary badge-sm ml-2">
                            {showtime.start_time?.slice(0, 5)} — {formatShortWeekday(showtime.show_date)},{formatDate(showtime.show_date)} — {showtime.branch.name}
                        </span>
                    )}
                </div>
                <div className="collapse-content">
                    {!movie ? (
                        <p className="text-sm text-base-content/40 pt-2">Vui lòng chọn phim trước</p>
                    ) : (
                        <div className="pt-3 space-y-5">
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {next5Days().map((d, i) => {
                                    const dateObj = new Date(d);
                                    const isSelected = selectedDate === d;
                                    const dayLabel = i === 0 ? "Hôm nay" : formatShortWeekday(dateObj);
                                    const dateLabel = dateObj.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
                                    return (
                                        <button
                                            key={d}
                                            onClick={() => setSelectedDate(d)}
                                            className={`flex flex-col items-center px-4 py-2 rounded-xl border text-xs font-medium shrink-0 transition-colors
                                                ${isSelected
                                                    ? "bg-primary text-primary-content border-primary"
                                                    : "bg-base-100 text-base-content border-base-300 hover:border-primary/50"}`}
                                        >
                                            <span className="font-semibold">{dayLabel}</span>
                                            <span className={isSelected ? "text-primary-content/80" : "text-base-content/50"}>{dateLabel}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <LocalLoading show={loadingShowtimes}>
                                <div className="min-h-25 divide-y divide-base-200">
                                    {groupedShowtimes.length === 0 && !loadingShowtimes && (
                                        <p className="text-sm text-base-content/40 py-4 text-center">
                                            Không có suất chiếu trong ngày này
                                        </p>
                                    )}
                                    {groupedShowtimes.map(({ branch, formats }) => (
                                        <div key={branch.id} className="border-l-4 border-base-200 overflow-hidden py-4">
                                            <div className="px-4 pt-3 pb-2 bg-base-50">
                                                <p className="text-sm font-bold text-base-content">{branch.name}</p>
                                                {branch.address && (
                                                    <p className="text-xs text-base-content/50 mt-0.5">{branch.address}</p>
                                                )}
                                            </div>
                                            <div className="px-4 py-3 space-y-3">
                                                {Array.from(formats.values()).map(({ format, showtimes: sts }) => (
                                                    <div key={format.id} className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                                        <span className="text-xs font-semibold text-base-content/50 w-20 shrink-0">{format.name}</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {sts.map((st) => (
                                                                <div className="tooltip" data-tip={`${st.room.name}`}>
                                                                    <button
                                                                        key={st.id}
                                                                        onClick={() => pickShowtime(st)}
                                                                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors
                                                                        ${showtime?.id === st.id
                                                                                ? "bg-primary text-primary-content border-primary"
                                                                                : "bg-base-100 text-base-content border-base-300 hover:border-primary hover:text-primary"}`}
                                                                    >
                                                                        {st.start_time?.slice(0, 5)}
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </LocalLoading>
                        </div>
                    )}
                </div>
            </div>

            <button
                className="btn btn-primary w-full mt-4"
                disabled={!showtime}
                onClick={onContinue}
            >
                Tiếp tục
            </button>
        </div>
    );
}

// step 2
function isValidSeatSelection(selectedInRow, seatsPerRow) {
    if (selectedInRow.length === 0) return true;
    const sorted = [...selectedInRow].sort((a, b) => a - b);
    const min = sorted[0], max = sorted[sorted.length - 1];

    if (min - 1 === 1) return false;
    if (seatsPerRow - max === 1) return false;

    for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i + 1] - sorted[i] - 1;
        if (gap === 1) return false;
    }
    return true;
}

function SeatMap({ showtime, selectedSeats, setSelectedSeats }) {
    const { data: seats, isLoading } = useRoomSeats(showtime.room.id);
    const { booked, held } = useSeatSocket(showtime.id);
    const toast = useToast();

    useEffect(() => {
        if (selectedSeats.length === 0) return;
        const unavailable = new Set([...booked, ...held]);
        const evicted = selectedSeats.filter((s) => unavailable.has(s.id));
        if (evicted.length === 0) return;
        setSelectedSeats((prev) => prev.filter((s) => !unavailable.has(s.id)));
    }, [booked, held]); // eslint-disable-line react-hooks/exhaustive-deps

    const rows = useMemo(() => {
        if (!seats) return [];
        const map = new Map();
        seats.forEach((s) => {
            if (!map.has(s.row_label)) map.set(s.row_label, []);
            map.get(s.row_label).push(s);
        });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([label, seatList]) => [label, seatList.sort((a, b) => a.seat_number - b.seat_number)]);
    }, [seats]);

    const toggleSeat = (seat) => {
        if (booked.includes(seat.id) || held.includes(seat.id)) return;

        const isSelected = selectedSeats.some((s) => s.id === seat.id);
        let next;
        if (isSelected) {
            next = selectedSeats.filter((s) => s.id !== seat.id);
        } else {
            if (selectedSeats.length >= MAX_SEATS) {
                toast.warning("Số ghế đạt giới hạn", `Bạn chỉ được chọn tối đa ${MAX_SEATS} ghế`);
                return;
            }
            next = [...selectedSeats, seat];
        }

        const rowSeats = rows.find(([label]) => label === seat.row_label)?.[1] ?? [];
        const seatsPerRowCount = rowSeats.length;
        const selectedInRow = next.filter((s) => s.row_label === seat.row_label).map((s) => s.seat_number);

        if (!isValidSeatSelection(selectedInRow, seatsPerRowCount)) {
            toast.warning("Không thể chọn hoặc bỏ chọn ghế này", "Vui lòng không chừa trống 1 ghế lẻ ở đầu, giữa hoặc cuối dãy ghế đã chọn");
            return;
        }

        setSelectedSeats(next);
    };

    const getSeatState = (seat) => {
        if (booked.includes(seat.id)) return "booked";
        if (held.includes(seat.id)) return "held";
        if (selectedSeats.some((s) => s.id === seat.id)) return "selected";
        return "available";
    };

    const seatClass = {
        available: "bg-base-200 hover:bg-primary/20 text-base-content/70 cursor-pointer",
        selected: "bg-primary text-primary-content cursor-pointer",
        held: "bg-warning/40 text-warning-content cursor-not-allowed",
        booked: "bg-accent/60 text-accent-content cursor-not-allowed",
    };

    return (
        <LocalLoading show={isLoading}>
            <div className="bg-base-100 border border-base-300 rounded-2xl p-5">
                <div className="mt-1 mb-2 border-b border-base-300 pb-3">
                    <p className="text-center text-xs text-base-content/60 mb-1 tracking-widest">{showtime.room.name}</p>
                </div>

                <div className="flex flex-col-reverse gap-2 items-center overflow-x-auto pb-2 pt-4">
                    {rows.map(([label, seatList]) => (
                        <div key={label} className="flex items-center gap-1.5 shrink-0">
                            <span className="w-5 text-xs text-base-content/40 font-medium text-center shrink-0 pr-18">{label}</span>
                            {seatList.map((seat) => (
                                <button
                                    key={seat.id}
                                    onClick={() => toggleSeat(seat)}
                                    disabled={getSeatState(seat) === "booked" || getSeatState(seat) === "held"}
                                    className={`w-7 h-7 rounded-md text-[10px] font-semibold flex items-center justify-center transition-colors shrink-0 ${seatClass[getSeatState(seat)]}`}
                                    title={seat.seat_code}
                                >
                                    {seat.seat_number}
                                </button>
                            ))}
                            <span className="w-5 text-xs text-base-content/40 font-medium text-center shrink-0 pl-18">{label}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-10 mb-2">
                    <p className="text-center text-xs text-base-content/60 mb-1 tracking-widest">VỊ TRÍ MÀN HÌNH</p>
                    <div className="w-full h-2 bg-linear-to-r from-transparent via-primary/40 to-transparent rounded-full" />
                </div>

                <div className="flex flex-wrap gap-4 justify-center mt-6 text-xs border-t border-base-300 pt-4">
                    {[
                        ["available", "Còn trống"],
                        ["selected", "Đang chọn"],
                        ["held", "Đang được giữ"],
                        ["booked", "Đã đặt"]
                    ].map(([key, label]) => (
                        <div key={key} className="flex items-center gap-1.5">
                            <span className={`w-3.5 h-3.5 rounded ${seatClass[key].split(" ")[0]}`} />
                            <span className="text-base-content/60">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </LocalLoading>
    );
}

function StepSeats({ showtime, selectedSeats, setSelectedSeats, onContinue, onBack }) {
    return (
        <div className="space-y-4">
            <SeatMap showtime={showtime} selectedSeats={selectedSeats} setSelectedSeats={setSelectedSeats} />

            <div className="flex items-center justify-between text-sm px-1">
                <span className="text-base-content/60">
                    Đã chọn <span className={`font-semibold ${selectedSeats.length === 0 || selectedSeats.length === MAX_SEATS ? "text-error" : "text-info"}`}>{selectedSeats.length}</span> / {MAX_SEATS} ghế
                </span>
                {selectedSeats.length > 0 && (
                    <span className="font-medium">
                        {selectedSeats.map((s) => s.seat_code).join(", ")}
                    </span>
                )}
            </div>

            <div className="flex gap-3">
                <button className="btn btn-outline" onClick={onBack}>
                    <ChevronLeft size={16} /> Quay lại
                </button>
                <button
                    className="btn btn-primary flex-1"
                    disabled={selectedSeats.length === 0}
                    onClick={onContinue}
                >
                    Tiếp tục
                </button>
            </div>
        </div>
    );
}

// step 3
function StepProducts({ booking, bookingCode, cart, setCart, onContinue }) {
    const { data: products, isLoading } = useProducts();
    const { mutate: setProducts, isPending } = useSetProducts(bookingCode);

    useEffect(() => {
        if (!booking?.products?.length || !products) return;
        if (cart.length > 0) return;

        const list = products?.results ?? products ?? [];
        const restored = booking.products.map((bp) => {
            const prod = list.find((p) => p.id === (typeof bp.product === "object" ? bp.product?.id : bp.product));
            return {
                product: prod?.id ?? bp.product,
                quantity: bp.quantity,
                _info: prod ?? { id: bp.product, name: bp.product_name ?? "Sản phẩm", price: bp.price ?? 0 },
            };
        });
        setCart(restored);
    }, [booking, products]); // eslint-disable-line 

    const list = products?.results ?? products ?? [];

    const changeQty = (product, delta) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.product === product.id);
            if (!existing) {
                return delta > 0 ? [...prev, { product: product.id, quantity: 1, _info: product }] : prev;
            }
            const newQty = existing.quantity + delta;
            if (newQty <= 0) return prev.filter((i) => i.product !== product.id);
            return prev.map((i) => i.product === product.id ? { ...i, quantity: newQty } : i);
        });
    };

    const getQty = (productId) => cart.find((i) => i.product === productId)?.quantity ?? 0;

    const handleContinue = () => {
        const items = cart.map(({ product, quantity }) => ({ product, quantity }));
        setProducts(items, { onSuccess: () => onContinue() });
    };

    return (
        <div className="space-y-4">
            <LocalLoading show={isLoading}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-50">
                    {list.map((p) => {
                        const qty = getQty(p.id);
                        return (
                            <div key={p.id} className="bg-base-100 border border-base-300 rounded-xl p-3 flex gap-3">
                                {p.image && (
                                    <img src={p.image} alt={p.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-semibold truncate">{p.name}</p>
                                        {p.product_type === "COMBO" && (
                                            <span className="badge badge-secondary badge-xs">Combo</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-base-content/50 line-clamp-1 mt-0.5">{p.description}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-sm font-bold text-primary">{formatMoney(p.price)}</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                className="btn btn-xs btn-circle btn-outline"
                                                onClick={() => changeQty(p, -1)}
                                                disabled={qty === 0}
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="w-4 text-center text-sm font-medium">{qty}</span>
                                            <button
                                                className="btn btn-xs btn-circle btn-primary"
                                                onClick={() => changeQty(p, 1)}
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </LocalLoading>

            <button className="btn btn-primary w-full" onClick={handleContinue} disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" size={16} /> : (cart.length === 0 ? "Bỏ qua" : "Tiếp tục")}
            </button>
        </div>
    );
}

// step 4
function StepPromotion({ booking, bookingCode, onContinue, onBack }) {
    const [code, setCode] = useState("");
    const [pointsInput, setPointsInput] = useState(0);
    const { user } = useAuth();
    const toast = useToast();

    const { mutate: applyPromo, isPending: applyingPromo } = useApplyPromotion(bookingCode);
    const { mutate: removePromo, isPending: removingPromo } = useRemovePromotion(bookingCode);
    const { mutate: redeemPts, isPending: redeemingPts } = useRedeemPoints(bookingCode);
    const { mutate: clearPts, isPending: clearingPts } = useClearPoints(bookingCode);

    const appliedPromo = booking?.promotion;
    const subtotal = parseFloat(booking?.seat_amount ?? 0) + parseFloat(booking?.product_amount ?? 0);
    const maxPointsByAmount = Math.floor(Math.max(subtotal - parseFloat(booking?.discount_amount ?? 0), 0) / POINTS_TO_VND);
    const maxPoints = Math.min(user?.loyalty_points ?? 0, maxPointsByAmount);

    const handleApplyCode = () => {
        if (!code.trim()) return;
        applyPromo(code.trim(), {
            onSuccess: () => {
                setCode("");
                toast.success("Áp dụng mã thành công", `Bạn đã áp dụng mã khuyến mãi ${code.toUpperCase()}`)
            }
        });
    };

    const handleApplyPoints = () => {
        if (pointsInput > maxPoints) {
            toast.warning("Số điểm vượt quá giới hạn", `Bạn chỉ có thể dùng tối đa ${maxPoints} điểm cho đơn này`);
            return;
        }
        redeemPts(pointsInput, {
            onSuccess: () => {
                toast.success("Quy đổi điểm thành công", `Bạn được giảm ${formatMoney(pointsInput * POINTS_TO_VND)}`)
            }
        });
    };

    const busy = applyingPromo || removingPromo || redeemingPts || clearingPts;

    return (
        <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="lg:w-1/2 space-y-4">
                    <div className="bg-base-100 border border-base-300 rounded-2xl p-4">
                        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Tag size={14} className="text-primary" /> Mã khuyến mãi
                        </p>
                        {appliedPromo ? (
                            <div className="flex items-center justify-between bg-success/10 border border-success/30 rounded-lg px-3 py-2">
                                <div>
                                    <p className="text-sm font-medium text-success">{appliedPromo.promotion.code}</p>
                                    <p className="text-xs text-base-content/70">{appliedPromo.promotion.name}</p>
                                </div>
                                <button
                                    className="btn btn-xs btn-circle btn-ghost"
                                    onClick={() => removePromo()}
                                    disabled={busy}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="input input-sm flex-1"
                                    placeholder="Nhập mã khuyến mãi"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    disabled={busy}
                                />
                                <button
                                    className={`btn btn-sm ${busy || !code.trim() ? "" : "border-primary/40 text-primary"} hover:btn-primary hover:text-primary-content`}
                                    onClick={handleApplyCode}
                                    disabled={busy || !code.trim()}
                                >
                                    Áp dụng
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-base-100 border border-base-300 rounded-2xl p-4">
                        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Flame size={16} className="text-primary" /> Quy đổi điểm thành viên
                        </p>
                        <p className="text-xs text-base-content/50 mb-3">
                            Bạn đang có <span className="font-semibold text-primary">{user?.loyalty_points.toLocaleString('vi-VN') ?? 0}</span> điểm
                            (2 điểm = 1.000đ)
                        </p>
                        {booking?.points_used > 0 ? (
                            <div className="flex items-center justify-between bg-success/10 border border-success/30 rounded-lg px-3 py-2">
                                <p className="text-sm font-medium text-success">
                                    Đã dùng {booking.points_used} điểm
                                </p>
                                <button className="btn btn-xs btn-circle btn-ghost" onClick={() => clearPts()} disabled={busy}>
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    className="input input-sm flex-1"
                                    placeholder="Số điểm muốn dùng"
                                    min={0}
                                    max={maxPoints}
                                    value={pointsInput}
                                    onChange={(e) => setPointsInput(Number(e.target.value))}
                                    disabled={busy}
                                />
                                <button
                                    className={`btn btn-sm ${busy || !pointsInput ? "" : "border-primary/40 text-primary"} hover:btn-primary hover:text-primary-content`}
                                    onClick={handleApplyPoints}
                                    disabled={busy || !pointsInput}
                                >
                                    Áp dụng
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:w-1/2">
                    <div className="bg-base-100 border border-base-300 rounded-2xl p-4 space-y-2.5 top-4">
                        <p className="text-sm font-semibold mb-1">Chi tiết thanh toán</p>
                        <SummaryRow label="Tổng tiền dự kiến" value={formatMoney(subtotal)} />
                        <SummaryRow
                            label="Mã khuyến mãi"
                            value={formatSignedMoney(booking?.discount_amount ?? 0)}
                            negative={booking?.discount_amount > 0}
                        />
                        <SummaryRow
                            label="Quy đổi điểm"
                            value={formatSignedMoney(booking?.points_used_amount ?? 0)}
                            negative={booking?.points_used_amount > 0}
                        />
                        <div className="divider my-1" />
                        <SummaryRow label="Thành tiền" value={formatMoney(booking?.final_amount)} bold />
                    </div>
                </div>
            </div>

            <div className="text-warning text-sm font-medium">Lưu ý: Bạn sẽ cần áp dụng lại khuyến mãi nếu quay lại từ bước này</div>

            <div className="flex gap-3">
                <button className="btn btn-outline" onClick={onBack} disabled={busy}>
                    <ChevronLeft size={16} /> Quay lại
                </button>
                <button className="btn btn-primary flex-1" onClick={onContinue} disabled={busy}>
                    Tiếp tục
                </button>
            </div>
        </div>
    );
}

function SummaryRow({ label, value, bold, negative }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className={bold ? "font-semibold" : "text-base-content/60"}>{label}</span>
            <span className={`${bold ? "font-bold text-lg text-primary" : "font-medium"} ${negative ? "text-error" : ""}`}>
                {value}
            </span>
        </div>
    );
}

// step 5
function StepConfirm({ booking, bookingCode, email, setEmail, onConfirmed, onBack }) {
    const { data: methods, isLoading } = usePaymentMethods();
    const [selectedMethod, setSelectedMethod] = useState(null);
    const { mutate: createPayment, isPending } = useCreatePayment(bookingCode);
    const { user } = useAuth();
    const toast = useToast();
    const [emailOption, setEmailOption] = useState("my-email");
    const methodList = methods?.results ?? methods ?? [];

    useEffect(() => {
        if (emailOption === "my-email") {
            setEmail(user?.email ?? "");
        }
    }, [emailOption, user?.email, setEmail]);

    const handleContinue = async () => {
        if (!selectedMethod) {
            toast.warning("Vui lòng chọn phương thức thanh toán");
            return;
        }
        if (!email.trim()) {
            toast.warning("Vui lòng nhập email để nhận vé");
            return;
        }

        const seatCodes = booking?.tickets?.map(t => t.seat.seat_code).join(", ");
        const confirmed = await MyAlert.alert(
            "Xác nhận đặt vé",
            `Phim: ${booking?.movie?.title}
            Thời gian: ${booking?.showtime?.start_time.slice(0, 5)} - ${formatShortWeekday(booking?.showtime?.show_date)}, ${formatDate(booking?.showtime?.show_date)}
            Tại: ${booking?.showtime?.room?.name} - ${booking?.showtime?.branch?.name}
            Ghế: ${seatCodes}
            Số tiền cần thanh toán: ${formatMoney(booking?.final_amount)}

            Vé sẽ được gửi tới email: ${email}
            Bạn sẽ không thể thay đổi thông tin sau khi xác nhận`,
            [
                { text: "Kiểm tra lại", style: "ghost" },
                { text: "Xác nhận", style: "primary" },
            ]
        );

        if (confirmed !== "Xác nhận") return;

        createPayment({ method: selectedMethod, email }, { onSuccess: onConfirmed });
    };

    return (
        <div className="space-y-4">
            <div className="bg-base-100 border border-base-300 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-semibold">Email nhận vé</p>

                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="email_option"
                            className="radio radio-primary radio-sm"
                            checked={emailOption === "my-email"}
                            onChange={() => setEmailOption("my-email")}
                        />
                        <span className="text-sm">Email của tôi</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="email_option"
                            className="radio radio-primary radio-sm"
                            checked={emailOption === "other"}
                            onChange={() => setEmailOption("other")}
                        />
                        <span className="text-sm">Khác</span>
                    </label>
                </div>

                <input
                    type="email"
                    className="input w-full"
                    placeholder="you@email.com"
                    value={email}
                    disabled={emailOption === "my-email"}
                    onChange={(e) => setEmail(e.target.value)}
                />

                {emailOption === "other" && (
                    <p className="text-xs text-warning flex items-start gap-1.5">
                        Lưu ý: Vui lòng kiểm tra kỹ địa chỉ email trước khi tiếp tục. Vé điện tử sẽ được gửi đến địa chỉ này và không thể thay đổi sau khi xác nhận.
                    </p>
                )}
            </div>

            <div className="bg-base-100 border border-base-300 rounded-2xl p-4">
                <p className="text-sm font-semibold mb-3">Phương thức thanh toán</p>
                <LocalLoading show={isLoading}>
                    <div className="space-y-2 min-h-20">
                        {methodList.map((m) => (
                            <label
                                key={m.id}
                                className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-colors
                                    ${selectedMethod === m.id ? "border-primary bg-primary/5" : "border-base-300"}`}
                            >
                                <input
                                    type="radio"
                                    name="payment_method"
                                    className="radio radio-primary radio-sm"
                                    checked={selectedMethod === m.id}
                                    onChange={() => setSelectedMethod(m.id)}
                                />
                                <CreditCard size={16} className="text-primary" />
                                <span className="text-sm font-medium">{m.name}</span>
                            </label>
                        ))}
                    </div>
                </LocalLoading>
            </div>

            <div className="flex gap-3">
                <button className="btn btn-outline" onClick={onBack}>
                    <ChevronLeft size={16} /> Quay lại
                </button>
                <button className="btn btn-primary flex-1" onClick={handleContinue} disabled={isPending}>
                    {isPending ? <Loader2 className="animate-spin" size={16} /> : "Tiếp tục"}
                </button>
            </div>
        </div>
    );
}

// step 6
function StepPayment({ booking }) {
    // const methodCode = booking?.payment?.method?.code?.toUpperCase();

    if (!booking?.payment) {
        return (
            <div className="bg-base-100 border border-base-300 rounded-2xl p-10 flex flex-col items-center gap-3">
                <Loader2 size={28} className="animate-spin text-primary" />
                <p className="text-sm text-base-content/50">Đang tải thông tin thanh toán...</p>
            </div>
        );
    }

    // if (methodCode === "MOMO") return <StepPaymentMoMo booking={booking} />;

    return <StepPaymentPayOS booking={booking} />;
}

function BookingSuccess({ booking }) {
    const navigate = useNavigate();
    const seats = booking?.tickets?.map((t) => t.seat.seat_code).join(", ") ?? "";

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col items-center gap-6 py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center">
                    <CheckCircle2 size={44} className="text-success" />
                </div>

                <div className="space-y-1">
                    <p className="text-xl font-bold">Đặt vé thành công!</p>
                    <p className="text-base-content/60 text-sm text-center">
                        Chúng tôi sẽ gửi vé điện tử đến email của bạn sau ít phút
                        <br></br>
                        Nếu bạn chưa nhận được vé, vui lòng liên hệ CSKH để được hỗ trợ
                    </p>
                </div>

                <div className="bg-base-100 border border-base-300 rounded-2xl p-5 w-full max-w-sm text-left space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-base-content/60">Mã vé</span>
                        <span className="font-medium">{booking?.booking_code}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-base-content/60">Phim</span>
                        <span className="font-medium text-right max-w-[60%]">{booking?.movie?.title}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-base-content/60">Suất chiếu</span>
                        <span className="font-medium">
                            {booking?.showtime?.start_time?.slice(0, 5)} - {formatShortWeekday(booking?.showtime?.show_date)}, {formatDate(booking?.showtime?.show_date)}
                        </span>
                    </div>
                    {seats && (
                        <div className="flex justify-between text-sm">
                            <span className="text-base-content/60">Ghế</span>
                            <span className="font-medium">{seats}</span>
                        </div>
                    )}
                    <div className="divider my-0" />
                    <div className="flex justify-between text-sm">
                        <span className="text-base-content/60">Tổng tiền thanh toán</span>
                        <span className="font-bold text-primary">{formatMoney(booking?.final_amount)}</span>
                    </div>
                </div>

                <div className="flex gap-3 w-full max-w-sm">
                    <button
                        className="btn btn-outline flex-1"
                        onClick={() => navigate("/movies")}
                    >
                        Trở về
                    </button>
                    <button
                        className="btn btn-primary flex-1"
                        onClick={() => {/* TODO: navigate to ticket detail */ }}
                    >
                        Xem vé
                    </button>
                </div>
            </div>
        </div>
    );
}

// order panel
function OrderSummaryPanel({ selection, selectedSeats, cart, booking, step }) {
    const { movie, showtime } = selection;
    if (!movie) {
        return (
            <div className="bg-base-100 border border-base-300 rounded-2xl p-8 text-center">
                <TicketIcon size={32} className="text-base-content/20 mx-auto mb-2" />
                <p className="text-sm text-base-content/40">Đơn đặt vé của bạn sẽ hiện ở đây</p>
            </div>
        );
    }

    const displaySeats = selectedSeats.length > 0 ? selectedSeats : (booking?.tickets?.map((t) => t.seat).filter(Boolean) ?? []);

    const displayCart = cart.length > 0 ? cart : (booking?.products?.map((bp) => {
        const prod = bp.product !== null ? bp.product : null;
        return {
            product: prod ? prod.id : bp.product,
            quantity: bp.quantity,
            _info: prod || {
                name: bp.product_name || "Sản phẩm",
                price: bp.price || 0,
            },
        };
    }) ?? []);

    return (
        <div className="bg-base-100 border border-base-300 rounded-2xl p-4 top-20 space-y-4">
            <div className="w-full text-md text-center text-primary font-medium pb-3 border-b border-base-300">
                Giữ ghế:
                <span className="pl-4">
                    {booking && booking.held_until ? (
                        <SeatCountdown heldUntil={booking.held_until} />
                    ) : (
                        <span className="font-medium text-md">--:--</span>
                    )}
                </span>
            </div>
            <div className="flex gap-3">
                <img src={movie.poster} alt={movie.title} className="w-32 rounded-xs object-cover aspect-2/3 shrink-0" />
                <div className="min-w-0">
                    <p className="text-sm font-bold line-clamp-2">{movie.title}</p>
                    {showtime && (
                        <>
                            <span className="block text-xs text-base-content/70 mt-2">{showtime.branch?.name}</span>
                            <span className="block text-xs text-base-content/70 mt-2">Suất chiếu: {showtime.start_time?.slice(0, 5)}</span>
                            <span className="block text-xs text-base-content/70 mt-2">Thời gian: {formatShortWeekday(showtime.show_date)}, {formatDate(showtime.show_date)}</span>
                            <span className="block badge badge-soft badge-info badge-sm mt-4">{showtime.room?.name} - {showtime.screening_format?.name}</span>
                        </>
                    )}
                </div>
            </div>

            {displaySeats.length > 0 && (
                <div className="border-t border-base-200 pt-3">
                    <p className="text-xs text-base-content/50 mb-1">Ghế đã chọn</p>
                    <div className="flex flex-wrap gap-1.5">
                        {displaySeats.map((s) => (
                            <span key={s.id || s.seat_code} className="badge badge-primary badge-sm">{s.seat_code}</span>
                        ))}
                    </div>
                </div>
            )}

            {displayCart.length > 0 && (
                <div className="border-t border-base-200 pt-3 space-y-1">
                    <p className="text-xs text-base-content/50 mb-1">Bắp / Nước</p>
                    {displayCart.map((item) => (
                        <div key={item.product} className="flex justify-between text-xs">
                            <span className="text-base-content/70">{item._info?.name} x{item.quantity}</span>
                            <span className="font-medium">{formatMoney((item._info?.price ?? 0) * item.quantity)}</span>
                        </div>
                    ))}
                </div>
            )}

            {booking && (
                <div className="space-y-1.5">
                    <div className="divider my-1" />
                    <div className="font-semibold mb-2">Hóa đơn tạm tính</div>
                    <SummaryRow label="Tiền vé" value={formatMoney(booking.seat_amount)} />
                    {(() => {
                        if (step === 2) {
                            const liveProductTotal = cart.reduce((sum, i) => sum + (i._info?.price ?? 0) * i.quantity, 0);
                            const liveTotal = parseFloat(booking.seat_amount) + liveProductTotal;
                            return (
                                <>
                                    {liveProductTotal > 0 && <SummaryRow label="Bắp nước" value={formatMoney(liveProductTotal)} />}
                                    <div className="divider my-1" />
                                    <SummaryRow label="Tổng cộng" value={formatMoney(liveTotal)} bold />
                                    <p className="text-xs text-base-content/60">* Chưa bao gồm khuyến mãi</p>
                                </>
                            );
                        }
                        return (
                            <>
                                {booking.product_amount > 0 && <SummaryRow label="Bắp nước" value={formatMoney(booking.product_amount)} />}
                                {booking.discount_amount > 0 && <SummaryRow label="Giảm giá" value={formatSignedMoney(booking.discount_amount)} negative />}
                                {booking.points_used_amount > 0 && <SummaryRow label="Điểm" value={formatSignedMoney(booking.points_used_amount)} negative />}
                                <div className="divider my-1" />
                                <SummaryRow label="Tổng cộng" value={formatMoney(booking.final_amount)} bold />
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}

function getResumeStep(booking) {
    if (booking.payment) return 5;
    return 2;
}

const Booking = () => {
    const [step, setStep] = useState(0);
    const [maxUnlockedStep, setMaxUnlockedStep] = useState(0);
    const [selection, setSelection] = useState({ location: null, movie: null, showtime: null });
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [cart, setCart] = useState([]);
    const [email, setEmail] = useState("");
    const [bookingCode, setBookingCode] = useState(null);
    const { isAuthenticated, user } = useAuth();
    const toast = useToast();

    const { data: booking } = useBookingDetails(bookingCode);

    const paymentSuccess = useBookingConfirmed(user?.email, bookingCode);

    const { data: holdingBookingsData, isLoading: checkingHolding } = useBookingsStatus(
        isAuthenticated && !bookingCode ? "HOLDING" : null
    );

    const { mutate: holdSeats, isPending: holding } = useHoldSeats();
    const { mutate: deleteBooking } = useDeleteBooking();

    useEffect(() => {
        if (!isAuthenticated || bookingCode || checkingHolding) return;
        const holdingList = holdingBookingsData ?? [];
        if (holdingList.length === 0) return;

        const holdingBooking = holdingList[0];
        const heldUntil = new Date(holdingBooking.held_until);
        const now = new Date();

        if (heldUntil <= now) {
            bookingService.deleteBooking(holdingBooking.booking_code).catch(() => { });
            return;
        }

        const showtime = holdingBooking.showtime;
        const movieTitle = holdingBooking.movie?.title ?? "Không rõ";
        const seatCount = holdingBooking.tickets?.length ?? "??";
        const showtimeInfo = showtime ? `${showtime.start_time?.slice(0, 5)} - ${formatDate(showtime.show_date)}` : "Không rõ";

        const resumeStep = getResumeStep(holdingBooking);

        MyAlert.alert(
            "Bạn có đơn đặt vé chưa hoàn tất",
            `Phim: ${movieTitle}
            Suất chiếu: ${showtimeInfo}
            Số ghế: ${seatCount}
            
            Bạn có thể tiếp tục hoàn thành đơn này hoặc hủy bỏ để đặt đơn mới`,
            [
                {
                    text: "Hủy đơn cũ",
                    style: "ghost",
                    onClick: () => {
                        deleteBooking(holdingBooking.booking_code);
                    },
                },
                {
                    text: "Tiếp tục đơn cũ",
                    style: "primary",
                    onClick: () => {
                        setBookingCode(holdingBooking.booking_code);
                        if (holdingBooking.movie && holdingBooking.showtime) {
                            setSelection({
                                location: holdingBooking.showtime?.branch?.location ?? null,
                                movie: holdingBooking.movie,
                                showtime: holdingBooking.showtime,
                            });
                        }
                        if (holdingBooking.tickets) {
                            setSelectedSeats(holdingBooking.tickets.map((t) => t.seat).filter(Boolean));
                        }
                        if (holdingBooking.products) {
                            setCart(
                                holdingBooking.products.map((bp) => {
                                    const prod = typeof bp.product === "object" && bp.product !== null ? bp.product : null;
                                    return {
                                        product: prod ? prod.id : bp.product,
                                        quantity: bp.quantity,
                                        _info: prod || {
                                            id: bp.product,
                                            name: bp.product_name || "Sản phẩm",
                                            price: bp.price || 0,
                                        },
                                    };
                                })
                            );
                        }
                        setStep(resumeStep);
                        setMaxUnlockedStep(resumeStep);
                    },
                },
            ]
        );
    }, [holdingBookingsData, checkingHolding]); // eslint-disable-line react-hooks/exhaustive-deps

    const goTo = (i) => {
        setStep(i);
    };
    const advance = (i) => {
        setStep(i);
        setMaxUnlockedStep((m) => Math.max(m, i));
    };

    const handleShowtimeContinue = () => advance(1);

    const checkAuth = () => {
        if (!isAuthenticated) {
            toast.info("Vui lòng đăng nhập để tiếp tục");
            callAuthModal();
            return false;
        }
        return true
    }

    const handleSeatsContinue = async () => {
        if (!checkAuth()) return;
        await MyAlert.alert("Bạn không thể đổi ghế sau khi tiếp tục",
            `Chúng tôi sẽ tiến hành giữ ghế cho bạn trong vòng ${SEAT_HOLD_MINUTES} phút
            Sau khi hết thời gian, đơn đặt vé này sẽ bị hủy bỏ nếu bạn chưa hoàn tất thanh toán`,
            [
                { text: "Chờ chút", style: "ghost" },
                {
                    text: "Tiếp tục", style: "primary", onClick: () => {
                        holdSeats(
                            { showtimeId: selection.showtime.id, seatIds: selectedSeats.map((s) => s.id) },
                            {
                                onSuccess: (data) => {
                                    setBookingCode(data.booking_code);
                                    advance(2);
                                },
                            }
                        );
                    }
                }
            ]
        )
    };

    const handleProductsContinue = () => {
        if (!checkAuth()) return;
        advance(3);
    }

    const handlePromotionContinue = () => {
        if (!checkAuth()) return;
        advance(4);
    }

    const handlePromotionBack = () => {
        if (!checkAuth()) return;
        goTo(2);
    }

    const handleConfirmContinue = () => {
        if (!checkAuth()) return;
        advance(5);
    }

    const handleConfirmBack = () => {
        if (!checkAuth()) return;
        goTo(3);
    }

    const handleDelete = async () => {
        if (!checkAuth()) return;
        await MyAlert.alert("Hủy đặt vé", "Bạn có chắc chắn muốn hủy bỏ đơn đặt vé này?",
            [
                { text: "Không", style: "ghost" },
                {
                    text: "Hủy đặt vé", style: "primary",
                    onClick: () => {
                        deleteBooking(booking.booking_code, {
                            onSuccess: () => {
                                setSelectedSeats([]);
                                setCart([]);
                                setStep(0);
                                setMaxUnlockedStep(0);
                                setSelection({ location: null, movie: null, showtime: null });
                            },
                        });
                    }
                }
            ]
        );
    };

    const canDelete = step >= 2 && booking;

    if (paymentSuccess) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <BookingStepper currentStep={STEPS.length} maxUnlockedStep={maxUnlockedStep} onStepClick={goTo} />
                <BookingSuccess booking={booking} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {holding && <GlobalLoading />}

            <BookingStepper currentStep={step} maxUnlockedStep={maxUnlockedStep} onStepClick={goTo} />

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="lg:w-[65%] w-full">
                    {step === 0 && (
                        <StepShowtime
                            selection={selection}
                            setSelection={setSelection}
                            onContinue={handleShowtimeContinue}
                        />
                    )}
                    {step === 1 && (
                        <StepSeats
                            showtime={selection.showtime}
                            selectedSeats={selectedSeats}
                            setSelectedSeats={setSelectedSeats}
                            onContinue={handleSeatsContinue}
                            onBack={() => { setSelectedSeats([]); goTo(0); }}
                        />
                    )}
                    {step === 2 && (
                        <StepProducts
                            booking={booking}
                            bookingCode={booking?.booking_code}
                            cart={cart}
                            setCart={setCart}
                            onContinue={handleProductsContinue}
                        />
                    )}
                    {step === 3 && (
                        <StepPromotion
                            booking={booking}
                            bookingCode={booking?.booking_code}
                            onContinue={handlePromotionContinue}
                            onBack={handlePromotionBack}
                        />
                    )}
                    {step === 4 && (
                        <StepConfirm
                            booking={booking}
                            bookingCode={booking?.booking_code}
                            email={email}
                            setEmail={setEmail}
                            onConfirmed={handleConfirmContinue}
                            onBack={handleConfirmBack}
                        />
                    )}
                    {step === 5 && (
                        <StepPayment booking={booking} />
                    )}
                </div>

                <div className="lg:w-[35%] w-full lg:sticky lg:top-20">
                    <OrderSummaryPanel
                        selection={selection}
                        selectedSeats={selectedSeats}
                        cart={cart}
                        booking={booking}
                        step={step}
                    />
                    {canDelete && (
                        <div className="flex justify-end mt-4">
                            <button className="btn btn-error btn-outline btn-sm" onClick={handleDelete}>
                                Hủy bỏ đặt vé
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Booking;