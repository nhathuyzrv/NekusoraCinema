import { useMutation, useQueryClient } from "@tanstack/react-query";
import userService from "../services/userService";
import { useToast } from "./useToast";

export function useUpdateUser() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => userService.updateUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["currentUser"] });
            toast.success("Cập nhật thành công", "Thông tin cá nhân của bạn đã được cập nhật");
        },
        onError: () =>
            toast.error("Cập nhật thất bại", "Đã có lỗi xảy ra, vui lòng thử lại sau"),
    })
}