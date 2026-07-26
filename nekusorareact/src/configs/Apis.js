import axios from "axios";
import Token from "./Token";

export const endpoints = {
    // Auth
    login: "/o/token/",
    logout: "/o/revoke_token/",
    users: "/users/",
    userInfo: "/users/current-user/",

    // Phim
    movies: "/movies/",
    movieDetail: (slug) => `/movies/${slug}/`,

    // Suất chiếu
    showtimes: "/showtimes/",
    showtimeSeats: (id) => `/showtimes/${id}/seats/`,

    // Đặt vé
    bookings: "/bookings/",
    bookingDetail: (code) => `/bookings/${code}/`,

    // Vị trí & chi nhánh
    locations: "/locations/",
    branches: "/branches/",

    // Sản phẩm bắp nước
    products: "/products/",

    // Khuyến mãi
    validatePromotion: "/promotions/validate/",

    // Lịch sử giao dịch
    transactionHistory: "/bookings/history/",

    // Rating
    ratings: "/ratings/",
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