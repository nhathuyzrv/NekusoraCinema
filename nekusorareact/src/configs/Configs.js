const Configs = {
    STEPS: ["Chọn suất chiếu", "Chọn ghế", "Chọn bắp/nước", "Khuyến mãi", "Xác nhận đơn", "Thanh toán"],
    MAX_SEATS: 8,
    MIN_SUBTOTAL_THRESHOLD: 10000,
    SEAT_HOLD_MINUTES: 8,
    POINTS_TO_VND: 500,
    MOVIE_PAGE_SIZE: 8,
    AGE_BADGE: {
        P: { label: "P", cls: "badge-success" },
        K: { label: "K", cls: "badge-accent" },
        T13: { label: "T13", cls: "badge-info" },
        T16: { label: "T16", cls: "badge-warning" },
        T18: { label: "T18", cls: "badge-error" },
    },
};

export default Configs;