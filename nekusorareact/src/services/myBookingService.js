import { authApis, endpoints } from "../configs/Apis";

const myBookingService = {
    getByPage: (params) =>
        authApis.get(endpoints.bookingsPagination(params))
            .then(res => res.data),
    getMyByStatus: (status) =>
        authApis.get(endpoints.bookings + `?status=${status}`)
            .then(res => res.data),
};

export default myBookingService;