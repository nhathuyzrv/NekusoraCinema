import Apis, { authApis, endpoints } from "../configs/Apis";

const movieService = {
    getByParams: (params) =>
        Apis.get(endpoints.moviesParams(params))
            .then(res => res.data),
    getDetails: (id) =>
        authApis.get(endpoints.movieDetails(id))
            .then(res => res.data),
};

export default movieService;