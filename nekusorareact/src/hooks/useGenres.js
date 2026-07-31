import { useQuery } from "@tanstack/react-query";
import genreService from "../services/genreService";

export function useGenres() {
    return useQuery({
        queryKey: ["genres"],
        queryFn: () => genreService.getAll(),
        staleTime: Infinity
    })
}