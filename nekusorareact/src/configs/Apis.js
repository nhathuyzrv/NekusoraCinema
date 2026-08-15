import axios from "axios";
import Token from "./Token";

export const endpoints = {
    // Auth
    login: "/o/token/",
    logout: "/o/revoke_token/",
    users: "/users/",
    userInfo: "/users/current-user/",
    sendOTP: "/auth/send-otp/",
    verifyOTP: "/auth/verify-otp/",
    authComplete: "/auth/complete/",
    wsTicket: "/auth/ws-ticket/",

    // Thể loại phim
    genres: "/genres/",

    // Phim
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

    // Suất chiếu
    showtimes: "/showtimes/",
    showtimeSeats: (id) => `/showtimes/${id}/seats/`,

    // Đặt vé
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

    // Vị trí & chi nhánh
    locations: "/locations/",
    locationMovies: (locationId, page) => `/locations/${locationId}/movies/?page=${page}`,
    branches: "/branches/",

    // Phòng & ghế
    rooms: "/rooms/",
    roomSeats: (roomId) => `/rooms/${roomId}/seats/`,

    // Sản phẩm bắp nước
    products: "/products/",

    // Khuyến mãi
    validatePromotion: "/promotions/validate/",

    // Lịch sử giao dịch
    transactionHistory: "/bookings/history/",

    // Rating
    ratings: "/ratings/",
    ratingDetails: (id) => `/ratings/${id}/`,

    // Thanh toán
    paymentMethods: "/payment-methods/",
    payments: "/payments/",
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