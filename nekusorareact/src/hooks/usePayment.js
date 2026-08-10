import { useQuery } from "@tanstack/react-query";
import paymentService from "../services/paymentService";

export function usePayOSResult(orderCode) {
    return useQuery({
        queryKey: ["payos-result", orderCode],
        queryFn: () => paymentService.getByOrderCode(orderCode),
        enabled: !!orderCode,
        staleTime: Infinity,
        retry: false,
    });
}