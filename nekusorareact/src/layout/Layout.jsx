import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import AuthModal from "../components/AuthModal";
import { useAuth } from "../hooks/useAuth";
import GlobalLoading from "../components/GlobalLoading";
import GlobalAlert from "../components/GlobalAlert";

export default function Layout() {
    const { isAuthenticated, register, login, appLoading } = useAuth();

    return (
        <div className="flex flex-col min-h-screen">
            <GlobalAlert />
            {appLoading && <GlobalLoading />}
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
            {!isAuthenticated && <AuthModal onLogin={login} onRegister={register} />}
        </div>
    );
}