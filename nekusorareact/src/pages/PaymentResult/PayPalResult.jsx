import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import paymentService from "../../services/paymentService";

const PayPalResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");
        const payerId = searchParams.get("PayerID");

        if (token && payerId) {
            paymentService.paypalCapture({ token, PayerID: payerId })
                .then((res) => {
                    const bookingCode = res?.data?.booking_code ?? "";
                    navigate(`/order?paypal=result&bookingCode=${bookingCode}`, { replace: true });
                })
                .catch(() => {
                    navigate(`/order?paypal=cancel`, { replace: true });
                });
        } else {
            navigate(`/order?paypal=cancel`, { replace: true });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return null;
}

export default PayPalResult;