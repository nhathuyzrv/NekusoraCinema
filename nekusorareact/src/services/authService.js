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
        ).then((res) => res.data),

    logout: (token) =>
        Apis.post(endpoints.logout,
            JSON.stringify({ token }),
            { headers: { "Content-Type": "application/json" } }
        ),
};

export default authService;