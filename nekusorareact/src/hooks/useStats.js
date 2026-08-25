import { useQuery } from "@tanstack/react-query";
import statService from "../services/statService";

export function useStatsOverview(params) {
    return useQuery({
        queryKey: ["stats-overview", params],
        queryFn: () => statService.getOverview(params),
        enabled: !!params,
        staleTime: 1000 * 60 * 5,
    });
}

export function useStatsByMonth(params) {
    return useQuery({
        queryKey: ["stats-by-month", params],
        queryFn: () => statService.getByMonth(params),
        enabled: !!params,
        staleTime: 1000 * 60 * 5,
    });
}

export function useStatsByMovie(params) {
    return useQuery({
        queryKey: ["stats-by-movie", params],
        queryFn: () => statService.getByMovie(params),
        enabled: !!params,
        staleTime: 1000 * 60 * 5,
    });
}

export function useStatsByBranch(params) {
    return useQuery({
        queryKey: ["stats-by-branch", params],
        queryFn: () => statService.getByBranch(params),
        enabled: !!params,
        staleTime: 1000 * 60 * 5,
    });
}

export function useStatsByShowtime(params) {
    return useQuery({
        queryKey: ["stats-by-showtime", params],
        queryFn: () => statService.getByShowtime(params),
        enabled: !!params,
        staleTime: 1000 * 60 * 5,
    });
}