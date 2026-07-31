import { useState, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Clock, Calendar, Globe, Film, Users, Clapperboard, Send } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import LocalLoading from "../components/LocalLoading";
import { getYtbEmbedUrl } from "../utils/EmbededUrl";
import { formatDate, formatDuration, formatTimeAgo } from "../utils/DateTime";
import { useCreateRating, useMyRating, useUpdateRating, useRatingsPagination } from "../hooks/useRatings";
import { useMovieDetails } from "../hooks/useMovies";
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';


const AGE_BADGE = {
    P: { label: "P", cls: "badge-success" },
    K: { label: "K", cls: "badge-info" },
    T13: { label: "T13", cls: "badge-warning" },
    T16: { label: "T16", cls: "badge-orange" },
    T18: { label: "T18", cls: "badge-error" },
};

function AgeBadge({ rating }) {
    const b = AGE_BADGE[rating] ?? { label: rating, cls: "badge-neutral" };
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

function RatingPanel({ movieId, avgRating, ratingCount }) {
    const { isAuthenticated } = useAuth();
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

    const PANEL_HEIGHT = 440;

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-base-100 border border-base-300 rounded-2xl p-4 flex items-center gap-4">
                <div className="text-center shrink-0">
                    <p className="text-3xl font-black text-warning">
                        {avgRating ? avgRating.toFixed(1) : "—"}
                    </p>
                    <p className="text-xs text-base-content/50">/10</p>
                </div>
                <div className="flex-1">
                    <div className="flex flex-wrap gap-0.5 mb-1">
                        {Array.from({ length: 10 }, (_, i) => (
                            <span key={i} className={`text-base ${i < Math.round(avgRating ?? 0) ? "text-warning" : "text-base-content/15"}`}>★</span>
                        ))}
                    </div>
                    <p className="text-xs text-base-content/50">{ratingCount?.toLocaleString("vi-VN") ?? 0} đánh giá</p>
                </div>
            </div>

            {isAuthenticated ? (
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
            ) : (
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

const MovieDetails = () => {
    const location = useLocation();
    const movieId = location.state?.movieId;
    const [trailerActive, setTrailerActive] = useState(false);

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

                        <div className="hover-3d shrink-0 relative" style={{ width: 280 }}>
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

                            <h1 className="text-2xl font-black leading-tight">{movie.title}</h1>

                            <div className="space-y-2 text-sm">
                                {[
                                    { icon: <Clock size={14} />, label: "Thời lượng", value: formatDuration(movie.duration) },
                                    { icon: <Calendar size={14} />, label: "Khởi chiếu", value: formatDate(movie.release_date) },
                                    { icon: <Globe size={14} />, label: "Quốc gia", value: movie.country },
                                    { icon: <Clapperboard size={14} />, label: "Đạo diễn", value: movie.director },
                                    {
                                        icon: <Users size={14} />,
                                        label: "Diễn viên",
                                        value: movie.actors?.length > 0
                                            ? movie.actors.map(a => a.name ?? a).join(", ")
                                            : "Đang cập nhật",
                                    },
                                    {
                                        icon: <Film size={14} />,
                                        label: "Thể loại",
                                        value: movie.genres?.map(g => g.name).join(", ") ?? "—",
                                    },
                                ].map(({ icon, label, value }) => (
                                    <div key={label} className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5 shrink-0">{icon}</span>
                                        <span className="text-base-content/50 shrink-0 w-24">{label}</span>
                                        <span className="text-base-content font-medium">{value}</span>
                                    </div>
                                ))}
                            </div>

                            {movie.status === "NOW_SHOWING" && (
                                <button className="btn btn-primary mt-2">
                                    Đặt vé ngay
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-base-100 border border-base-300 rounded-2xl p-5">
                        <h2 className="font-bold text-base mb-3">Nội dung phim {movie.title}</h2>
                        <div className="text-sm text-base-content/80 leading-relaxed prose prose-sm max-w-none">
                            {parse(movieDescription)}
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-[30%] lg:sticky lg:top-20">
                    <RatingPanel
                        movieId={movieId}
                        avgRating={movie.avg_rating}
                        ratingCount={movie.rating_count}
                    />
                </div>
            </div>
        </div >
    );
}

export default MovieDetails;