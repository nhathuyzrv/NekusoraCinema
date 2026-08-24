const Configs = {
    USER_ROLES: {
        ADMIN: "ADMIN",
        CUSTOMER: "CUSTOMER",
        STAFF: "STAFF",
        MANAGER: "MANAGER",
    },
    USER_ROLE_LABELS: {
        ADMIN: "Quản trị viên",
        CUSTOMER: "Thành viên",
        STAFF: "Nhân viên",
        MANAGER: "Quản lý",
    },

    STAFF_POSITIONS: {
        COUNTER_STAFF: "COUNTER_STAFF",
        CHECKER_STAFF: "CHECKER_STAFF",
        BRANCH_MANAGER: "BRANCH_MANAGER",
        SYSTEM_MANAGER: "SYSTEM_MANAGER",
    },
    STAFF_POSITION_LABELS: {
        COUNTER_STAFF: "Nhân viên quầy vé",
        CHECKER_STAFF: "Nhân viên soát vé",
        BRANCH_MANAGER: "Quản lý chi nhánh",
        SYSTEM_MANAGER: "Quản lý hệ thống",
    },

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

    BOOKING_PAGE_SIZE: 5,
    BOOKING_STATUS_FILTERS: [
        { label: "Đã xác nhận", value: "CONFIRMED" },
        { label: "Chưa hoàn tất", value: "HOLDING" },
        { label: "Đã huỷ", value: "CANCELLED" },
        { label: "Đã hết hạn", value: "EXPIRED" },
    ],
    BOOKING_DAYS_FILTERS: [
        { label: "1 tuần", value: "7" },
        { label: "1 tháng", value: "30" },
        { label: "3 tháng", value: "90" },
        { label: "6 tháng", value: "180" },
    ],
    BOOKING_STATUS_BADGE: {
        CONFIRMED: "badge-success",
        CANCELLED: "badge-error",
        EXPIRED: "badge-info",
        HOLDING: "badge-warning",
    },
    BOOKING_STATUS_LABEL: {
        HOLDING: "Chưa hoàn tất",
        CONFIRMED: "Đã xác nhận",
        CANCELLED: "Đã huỷ",
        EXPIRED: "Đã hết hạn",
    },

    PAYMENT_METHODS: {
        BANK_QR: "BANK_QR",
        MOMO: "MOMO",
        PAYPAL: "PAYPAL",
    },

    TICKET_BASE_PRICE: {
        MON: 65000,
        TUE: 55000,
        WED: 65000,
        THU: 65000,
        FRI: 65000,
        SAT: 80000,
        SUN: 80000,
    },

    TICKET_FORMAT_SURCHARGE: {
        "2D_PD": 0,
        "2D_LT": 0,
        "3D": 30000,
        "IMAX": 50000,
        "4DX": 80000,
    },

    TICKET_FORMAT_LABELS: {
        "2D_PD": "2D Phụ đề",
        "2D_LT": "2D Lồng tiếng",
        "3D": "3D",
        "IMAX": "IMAX",
        "4DX": "4DX",
    },
};

export default Configs;