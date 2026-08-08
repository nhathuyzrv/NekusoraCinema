import Apis, { authApis, endpoints } from "../configs/Apis";

const bookingService = {
    getMyByStatus: (status) =>
        authApis.get(endpoints.bookings + `my/?status=${status}`)
            .then(res => res.data),

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
        authApis.post(endpoints.bookings + "hold/", { showtime: showtimeId, seats: seatIds })
            .then(r => r.data),

    getBooking: (bookingCode) =>
        authApis.get(endpoints.bookingDetails(bookingCode))
            .then(r => r.data),
    cancelBooking: (bookingCode) =>
        authApis.post(endpoints.bookingDetails(bookingCode) + "cancel/")
            .then(r => r.data),
    expireBooking: (bookingCode) =>
        authApis.post(endpoints.bookingDetails(bookingCode) + "expire/")
            .then(r => r.data),

    getProducts: () =>
        Apis.get("/products/")
            .then(r => r.data),
    setProducts: (bookingCode, items) =>
        authApis.post(endpoints.bookingDetails(bookingCode) + "products/", { items })
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
    initCheckout: (bookingCode, method, email) =>
        authApis.post(endpoints.bookingDetails(bookingCode) + "checkout/", { method, email })
            .then(r => r.data),
};

export default bookingService;