import { useEffect, useRef, useState } from "react";

const WS_BASE = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8000";

export function useSeatSocket(showtimeId) {
    const [seatStatus, setSeatStatus] = useState({ booked: [], held: [] });
    const wsRef = useRef(null);
    const intentionalClose = useRef(false);

    useEffect(() => {
        if (!showtimeId) return;

        intentionalClose.current = false;
        let reconnectTimer;

        const connect = () => {
            const ws = new WebSocket(`${WS_BASE}/ws/showtimes/${showtimeId}/seats/`);
            wsRef.current = ws;

            ws.onmessage = (e) => {
                const data = JSON.parse(e.data);
                if (data.type === "seat_status") {
                    setSeatStatus({ booked: data.booked ?? [], held: data.held ?? [] });
                }
            };

            ws.onclose = () => {
                if (!intentionalClose.current) {
                    reconnectTimer = setTimeout(connect, 10000);
                }
            };
        };

        connect();

        return () => {
            intentionalClose.current = true;
            clearTimeout(reconnectTimer);

            const ws = wsRef.current;
            if (!ws) return;

            if (ws.readyState === WebSocket.CONNECTING) {
                ws.onopen = () => ws.close();
            } else if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [showtimeId]);

    return seatStatus;
}