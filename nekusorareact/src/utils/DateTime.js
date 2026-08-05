import { formatDistance } from "date-fns";
import { vi } from "date-fns/locale";

export function formatDuration(mins) {
    if (!mins) return "—";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
}

export function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatShortWeekday(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", { weekday: "short" })
}


export function formatTimeAgo(datetimeStr) {
    if (!datetimeStr) return "-"
    return formatDistance(new Date(datetimeStr), new Date(), { locale: vi, addSuffix: true });
}