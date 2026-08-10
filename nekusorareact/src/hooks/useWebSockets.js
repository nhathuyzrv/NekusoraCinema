import { useEffect, useRef, useState } from "react";
import authService from "../services/authService";

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

export function useBookingConfirmed(userEmail, bookingCode) {
    const [confirmed, setConfirmed] = useState(false);
    const wsRef = useRef(null);

    useEffect(() => {
        if (!userEmail || !bookingCode) return;

        let destroyed = false;
        let reconnectTimer;
        let attempt = 0;

        const connect = async () => {
            if (destroyed) return;

            const { ticket } = await authService.getWsTicket();
            const ws = new WebSocket(`${WS_BASE}/ws/user/?ticket=${ticket}`);
            wsRef.current = ws;

            ws.onopen = () => { attempt = 0; };

            ws.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    if (data.type === "booking_confirmed" && data.booking_code === bookingCode) {
                        setConfirmed(true);
                        ws.close();
                    }
                } catch {
                    //
                }
            };

            ws.onclose = () => {
                if (!destroyed && !confirmed) {
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
    }, [userEmail, bookingCode]); // eslint-disable-line react-hooks/exhaustive-deps

    return confirmed;
}