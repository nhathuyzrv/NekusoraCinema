import Apis, { endpoints } from "../configs/Apis";

const authService = {
    login: ({ username, password }) =>
        Apis.post(endpoints.login,
            JSON.stringify({
                username,
                password,
                grant_type: "password"
            }),
            { headers: { "Content-Type": "application/json" } }
        ).then(res => res.data),

    logout: (token) =>
        Apis.post(endpoints.logout,
            JSON.stringify({ token }),
            { headers: { "Content-Type": "application/json" } }
        ),

    sendOTP: (mode, data) =>
        Apis.post(endpoints.sendOTP,
            JSON.stringify({ mode, ...data }),
            { headers: { "Content-Type": "application/json" } }
        ).then(res => res.data),

    verifyOTP: (mode, data, otp) =>
        Apis.post(endpoints.verifyOTP,
            JSON.stringify({ mode, ...data, otp }),
            { headers: { "Content-Type": "application/json" } }
        ).then(res => res.data),

    authComplete: (mode, data) =>
        Apis.post(endpoints.authComplete,
            JSON.stringify({ mode, ...data }),
            { headers: { "Content-Type": "application/json" } }
        ).then(res => res.data),
};

export default authService;