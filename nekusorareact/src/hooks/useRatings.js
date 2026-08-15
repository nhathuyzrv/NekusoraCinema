import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ratingService from "../services/ratingService";
import { useToast } from "./useToast";
import { useAuth } from "./useAuth";

export function useRatingsPagination({ movieId }) {
    return useInfiniteQuery({
        queryKey: ["ratings", movieId],
        queryFn: ({ pageParam }) => ratingService.getByMovie(movieId, pageParam),
        getNextPageParam: (last, pages) => last.next ? pages.length + 1 : undefined,
        staleTime: 1000 * 60,
        initialPageParam: 1,
    })
}

export function useMyRating({ movieId }) {
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: ["ratings", movieId, "my"],
        queryFn: () => ratingService.getMyRating(movieId),
        enabled: isAuthenticated,
        staleTime: Infinity,
        retry: false,
    })
}

export function useCreateRating({ movieId }) {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => ratingService.createRating(movieId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ratings", movieId] });
            queryClient.invalidateQueries({ queryKey: ["movie", movieId] });
            toast.success("Gửi đánh giá thành công", "Cảm ơn bạn đã đánh giá");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Gửi đánh giá thất bại", msg);
        },
    })
}

export function useUpdateRating({ movieId, ratingId }) {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => ratingService.updateRating(ratingId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ratings", movieId] });
            queryClient.invalidateQueries({ queryKey: ["movie", movieId] });
            toast.success("Sửa đánh giá thành công", "Cảm ơn bạn đã đánh giá");
        },
        onError: () => {
            toast.error("Sửa đánh giá thất bại", "Đã có lỗi xảy ra, vui lòng thử lại sau");
        }
    })
}