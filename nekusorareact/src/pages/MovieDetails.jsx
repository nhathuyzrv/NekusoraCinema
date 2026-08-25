import { useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Clock, Calendar, Globe, Film, Users, Clapperboard, Send, MapPin } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import LocalLoading from "../components/LocalLoading";
import { getYtbEmbedUrl } from "../utils/EmbededUrl";
import { formatDate, formatDuration, formatTimeAgo } from "../utils/DateTime";
import { useCreateRating, useMyRating, useUpdateRating, useRatingsPagination } from "../hooks/useRatings";
import { useMovieDetails } from "../hooks/useMovies";
import { useMovieShowtimes } from "../hooks/useShowtimes";
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import MyAlert from "../configs/MyAlert";
import Configs from "../configs/Configs";
import BackButton from "../components/BackButton";


function AgeBadge({ rating }) {
    const b = Configs.AGE_BADGE[rating] ?? { label: rating, cls: "badge-neutral" };
    return (
        <span className={`badge badge-sm font-bold ${b.cls} px-2.5 py-3.5`}>{b.label}</span>
    );
}

function StatusBadge({ status }) {
    const map = {
        NOW_SHOWING: { label: "Đang chiếu", cls: "badge-success" },
        COMING_SOON: { label: "Sắp chiếu", cls: "badge-warning" },
    };
    const b = map[status] ?? { label: status, cls: "badge-neutral" };
    return <span className={`badge badge-sm font-medium ${b.cls} px-2.5 py-3.5`}>{b.label}</span>;
}

function StarInput({ value, onChange, disabled }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex gap-0.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={disabled}
                    className={`text-xl transition-colors ${star <= (hover || value) ? "text-warning" : "text-base-content/20"
                        }`}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => onChange(star)}
                    aria-label={`${star} sao`}
                >
                    ★
                </button>
            ))}
            {value > 0 && (
                <span className="ml-1 text-sm font-semibold text-warning self-center">{value}/10</span>
            )}
        </div>
    );
}

function UserAvatar({ user, size = "sm" }) {
    const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
    const name = `${user?.last_name ?? ""} ${user?.first_name ?? ""}`.trim() || "?";
    if (user?.avatar) {
        return (
            <img src={user.avatar} alt={name}
                className={`${dim} rounded-full object-cover shrink-0`} />
        );
    }
    return (
        <div className={`${dim} rounded-full bg-primary/15 flex items-center justify-center shrink-0 font-bold text-primary`}>
            {name[0]?.toUpperCase()}
        </div>
    );
}

function RatingCard({ rating }) {
    const name = `${rating.user?.last_name ?? ""} ${rating.user?.first_name ?? ""}`.trim() || "Ẩn danh";
    return (
        <div className="flex gap-3 py-3 border-b border-base-200 last:border-0">
            <UserAvatar user={rating.user} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{name}</span>
                    <span className="text-xs text-base-content/40 shrink-0">{formatTimeAgo(rating.created_at)}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: 10 }, (_, i) => (
                        <span key={i} className={`text-xs ${i < rating.score ? "text-warning" : "text-base-content/15"}`}>★</span>
                    ))}
                    <span className="text-xs font-semibold text-warning ml-1">{rating.score}/10</span>
                </div>
                {rating.comment && (
                    <p className="text-xs text-base-content/70 mt-1 leading-relaxed">{rating.comment}</p>
                )}
            </div>
        </div>
    );
}

function RatingPanel({ movieId, movieStatus, avgRating, ratingCount, isAuthenticated }) {
    const scrollRef = useRef(null);
    const [score, setScore] = useState(0);
    const [comment, setComment] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useRatingsPagination({ movieId });

    const { data: myRating, isLoading: isMyRatingLoading } = useMyRating({
        movieId: isAuthenticated ? movieId : null,
    });

    const hasMyRating = !!myRating;

    const ratings = data?.pages.flatMap(p => p.results) ?? [];

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el || !hasNextPage || isFetchingNextPage) return;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const { mutate: createRating, isPending: isCreating } = useCreateRating({ movieId });
    const { mutate: updateRating, isPending: isUpdating } = useUpdateRating({
        movieId,
        ratingId: myRating?.id,
    });

    const isPending = isCreating || isUpdating;

    const handleStartEdit = () => {
        setScore(myRating.score);
        setComment(myRating.comment ?? "");
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setScore(0);
        setComment("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (score === 0) return;
        if (hasMyRating) {
            updateRating({ score, comment }, {
                onSuccess: () => {
                    setIsEditing(false);
                    setScore(0);
                    setComment("");
                },
            });
        } else {
            createRating({ score, comment }, {
                onSuccess: () => {
                    setScore(0);
                    setComment("");
                },
            });
        }
    };

    const PANEL_HEIGHT = 480;

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-base-100 border border-base-300 rounded-2xl p-4 flex items-center gap-4">
                <div className="text-center shrink-0">
                    <p className="text-3xl font-black text-warning">
                        {avgRating ? avgRating.toFixed(1) : "-"}
                    </p>
                    <p className="text-xs text-base-content/50">/10</p>
                </div>
                <div className="flex-1">
                    <div className="flex flex-wrap gap-0.5 mb-1">
                        {Array.from({ length: 10 }, (_, i) => (
                            <span key={i} className={`text-base ${i < Math.round(avgRating ?? 0) ? "text-warning" : "text-base-content/15"}`}>★</span>
                        ))}
                    </div>
                    {movieStatus !== "COMING_SOON" ? (
                        <p className="text-xs text-base-content/50">{ratingCount?.toLocaleString("vi-VN") ?? 0} đánh giá</p>
                    ) : (
                        <p className="text-xs text-base-content/50">COMING SOON</p>
                    )}
                </div>
            </div>

            {movieStatus !== "COMING_SOON" && isAuthenticated ? (
                <div className="bg-base-100 border border-base-300 rounded-2xl p-4">
                    {hasMyRating && !isEditing ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold">Đánh giá của bạn</p>
                                <button
                                    className="btn btn-ghost btn-xs text-primary"
                                    onClick={handleStartEdit}
                                    disabled={isMyRatingLoading}
                                >
                                    Sửa đánh giá
                                </button>
                            </div>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: 10 }, (_, i) => (
                                    <span key={i} className={`text-base ${i < myRating.score ? "text-warning" : "text-base-content/15"}`}>★</span>
                                ))}
                                <span className="ml-1 text-sm font-semibold text-warning">{myRating.score}/10</span>
                            </div>
                            {myRating.comment && (
                                <p className="text-xs text-base-content/70 leading-relaxed bg-base-200 rounded-xl px-3 py-2">
                                    {myRating.comment}
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold">
                                    Đánh giá của bạn
                                </p>
                                {isEditing && (
                                    <button
                                        className="btn btn-ghost btn-xs text-base-content/50"
                                        onClick={handleCancelEdit}
                                        disabled={isPending}
                                    >
                                        Huỷ
                                    </button>
                                )}
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div>
                                    <p className="text-xs text-base-content/50 mb-1">Trải nghiệm tổng thể</p>
                                    <StarInput value={score} onChange={setScore} disabled={isPending} />
                                </div>
                                <textarea
                                    className="textarea textarea-bordered w-full text-sm resize-none"
                                    rows={3}
                                    placeholder="Nhận xét của bạn (không bắt buộc)..."
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    disabled={isPending}
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-sm w-full"
                                    disabled={isPending || score === 0}
                                >
                                    <Send size={14} />
                                    {isPending
                                        ? (isEditing ? "Đang sửa..." : "Đang gửi...")
                                        : (isEditing ? "Sửa đánh giá" : "Gửi đánh giá")
                                    }
                                </button>
                            </form>
                        </>
                    )}
                </div>
            ) : movieStatus !== "COMING_SOON" && (
                <div className="bg-base-100 border border-base-300 rounded-2xl p-4 text-center">
                    <p className="text-sm text-base-content/60">
                        <button
                            className="link link-primary font-medium"
                            onClick={() => {
                                const modal = document.getElementById("auth_modal");
                                if (modal) { modal.dataset.tab = "login"; modal.showModal(); }
                            }}
                        >
                            Đăng nhập
                        </button>
                        {" "}để gửi đánh giá
                    </p>
                </div>
            )}

            <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
                <div className="px-4 pt-4 pb-2 border-b border-base-200">
                    <p className="text-sm font-semibold">Đánh giá</p>
                </div>

                <LocalLoading show={isLoading}>
                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="overflow-y-auto px-4"
                        style={{ height: PANEL_HEIGHT }}
                    >
                        {ratings.length === 0 && !isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-sm text-base-content/40">Chưa có đánh giá nào</p>
                            </div>
                        ) : (
                            <>
                                {ratings.map(r => <RatingCard key={r.id} rating={r} />)}
                                {isFetchingNextPage && (
                                    <div className="flex justify-center py-3">
                                        <span className="loading loading-dots loading-sm text-primary" />
                                    </div>
                                )}
                                {!hasNextPage && ratings.length > 0 && (
                                    <p className="text-center text-xs text-base-content/30 py-3">Đã tải hết bình luận</p>
                                )}
                            </>
                        )}
                    </div>
                </LocalLoading>
            </div>
        </div>
    );
}

function buildDateTabs() {
    const tabs = [];
    const today = new Date();
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    for (let i = 0; i < 5; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        tabs.push({
            dateStr,
            label: i === 0 ? "Hôm nay" : dayNames[d.getDay()],
            dayNum: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
        });
    }
    return tabs;
}

function groupShowtimes(showtimes) {
    const locMap = new Map();
    for (const st of showtimes) {
        if (!locMap.has(st.location.id)) locMap.set(st.location.id, { location: st.location, branches: new Map() });
        const locEntry = locMap.get(st.location.id);
        if (!locEntry.branches.has(st.branch.id)) locEntry.branches.set(st.branch.id, { branch: st.branch, formats: new Map() });
        const brEntry = locEntry.branches.get(st.branch.id);
        if (!brEntry.formats.has(st.screening_format.id)) brEntry.formats.set(st.screening_format.id, { format: st.screening_format, showtimes: [] });
        brEntry.formats.get(st.screening_format.id).showtimes.push(st);
    }
    return [...locMap.values()].map(l => ({ ...l, branches: [...l.branches.values()].map(b => ({ ...b, formats: [...b.formats.values()] })) }));
}

function formatTime(t) { return t?.slice(0, 5) ?? ""; }

function ShowtimesPanel({ movieId, movie }) {
    const navigate = useNavigate();
    const DATE_TABS = buildDateTabs();
    const [selectedDate, setSelectedDate] = useState(DATE_TABS[0].dateStr);
    const [filterLocation, setFilterLocation] = useState("all");
    const [filterBranch, setFilterBranch] = useState("all");

    const { data: showtimes = [], isLoading } = useMovieShowtimes({ movieId, date: selectedDate });

    const allLocations = [...new Map(showtimes.map(s => [s.location.id, s.location])).values()];
    const allBranches = [...new Map(
        showtimes
            .filter(s => filterLocation === "all" || s.location.id === Number(filterLocation))
            .map(s => [s.branch.id, s.branch])
    ).values()];

    const handleLocationChange = (val) => { setFilterLocation(val); setFilterBranch("all"); };
    const handleNavigateBooking = async (showtime) => {
        await MyAlert.alert("Chọn suất chiếu",
            `Bạn muốn đặt vé cho suất chiếu lúc ${showtime.start_time.slice(0, 5)} tại ${showtime.branch.name}?
            Chúng tôi sẽ chuyển hướng bạn đến sơ đồ ghế của suất chiếu này.`,
            [
                { text: 'Hủy', style: 'ghost' },
                {
                    text: 'Tôi muốn đặt', style: 'primary',
                    onClick: () => {
                        navigate("/order", {
                            state: {
                                preselectedShowtime: showtime,
                                preselectedMovie: movie,
                            }
                        });
                    }
                }
            ]
        );
    }

    const filtered = showtimes.filter(s =>
        (filterLocation === "all" || s.location.id === Number(filterLocation)) &&
        (filterBranch === "all" || s.branch.id === Number(filterBranch))
    );
    const grouped = groupShowtimes(filtered);

    return (
        <div className="py-2 bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
            <div className="px-5 pt-4 pb-4 border-b border-base-200 space-y-3">
                <h2 className="font-bold text-2xl pb-2">Lịch chiếu</h2>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {DATE_TABS.map(tab => (
                        <button
                            key={tab.dateStr}
                            onClick={() => setSelectedDate(tab.dateStr)}
                            className={`flex flex-col items-center shrink-0 px-3 py-3 gap-1 rounded-xl border text-xs font-medium transition-all
                                ${selectedDate === tab.dateStr
                                    ? "bg-primary text-primary-content border-primary shadow-sm"
                                    : "border-base-300 text-base-content/70 hover:border-primary/50 hover:text-primary"
                                }`}
                        >
                            <span className={`text-xs font-semibold leading-none ${selectedDate === tab.dateStr ? "opacity-80" : "opacity-60"}`}>
                                {tab.label}
                            </span>
                            <span className="text-sm font-bold mt-0.5 leading-none">{tab.dayNum}</span>
                        </button>
                    ))}

                    <div className="h-8 w-px bg-base-300 shrink-0 mx-1" />

                    <div className="flex flex-col py-2 gap-2">
                        <div className="relative shrink-0">
                            <select
                                className="select select-bordered select-sm pr-10 text-sm appearance-none min-w-120px"
                                value={filterLocation}
                                onChange={e => handleLocationChange(e.target.value)}
                            >
                                <option value="all">Tất cả khu vực</option>
                                {allLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>

                        <div className="relative shrink-0">
                            <select
                                className="select select-bordered select-sm pr-12 text-sm appearance-none min-w-140px"
                                value={filterBranch}
                                onChange={e => setFilterBranch(e.target.value)}
                            >
                                <option value="all">Tất cả chi nhánh</option>
                                {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-base-200">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <span className="loading loading-bars loading-md text-primary" />
                    </div>
                ) : grouped.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-base-content/40">
                        <Calendar size={32} className="opacity-40" />
                        <p className="text-sm">Không có suất chiếu nào</p>
                    </div>
                ) : (
                    grouped.map(({ location, branches }) => (
                        <div key={location.id} className="px-5 py-4 space-y-4">
                            <div className="flex items-center gap-1.5 text-lg font-bold text-primary">
                                <MapPin size={22} />
                                {location.name}
                            </div>

                            {branches.map(({ branch, formats }) => (
                                <div key={branch.id} className="pl-3 border-l-2 border-base-200 space-y-3">
                                    <div>
                                        <div className="flex items-center gap-1.5 text-md font-semibold">
                                            {branch.name}
                                        </div>
                                        {branch.address && (
                                            <p className="text-xs text-base-content/40 mt-0.5">{branch.address}</p>
                                        )}
                                    </div>

                                    {formats.map(({ format, showtimes: fmtSt }) => (
                                        <div key={format.id} className="flex items-start gap-3">
                                            <span className="shrink-0 inline-flex self-center items-center text-xs font-semibold px-3 py-2 rounded-md bg-base-200 text-base-content/60 tracking-wide whitespace-nowrap">
                                                {format.name}
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {fmtSt.map(st => {
                                                    const ok = st.status === "SCHEDULED";
                                                    return (
                                                        <>
                                                            <div className="tooltip tooltip-accent" data-tip="đặt vé">
                                                                <button
                                                                    key={st.id}
                                                                    disabled={!ok}
                                                                    className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all
                                                                ${ok
                                                                            ? "border-primary/40 text-primary hover:bg-primary hover:text-primary-content hover:border-primary active:scale-95"
                                                                            : "border-base-200 text-base-content/25 bg-base-200/50 cursor-not-allowed line-through"
                                                                        }`}
                                                                    onClick={() => handleNavigateBooking(st)}
                                                                >
                                                                    {formatTime(st.start_time)}
                                                                </button>
                                                            </div>
                                                        </>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const MovieDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const movieId = location.state?.movieId;
    const [trailerActive, setTrailerActive] = useState(false);
    const showtimeRef = useRef(null);

    const handleScrollToShowtime = () => {
        if (showtimeRef.current) {
            showtimeRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    const { data: movie, isLoading } = useMovieDetails({ movieId });

    const embedUrl = getYtbEmbedUrl(movie?.trailer_url);
    const movieDescription = DOMPurify.sanitize(movie?.description);

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <span className="loading loading-bars loading-lg text-primary" />
            </div>
        );
    }

    if (!movie) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <p className="text-base-content/50">Không tìm thấy phim</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            <BackButton label={"Phim"} onClick={() => navigate("/movies/")} />

            <div
                className="relative w-full rounded-2xl overflow-hidden bg-black cursor-pointer group"
                style={{ aspectRatio: "16/7" }}
                onClick={() => setTrailerActive(true)}
            >
                {trailerActive && embedUrl ? (
                    <iframe
                        src={embedUrl}
                        className="absolute inset-0 w-full h-full"
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                        title={movie.title}
                    />
                ) : (
                    <>
                        <img
                            src={movie.poster}
                            alt={movie.title}
                            className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm scale-105"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <div className="w-0 h-0 border-t-16px border-t-transparent border-b-16px border-b-transparent border-l-28px border-l-white ml-1.5" />
                            </div>
                            <p className="text-white/80 text-sm font-medium tracking-wide">Xem Trailer</p>
                        </div>
                    </>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">

                <div className="w-full lg:w-[70%] space-y-6">

                    <div className="flex gap-5">
                        <div className="hover-3d shrink-0 relative w-50">
                            <img
                                src={movie.poster}
                                alt={movie.title}
                                className="w-full rounded-xs object-cover shadow-lg"
                                style={{ aspectRatio: "2/3" }}
                            />
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                        </div>

                        <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <AgeBadge rating={movie.age_rating} />
                                <StatusBadge status={movie.status} />
                            </div>
                            <h1 className="text-2xl font-black">{movie.title}</h1>
                            <div className="space-y-2 text-sm">
                                {[
                                    { icon: <Clock size={14} />, label: "Thời lượng", value: formatDuration(movie.duration) },
                                    { icon: <Calendar size={14} />, label: "Khởi chiếu", value: formatDate(movie.release_date) },
                                    { icon: <Globe size={14} />, label: "Quốc gia", value: movie.country },
                                    { icon: <Clapperboard size={14} />, label: "Đạo diễn", value: movie.director },
                                    { icon: <Users size={14} />, label: "Diễn viên", value: movie.actors?.length > 0 ? movie.actors.map(a => a.name ?? a).join(", ") : "Đang cập nhật" },
                                    { icon: <Film size={14} />, label: "Thể loại", value: movie.genres?.map(g => g.name).join(", ") ?? "-" },
                                ].map(({ icon, label, value }) => (
                                    <div key={label} className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5 shrink-0">{icon}</span>
                                        <span className="text-base-content/50 shrink-0 w-24">{label}</span>
                                        <span className="text-base-content font-medium">{value}</span>
                                    </div>
                                ))}
                            </div>
                            {movie.status === "NOW_SHOWING" && (
                                <>
                                    <div className="pt-2 flex justify-end">
                                        <button className="btn btn-primary" onClick={handleScrollToShowtime}>Đặt vé ngay</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-base-100 border border-base-300 rounded-2xl p-5">
                        <h2 className="font-bold text-base mb-3">Nội dung phim {movie.title}</h2>
                        <div className="text-sm text-base-content/80 leading-relaxed prose prose-sm max-w-none">
                            {parse(movieDescription)}
                        </div>
                    </div>

                    {movie.status === "NOW_SHOWING" && (
                        <>
                            <div ref={showtimeRef} className="scroll-mt-20">
                                <ShowtimesPanel ref={showtimeRef} movieId={movieId} movie={movie} isAuthenticated={isAuthenticated} />
                            </div>
                        </>
                    )}
                </div>

                <div className="w-full lg:w-[30%] lg:sticky lg:top-20">
                    <RatingPanel
                        movieId={movieId}
                        movieStatus={movie.status}
                        avgRating={movie.avg_rating}
                        ratingCount={movie.rating_count}
                        isAuthenticated={isAuthenticated}
                    />
                </div>
            </div>
        </div>
    );
}

export default MovieDetails;