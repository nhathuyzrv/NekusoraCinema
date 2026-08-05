import { useEffect, useRef, useState } from "react";

const WS_BASE = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8000";

export function useSeatSocket(showtimeId) {
    const [seatStatus, setSeatStatus] = useState({ booked: [], held: [] });
    const wsRef = useRef(null);

    useEffect(() => {
        if (!showtimeId) return;

        let destroyed = false;
        let reconnectTimer;
        let attempt = 0;

        const connect = () => {
            if (destroyed) return;

            const ws = new WebSocket(`${WS_BASE}/ws/showtimes/${showtimeId}/seats/`);
            wsRef.current = ws;

            ws.onopen = () => { attempt = 0; };

            ws.onmessage = (e) => {
                const data = JSON.parse(e.data);
                if (data.type === "seat_status") {
                    setSeatStatus({ booked: data.booked ?? [], held: data.held ?? [] });
                }
            };

            ws.onclose = () => {
                if (!destroyed) {
                    const delay = Math.min(1000 * 2 ** attempt, 30000);
                    attempt++;
                    reconnectTimer = setTimeout(connect, delay);
                }
            };
        };

        connect();

        return () => {
            destroyed = true;
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