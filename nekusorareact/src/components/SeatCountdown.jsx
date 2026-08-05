import { useState, useEffect } from 'react';
import MyAlert from '../configs/MyAlert';

export const SeatCountdown = ({ heldUntil }) => {
    const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });

    useEffect(() => {
        const targetTime = new Date(heldUntil).getTime();

        const updateCountdown = async () => {
            const now = Date.now();
            const diff = targetTime - now;

            if (diff <= 0) {
                setTimeLeft({ minutes: 0, seconds: 0 });
                await MyAlert.alert("Hết thời gian giữ ghế", "Chúng tôi đã hủy đơn đặt vé của bạn vì đã hết thời gian giữ ghế, vui lòng đặt lại đơn mới nhé.",
                    [{ text: "Quay lại", style: "primary", onClick: () => window.location.reload() }]
                );
                return;
            }

            const minutes = Math.floor(diff / 1000 / 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTimeLeft({ minutes, seconds });
        };

        updateCountdown();

        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [heldUntil]);

    return (
        <span className="countdown font-medium text-md">
            <span
                style={{ "--value": timeLeft.minutes, "--digits": 2 }}
                aria-live="polite"
                aria-label={`${timeLeft.minutes}`}
            >
                {timeLeft.minutes}
            </span>
            :
            <span
                style={{ "--value": timeLeft.seconds, "--digits": 2 }}
                aria-live="polite"
                aria-label={`${timeLeft.seconds}`}
            >
                {timeLeft.seconds}
            </span>
        </span>
    );
};