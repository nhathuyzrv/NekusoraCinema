import { useEffect, useState } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { Ticket, ChevronLeft, ChevronRight, Search, X, Calendar, MapPin } from "lucide-react";
import { useMyBookingsPagination } from "../hooks/useMyBookings";
import LocalLoading from "../components/LocalLoading";
import { formatDate, formatShortWeekday } from "../utils/DateTime";
import { formatMoney } from "../utils/Money";
import Configs from "../configs/Configs";


function BookingListItem({ booking }) {
    const movie = booking.movie;
    const showtime = booking.showtime;

    return (
        <div className="w-full text-left bg-base-100 border border-base-300 rounded-2xl p-4
                       hover:border-primary/70 hover:shadow-md transition-all">
            <NavLink to={`/bookings/${booking.booking_code}`}>
                <div className="flex gap-4">
                    {movie?.poster && (
                        <img
                            src={movie.poster}
                            alt={movie.title}
                            className="w-14 sm:w-16 rounded-sm object-cover aspect-2/3 shrink-0"
                        />
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-sm line-clamp-2 flex-1">{movie?.title ?? "—"}</p>
                            <span className={`badge badge-sm shrink-0 ${Configs.BOOKING_STATUS_BADGE[booking.status] ?? "badge-accent"}`}>
                                {Configs.BOOKING_STATUS_LABEL[booking.status] ?? booking.status}
                            </span>
                        </div>

                        {showtime && (
                            <div className="flex flex-col gap-1.5 mt-1.5">
                                <span className="flex items-center gap-1 text-xs text-base-content/60">
                                    <Calendar size={11} />
                                    {showtime.start_time?.slice(0, 5)} - {formatShortWeekday(showtime.show_date)}, {formatDate(showtime.show_date)}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-base-content/60">
                                    <MapPin size={11} />
                                    {showtime.branch?.name}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-1.5">
                            <span className="text-xs text-base-content/60 flex gap-2 items-center"><Ticket size={12} /> {booking.booking_code}</span>
                            <span className="font-bold text-primary text-sm">{formatMoney(booking.final_amount)}</span>
                        </div>
                    </div>
                </div>
            </NavLink>
        </div>
    );
}

const MyBookings = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("CONFIRMED");
    const [days, setDays] = useState("7");
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");

    useEffect(() => {
        const code = searchParams.get("code");
        if (code) navigate(`/bookings/${code}`, { replace: true });
    }, [searchParams, navigate]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data, isPending } = useMyBookingsPagination({
        page,
        statusFilter,
        days,
        search,
    });

    const bookingsData = data;
    const totalCount = bookingsData?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / Configs.BOOKING_PAGE_SIZE));
    const bookings = bookingsData?.results ?? [];

    const handleStatusChange = (value) => {
        setStatusFilter(value);
        setPage(1);
    };

    const handleDaysChange = (value) => {
        setDays(value);
        setPage(1);
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Vé của tôi</h1>

            <div className="flex flex-col lg:flex-row gap-6 items-start">

                <div className="w-full space-y-4">

                    <div className="space-y-3">
                        <label className="input input-info flex items-center gap-4 flex-1 border-2 w-full mb-4">
                            <Search size={16} className="text-base-content/50" />
                            <input
                                type="text"
                                className="grow"
                                placeholder="Tìm tên phim hoặc mã vé..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            {search && (
                                <button
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                                    onClick={() => { setSearchInput(""); }}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </label>

                        <div className="flex items-start gap-3">
                            <span className="text-sm font-medium text-base-content shrink-0 w-28 mt-1.5">Trạng thái vé</span>
                            <div className="flex gap-2 flex-wrap">
                                {Configs.BOOKING_STATUS_FILTERS.map(f => (
                                    <button
                                        key={f.value}
                                        onClick={() => handleStatusChange(f.value)}
                                        className={`btn btn-sm ${statusFilter === f.value ? "btn-primary" : "btn-outline"}`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <span className="text-sm font-medium text-base-content shrink-0 w-28 mt-1.5">Số ngày gần đây</span>
                            <div className="flex gap-2 flex-wrap">
                                {Configs.BOOKING_DAYS_FILTERS.map(f => (
                                    <button
                                        key={f.value}
                                        onClick={() => handleDaysChange(f.value)}
                                        className={`btn btn-sm ${days === f.value ? "btn-primary" : "btn-outline"}`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <LocalLoading show={isPending}>
                        <div className="space-y-3 min-h-40">
                            {bookings.length === 0 && !isPending ? (
                                <div className="text-center py-16 text-base-content/40">
                                    <Ticket size={36} className="mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">Không có vé nào</p>
                                </div>
                            ) : (
                                bookings.map(b => (
                                    <BookingListItem
                                        key={b.id}
                                        booking={b}
                                    />
                                ))
                            )}
                        </div>
                    </LocalLoading>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-10">
                            <button
                                type="button"
                                className="btn btn-circle btn-sm btn-ghost"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <span className="text-sm text-base-content/60 font-mono">
                                Trang {page} / {totalPages}
                            </span>

                            <button
                                type="button"
                                className="btn btn-circle btn-sm btn-ghost"
                                disabled={!bookingsData?.next}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MyBookings;