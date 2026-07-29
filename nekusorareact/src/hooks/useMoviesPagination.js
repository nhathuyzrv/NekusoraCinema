import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import movieService from "../services/movieService";
import { useEffect } from "react";

export function useMoviesPagination({ page, search, genres, status }) {
    const queryClient = useQueryClient();
    const params = { page, search, genres, status };

    const query = useQuery({
        queryKey: ["movies", "pagination", params],
        queryFn: () => movieService.getByPage(params),
        placeholderData: keepPreviousData,
        staleTime: 60 * 1000,
    })

    const hasNextPage = query.data?.next;

    useEffect(() => {
        if (!hasNextPage) return;
        const nextParams = { ...params, page: page + 1 };
        queryClient.prefetchQuery({
            queryKey: ["movies", "pagination", nextParams],
            queryFn: () => movieService.getByPage(nextParams),
            staleTime: 60 * 1000,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasNextPage, page, search, JSON.stringify(genres), status]);

    return query
}