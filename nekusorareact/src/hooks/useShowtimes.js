import { useQuery } from "@tanstack/react-query";
import showtimeService from "../services/showtimeService";

export function useMovieShowtimes({ movieId, date }) {
    return useQuery({
        queryKey: ["movie", movieId, "showtimes", date],
        queryFn: () => showtimeService.getByDate(movieId, date),
        staleTime: 1000 * 60
    })
}