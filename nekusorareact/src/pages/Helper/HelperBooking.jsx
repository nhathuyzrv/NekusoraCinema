import { useState, useEffect, useRef } from "react";
import {
    Check, CheckCircle2, ChevronLeft, MapPin, Film, Clock,
    Ticket as TicketIcon, Tag, CreditCard, X, Plus, Minus,
    Flame, Info, AlertTriangle, ArrowRight
} from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { formatMoney } from "../../utils/Money";

const MOCK_LOCATION = { id: 1, name: "TP. Hồ Chí Minh" };

const MOCK_MOVIE = {
    id: 1,
    title: "Thám tử lừng danh Conan: Thiên thần sa ngã trên xa lộ",
    poster: "https://cdn.galaxycine.vn/media/2026/7/23/detective-conan-fallen-angel-of-the-highway-2_1784794024555.jpg",
    duration: 110,
    rated: "T13",
};

const MOCK_SHOWTIME = {
    id: 1,
    start_time: "19:30",
    show_date: "2026-08-15",
    screening_format: { id: 1, name: "2D Lồng tiếng" },
    branch: { id: 1, name: "Nekusora Cinema Central Mall", address: "72 Lê Thánh Tôn, Q.1, TP.HCM" },
    room: { id: 1, name: "RẠP 5" },
};

const MOCK_PRODUCT = {
    id: 1,
    name: "Bắp Caramel",
    price: 65000,
    description: "Bắp rang bơ caramel thơm ngon, size vừa",
    image: "https://imgs.search.brave.com/zI-RLZ7hZqNFTrNqFWo9Bsmal7FqdAvFc0sO4VjriPg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/ZGllbm1heW1la29u/Zy5jb20vVXBsb2Fk/L0VkaXRvci8yMDI0/LzEyLzI3L2NhY2gt/bGFtLWJhcC1yYW5n/LWJvLWNhcmFtZWwt/Y2h1YW4tdmktYmYw/NS5qcGc",
};

const MOCK_PAYMENT_METHODS = [
    { id: 1, name: "Thẻ ngân hàng / QR Pay", code: "PAYOS" },
    { id: 2, name: "Ví điện tử MoMo", code: "MOMO" },
];

const STEPS = ["Chọn suất chiếu", "Chọn ghế", "Chọn Bắp/Nước", "Khuyến mãi", "Xác nhận", "Thanh toán"];

const ROW_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const COLS = 10;

const HELD_SEATS = new Set(["A-3", "A-4", "C-6", "C-7", "C-8", "F-3", "F-4", "F-5", "F-6", "H-5"]);
const BOOKED_SEATS = new Set(["B-6", "B-7", "D-1", "D-2", "G-8", "G-9", "G-10"]);

function generateSeats() {
    const seats = [];
    ROW_LABELS.forEach((row) => {
        for (let col = 1; col <= COLS; col++) {
            const key = `${row}-${col}`;
            seats.push({
                id: `seat-${key}`,
                row_label: row,
                seat_number: col,
                seat_code: `${row}${col}`,
                status: BOOKED_SEATS.has(key) ? "booked" : HELD_SEATS.has(key) ? "held" : "available",
            });
        }
    });
    return seats;
}

const ALL_SEATS = generateSeats();

function isValidSeatSelection(rowSeats, selectedIds, unavailableIds) {
    if (selectedIds.size === 0) return true;

    let emptyBlockSize = 0;
    for (const seat of rowSeats) {
        const isOccupied = selectedIds.has(seat.id) || unavailableIds.has(seat.id);
        if (isOccupied) {
            if (emptyBlockSize === 1) return false;
            emptyBlockSize = 0;
        } else {
            emptyBlockSize++;
        }
    }

    return true;
}

function BookingStepper({ currentStep }) {
    return (
        <div className="w-full mb-10 flex justify-center px-4 not-sm:hidden">
            {STEPS.map((label, i) => {
                const isDone = i < currentStep;
                const isActive = i === currentStep;
                return (
                    <div key={label} className={`flex items-center min-w-fit ${i < STEPS.length - 1 ? "flex-1" : "flex-none"}`}>
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                ${isDone ? "bg-primary text-primary-content" : ""}
                ${isActive ? "bg-primary/15 text-primary border-2 border-primary" : ""}
                ${!isDone && !isActive ? "bg-base-200 text-base-content/40" : ""}`}
                            >
                                {isDone ? <Check size={18} /> : i + 1}
                            </div>
                            <span className={`text-[11px] whitespace-nowrap ${isActive ? "font-bold text-primary" : "text-base-content/60"}`}>
                                {label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`h-1 flex-1 mx-1 mb-4 ${isDone ? "bg-primary" : "bg-base-300"}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function TutorialOverlay({ message, spotlightRect, onNext, nextLabel = "Tôi hiểu rồi, tiếp tục", children }) {
    const pad = 8;
    const svgOverlay = spotlightRect ? (
        <svg
            className="fixed inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 50 }}
            xmlns="https://www.w3.org/TR/2018/CR-SVG2-20181004/"
        >
            <defs>
                <mask id="spotlight-mask">
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    <rect
                        x={spotlightRect.left - pad}
                        y={spotlightRect.top - pad}
                        width={spotlightRect.width + pad * 2}
                        height={spotlightRect.height + pad * 2}
                        rx="12"
                        fill="black"
                    />
                </mask>
            </defs>
            <rect
                x="0" y="0" width="100%" height="100%"
                fill="rgba(0,0,0,0.65)"
                mask="url(#spotlight-mask)"
            />
            <rect
                x={spotlightRect.left - pad}
                y={spotlightRect.top - pad}
                width={spotlightRect.width + pad * 2}
                height={spotlightRect.height + pad * 2}
                rx="12"
                fill="none"
                stroke="rgba(99,102,241,0.7)"
                strokeWidth="2"
            />
        </svg>
    ) : (
        <div className="fixed inset-0 bg-black/65 pointer-events-none" style={{ zIndex: 50 }} />
    );

    const clickBlockers = spotlightRect ? (
        <>
            <div className="fixed pointer-events-auto" style={{ zIndex: 49, top: 0, left: 0, right: 0, height: Math.max(0, spotlightRect.top - pad) }} />
            <div className="fixed pointer-events-auto" style={{ zIndex: 49, bottom: 0, left: 0, right: 0, top: spotlightRect.top + spotlightRect.height + pad }} />
            <div className="fixed pointer-events-auto" style={{ zIndex: 49, top: spotlightRect.top - pad, left: 0, width: Math.max(0, spotlightRect.left - pad), height: spotlightRect.height + pad * 2 }} />
            <div className="fixed pointer-events-auto" style={{ zIndex: 49, top: spotlightRect.top - pad, left: spotlightRect.left + spotlightRect.width + pad, right: 0, height: spotlightRect.height + pad * 2 }} />
        </>
    ) : (
        <div className="fixed inset-0 pointer-events-auto" style={{ zIndex: 49 }} />
    );

    return (
        <>
            {clickBlockers}
            {svgOverlay}

            {message && (
                <div
                    className="fixed pointer-events-auto"
                    style={{
                        zIndex: 52,
                        ...(spotlightRect
                            ? {
                                top: Math.min(spotlightRect.top + spotlightRect.height + pad + 10, window.innerHeight - 220),
                                left: Math.max(8, Math.min(spotlightRect.left, window.innerWidth - 360)),
                                maxWidth: 340,
                            }
                            : { top: "50%", left: "50%", transform: "translate(-50%,-50%)", maxWidth: 380 }),
                    }}
                >
                    <div className="bg-base-100 border border-primary/40 rounded-2xl shadow-2xl p-4 space-y-3">
                        <div className="flex items-start gap-2">
                            <Info size={16} className="text-primary shrink-0 mt-0.5" />
                            <p className="text-sm leading-relaxed text-base-content whitespace-pre-line">{message}</p>
                        </div>
                        {children}
                        {onNext && (
                            <button
                                className="btn btn-primary btn-sm w-full"
                                onClick={onNext}
                            >
                                {nextLabel} <ArrowRight size={14} />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

function StepShowtime({ tutorialPhase, onTutorialNext, spotlightRefs, onContinue }) {
    const [openPanel, setOpenPanel] = useState(0);
    const [locationDone, setLocationDone] = useState(false);
    const [movieDone, setMovieDone] = useState(false);
    const [showtimeDone, setShowtimeDone] = useState(false);
    const toast = useToast();

    const canContinue = locationDone && movieDone && showtimeDone;

    return (
        <div className="space-y-4 relative">
            <div
                ref={spotlightRefs.location}
                className={`collapse collapse-arrow bg-base-100 border rounded-2xl transition-all
          ${openPanel === 0 ? "collapse-open" : "collapse-close"}
          ${tutorialPhase > 0 ? "border-base-300" : "border-primary ring-2 ring-primary/30"}`}
            >
                <div
                    className="collapse-title font-semibold flex items-center gap-2 cursor-pointer"
                    onClick={() => setOpenPanel(0)}
                >
                    <MapPin size={16} className="text-primary" />
                    Chọn khu vực
                    {locationDone && <span className="badge badge-primary badge-sm ml-2">{MOCK_LOCATION.name}</span>}
                </div>
                <div className="collapse-content">
                    <div className="flex flex-wrap gap-2 pt-2">
                        <button
                            onClick={() => {
                                setLocationDone(true);
                                setOpenPanel(1);
                                if (tutorialPhase === 0) onTutorialNext();
                            }}
                            className={`btn btn-sm ${locationDone ? "btn-primary" : "btn-outline"}`}
                        >
                            {MOCK_LOCATION.name}
                        </button>
                    </div>
                </div>
            </div>

            <div
                // eslint-disable-next-line react-hooks/refs
                ref={spotlightRefs.movie}
                className={`collapse collapse-arrow bg-base-100 border rounded-2xl transition-all
          ${openPanel === 1 ? "collapse-open" : "collapse-close"}
          ${!locationDone ? "opacity-50" : ""}
          ${tutorialPhase === 1 ? "border-primary ring-2 ring-primary/30" : "border-base-300"}`}
            >
                <div
                    className="collapse-title font-semibold flex items-center gap-2 cursor-pointer"
                    onClick={() => locationDone && setOpenPanel(1)}
                >
                    <Film size={16} className="text-primary" />
                    Chọn phim
                    {movieDone && (
                        <span className="badge badge-primary badge-sm ml-2 truncate max-w-100">{MOCK_MOVIE.title}</span>
                    )}
                </div>
                <div className="collapse-content">
                    {!locationDone ? (
                        <p className="text-sm text-base-content/40 pt-2">Vui lòng chọn khu vực trước</p>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setMovieDone(true);
                                    setOpenPanel(2);
                                    if (tutorialPhase === 1) onTutorialNext();
                                }}
                                className={`bg-base-200 text-left rounded-xl overflow-hidden border-2 transition-colors
                  ${movieDone ? "border-primary" : "border-transparent hover:border-base-300"}`}
                            >
                                <img src={MOCK_MOVIE.poster} alt={MOCK_MOVIE.title} className="w-full aspect-2/3 object-cover" />
                                <p className="text-xs font-medium mt-1 line-clamp-2 px-2 py-1">{MOCK_MOVIE.title}</p>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div
                // eslint-disable-next-line react-hooks/refs
                ref={spotlightRefs.showtime}
                className={`collapse collapse-arrow bg-base-100 border rounded-2xl transition-all
          ${openPanel === 2 ? "collapse-open" : "collapse-close"}
          ${!movieDone ? "opacity-50" : ""}
          ${tutorialPhase === 2 ? "border-primary ring-2 ring-primary/30" : "border-base-300"}`}
            >
                <div
                    className="collapse-title font-semibold flex items-center gap-2 cursor-pointer"
                    onClick={() => movieDone && setOpenPanel(2)}
                >
                    <Clock size={16} className="text-primary" />
                    Chọn suất chiếu
                    {showtimeDone && (
                        <span className="badge badge-primary badge-sm ml-2">
                            {MOCK_SHOWTIME.start_time} - {MOCK_SHOWTIME.screening_format.name}
                        </span>
                    )}
                </div>
                <div className="collapse-content">
                    {!movieDone ? (
                        <p className="text-sm text-base-content/40 pt-2">Vui lòng chọn phim trước</p>
                    ) : (
                        <div className="pt-3 space-y-4">
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {["T5 14/08", "T6 15/08", "T7 16/08", "CN 17/08", "T2 18/08"].map((d, i) => (
                                    <button
                                        key={d}
                                        className={`flex flex-col items-center px-4 py-2 rounded-xl border text-xs font-medium shrink-0 transition-colors
                      ${i === 0 ? "bg-primary text-primary-content border-primary" : "bg-base-100 text-base-content border-base-300"}`}
                                    >
                                        <span className={`font-bold`}>{d.split(" ")[0]}</span>
                                        <span className={`${i === 0 ? "text-primary-content/60" : "text-base-content/40"}`}>{d.split(" ")[1] ?? ""}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="border-l-4 border-base-200 overflow-hidden py-4">
                                <div className="px-4 pt-3 pb-2">
                                    <p className="text-sm font-bold">{MOCK_SHOWTIME.branch.name}</p>
                                    <p className="text-xs text-base-content/50 mt-0.5">{MOCK_SHOWTIME.branch.address}</p>
                                </div>
                                <div className="px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                        <span className="text-xs font-semibold text-base-content/50 w-24 shrink-0">
                                            {MOCK_SHOWTIME.screening_format.name}
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {["15:00", "17:15", "19:30", "21:45"].map((t) => (
                                                <button
                                                    key={t}
                                                    onClick={() => {
                                                        if (t !== "19:30") {
                                                            toast.warning("Hãy làm theo hướng dẫn nhe");
                                                            return;
                                                        }
                                                        setShowtimeDone(true);
                                                        if (tutorialPhase === 2) onTutorialNext();
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors
                            ${t === "19:30" && showtimeDone
                                                            ? "bg-primary text-primary-content border-primary"
                                                            : "bg-base-100 text-base-content border-base-300 hover:border-primary hover:text-primary"}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div
                // eslint-disable-next-line react-hooks/refs
                ref={spotlightRefs.continueBtn}
            >
                <button
                    className="btn btn-primary w-full"
                    disabled={!canContinue || tutorialPhase < 3}
                    onClick={onContinue}
                >
                    Tiếp tục
                </button>
            </div>
        </div>
    );
}

function SeatLegend() {
    const items = [
        { color: "bg-base-300", label: "Còn trống" },
        { color: "bg-primary", label: "Đang chọn" },
        { color: "bg-warning/60", label: "Đang được giữ" },
        { color: "bg-accent/60", label: "Đã đặt" },
    ];
    return (
        <div className="flex flex-wrap gap-4 justify-center mt-4 text-xs border-t border-base-300 pt-4">
            {items.map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                    <span className={`w-3.5 h-3.5 rounded ${color}`} />
                    <span className="text-base-content/60">{label}</span>
                </div>
            ))}
        </div>
    );
}

function StepSeats({ tutorialPhase, onTutorialNext, spotlightRefs, onContinue, onBack }) {
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [seatError, setSeatError] = useState(null);
    const toast = useToast();

    const unavailableIds = new Set(
        ALL_SEATS.filter((s) => s.status === "booked" || s.status === "held").map((s) => s.id)
    );

    const TUTORIAL_TARGET_SEATS = new Set(["E5", "E6"]);

    const rows = ROW_LABELS.map((row) => ({
        label: row,
        seats: ALL_SEATS.filter((s) => s.row_label === row),
    }));

    const handleContinue = () => {
        if (tutorialPhase >= 5) {
            const hasE5 = selectedSeats.some((s) => s.seat_code === "E5");
            const hasE6 = selectedSeats.some((s) => s.seat_code === "E6");
            if (!hasE5 || !hasE6 || selectedSeats.length !== 2) {
                toast.warning("Hãy làm theo hướng dẫn nhe");
                return;
            }
        }
        const selectedIds = new Set(selectedSeats.map((s) => s.id));
        for (const { seats: seatList } of rows) {
            if (!isValidSeatSelection(seatList, selectedIds, unavailableIds)) {
                toast.warning(
                    "Chọn ghế không hợp lệ",
                    "Vui lòng không chừa trống 1 ghế lẻ ở đầu, giữa hoặc cuối dãy ghế đã chọn"
                );
                return;
            }
        }
        onContinue(selectedSeats);
    };

    const getSeatState = (seat) => {
        if (seat.status === "booked") return "booked";
        if (seat.status === "held") return "held";
        if (selectedSeats.some((s) => s.id === seat.id)) return "selected";
        return "available";
    };

    const seatClass = {
        available: "bg-base-300 hover:bg-primary/30 text-base-content/70 cursor-pointer",
        selected: "bg-primary text-primary-content cursor-pointer",
        held: "bg-warning/60 text-warning-content cursor-not-allowed",
        booked: "bg-accent/60 text-accent-content cursor-not-allowed",
    };

    const toggleSeat = (seat) => {
        if (tutorialPhase < 5) return;
        if (seat.status === "booked" || seat.status === "held") return;
        if (!TUTORIAL_TARGET_SEATS.has(seat.seat_code)) {
            toast.warning("Hãy làm theo hướng dẫn nhe");
            return;
        }

        const isSelected = selectedSeats.some((s) => s.id === seat.id);
        let next;
        if (isSelected) {
            next = selectedSeats.filter((s) => s.id !== seat.id);
        } else {
            if (selectedSeats.length >= 2) return;
            next = [...selectedSeats, seat];
        }

        setSeatError(null);
        setSelectedSeats(next);

        if (tutorialPhase === 5) {
            const nextCodes = next.map((s) => s.seat_code);
            if (nextCodes.includes("E5") && nextCodes.includes("E6")) {
                setTimeout(onTutorialNext, 200);
            }
        }
    };

    const tutorialSelectedIllustration = tutorialPhase === 3
        ? new Set(["E-4", "E-5", "E-6"]) : tutorialPhase === 4
            ? new Set(["E-4", "E-6"])
            : new Set();

    const highlightSeat = (seat) => {
        const key = `${seat.row_label}-${seat.seat_number}`;
        if (tutorialPhase === 1 && HELD_SEATS.has(key)) return true;
        if (tutorialPhase === 2 && BOOKED_SEATS.has(key)) return true;
        if (tutorialPhase === 3 && (tutorialSelectedIllustration.has(key) || key === "E-2" || key === "E-8")) return true;
        if (tutorialPhase === 4 && (tutorialSelectedIllustration.has(key) || key === "E-5")) return true;
        return false;
    };

    const getSeatDisplayClass = (seat) => {
        const key = `${seat.row_label}-${seat.seat_number}`;
        const baseState = getSeatState(seat);

        if (tutorialPhase === 3) {
            if (tutorialSelectedIllustration.has(key)) return "bg-primary text-primary-content cursor-not-allowed";
            if (key === "E-2" || key === "E-8") return "bg-error/60 text-error-content cursor-not-allowed ring-2 ring-error";
        }

        if (tutorialPhase === 4) {
            if (tutorialSelectedIllustration.has(key)) return "bg-primary text-primary-content cursor-not-allowed";
            if (key === "E-5") return "bg-error/60 text-error-content cursor-not-allowed ring-2 ring-error";
        }

        return seatClass[baseState];
    };

    return (
        <div className="space-y-4 relative">
            <div
                ref={spotlightRefs.seatMap}
                className="bg-base-100 border border-base-300 rounded-2xl p-5"
            >
                <div className="mb-6">
                    <p className="text-center text-xs text-base-content/60 mb-1 tracking-widest">VỊ TRÍ MÀN HÌNH</p>
                    <div className="w-full h-2 bg-linear-to-r from-transparent via-primary/40 to-transparent rounded-full" />
                </div>

                <div className="flex flex-col gap-2 items-center overflow-x-auto pb-2 py-2">
                    {rows.map(({ label, seats }) => (
                        <div key={label} className="flex items-center gap-1.5 shrink-0">
                            <span className="w-5 text-xs text-base-content/40 font-medium text-center shrink-0">{label}</span>
                            {seats.map((seat) => {
                                const isHighlighted = highlightSeat(seat);
                                return (
                                    <button
                                        key={seat.id}
                                        onClick={() => toggleSeat(seat)}
                                        disabled={seat.status === "booked" || seat.status === "held" || tutorialPhase < 5}
                                        className={`w-7 h-7 rounded-md text-[10px] font-semibold flex items-center justify-center transition-all shrink-0
                      ${getSeatDisplayClass(seat)}
                      ${isHighlighted ? "ring-2 ring-mist-600 scale-110 z-10" : ""}
                    `}
                                        title={seat.seat_code}
                                    >
                                        {seat.seat_number}
                                    </button>
                                );
                            })}
                            <span className="w-5 text-xs text-base-content/40 font-medium text-center shrink-0">{label}</span>
                        </div>
                    ))}
                </div>

                <SeatLegend />

                {tutorialPhase === 3 && (
                    <div className="mt-4 flex items-start gap-2 bg-error/10 border border-error/30 rounded-xl p-3">
                        <AlertTriangle size={14} className="text-error shrink-0 mt-0.5" />
                        <p className="text-xs text-error leading-relaxed">
                            Ghế <strong>E1</strong>, <strong>E3</strong> hoặc <strong>E7</strong> sẽ bị cô lập nếu chọn E2 hoặc E8. Hệ thống sẽ từ chối lựa chọn này để tránh ghế lẻ.
                        </p>
                    </div>
                )}

                {tutorialPhase === 4 && (
                    <div className="mt-4 flex items-start gap-2 bg-error/10 border border-error/30 rounded-xl p-3">
                        <AlertTriangle size={14} className="text-error shrink-0 mt-0.5" />
                        <p className="text-xs text-error leading-relaxed">
                            Ghế <strong>E5</strong> sẽ bị cô lập nếu bỏ chọn nó. Hệ thống sẽ từ chối lựa chọn này để tránh ghế lẻ.
                        </p>
                    </div>
                )}
            </div>

            {seatError && (
                <div className="alert alert-warning text-sm">
                    <AlertTriangle size={16} />
                    <span>{seatError}</span>
                </div>
            )}

            <div className="flex items-center justify-between text-sm px-1">
                <span className="text-base-content/60">
                    Đã chọn <span className={`font-semibold ${selectedSeats.length === 0 ? "text-error" : "text-info"}`}>{selectedSeats.length}</span> / 8 ghế
                </span>
                {selectedSeats.length > 0 && (
                    <span className="font-medium">{selectedSeats.map((s) => s.seat_code).join(", ")}</span>
                )}
            </div>

            <div className="flex gap-3">
                <button className="btn btn-outline" onClick={onBack}>
                    <ChevronLeft size={16} /> Quay lại
                </button>
                <button
                    // eslint-disable-next-line react-hooks/refs
                    ref={spotlightRefs.seatContinue}
                    className="btn btn-primary flex-1"
                    disabled={tutorialPhase < 5 || !selectedSeats.some((s) => s.seat_code === "E5") || !selectedSeats.some((s) => s.seat_code === "E6")}
                    onClick={handleContinue}
                >
                    Tiếp tục
                </button>
            </div>
        </div>
    );
}

function StepProducts({ tutorialPhase, onTutorialNext, spotlightRefs, onContinue }) {
    const [qty, setQty] = useState(0);

    const changeQty = (delta) => {
        if (tutorialPhase < 2) return;
        setQty((q) => Math.max(0, q + delta));
        if (delta > 0 && qty === 1 && tutorialPhase === 1) {
            onTutorialNext();
        }
    };

    return (
        <div className="space-y-4 relative">
            <div ref={spotlightRefs.productItem} className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-25">
                <div className="bg-base-100 border border-base-300 rounded-xl p-3 flex gap-3">
                    <img src={MOCK_PRODUCT.image} alt={MOCK_PRODUCT.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{MOCK_PRODUCT.name}</p>
                        <p className="text-xs text-base-content/50 line-clamp-1 mt-0.5">{MOCK_PRODUCT.description}</p>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-bold text-primary">{formatMoney(MOCK_PRODUCT.price)}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    className="btn btn-xs btn-circle btn-outline"
                                    onClick={() => changeQty(-1)}
                                    disabled={qty === 0}
                                >
                                    <Minus size={12} />
                                </button>
                                <span className="w-4 text-center text-sm font-medium">{qty}</span>
                                <button
                                    className="btn btn-xs btn-circle btn-primary"
                                    onClick={() => {
                                        const newQty = qty + 1;
                                        setQty(newQty);
                                        if ((newQty === 1 && tutorialPhase === 0) || (newQty === 2 && tutorialPhase === 1)) {
                                            setTimeout(onTutorialNext);
                                        }
                                    }}
                                >
                                    <Plus size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                // eslint-disable-next-line react-hooks/refs
                ref={spotlightRefs.productContinue}
            >
                <button
                    className="btn btn-primary w-full"
                    disabled={qty === 0 || tutorialPhase < 2}
                    onClick={() => onContinue(qty)}
                >
                    {qty === 0 ? "Bỏ qua" : "Tiếp tục"}
                </button>
            </div>
        </div>
    );
}

function StepPromotion({ tutorialPhase, onTutorialNext, spotlightRefs, onContinue, onBack }) {
    const [code, setCode] = useState("");
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [pointsInput, setPointsInput] = useState(0);
    const [appliedPoints, setAppliedPoints] = useState(false);
    const toast = useToast();

    const baseAmount = 120000 + 65000 * 2;
    const discount = appliedPromo ? Math.round(baseAmount * 0.2) : 0;
    const pointsDiscount = appliedPoints ? 5000 : 0;
    const finalAmount = baseAmount - discount - pointsDiscount;

    return (
        <div className="space-y-4 relative">
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="lg:w-1/2 space-y-4">
                    <div ref={spotlightRefs.promoBox} className="bg-base-100 border border-base-300 rounded-2xl p-4">
                        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Tag size={14} className="text-primary" /> Mã khuyến mãi
                        </p>
                        {appliedPromo ? (
                            <div className="flex items-center justify-between bg-success/10 border border-success/30 rounded-lg px-3 py-2">
                                <div>
                                    <p className="text-sm font-medium text-success">CONAN20</p>
                                    <p className="text-xs text-base-content/70">Giảm 20% cho phim Conan</p>
                                </div>
                                <button className="btn btn-xs btn-circle btn-ghost">
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
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    disabled={tutorialPhase > 1}
                                />
                                <button
                                    className={`btn btn-sm ${code.trim() ? "border-primary/40 text-primary" : ""} hover:btn-primary hover:text-primary-content`}
                                    onClick={() => {
                                        if (code.trim() !== "CONAN20") {
                                            toast.warning("Hãy làm theo hướng dẫn nhe");
                                            return;
                                        }
                                        setAppliedPromo(true);
                                        if (tutorialPhase === 0) setTimeout(onTutorialNext, 300);
                                    }}
                                    disabled={!code.trim() || tutorialPhase > 1}
                                >
                                    Áp dụng
                                </button>
                            </div>
                        )}
                    </div>

                    <div
                        // eslint-disable-next-line react-hooks/refs
                        ref={spotlightRefs.pointsBox}
                        className="bg-base-100 border border-base-300 rounded-2xl p-4">
                        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Flame size={16} className="text-primary" /> Quy đổi điểm thành viên
                        </p>
                        <p className="text-xs text-base-content/50 mb-3">
                            Bạn đang có <span className="font-semibold text-primary">10</span> điểm (2 điểm = 1.000đ)
                            <br />Bạn có thể quy đổi tối đa 10 điểm
                        </p>
                        {appliedPoints ? (
                            <div className="flex items-center justify-between bg-success/10 border border-success/30 rounded-lg px-3 py-2">
                                <p className="text-sm font-medium text-success">Đã dùng 10 điểm</p>
                                <button className="btn btn-xs btn-circle btn-ghost">
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
                                    max={10}
                                    value={pointsInput}
                                    onChange={(e) => setPointsInput(Number(e.target.value))}
                                    disabled={tutorialPhase > 3}
                                />
                                <button
                                    className={`btn btn-sm ${pointsInput ? "border-primary/40 text-primary" : ""} hover:btn-primary hover:text-primary-content`}
                                    onClick={() => {
                                        if (pointsInput > 0) {
                                            if (pointsInput !== 10) {
                                                toast.warning("Hãy làm theo hướng dẫn nhe");
                                                return;
                                            }
                                            setAppliedPoints(true);
                                            if (tutorialPhase === 2) setTimeout(onTutorialNext, 300);
                                        }
                                    }}
                                    disabled={!pointsInput || tutorialPhase > 3}
                                >
                                    Áp dụng
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:w-1/2">
                    <div className="bg-base-100 border border-base-300 rounded-2xl p-4 space-y-2.5">
                        <p className="text-sm font-semibold mb-1">Chi tiết thanh toán</p>
                        <div className="flex justify-between text-sm">
                            <span className="text-base-content/60">Tổng tiền dự kiến</span>
                            <span className="font-medium">{formatMoney(baseAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-base-content/60">Mã khuyến mãi</span>
                            <span className={`font-medium ${discount > 0 ? "text-error" : ""}`}>
                                {discount > 0 ? `−${formatMoney(discount)}` : "0đ"}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-base-content/60">Quy đổi điểm</span>
                            <span className={`font-medium ${pointsDiscount > 0 ? "text-error" : ""}`}>
                                {pointsDiscount > 0 ? `−${formatMoney(pointsDiscount)}` : "0đ"}
                            </span>
                        </div>
                        <div className="divider my-1" />
                        <div className="flex justify-between text-sm">
                            <span className="font-semibold">Thành tiền</span>
                            <span className="font-bold text-lg text-primary">{formatMoney(finalAmount)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-warning text-sm font-medium">
                Lưu ý: Bạn sẽ cần áp dụng lại khuyến mãi nếu quay lại từ bước này
            </div>

            <div className="flex gap-3">
                <button className="btn btn-outline" onClick={onBack}>
                    <ChevronLeft size={16} /> Quay lại
                </button>
                <div
                    // eslint-disable-next-line react-hooks/refs
                    ref={spotlightRefs.promoContinue}
                    className="flex-1"
                >
                    <button
                        className="btn btn-primary w-full"
                        onClick={onContinue}
                        disabled={tutorialPhase < 4}
                    >
                        Tiếp tục
                    </button>
                </div>
            </div>
        </div>
    );
}

function StepConfirm({ tutorialPhase, onTutorialNext, spotlightRefs, onContinue, onBack }) {
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [emailOption, setEmailOption] = useState("my-email");
    const [email, setEmail] = useState("user@example.com");

    return (
        <div className="space-y-4 relative">
            <div ref={spotlightRefs.emailBox} className="bg-base-100 border border-base-300 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-semibold">Email nhận vé</p>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            className="radio radio-primary radio-sm"
                            checked={emailOption === "my-email"}
                            onChange={() => { setEmailOption("my-email"); setEmail("user@example.com"); }}
                        />
                        <span className="text-sm">Email của tôi</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
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
            </div>

            <div
                // eslint-disable-next-line react-hooks/refs
                ref={spotlightRefs.paymentMethods}
                className="bg-base-100 border border-base-300 rounded-2xl p-4"
            >
                <p className="text-sm font-semibold mb-3">Phương thức thanh toán</p>
                <div className="space-y-2">
                    {MOCK_PAYMENT_METHODS.map((m) => (
                        <label
                            key={m.id}
                            className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-colors
                ${selectedMethod === m.id ? "border-primary bg-primary/5" : "border-base-300"}
                ${tutorialPhase < 1 ? "opacity-50 pointer-events-none" : ""}`}
                        >
                            <input
                                type="radio"
                                className="radio radio-primary radio-sm"
                                checked={selectedMethod === m.id}
                                onChange={() => {
                                    setSelectedMethod(m.id);
                                    if (tutorialPhase === 1) setTimeout(onTutorialNext, 300);
                                }}
                            />
                            <CreditCard size={16} className="text-primary" />
                            <span className="text-sm font-medium">{m.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex gap-3">
                <button className="btn btn-outline" onClick={onBack}>
                    <ChevronLeft size={16} /> Quay lại
                </button>
                <div
                    // eslint-disable-next-line react-hooks/refs
                    ref={spotlightRefs.confirmContinue}
                    className="flex-1"
                >
                    <button
                        className="btn btn-primary w-full"
                        disabled={!selectedMethod || tutorialPhase < 2}
                        onClick={onContinue}
                    >
                        Tiếp tục
                    </button>
                </div>
            </div>
        </div>
    );
}

function StepPayment({ spotlightRefs, onSuccess }) {
    const [random] = useState(() => Math.random());
    return (
        <div className="space-y-4">
            <div className="bg-base-100 border border-base-300 rounded-2xl p-8 flex flex-col items-center gap-5 text-center">
                <div className="w-40 h-40 bg-base-200 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                        <div className="grid grid-cols-5 gap-0.5">
                            {Array.from({ length: 25 }).map((_, i) => (
                                <div key={i} className={`w-5 h-5 ${random > 0.5 ? "bg-base-content" : "bg-base-100"} rounded-sm`} />
                            ))}
                        </div>
                        <p className="text-[10px] text-base-content/40 mt-1">QR thanh toán</p>
                    </div>
                </div>

                <div>
                    <p className="text-lg font-bold">Quét mã QR để thanh toán</p>
                    <p className="text-sm text-base-content/50 mt-1">Số tiền: <span className="font-bold text-primary">195.000đ</span></p>
                </div>

                <div className="w-full max-w-xs space-y-2 text-sm text-base-content/60">
                    <div className="flex justify-between">
                        <span>Mã đặt vé</span>
                        <span className="font-medium text-base-content">NEKUSORA xxx</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Hết hạn trong</span>
                        <span className="font-medium text-warning">4:58</span>
                    </div>
                </div>

                <div
                    // eslint-disable-next-line react-hooks/refs
                    ref={spotlightRefs.payBtn}
                >
                    <button className="btn btn-primary btn-wide" onClick={onSuccess}>
                        Thanh toán
                    </button>
                </div>
            </div>
        </div>
    );
}

function BookingSuccess({ onReset }) {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center gap-6 py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center">
                <CheckCircle2 size={44} className="text-success" />
            </div>
            <div className="space-y-1">
                <p className="text-xl font-bold">Đặt vé thành công!</p>
                <p className="text-base-content/60 text-sm">
                    Bạn có thể bắt đầu lại hoặc thoát hướng dẫn
                </p>
            </div>
            <div className="flex flex-col gap-3">
                <div className="bg-base-100 border border-base-300 rounded-2xl p-5 w-full max-w-sm text-left space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-base-content/60">Mã vé</span>
                        <span className="font-medium">NEKUSORA xxx</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-base-content/60">Phim</span>
                        <span className="font-medium text-right max-w-[60%]">{MOCK_MOVIE.title}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-base-content/60">Suất chiếu</span>
                        <span className="font-medium">19:30 - Thứ 6, 15/08/2025</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-base-content/60">Ghế</span>
                        <span className="font-medium">E5, E6</span>
                    </div>
                    <div className="divider my-0" />
                    <div className="flex justify-between text-sm">
                        <span className="text-base-content/60">Tổng tiền thanh toán</span>
                        <span className="font-bold text-primary">350.000đ</span>
                    </div>

                </div>
                <button className="btn btn-outline w-full" onClick={onReset}>
                    Bắt đầu lại hướng dẫn
                </button>
                <button className="btn btn-outline w-full" onClick={() => navigate("/")}>
                    Thoát
                </button>
            </div>
        </div>
    );
}

function OrderSummaryPanel({ step, selectedSeats, productQty, appliedPromo, appliedPoints }) {
    const seatPrice = selectedSeats * 60000;
    const productPrice = productQty * MOCK_PRODUCT.price;
    const discount = appliedPromo ? Math.round((seatPrice + productPrice) * 0.2) : 0;
    const pointsDiscount = appliedPoints ? 5000 : 0;
    const total = seatPrice + productPrice - discount - pointsDiscount;

    if (step === 0) {
        return (
            <div className="bg-base-100 border border-base-300 rounded-2xl p-8 text-center">
                <TicketIcon size={32} className="text-base-content/20 mx-auto mb-2" />
                <p className="text-sm text-base-content/40">Đơn đặt vé của bạn sẽ hiện ở đây</p>
            </div>
        );
    }

    return (
        <div className="bg-base-100 border border-base-300 rounded-2xl p-4 space-y-4">
            <div className="flex gap-3">
                <img src={MOCK_MOVIE.poster} alt={MOCK_MOVIE.title} className="w-24 rounded object-cover aspect-2/3 shrink-0" />
                <div className="min-w-0">
                    <p className="text-sm font-bold line-clamp-2">{MOCK_MOVIE.title}</p>
                    <span className="block text-xs text-base-content/70 mt-2">{MOCK_SHOWTIME.branch.name}</span>
                    <span className="block text-xs text-base-content/70 mt-1">Suất chiếu: {MOCK_SHOWTIME.start_time}</span>
                    <span className="block text-xs text-base-content/70 mt-1">Thứ 6, 15/08/2025</span>
                    <span className="block badge badge-soft badge-info badge-sm mt-3">{MOCK_SHOWTIME.room.name} - {MOCK_SHOWTIME.screening_format.name}</span>
                </div>
            </div>

            {selectedSeats > 0 && (
                <div className="border-t border-base-200 pt-3">
                    <p className="text-xs text-base-content/50 mb-1">Ghế đã chọn</p>
                    <div className="flex flex-wrap gap-1.5">
                        {["E5", "E6"].slice(0, selectedSeats).map((s) => (
                            <span key={s} className="badge badge-primary badge-sm">{s}</span>
                        ))}
                    </div>
                </div>
            )}

            {productQty > 0 && (
                <div className="border-t border-base-200 pt-3">
                    <p className="text-xs text-base-content/50 mb-1">Bắp / Nước</p>
                    <div className="flex justify-between text-xs">
                        <span className="text-base-content/70">{MOCK_PRODUCT.name} x{productQty}</span>
                        <span className="font-medium">{formatMoney(productPrice)}</span>
                    </div>
                </div>
            )}

            {step >= 2 && (
                <div className="space-y-1.5">
                    <div className="divider my-1" />
                    <div className="font-semibold text-sm mb-2">Hóa đơn tạm tính</div>
                    <div className="flex justify-between text-sm">
                        <span className="text-base-content/60">Tiền vé</span>
                        <span className="font-medium">{formatMoney(seatPrice)}</span>
                    </div>
                    {productQty > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-base-content/60">Bắp nước</span>
                            <span className="font-medium">{formatMoney(productPrice)}</span>
                        </div>
                    )}
                    {discount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-base-content/60">Giảm giá</span>
                            <span className="font-medium text-error">−{formatMoney(discount)}</span>
                        </div>
                    )}
                    {pointsDiscount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-base-content/60">Điểm</span>
                            <span className="font-medium text-error">−{formatMoney(pointsDiscount)}</span>
                        </div>
                    )}
                    <div className="divider my-1" />
                    <div className="flex justify-between text-sm">
                        <span className="font-semibold">Tổng cộng</span>
                        <span className="font-bold text-lg text-primary">{formatMoney(total)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

const TUTORIAL_FLOW = {
    0: [
        {
            refKey: "location",
            message: "Hãy bắt đầu bằng cách chọn khu vực bạn muốn xem phim. Nhấn vào 'TP. Hồ Chí Minh' để tiếp tục.",
            nextLabel: null,
        },
        {
            refKey: "movie",
            message: "Chọn phim bạn muốn xem. Nhấn vào phim Conan.",
            nextLabel: null,
        },
        {
            refKey: "showtime",
            message: "Bây giờ hãy chọn suất chiếu. Chọn suất '19:30' nhé.",
            nextLabel: null,
        },
        {
            refKey: "continueBtn",
            message: "Bạn đã chọn đủ thông tin rồi! Nhấn 'Tiếp tục' để sang bước chọn ghế.",
            nextLabel: null,
        },
    ],
    1: [
        {
            refKey: "seatMap",
            message: "Đây là sơ đồ ghế ngồi. Hãy chú ý màu sắc của từng loại ghế:\n- Xám nhạt: còn trống\n- Đỏ: bạn đang chọn\n- Vàng: đang được người khác giữ\n- Xanh lá: đã được đặt",
            nextLabel: "Đã hiểu về màu sắc",
        },
        {
            refKey: "seatMap",
            message: "Các ghế này là ghế 'Đang được giữ' - ai đó đang trong quá trình thanh toán. Bạn không thể chọn các ghế này.",
            nextLabel: "Tiếp theo",
        },
        {
            refKey: "seatMap",
            message: "Còn các ghế này là ghế 'Đã đặt' - đã có người mua. Bạn cũng không thể chọn chúng.",
            nextLabel: "Tiếp theo: Quy tắc chọn ghế",
        },
        {
            refKey: "seatMap",
            message: "Quy tắc chọn ghế: Không được để trống 1 ghế lẻ ở bên trái, giữa hoặc bên phải dãy ghế đã chọn. Ví dụ: Nếu bạn chọn E4-E5-E6, thì ghế E1, E3 hoặc E7 sẽ bị cô lập nếu bạn chọn E2 hoặc E8. Hãy chọn ghế liền kề hoặc sát tường.",
            nextLabel: "Tiếp theo",
        },
        {
            refKey: "seatMap",
            message: "Nếu bạn đang chọn E4-E5-E6, bạn cũng không thể bỏ chọn ghế E5 vì quy tắc trên.",
            nextLabel: "Tôi hiểu rồi, cho tôi chọn ghế",
        },
        {
            refKey: "seatMap",
            message: "Đến lượt bạn chọn ghế rồi. Hãy chọn ghế E5 và E6 để tiếp tục.",
            nextLabel: null,
        },
        {
            refKey: "seatContinue",
            message: "Tuyệt! Bạn đã chọn ghế xong rồi. Nhấn 'Tiếp tục' để sang bước chọn bắp nước. Lưu ý: Trong thực tế sau khi tiếp tục, chúng mình sẽ giữ ghế cho bạn trong một khoảng thời gian, hãy nhớ hoàn tất đơn đặt vé trong thời gian giới hạn nhé.",
            nextLabel: null,
        },
    ],
    2: [
        {
            refKey: "productItem",
            message: "Tại đây bạn có thể thêm bắp rang và nước uống vào đơn. Nhấn nút '+' để thêm 1 phần Bắp Caramel.",
            nextLabel: null,
        },
        {
            refKey: "productItem",
            message: "Chưa đủ, thêm 1 phần nữa!",
            nextLabel: null,
        },
        {
            refKey: "productContinue",
            message: "Hoàn hảo! Bạn đã chọn 2 Bắp Caramel. Nhấn 'Tiếp tục' để sang bước khuyến mãi.",
            nextLabel: null,
        },
    ],
    3: [
        {
            refKey: "promoBox",
            message: "Tại đây bạn có thể nhập mã khuyến mãi. Hãy nhập mã 'CONAN20' và nhấn 'Áp dụng'.",
            nextLabel: null,
        },
        {
            refKey: "promoBox",
            message: "Mã khuyến mãi đã được áp dụng thành công! Bạn được giảm 20% trên tổng giá trị đơn hàng.",
            nextLabel: "Tiếp theo: Dùng điểm thành viên",
        },
        {
            refKey: "pointsBox",
            message: "Bạn cũng có thể dùng điểm tích lũy để giảm thêm. Hãy nhập '10' vào ô điểm và nhấn 'Áp dụng'.",
            nextLabel: null,
        },
        {
            refKey: "pointsBox",
            message: "Điểm đã được quy đổi! 10 điểm = 5.000đ giảm giá. Xem tổng tiền đã được cập nhật.",
            nextLabel: "Tiếp theo",
        },
        {
            refKey: "promoContinue",
            message: "Tất cả ưu đãi đưuọc đã áp dụng. Nhấn 'Tiếp tục' để sang bước xác nhận thanh toán.",
            nextLabel: null,
        },
    ],
    4: [
        {
            refKey: "emailBox",
            message: "Vé điện tử sẽ được gửi đến email này. Bạn có thể chọn email khác nếu muốn. Tuy nhiên bạn không thể đổi lại sau khi xác nhận thanh toán, hãy kiểm tra kỹ thông tin nhé.",
            nextLabel: "Tôi chọn xong rồi",
        },
        {
            refKey: "paymentMethods",
            message: "Chọn phương thức thanh toán bạn muốn dùng. Hãy chọn một trong hai phương thức bên trên.",
            nextLabel: null,
        },
        {
            refKey: "confirmContinue",
            message: "Đã chọn xong! Nhấn 'Tiếp tục' để đến bước thanh toán cuối cùng.",
            nextLabel: null,
        },
    ],
    5: [
        {
            refKey: "payBtn",
            message: "Đây là màn hình thanh toán. Tuy nhiên trong chế độ hướng dẫn này, chỉ cần nhấn 'Thanh toán' là hoàn tất.",
            nextLabel: null,
        },
    ],
};

const HelperBooking = () => {
    const [step, setStep] = useState(0);
    const [tutPhase, setTutPhase] = useState(0);
    const [success, setSuccess] = useState(false);

    const [summarySeats, setSummarySeats] = useState(0);
    const [summaryProductQty, setSummaryProductQty] = useState(0);
    const [summaryPromo, setSummaryPromo] = useState(false);
    const [summaryPoints, setSummaryPoints] = useState(false);

    // step 0
    const locationRef = useRef(null);
    const movieRef = useRef(null);
    const showtimeRef = useRef(null);
    const continueBtnRef = useRef(null);
    // step 1
    const seatMapRef = useRef(null);
    const seatContinueRef = useRef(null);
    // step 2
    const productItemRef = useRef(null);
    const productContinueRef = useRef(null);
    // step 3
    const promoBoxRef = useRef(null);
    const pointsBoxRef = useRef(null);
    const promoContinueRef = useRef(null);
    // step 4
    const emailBoxRef = useRef(null);
    const paymentMethodsRef = useRef(null);
    const confirmContinueRef = useRef(null);
    // step 5
    const payBtnRef = useRef(null);

    const refs = {
        location: locationRef,
        movie: movieRef,
        showtime: showtimeRef,
        continueBtn: continueBtnRef,
        seatMap: seatMapRef,
        seatContinue: seatContinueRef,
        productItem: productItemRef,
        productContinue: productContinueRef,
        promoBox: promoBoxRef,
        pointsBox: pointsBoxRef,
        promoContinue: promoContinueRef,
        emailBox: emailBoxRef,
        paymentMethods: paymentMethodsRef,
        confirmContinue: confirmContinueRef,
        payBtn: payBtnRef,
    };

    const [spotlightRect, setSpotlightRect] = useState(null);

    const currentFlow = TUTORIAL_FLOW[step] ?? [];
    const currentTut = currentFlow[tutPhase] ?? null;

    useEffect(() => {
        if (!currentTut) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSpotlightRect(null);
            return;
        }
        const el = refs[currentTut.refKey]?.current;
        if (!el) {
            setSpotlightRect(null);
            return;
        }

        const update = () => {
            const rect = el.getBoundingClientRect();
            setSpotlightRect((prev) => {
                if (
                    prev &&
                    prev.top === rect.top &&
                    prev.left === rect.left &&
                    prev.width === rect.width &&
                    prev.height === rect.height
                ) {
                    return prev;
                }
                return { top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom, right: rect.right };
            });
        };

        const rafId = requestAnimationFrame(update);
        const id = setInterval(update, 200);
        return () => {
            cancelAnimationFrame(rafId);
            clearInterval(id);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, tutPhase]);

    const advanceTutorial = () => {
        const nextPhase = tutPhase + 1;
        if (nextPhase >= currentFlow.length) {
            setTutPhase(currentFlow.length);
        } else {
            setTutPhase(nextPhase);
        }
    };

    const goToStep = (nextStep) => {
        setStep(nextStep);
        setTutPhase(0);
    };

    const reset = () => {
        setStep(0);
        setTutPhase(0);
        setSuccess(false);
        setSummarySeats(0);
        setSummaryProductQty(0);
        setSummaryPromo(false);
        setSummaryPoints(false);
    };

    if (success) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <BookingStepper currentStep={STEPS.length} />
                <BookingSuccess onReset={reset} />
            </div>
        );
    }

    const showOverlay = !!currentTut;
    const tutMessage = currentTut
        ? currentTut.message.split("\\n").join("\n")
        : null;
    const hasNextBtn = currentTut?.nextLabel !== null && currentTut?.nextLabel !== undefined;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 relative">
            {showOverlay && (
                <TutorialOverlay
                    message={tutMessage}
                    spotlightRect={spotlightRect}
                    onNext={hasNextBtn ? advanceTutorial : null}
                    nextLabel={currentTut?.nextLabel}
                />
            )}

            <BookingStepper currentStep={step} />

            <div className="mb-4 flex items-center gap-2 bg-info/10 border border-info/30 rounded-xl px-4 py-2">
                <Info size={16} className="text-info shrink-0" />
                <p className="text-sm text-info">
                    <strong>Chế độ hướng dẫn:</strong> Mọi thao tác trong chế độ này không ảnh hưởng đến kết quả thực sự.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="lg:w-[65%] w-full">
                    {step === 0 && (
                        <StepShowtime
                            tutorialPhase={tutPhase}
                            onTutorialNext={advanceTutorial}
                            spotlightRefs={refs}
                            onContinue={() => goToStep(1)}
                        />
                    )}
                    {step === 1 && (
                        <StepSeats
                            tutorialPhase={tutPhase}
                            onTutorialNext={advanceTutorial}
                            spotlightRefs={refs}
                            onContinue={(seats) => {
                                setSummarySeats(seats.length);
                                goToStep(2);
                            }}
                            onBack={() => goToStep(0)}
                        />
                    )}
                    {step === 2 && (
                        <StepProducts
                            tutorialPhase={tutPhase}
                            onTutorialNext={advanceTutorial}
                            spotlightRefs={refs}
                            onContinue={(qty) => {
                                setSummaryProductQty(qty);
                                goToStep(3);
                            }}
                        />
                    )}
                    {step === 3 && (
                        <StepPromotion
                            tutorialPhase={tutPhase}
                            onTutorialNext={advanceTutorial}
                            spotlightRefs={refs}
                            onContinue={() => {
                                setSummaryPromo(true);
                                setSummaryPoints(true);
                                goToStep(4);
                            }}
                            onBack={() => goToStep(2)}
                        />
                    )}
                    {step === 4 && (
                        <StepConfirm
                            tutorialPhase={tutPhase}
                            onTutorialNext={advanceTutorial}
                            spotlightRefs={refs}
                            onContinue={() => goToStep(5)}
                            onBack={() => goToStep(3)}
                        />
                    )}
                    {step === 5 && (
                        <StepPayment
                            spotlightRefs={refs}
                            onSuccess={() => setSuccess(true)}
                        />
                    )}
                </div>

                <div className="lg:w-[35%] w-full lg:sticky lg:top-20">
                    <OrderSummaryPanel
                        step={step}
                        selectedSeats={summarySeats || (step >= 2 ? 2 : 0)}
                        productQty={summaryProductQty}
                        appliedPromo={summaryPromo}
                        appliedPoints={summaryPoints}
                    />
                </div>
            </div>
        </div>
    );
}

export default HelperBooking;