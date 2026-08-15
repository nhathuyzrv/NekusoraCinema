import Apis, { authApis, endpoints } from "../configs/Apis";

const bookingService = {
    getLocations: () =>
        Apis.get(endpoints.locations)
            .then(r => r.data),
    getLocationMovies: (locationId, page = 1) =>
        Apis.get(endpoints.locationMovies(locationId, page))
            .then(r => r.data),

    getRoomSeats: (roomId) =>
        Apis.get(endpoints.roomSeats(roomId))
            .then(r => r.data),
    holdSeats: (showtimeId, seatIds) =>
        authApis.post(endpoints.bookings, { showtime: showtimeId, seats: seatIds })
            .then(r => r.data),

    getBooking: (bookingCode) =>
        authApis.get(endpoints.bookingDetails(bookingCode))
            .then(r => r.data),
    deleteBooking: (bookingCode) =>
        authApis.delete(endpoints.bookingDetails(bookingCode))
            .then(r => r.data),

    getProducts: () =>
        Apis.get("/products/")
            .then(r => r.data),
    setProducts: (bookingCode, items) =>
        authApis.put(endpoints.bookingDetails(bookingCode) + "products/", { items })
            .then(r => r.data),

    applyPromotion: (bookingCode, code) =>
        authApis.post(endpoints.bookingDetails(bookingCode) + "promotion/", { code })
            .then(r => r.data),
    removePromotion: (bookingCode) =>
        authApis.delete(endpoints.bookingDetails(bookingCode) + "promotion/")
            .then(r => r.data),
    redeemPoints: (bookingCode, points) =>
        authApis.post(endpoints.bookingDetails(bookingCode) + "points/", { points })
            .then(r => r.data),
    clearPoints: (bookingCode) =>
        authApis.delete(endpoints.bookingDetails(bookingCode) + "points/")
            .then(r => r.data),

    getPaymentMethods: () =>
        Apis.get(endpoints.paymentMethods)
            .then(r => r.data),
    createPayment: (bookingCode, method, email) =>
        authApis.post(endpoints.bookingDetails(bookingCode) + "payment/", { method, email })
            .then(r => r.data),
};

export default bookingService;