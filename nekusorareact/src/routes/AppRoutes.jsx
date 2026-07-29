import { Routes, Route } from "react-router-dom";
import Layout from "../layout/Layout";
import ProtectedRoutes from "./ProtectedRoutes";

import Movies from "../pages/Movies";
// import MovieDetail from "../pages/MovieDetail";
// import Booking from "../pages/Booking";
import Profile from "../pages/Profile";
// import History from "../pages/History";
import NotFound from "../pages/NotFound";
import Forbidden from "../pages/Forbidden";

// import AdminDashboard from "../pages/admin/Dashboard";
// import ManageMovies from "../pages/admin/ManageMovies";
// import ManageShowtime from "../pages/admin/ManageShowtime";
// import CheckIn from "../pages/staff/CheckIn";

export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="movies" element={<Movies />} />
                {/* <Route path="movies/:slug" element={<MovieDetail />} /> */}

                <Route element={<ProtectedRoutes roles={["CUSTOMER"]} />}>
                    {/* <Route path="booking" element={<Booking />} /> */}
                    <Route path="profile" element={<Profile />} />
                    {/* <Route path="history" element={<History />} /> */}
                </Route>

                <Route element={<ProtectedRoutes roles={["STAFF", "MANAGER"]} />}>
                    {/* <Route path="staff/checkin" element={<CheckIn />} /> */}
                </Route>

                <Route element={<ProtectedRoutes roles={["MANAGER"]} />}>
                    {/* <Route path="admin" element={<AdminDashboard />} /> */}
                    {/* <Route path="admin/movies" element={<ManageMovies />} /> */}
                    {/* <Route path="admin/showtimes" element={<ManageShowtime />} /> */}
                </Route>

                <Route path="403" element={<Forbidden />} />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    );
}