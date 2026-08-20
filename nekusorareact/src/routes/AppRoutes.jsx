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

import ManagerDashboard from "../pages/Manager/ManagerDashboard";
import ManagerMonitor from "../pages/Manager/ManagerMonitor";
import ManageGenres from "../pages/Manager/ManageGenres";
import ManageMovies from "../pages/Manager/ManageMovies";
import ManageShowtimes from "../pages/Manager/ManageShowtimes";
import ManageLocations from "../pages/Manager/ManageLocations";
import ManageProducts from "../pages/Manager/ManageProducts";
import ManagePromotions from "../pages/Manager/ManagePromotions";
import ManageStaffs from "../pages/Manager/ManageStaffs";

// import CheckIn from "../pages/staff/CheckIn";

const AppRoutes = () => {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="" element={<Home />} />
                <Route path="profile" element={<Profile />} />
                <Route path="movies" element={<Movies />} />
                <Route path="movies/:slug" element={<MovieDetails />} />
                <Route path="help/order" element={<HelperBooking />} />
                <Route path="help/faq" element={<HelperFAQ />} />
                <Route path="help/terms-of-service" element={<HelperTermsOfService />} />
                <Route path="help/privacy-policy" element={<HelperPrivacyPolicy />} />
                <Route path="order" element={<Booking />} />
                <Route path="order/payos/result" element={<PayOSResult />} />
                <Route path="order/payos/cancel" element={<PayOSResult />} />

                <Route element={<ProtectedRoutes roles={["CUSTOMER"]} />}>
                    <Route path="bookings" element={<MyBookings />} />
                    <Route path="bookings/:bookingCode" element={<BookingDetails />} />
                </Route>

                <Route element={<ProtectedRoutes roles={["STAFF", "MANAGER"]} />}>
                    {/* <Route path="staff/checkin" element={<CheckIn />} /> */}
                </Route>

                <Route element={<ProtectedRoutes roles={["MANAGER"]} />}>
                    <Route path="manage" element={<ManagerDashboard />}>
                        <Route index element={<ManagerMonitor />} />
                        <Route path="genres" element={<ManageGenres />} />
                        <Route path="movies" element={<ManageMovies />} />
                        <Route path="showtimes" element={<ManageShowtimes />} />
                        <Route path="locations" element={<ManageLocations />} />
                        <Route path="products" element={<ManageProducts />} />
                        <Route path="promotions" element={<ManagePromotions />} />
                        <Route path="staffs" element={<ManageStaffs />} />
                    </Route>
                </Route>

                <Route path="403" element={<Forbidden />} />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    );
}

export default AppRoutes;