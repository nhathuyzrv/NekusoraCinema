import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import managementService from "../services/managementService";
import { useToast } from "./useToast";

export const useManageStaffs = (params) =>
    useQuery({
        queryKey: ["manage_staffs", params],
        queryFn: () => managementService.getStaffs(params),
        staleTime: 1000 * 60,
    });

export const useManageStaffDetail = (id) =>
    useQuery({
        queryKey: ["manage_staffs", id],
        queryFn: () => managementService.getStaffDetail(id),
        enabled: !!id,
    });

export const useCreateStaff = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => managementService.createStaff(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_staffs"] });
            toast.success("Đã thêm nhân viên mới");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useUpdateStaff = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ id, data }) => managementService.updateStaff(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_staffs"] });
            toast.success("Đã cập nhật nhân viên");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useManageGenres = () =>
    useQuery({
        queryKey: ["manage_genres"],
        queryFn: () => managementService.getGenres(),
        staleTime: 1000 * 60,
    });

export const useCreateGenre = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => managementService.createGenre(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_genres"] });
            toast.success("Đã thêm thể loại mới");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useUpdateGenre = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ id, data }) => managementService.updateGenre(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_genres"] });
            toast.success("Đã cập nhật thể loại");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useManageScreeningFormats = () =>
    useQuery({
        queryKey: ["manage_screening_formats"],
        queryFn: () => managementService.getScreeningFormats(),
        staleTime: 1000 * 60,
    });

export const useCreateScreeningFormat = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => managementService.createScreeningFormat(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_screening_formats"] });
            toast.success("Đã thêm định dạng chiếu mới");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useUpdateScreeningFormat = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ id, data }) => managementService.updateScreeningFormat(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_screening_formats"] });
            toast.success("Đã cập nhật định dạng chiếu");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useManageMovies = (params) =>
    useQuery({
        queryKey: ["manage_movies", params],
        queryFn: () => managementService.getMovies(params),
        staleTime: 1000 * 60,
    });

export const useManageMovieDetail = (id) =>
    useQuery({
        queryKey: ["manage_movies", id],
        queryFn: () => managementService.getMovieDetail(id),
        enabled: !!id,
    });

export const useCreateMovie = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => managementService.createMovie(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_movies"] });
            toast.success("Đã thêm phim mới");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useUpdateMovie = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ id, data }) => managementService.updateMovie(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_movies"] });
            toast.success("Đã cập nhật phim");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useManageMovieShowtimes = (movieId, params) =>
    useQuery({
        queryKey: ["manage_movie_showtimes", movieId, params],
        queryFn: () => managementService.getMovieShowtimes(movieId, params),
        enabled: !!movieId,
        staleTime: 1000 * 60,
    });

export const useCreateMovieShowtime = (movieId) => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => managementService.createMovieShowtime(movieId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_movie_showtimes", movieId] });
            toast.success("Đã thêm suất chiếu mới");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useManageShowtimeDetail = (id) =>
    useQuery({
        queryKey: ["manage_showtime_detail", id],
        queryFn: () => managementService.getShowtimeDetail(id),
        enabled: !!id,
    });

export const useUpdateShowtime = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ id, data }) => managementService.updateShowtime(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_movie_showtimes"] });
            toast.success("Đã cập nhật suất chiếu");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useDeleteShowtime = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (id) => managementService.deleteShowtime(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_movie_showtimes"] });
            toast.success("Đã xóa suất chiếu");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useManageLocations = () =>
    useQuery({
        queryKey: ["manage_locations"],
        queryFn: () => managementService.getLocations(),
        staleTime: 1000 * 60,
    });

export const useManageLocationDetail = (id) =>
    useQuery({
        queryKey: ["manage_location_detail", id],
        queryFn: () => managementService.getLocationDetail(id),
        enabled: !!id,
    });

export const useCreateLocation = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => managementService.createLocation(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_locations"] });
            toast.success("Đã thêm khu vực mới");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useUpdateLocation = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ id, data }) => managementService.updateLocation(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_locations"] });
            toast.success("Đã cập nhật khu vực");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useManageLocationBranches = (locationId) =>
    useQuery({
        queryKey: ["manage_location_branches", locationId],
        queryFn: () => managementService.getLocationBranches(locationId),
        enabled: !!locationId,
        staleTime: 1000 * 60,
    });

export const useCreateBranch = (locationId) => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => managementService.createBranch(locationId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_location_branches", locationId] });
            toast.success("Đã thêm chi nhánh mới");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useManageBranchDetail = (id) =>
    useQuery({
        queryKey: ["manage_branch_detail", id],
        queryFn: () => managementService.getBranchDetail(id),
        enabled: !!id,
    });

export const useUpdateBranch = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ id, data }) => managementService.updateBranch(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_locations"] });
            toast.success("Đã cập nhật chi nhánh");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useManageBranchRooms = (branchId) =>
    useQuery({
        queryKey: ["manage_branch_rooms", branchId],
        queryFn: () => managementService.getBranchRooms(branchId),
        enabled: !!branchId,
        staleTime: 1000 * 60,
    });

export const useCreateRoom = (branchId) => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => managementService.createRoom(branchId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_branch_rooms", branchId] });
            toast.success("Đã thêm phòng chiếu mới");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useManageRoomDetail = (id) =>
    useQuery({
        queryKey: ["manage_room_detail", id],
        queryFn: () => managementService.getRoomDetail(id),
        enabled: !!id,
    });

export const useUpdateRoom = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ id, data }) => managementService.updateRoom(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_branch_rooms"] });
            toast.success("Đã cập nhật phòng chiếu");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useManageProducts = (params) =>
    useQuery({
        queryKey: ["manage_products", params],
        queryFn: () => managementService.getProducts(params),
        staleTime: 1000 * 60,
    });

export const useManageProductDetail = (id) =>
    useQuery({
        queryKey: ["manage_product_detail", id],
        queryFn: () => managementService.getProductDetail(id),
        enabled: !!id,
    });

export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => managementService.createProduct(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_products"] });
            toast.success("Đã thêm sản phẩm mới");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ id, data }) => managementService.updateProduct(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ["manage_products"] });
            queryClient.invalidateQueries({ queryKey: ["manage_product_detail", id] });
            toast.success("Đã cập nhật sản phẩm");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useManagePromotions = (params) =>
    useQuery({
        queryKey: ["manage_promotions", params],
        queryFn: () => managementService.getPromotions(params),
        staleTime: 1000 * 60,
    });

export const useCreatePromotion = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => managementService.createPromotion(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manage_promotions"] });
            toast.success("Đã thêm khuyến mãi mới");
        },
        onError: (err) => {
            const msg = err.response?.data?.message || Object.values(err.response?.data) || "Đã có lỗi xảy ra, vui lòng thử lại";
            toast.error("Thao tác thất bại", msg);
        },
    });
};

export const useBranches = () =>
    useQuery({
        queryKey: ["branches"],
        queryFn: () => managementService.getBranches(),
        staleTime: 1000 * 60,
    });