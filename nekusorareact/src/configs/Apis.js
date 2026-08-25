import axios from "axios";
import Token from "./Token";

export const endpoints = {
    login: "/o/token/",
    logout: "/o/revoke_token/",
    users: "/users/",
    userInfo: "/users/current-user/",
    sendOTP: "/auth/send-otp/",
    verifyOTP: "/auth/verify-otp/",
    authComplete: "/auth/complete/",
    wsTicket: "/auth/ws-ticket/",

    genres: "/genres/",

    movies: "/movies/",
    moviesParams: ({ search = "", genres = [], status = "" }) => {
        const params = new URLSearchParams();
        if (search) params.append("title", search);
        if (status) params.append("status", status);
        genres.forEach((g) => params.append("genre", g));
        return `/movies/?${params.toString()}`;
    },
    movieDetails: (id) => `/movies/${id}/`,
    movieRatings: (id) => `/movies/${id}/ratings/`,
    movieRatingsPagination: (id, page = 1) => `/movies/${id}/ratings/?page=${page}`,
    movieShowtimes: (id) => `/movies/${id}/showtimes/`,

    showtimes: "/showtimes/",
    showtimeSeats: (id) => `/showtimes/${id}/seats/`,

    bookings: "/bookings/",
    bookingDetails: (code) => `/bookings/${code}/`,
    bookingsPagination: ({ page = 1, statusFilter, days, search = "" }) => {
        const params = new URLSearchParams();
        params.append("page", page);
        if (statusFilter) params.append("status", statusFilter);
        if (days) params.append("days", days);
        if (search) params.append("search", search);
        return `/bookings/?${params.toString()}`;
    },

    locations: "/locations/",
    locationMovies: (locationId, page) => `/locations/${locationId}/movies/?page=${page}`,
    branches: "/branches/",

    rooms: "/rooms/",
    roomSeats: (roomId) => `/rooms/${roomId}/seats/`,

    products: "/products/",

    validatePromotion: "/promotions/validate/",

    transactionHistory: "/bookings/history/",

    ratings: "/ratings/",
    ratingDetails: (id) => `/ratings/${id}/`,

    paymentMethods: "/payment-methods/",
    paypalCapture: "/paypal/capture/",

    screeningFormats: "/screening-formats/",

    manageStaffs: "/manage/staffs/",
    manageStaffDetail: (id) => `/manage/staffs/${id}/`,
    manageStaffsParams: ({ search = "", branch = "", position = "" } = {}) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (branch) params.append("branch", branch);
        if (position) params.append("position", position);
        return `/manage/staffs/?${params.toString()}`;
    },

    manageGenres: "/manage/genres/",
    manageGenreDetail: (id) => `/manage/genres/${id}/`,

    manageScreeningFormats: "/manage/screenings/",
    manageScreeningFormatDetail: (id) => `/manage/screenings/${id}/`,

    manageMovies: "/manage/movies/",
    manageMovieDetail: (id) => `/manage/movies/${id}/`,
    manageMoviesParams: ({ search = "", status = "" } = {}) => {
        const params = new URLSearchParams();
        if (search) params.append("title", search);
        if (status) params.append("status", status);
        return `/manage/movies/?${params.toString()}`;
    },
    manageMovieShowtimes: (movieId) => `/manage/movies/${movieId}/showtimes/`,
    manageMovieShowtimesParams: (movieId, { status = "", date = "", branch = "" } = {}) => {
        const params = new URLSearchParams();
        if (status) params.append("status", status);
        if (date) params.append("date", date);
        if (branch) params.append("branch", branch);
        return `/manage/movies/${movieId}/showtimes/?${params.toString()}`;
    },

    manageShowtimes: "/manage/showtimes/",
    manageShowtimeDetail: (id) => `/manage/showtimes/${id}/`,

    manageLocations: "/manage/locations/",
    manageLocationDetail: (id) => `/manage/locations/${id}/`,
    manageLocationBranches: (locationId) => `/manage/locations/${locationId}/branches/`,

    manageBranches: "/manage/branches/",
    manageBranchDetail: (id) => `/manage/branches/${id}/`,
    manageBranchRooms: (branchId) => `/manage/branches/${branchId}/rooms/`,

    manageRooms: "/manage/rooms/",
    manageRoomDetail: (id) => `/manage/rooms/${id}/`,

    manageProducts: "/manage/products/",
    manageProductDetail: (id) => `/manage/products/${id}/`,
    manageProductsParams: ({ product_type = "", active = "" } = {}) => {
        const params = new URLSearchParams();
        if (product_type) params.append("product_type", product_type);
        if (active !== "") params.append("active", active);
        return `/manage/products/?${params.toString()}`;
    },

    managePromotions: "/manage/promotions/",
    managePromotionDetail: (id) => `/manage/promotions/${id}/`,
    managePromotionsParams: ({ discount_type = "" } = {}) => {
        const params = new URLSearchParams();
        if (discount_type) params.append("discount_type", discount_type);
        return `/manage/promotions/?${params.toString()}`;
    },

    manageStatsOverview: ({ year = "", month = "", branch_id = "", movie_id = "" } = {}) => {
        const params = new URLSearchParams();
        if (year) params.append("year", year);
        if (month) params.append("month", month);
        if (branch_id) params.append("branch", branch_id);
        if (movie_id) params.append("movie", movie_id);
        return `/manage/stats/overview/?${params.toString()}`;
    },

    manageStatsByMonth: ({ year = "", month = "", branch_id = "", movie_id = "" } = {}) => {
        const params = new URLSearchParams();
        if (year) params.append("year", year);
        if (month) params.append("month", month);
        if (branch_id) params.append("branch", branch_id);
        if (movie_id) params.append("movie", movie_id);
        return `/manage/stats/month/?${params.toString()}`;
    },

    manageStatsByMovie: ({ year = "", month = "", branch_id = "", movie_id = "" } = {}) => {
        const params = new URLSearchParams();
        if (year) params.append("year", year);
        if (month) params.append("month", month);
        if (branch_id) params.append("branch", branch_id);
        if (movie_id) params.append("movie", movie_id);
        return `/manage/stats/movie/?${params.toString()}`;
    },

    manageStatsByBranch: ({ year = "", month = "", branch_id = "", movie_id = "" } = {}) => {
        const params = new URLSearchParams();
        if (year) params.append("year", year);
        if (month) params.append("month", month);
        if (branch_id) params.append("branch", branch_id);
        if (movie_id) params.append("movie", movie_id);
        return `/manage/stats/branch/?${params.toString()}`;
    },

    manageStatsByShowtime: ({ year = "", month = "", branch_id = "", movie_id = "" } = {}) => {
        const params = new URLSearchParams();
        if (year) params.append("year", year);
        if (month) params.append("month", month);
        if (branch_id) params.append("branch", branch_id);
        if (movie_id) params.append("movie", movie_id);
        return `/manage/stats/showtime/?${params.toString()}`;
    },
};

const BASE_URL = 'http://127.0.0.1:8000/';

export default axios.create({
    baseURL: BASE_URL
})

export const authApis = axios.create({
    baseURL: BASE_URL
})

authApis.interceptors.request.use(
    (config) => {
        const token = Token.getAccess();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
)