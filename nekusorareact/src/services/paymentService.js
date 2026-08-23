import { authApis, endpoints } from "../configs/Apis";

const paymentService = {
    getByOrderCode: (orderCode) =>
        authApis.get(endpoints.payments + `?orderCode=${orderCode}`)
            .then(res => res.data),
};

export default paymentService;