import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import bookingService from "../services/bookingService";
import { useToast } from "./useToast";
import showtimeService from "../services/showtimeService";
import paymentService from "../services/paymentService";

export function useLocations() {
    return useQuery({
        queryKey: ["locations"],
        queryFn: bookingService.getLocations,
        staleTime: 1000 * 60 * 30,
    });
}

export function useLocationMovies(locationId) {
    return useQuery({
        queryKey: ["location-movies", locationId],
        queryFn: () => bookingService.getLocationMovies(locationId),
        enabled: !!locationId,
        staleTime: 1000 * 60,
    });
}

export function useBookingMovieShowtimes(movieId, date, locationId) {
    return useQuery({
        queryKey: ["booking-location-movie-showtimes", locationId, movieId, date],
        queryFn: () => showtimeService.getByDateLocation(movieId, date, locationId),
        enabled: !!movieId && !!date,
        staleTime: 1000 * 60,
    });
}

export function useRoomSeats(roomId) {
    return useQuery({
        queryKey: ["room-seats", roomId],
        queryFn: () => bookingService.getRoomSeats(roomId),
        enabled: !!roomId,
        staleTime: 1000 * 60 * 10,
    });
}

export function useProducts() {
    return useQuery({
        queryKey: ["products"],
        queryFn: bookingService.getProducts,
        staleTime: 1000 * 60 * 10,
    });
}

export function usePaymentMethods() {
    return useQuery({
        queryKey: ["payment-methods"],
        queryFn: paymentService.getPaymentMethods,
        staleTime: 1000 * 60 * 30,
    });
}

export function useBookingDetails(bookingCode) {
    return useQuery({
        queryKey: ["booking", bookingCode],
        queryFn: () => bookingService.getBooking(bookingCode),
        enabled: !!bookingCode,
    });
}

function useBookingMutation(mutationFn) {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn,
        onSuccess: (data) => {
            if (data?.booking_code) {
                queryClient.setQueryData(["booking", data.booking_code], data);
            }
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
}

export function useHoldSeats() {
    return useBookingMutation(({ showtimeId, seatIds }) => bookingService.holdSeats(showtimeId, seatIds));
}

export function useSetProducts(bookingCode) {
    return useBookingMutation((items) => bookingService.setProducts(bookingCode, items));
}

export function useApplyPromotion(bookingCode) {
    return useBookingMutation((code) => bookingService.applyPromotion(bookingCode, code));
}

export function useRemovePromotion(bookingCode) {
    return useBookingMutation(() => bookingService.removePromotion(bookingCode));
}

export function useRedeemPoints(bookingCode) {
    return useBookingMutation((points) => bookingService.redeemPoints(bookingCode, points));
}

export function useClearPoints(bookingCode) {
    return useBookingMutation(() => bookingService.clearPoints(bookingCode));
}

export function useCreatePayment(bookingCode) {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ method, email }) => bookingService.createPayment(bookingCode, method, email),
        onSuccess: (paymentData) => {
            queryClient.setQueryData(["booking", bookingCode], (prev) => {
                if (!prev) return prev;
                return { ...prev, payment: paymentData };
            });
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
}

export function useDeleteBooking() {
    const toast = useToast();
    return useMutation({
        mutationFn: (bookingCode) => bookingService.deleteBooking(bookingCode),
        onSuccess: () => toast.success("Hủy đặt vé thành công"),
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Hủy đặt vé thất bại", msg);
        }
    });
}