import Apis, { authApis, endpoints } from "../configs/Apis";

const ratingService = {
    getByMovie: (movieId, page) =>
        Apis.get(endpoints.movieRatingsPagination(movieId, page))
            .then(res => res.data),
    getMyRating: (movieId) =>
        authApis.get(endpoints.movieRatings(movieId) + 'my/')
            .then(res => res.data)
            .catch(error => {
                if (error?.response?.status === 404)
                    return null;
            }),
    createRating: (movieId, formData) =>
        authApis.post(endpoints.movieRatings(movieId), formData)
            .then(res => res.data),
    updateRating: (ratingId, formData) =>
        authApis.patch(endpoints.ratingDetails(ratingId), formData)
            .then(res => res.data),
};

export default ratingService;