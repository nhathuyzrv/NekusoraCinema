import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { useMoviesPagination } from "../hooks/useMovies";
import { useGenres } from "../hooks/useGenres";
import { getYtbEmbedUrl } from "../utils/EmbededUrl";

const PAGE_SIZE = 8;

function TrailerModal({ movie, onClose }) {
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

const AGE_BADGE = {
    P: { label: "P", cls: "badge-success" },
    K: { label: "K", cls: "badge-info" },
    T13: { label: "T13", cls: "badge-warning" },
    T16: { label: "T16", cls: "badge-orange" },
    T18: { label: "T18", cls: "badge-error" },
};

function AgeRatingBadge({ rating }) {
    const b = AGE_BADGE[rating] ?? { label: rating, cls: "badge-neutral" };
    return (
        <span className={`badge badge-sm w-8 h-8 font-bold ${b.cls}`}>
            {b.label}
        </span>
    );
}

function MoviePoster({ movie, onTrailerClick }) {
    return (
        <figure className="relative w-full aspect-2/3 bg-base-300 overflow-hidden group">
            {movie.poster ? (
                <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover"
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
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onTrailerClick(); }}
                        className="btn btn-sm btn-white gap-1.5 shadow-lg"
                    >
                        <Play size={14} className="fill-current" />
                        Trailer
                    </button>
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

function MovieCard({ movie }) {
    const navigate = useNavigate();
    const [showTrailer, setShowTrailer] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => navigate(`/movies/${movie.slug}`,
                    { state: { movieId: movie.id } }
                )}
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

const Movies = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [status, setStatus] = useState("NOW_SHOWING");
    const [genres, setGenres] = useState([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data: movieData, isPending: movieIsPending, isPlaceholderData } = useMoviesPagination({
        page,
        search,
        genres,
        status,
    });

    const { data: genreData, isPending: genreIsPending } = useGenres();

    const movies = movieData?.results ?? [];
    const totalCount = movieData?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const toggleGenre = (id) => {
        setGenres((prev) =>
            prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
        );
        setPage(1);
    };

    const handleStatusChange = (value) => {
        setStatus(value);
        setPage(1);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Phim</h1>

            <label className="input input-info flex items-center gap-4 flex-1 border-2 w-full mb-4">
                <Search size={16} className="text-base-content/50" />
                <input
                    type="text"
                    className="grow"
                    placeholder="Tìm tên phim..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
            </label>

            <div className="flex flex-col gap-3 mb-8">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-base-content shrink-0 w-20">Trạng thái</span>
                    <div className="flex flex-wrap gap-2">
                        <button
                            role="tab"
                            type="button"
                            className={`btn btn-sm ${status === "NOW_SHOWING" ? "btn-primary" : "btn-outline"}`}
                            onClick={() => handleStatusChange("NOW_SHOWING")}
                        >
                            Đang chiếu
                        </button>
                        <button
                            role="tab"
                            type="button"
                            className={`btn btn-sm ${status === "COMING_SOON" ? "btn-primary" : "btn-outline"}`}
                            onClick={() => handleStatusChange("COMING_SOON")}
                        >
                            Sắp chiếu
                        </button>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <span className="text-sm font-medium text-base-content shrink-0 w-20 mt-1.5">Thể loại</span>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => { setGenres([]); setPage(1); }}
                            className={`btn btn-sm ${genres.length === 0 ? "btn-primary" : "btn-outline"}`}
                        >
                            Tất cả
                        </button>
                        {genreIsPending
                            ? Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="skeleton h-8 w-20 rounded-lg" />
                            ))
                            : (genreData ?? []).map((g) => (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => toggleGenre(g.id)}
                                    className={`btn btn-sm ${genres.includes(g.id) ? "btn-primary" : "btn-outline"}`}
                                >
                                    {g.name}
                                </button>
                            ))
                        }
                    </div>
                </div>
            </div>

            {movieIsPending ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <div className="skeleton w-full aspect-2/3 rounded-box" />
                            <div className="skeleton h-4 w-3/4 rounded" />
                            <div className="skeleton h-4 w-1/2 rounded" />
                        </div>
                    ))}
                </div>
            ) : movies.length === 0 ? (
                <div className="text-center py-20 text-base-content/50">
                    Không tìm thấy phim nào phù hợp.
                </div>
            ) : (
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}>
                    {movies.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} />
                    ))}
                </div>
            )}

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
                        disabled={!movieData?.next}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default Movies;