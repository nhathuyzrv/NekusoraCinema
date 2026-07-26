import { useMutation, useQueryClient } from "@tanstack/react-query";
import userService from "../services/userService";
import { useToast } from "./useToast";

export function useUpdateUser(options = {}) {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => userService.updateUser(data),
        onSuccess: async (...args) => {
            await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
            toast.success("Cập nhật thành công", "Thông tin cá nhân của bạn đã được cập nhật");
            options.onSuccess?.(...args);
        },
        onError: (...args) => {
            toast.error("Cập nhật thất bại", "Đã có lỗi xảy ra, vui lòng thử lại sau");
            options.onError?.(...args);
        },
    });
}