import Apis, { authApis, endpoints } from "../configs/Apis";

const movieService = {
    getByPage: (page) =>
        Apis.get(endpoints.moviesPagination(page))
            .then(res => res.data),
    getDetails: (id) =>
        authApis.get(endpoints.movieDetails(id))
            .then(res => res.data),
};

export default movieService;