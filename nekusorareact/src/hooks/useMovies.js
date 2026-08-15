import { useQuery } from "@tanstack/react-query";
import movieService from "../services/movieService";

export function useMovies({ search, genres, status }) {
    const params = { search, genres, status };

    return useQuery({
        queryKey: ["movies", params],
        queryFn: () => movieService.getByParams(params),
        staleTime: 60 * 1000,
    });
}

export function useMovieDetails({ movieId }) {
    return useQuery({
        queryKey: ["movie", movieId],
        queryFn: () => movieService.getDetails(movieId),
        staleTime: 1000 * 60,
    })
}