import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import myBookingService from "../services/myBookingService";

export function useMyBookingsPagination({ page, statusFilter, days, search }) {
    const queryClient = useQueryClient();
    const params = { page, statusFilter, days, search };

    const query = useQuery({
        queryKey: ["my-bookings", "pagination", params],
        queryFn: () => myBookingService.getByPage(params),
        placeholderData: keepPreviousData,
        staleTime: 60 * 1000,
    });

    const hasNextPage = query.data?.next;

    useEffect(() => {
        if (!hasNextPage) return;
        const nextParams = { ...params, page: page + 1 };
        queryClient.prefetchQuery({
            queryKey: ["my-bookings", nextParams],
            queryFn: () => myBookingService.getByPage(nextParams),
            staleTime: 60 * 1000,
        });
    }, [hasNextPage, page, statusFilter, days, search]); // eslint-disable-line react-hooks/exhaustive-deps

    return query;
}

export function useHoldingBooking(enabled = true) {
    return useQuery({
        queryKey: ["my-bookings", "status", "holding"],
        queryFn: () => myBookingService.getMyByStatus('HOLDING'),
        enabled,
    });
}