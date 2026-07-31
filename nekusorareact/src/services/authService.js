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

    forgotPW: (email) =>
        Apis.post(endpoints.forgotPW,
            JSON.stringify({ email }),
            { headers: { "Content-Type": "application/json" } }
        ).then(res => res.data),

    verifyOTP: (email, otp) =>
        Apis.post(endpoints.verifyOTP,
            JSON.stringify({ email, otp }),
            { headers: { "Content-Type": "application/json" } }
        ).then(res => res.data),

    resetPW: (email, reset_token, new_password) =>
        Apis.post(endpoints.resetPW,
            JSON.stringify({ email, reset_token, new_password }),
            { headers: { "Content-Type": "application/json" } }
        ).then(res => res.data),
};

export default authService;