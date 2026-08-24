import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Play, X, CalendarDays, Ticket } from "lucide-react";
import Configs from "../configs/Configs";
import { getYtbEmbedUrl } from "../utils/EmbededUrl";

export function AgeRatingBadge({ rating }) {
    const b = Configs.AGE_BADGE[rating] ?? { label: rating, cls: "badge-neutral" };
    return (
        <span className={`badge badge-sm w-8 h-8 font-bold ${b.cls}`}>
            {b.label}
        </span>
    );
}

export function TrailerModal({ movie, onClose }) {
    const embedUrl = getYtbEmbedUrl(movie.trailer_url);
    const overlayRef = useRef(null);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleKey);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-999 bg-black/80 flex flex-col items-center justify-center p-4"
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className="w-full max-w-4xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-lg line-clamp-1">{movie.title}</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-circle btn-sm btn-ghost text-white hover:bg-white/20"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
                    {embedUrl ? (
                        <iframe
                            src={embedUrl}
                            title={`Trailer - ${movie.title}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/50 text-sm">
                            Không thể tải trailer.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function MoviePoster({ movie, onTrailerClick }) {
    return (
        <figure className="relative w-full aspect-2/3 bg-base-300 overflow-hidden group">
            {movie.poster ? (
                <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center p-4 text-center">
                    <span className="text-base-content/50 text-sm font-medium line-clamp-4">
                        {movie.title}
                    </span>
                </div>
            )}

            {movie.trailer_url && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="tooltip" data-tip="phát trailer">
                        <div
                            onClick={(e) => { e.stopPropagation(); onTrailerClick(); }}
                            className="btn btn-sm btn-primary btn-white gap-1.5 shadow-lg cursor-pointer"
                        >
                            <Play size={14} className="fill-current" />
                            Trailer
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute bottom-2 right-2 w-fit flex items-center gap-1.5">
                {movie.avg_rating > 0 && (
                    <span className="badge badge-sm bg-base-100/90 border-none gap-1 px-2 py-3 font-semibold">
                        <Star size={11} className="fill-warning text-warning" />
                        {movie.avg_rating.toFixed(1)}
                    </span>
                )}
                <AgeRatingBadge rating={movie.age_rating} />
            </div>
        </figure>
    );
}

export function MovieCardFull({ movie }) {
    const navigate = useNavigate();
    const [showTrailer, setShowTrailer] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => navigate(`/movies/${movie.slug}`, { state: { movieId: movie.id } })}
                className="card bg-base-100 shadow-sm hover:shadow-lg transition-shadow text-left"
            >
                <MoviePoster movie={movie} onTrailerClick={() => setShowTrailer(true)} />
                <div className="card-body p-3">
                    <h3 className="text-sm font-semibold line-clamp-2 leading-snug">{movie.title}</h3>
                </div>
            </button>

            {showTrailer && (
                <TrailerModal movie={movie} onClose={() => setShowTrailer(false)} />
            )}
        </>
    );
}

export function MovieCardHome({ movie }) {
    const navigate = useNavigate();
    const [showTrailer, setShowTrailer] = useState(false);

    return (
        <>
            <div className="group">
                <div
                    className="relative aspect-2/3 rounded-box overflow-hidden bg-base-300 cursor-pointer"
                    onClick={() => navigate(`/movies/${movie.slug}`, { state: { movieId: movie.id } })}
                >
                    {movie.poster ? (
                        <img
                            src={movie.poster}
                            alt={movie.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 text-center">
                            <span className="text-base-content/50 text-sm font-medium">{movie.title}</span>
                        </div>
                    )}

                    <div className="absolute inset-0 bg-linear-to-t from-neutral/90 via-neutral/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm w-full gap-1"
                            onClick={(e) => { e.stopPropagation(); navigate("/order"); }}
                        >
                            <Ticket size={14} />
                            Đặt vé
                        </button>
                    </div>

                    {movie.age_rating && (
                        <AgeRatingBadge
                            rating={movie.age_rating}
                            className="absolute top-2 left-2"
                        />
                    )}

                    {movie.avg_rating > 0 && (
                        <span className="badge badge-sm absolute top-2 right-2 bg-neutral/70 border-none text-neutral-content gap-1">
                            <Star size={11} className="fill-warning text-warning" />
                            {movie.avg_rating.toFixed(1)}
                        </span>
                    )}
                </div>

                <h3 className="font-display font-semibold text-sm sm:text-base mt-3 line-clamp-1 text-base-content">
                    {movie.title}
                </h3>
                <p className="text-xs sm:text-sm text-base-content/60">
                    {movie.genres?.map((g) => g.name).join(" • ")}
                    {movie.duration ? ` • ${movie.duration} phút` : ""}
                </p>
            </div>

            {showTrailer && (
                <TrailerModal movie={movie} onClose={() => setShowTrailer(false)} />
            )}
        </>
    );
}

export function ComingSoonCard({ movie }) {
    const navigate = useNavigate();
    const d = new Date(movie.release_date ?? movie.release);
    const label = isNaN(d)
        ? ""
        : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

    return (
        <div
            className="shrink-0 w-37.5 sm:w-47.5 snap-start cursor-pointer group"
            onClick={() => navigate(`/movies/${movie.slug}`, { state: { movieId: movie.id } })}
        >
            <div className="relative aspect-2/3 rounded-box overflow-hidden bg-base-300">
                {movie.poster ? (
                    <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 text-center">
                        <span className="text-base-content/50 text-sm font-medium">{movie.title}</span>
                    </div>
                )}
                {label && (
                    <span className="badge badge-sm absolute top-2 left-2 bg-primary border-none text-primary-content gap-1">
                        <CalendarDays size={11} />
                        {label}
                    </span>
                )}
            </div>
            <h3 className="font-display font-semibold text-sm mt-3 line-clamp-1 text-base-content">
                {movie.title}
            </h3>
            <p className="text-xs text-base-content/60">
                {movie.genres?.map((g) => g.name).join(" • ") ?? movie.genre}
            </p>
        </div>
    );
}

export function MovieCardSkeleton() {
    return (
        <div className="flex flex-col gap-2">
            <div className="skeleton w-full aspect-2/3 rounded-box" />
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
        </div>
    );
}