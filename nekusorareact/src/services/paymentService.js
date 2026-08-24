import Apis, { endpoints } from "../configs/Apis";

const paymentService = {
    getPaymentMethods: () =>
        Apis.get(endpoints.paymentMethods)
            .then(r => r.data),
    paypalCapture: (data) =>
        Apis.post(endpoints.paypalCapture, data),
};

export default paymentService;