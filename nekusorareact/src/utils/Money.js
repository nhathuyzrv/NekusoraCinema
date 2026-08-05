export function formatMoney(n) {
    return parseInt(n ?? 0).toLocaleString("vi-VN") + "đ";
}

export function formatSignedMoney(n) {
    if (!n) return "0đ";
    return (n > 0 ? "-" : "") + parseInt(Math.abs(n)).toLocaleString("vi-VN") + "đ";
}