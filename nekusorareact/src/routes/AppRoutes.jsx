import { Routes, Route } from "react-router-dom";
import Layout from "../layout/Layout";
import ProtectedRoutes from "./ProtectedRoutes";

import Movies from "../pages/Movies";
import MovieDetails from "../pages/MovieDetails";
import Booking from "../pages/Booking";
import Profile from "../pages/Profile";
import MyBookings from "../pages/MyBookings";
import NotFound from "../pages/Error/NotFound";
import Forbidden from "../pages/Error/Forbidden";
import PayOSResult from "../pages/PayOSResult";
import BookingDetails from "../pages/BookingDetails";
import Home from "../pages/Home";
import HelperBooking from "../pages/Helper/HelperBooking";
import HelperFAQ from "../pages/Helper/HelperFAQ";
import HelperTermsOfService from "../pages/Helper/HelperTermsOfService";
import HelperPrivacyPolicy from "../pages/Helper/HelperPrivacyPolicy";

// import AdminDashboard from "../pages/admin/Dashboard";
// import ManageMovies from "../pages/admin/ManageMovies";
// import ManageShowtime from "../pages/admin/ManageShowtime";
// import CheckIn from "../pages/staff/CheckIn";

const AppRoutes = () => {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="" element={<Home />} />
                <Route path="movies" element={<Movies />} />
                <Route path="movies/:slug" element={<MovieDetails />} />
                <Route path="help/booking" element={<HelperBooking />} />
                <Route path="help/faq" element={<HelperFAQ />} />
                <Route path="help/terms-of-service" element={<HelperTermsOfService />} />
                <Route path="help/privacy-policy" element={<HelperPrivacyPolicy />} />
                <Route path="order" element={<Booking />} />
                <Route path="order/payos/result" element={<PayOSResult />} />
                <Route path="order/payos/cancel" element={<PayOSResult />} />

                <Route element={<ProtectedRoutes roles={["CUSTOMER"]} />}>
                    <Route path="profile" element={<Profile />} />
                    <Route path="bookings" element={<MyBookings />} />
                    <Route path="bookings/:bookingCode" element={<BookingDetails />} />
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

export default AppRoutes;