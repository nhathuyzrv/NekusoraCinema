import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const PayOSResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const code = searchParams.get("code");
        const cancel = searchParams.get("cancel");
        const orderCode = searchParams.get("orderCode");

        navigate(`/order?payos=${cancel === "true" ? "cancel" : "result"}&orderCode=${orderCode}&code=${code}`, { replace: true });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return null;
}

export default PayOSResult;