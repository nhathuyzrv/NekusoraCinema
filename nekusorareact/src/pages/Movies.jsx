import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useMoviesPagination } from "../hooks/useMoviesPagination";

const PAGE_SIZE = 8;

const GENRE_OPTIONS = [
    { id: 1, name: "Hành động" },
    { id: 2, name: "Kinh dị" },
    { id: 3, name: "Hài" },
    { id: 4, name: "Tâm lý" },
    { id: 5, name: "Hoạt hình" },
    { id: 6, name: "Phiêu lưu" },
    { id: 7, name: "Khoa học viễn tưởng" },
    { id: 8, name: "Tình cảm" },
    { id: 9, name: "Trinh thám" },
    { id: 10, name: "Chính kịch" },
    { id: 11, name: "Nhạc kịch" },
    { id: 12, name: "Thần thoại" },
    { id: 13, name: "Gia đình" },
    { id: 14, name: "Siêu anh hùng" },
    { id: 15, name: "Cổ trang" },
    { id: 16, name: "Bí ẩn" },
];

const AGE_RATING_STYLE = {
    P: "badge-success",
    K: "badge-info",
    T13: "badge-warning",
    T16: "badge-warning",
    T18: "badge-error",
};

function AgeRatingBadge({ rating }) {
    if (!rating) return null;
    return (
        <span className={`badge badge-sm w-8 h-8 font-bold ${AGE_RATING_STYLE[rating] ?? "badge-neutral"}`}>
            {rating}
        </span>
    );
}

function MoviePoster({ movie }) {
    return (
        <figure className="relative w-full aspect-2/3 bg-base-300 overflow-hidden">
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
    return (
        <button
            type="button"
            onClick={() => navigate(`/movies/${movie.slug}`)}
            className="card bg-base-100 shadow-sm hover:shadow-lg transition-shadow text-left"
        >
            <MoviePoster movie={movie} />
            <div className="card-body p-3">
                <h3 className="text-sm font-semibold line-clamp-2 leading-snug">{movie.title}</h3>
            </div>
        </button>
    );
}

export default function Movies() {
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

    const { data, isPending, isPlaceholderData } = useMoviesPagination({
        page,
        search,
        genres,
        status,
    });

    const movies = data?.results ?? [];
    const totalCount = data?.count ?? 0;
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
                            type="button"
                            className={`btn btn-sm ${status === "NOW_SHOWING" ? "btn-primary" : "btn-outline"}`}
                            onClick={() => handleStatusChange("NOW_SHOWING")}
                        >
                            Đang chiếu
                        </button>
                        <button
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
                        {GENRE_OPTIONS.map((g) => (
                            <button
                                key={g.id}
                                type="button"
                                onClick={() => toggleGenre(g.id)}
                                className={`btn btn-sm ${genres.includes(g.id) ? "btn-primary" : "btn-outline"}`}
                            >
                                {g.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {isPending ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                        <div key={i} className="w-full aspect-2/3 bg-base-300 rounded-box animate-pulse" />
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
                        disabled={!data?.next}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}