import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoutes = ({ roles = [] }) => {
    const { isAuthenticated, appLoading, hasRole } = useAuth();
    const location = useLocation();

    if (appLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (roles.length > 0 && !hasRole(...roles)) {
        return <Navigate to="/403" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoutes;