import Apis, { endpoints } from "../configs/Apis";

const showtimeService = {
    getByMovie: (movieId) =>
        Apis.get(endpoints.movieShowtimes(movieId))
            .then(res => res.data),
    getByDate: (movieId, date) =>
        Apis.get(endpoints.movieShowtimes(movieId) + `?date=${date}`)
            .then(res => res.data),
};

export default showtimeService;

