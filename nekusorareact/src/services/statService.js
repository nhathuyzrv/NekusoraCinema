import { authApis, endpoints } from "../configs/Apis";

const statService = {
    getOverview: (params) =>
        authApis.get(endpoints.manageStatsOverview(params))
            .then(res => res.data),
    getByMonth: (params) =>
        authApis.get(endpoints.manageStatsByMonth(params))
            .then(res => res.data),
    getByMovie: (params) =>
        authApis.get(endpoints.manageStatsByMovie(params))
            .then(res => res.data),
    getByBranch: (params) =>
        authApis.get(endpoints.manageStatsByBranch(params))
            .then(res => res.data),
    getByShowtime: (params) =>
        authApis.get(endpoints.manageStatsByShowtime(params))
            .then(res => res.data),
};

export default statService;