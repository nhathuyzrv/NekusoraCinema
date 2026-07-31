import Apis, { endpoints } from "../configs/Apis";

const genreService = {
    getAll: () =>
        Apis.get(endpoints.genres)
            .then(res => res.data),
};

export default genreService;