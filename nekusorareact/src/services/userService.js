import Apis, { authApis, endpoints } from "../configs/Apis";

const userService = {
    getCurrentUser: () =>
        authApis.get(endpoints.userInfo)
            .then((res) => res.data),
    register: (formData) =>
        Apis.post(endpoints.users, { ...formData })
            .then((res) => res.data),
    updateUser: (formData) =>
        authApis.patch(endpoints.userInfo,
            { ...formData },
            { headers: { "Content-Type": "multipart/form-data" } }
        )
};

export default userService;