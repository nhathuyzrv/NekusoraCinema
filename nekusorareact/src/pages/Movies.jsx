import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useMovies } from "../hooks/useMovies";
import { useGenres } from "../hooks/useGenres";
import { MovieCardFull, MovieCardSkeleton } from "../components/MovieComponents";
import Configs from "../configs/Configs";

const Movies = () => {
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [status, setStatus] = useState("NOW_SHOWING");
    const [genres, setGenres] = useState([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data: movieData, isPending: movieIsPending, isPlaceholderData } = useMovies({
        search,
        genres,
        status,
    });

    const { data: genreData, isPending: genreIsPending } = useGenres();

    const movies = movieData ?? [];

    const toggleGenre = (id) => {
        setGenres((prev) =>
            prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
        );
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
                        {[
                            { value: "NOW_SHOWING", label: "Đang chiếu" },
                            { value: "COMING_SOON", label: "Sắp chiếu" },
                        ].map(({ value, label }) => (
                            <button
                                key={value}
                                role="tab"
                                type="button"
                                className={`btn btn-sm ${status === value ? "btn-primary" : "btn-outline"}`}
                                onClick={() => setStatus(value)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <span className="text-sm font-medium text-base-content shrink-0 w-20 mt-1.5">Thể loại</span>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setGenres([])}
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
                    {Array.from({ length: Configs.MOVIE_PAGE_SIZE }).map((_, i) => (
                        <MovieCardSkeleton key={i} />
                    ))}
                </div>
            ) : movies.length === 0 ? (
                <div className="text-center py-20 text-base-content/50">
                    Không tìm thấy phim nào phù hợp.
                </div>
            ) : (
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}>
                    {movies.map((movie) => (
                        <MovieCardFull key={movie.id} movie={movie} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Movies;