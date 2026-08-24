import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const MoMoResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const resultCode = searchParams.get("resultCode");
        const orderId = searchParams.get("orderId");

        const bookingCode = orderId?.split("_")[0] ?? "";
        const status = resultCode === "0" ? "result" : "cancel";

        navigate(`/order?momo=${status}&bookingCode=${bookingCode}&resultCode=${resultCode}`, { replace: true });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return null;
}

export default MoMoResult;