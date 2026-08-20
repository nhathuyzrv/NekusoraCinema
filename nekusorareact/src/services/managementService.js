import { authApis, endpoints } from "../configs/Apis";

const managementService = {
    getStaffs: (params) =>
        authApis.get(endpoints.manageStaffsParams(params))
            .then(res => res.data),
    getStaffDetail: (id) =>
        authApis.get(endpoints.manageStaffDetail(id))
            .then(res => res.data),
    createStaff: (data) =>
        authApis.post(endpoints.manageStaffs, data)
            .then(res => res.data),
    updateStaff: (id, data) =>
        authApis.patch(endpoints.manageStaffDetail(id), data)
            .then(res => res.data),

    getGenres: () =>
        authApis.get(endpoints.manageGenres)
            .then(res => res.data),
    createGenre: (data) =>
        authApis.post(endpoints.manageGenres, data)
            .then(res => res.data),
    updateGenre: (id, data) =>
        authApis.patch(endpoints.manageGenreDetail(id), data)
            .then(res => res.data),

    getScreeningFormats: () =>
        authApis.get(endpoints.manageScreeningFormats)
            .then(res => res.data),
    createScreeningFormat: (data) =>
        authApis.post(endpoints.manageScreeningFormats, data)
            .then(res => res.data),
    updateScreeningFormat: (id, data) =>
        authApis.patch(endpoints.manageScreeningFormatDetail(id), data)
            .then(res => res.data),

    getMovies: (params) =>
        authApis.get(endpoints.manageMoviesParams(params))
            .then(res => res.data),
    getMovieDetail: (id) =>
        authApis.get(endpoints.manageMovieDetail(id))
            .then(res => res.data),
    createMovie: (data) =>
        authApis.post(endpoints.manageMovies, data, { headers: { "Content-Type": "multipart/form-data" } })
            .then(res => res.data),
    updateMovie: (id, data) =>
        authApis.patch(endpoints.manageMovieDetail(id), data, { headers: { "Content-Type": "multipart/form-data" } })
            .then(res => res.data),
    getMovieShowtimes: (movieId, params) =>
        authApis.get(endpoints.manageMovieShowtimesParams(movieId, params))
            .then(res => res.data),
    createMovieShowtime: (movieId, data) =>
        authApis.post(endpoints.manageMovieShowtimes(movieId), data)
            .then(res => res.data),

    getShowtimeDetail: (id) =>
        authApis.get(endpoints.manageShowtimeDetail(id))
            .then(res => res.data),
    updateShowtime: (id, data) =>
        authApis.patch(endpoints.manageShowtimeDetail(id), data)
            .then(res => res.data),
    deleteShowtime: (id) =>
        authApis.delete(endpoints.manageShowtimeDetail(id))
            .then(res => res.data),

    getLocations: () =>
        authApis.get(endpoints.manageLocations)
            .then(res => res.data),
    getLocationDetail: (id) =>
        authApis.get(endpoints.manageLocationDetail(id))
            .then(res => res.data),
    createLocation: (data) =>
        authApis.post(endpoints.manageLocations, data)
            .then(res => res.data),
    updateLocation: (id, data) =>
        authApis.patch(endpoints.manageLocationDetail(id), data)
            .then(res => res.data),
    getLocationBranches: (locationId) =>
        authApis.get(endpoints.manageLocationBranches(locationId))
            .then(res => res.data),
    createBranch: (locationId, data) =>
        authApis.post(endpoints.manageLocationBranches(locationId), data)
            .then(res => res.data),

    getBranchDetail: (id) =>
        authApis.get(endpoints.manageBranchDetail(id))
            .then(res => res.data),
    updateBranch: (id, data) =>
        authApis.patch(endpoints.manageBranchDetail(id), data)
            .then(res => res.data),
    getBranchRooms: (branchId) =>
        authApis.get(endpoints.manageBranchRooms(branchId))
            .then(res => res.data),
    createRoom: (branchId, data) =>
        authApis.post(endpoints.manageBranchRooms(branchId, data))
            .then(res => res.data),

    getRoomDetail: (id) =>
        authApis.get(endpoints.manageRoomDetail(id))
            .then(res => res.data),
    updateRoom: (id, data) =>
        authApis.patch(endpoints.manageRoomDetail(id), data)
            .then(res => res.data),

    getProducts: (params) =>
        authApis.get(endpoints.manageProductsParams(params))
            .then(res => res.data),
    getProductDetail: (id) =>
        authApis.get(endpoints.manageProductDetail(id))
            .then(res => res.data),
    createProduct: (data) =>
        authApis.post(endpoints.manageProducts, data, { headers: { "Content-Type": "multipart/form-data" } })
            .then(res => res.data),
    updateProduct: (id, data) =>
        authApis.patch(endpoints.manageProductDetail(id), data, { headers: { "Content-Type": "multipart/form-data" } })
            .then(res => res.data),

    getPromotions: (params) =>
        authApis.get(endpoints.managePromotionsParams(params))
            .then(res => res.data),
    createPromotion: (data) =>
        authApis.post(endpoints.managePromotions, data)
            .then(res => res.data),

    getBranches: () =>
        authApis.get(endpoints.branches)
            .then(res => res.data),
};

export default managementService;