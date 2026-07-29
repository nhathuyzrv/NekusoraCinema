import Apis, { authApis, endpoints } from "../configs/Apis";

const movieService = {
    getByPage: (page) =>
        Apis.get(endpoints.movies(page))
            .then(res => res.data),
    getDetail: (id) =>
        authApis.get(endpoints.movieDetail(id))
            .then(res => res.data),
};

export default movieService;