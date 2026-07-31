import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "../components/ThemeToggle";
import MyAlert from "../configs/MyAlert";


const NAV_LINKS = [
    { to: "/", label: "Trang chủ", end: true },
    { to: "/movies", label: "Phim" },
    { to: "/booking", label: "Đặt vé" },
];

const navLinkClass = ({ isActive }) => `btn btn-ghost btn-md rounded-field font-medium transition-colors ${isActive ? "text-primary font-semibold" : ""}`;

const DefaultAvatar = ({ name = "U" }) => (
    <div className="avatar avatar-placeholder">
        <div className="bg-primary text-primary-content w-8 rounded-full">
            <span className="text-sm font-semibold">{name[0].toUpperCase()}</span>
        </div>
    </div>
);

const Header = () => {
    const { user, isAuthenticated, logout, hasRole } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await MyAlert.alert('Thông báo', 'Bạn có chắc chắn muốn đăng xuất?', [
            { text: 'Hủy', style: 'ghost' },
            { text: 'Đăng xuất', style: 'primary', onPress: async () => await logout() }
        ])
        navigate("/");
    };

    const openAuthModal = (tab = "login") => {
        const modal = document.getElementById("auth_modal");
        if (modal) {
            modal.dataset.tab = tab;
            modal.showModal();
        }
    };

    return (
        <header className="navbar bg-base-100 shadow-sm sticky top-0 z-50 px-4 lg:px-8">

            <div className="navbar-start gap-2">

                <div className="dropdown lg:hidden">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle" aria-label="Menu">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </div>
                    <ul tabIndex={-1} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
                        {NAV_LINKS.map(({ to, label, end }) => (
                            <li key={to}>
                                <NavLink to={to} end={end} className={({ isActive }) => isActive ? "active" : ""}>
                                    {label}
                                </NavLink>
                            </li>
                        ))}
                        {isAuthenticated && hasRole("STAFF", "MANAGER") && (
                            <li><NavLink to="/staff/checkin">Soát vé</NavLink></li>
                        )}
                        {isAuthenticated && hasRole("MANAGER") && (
                            <li><NavLink to="/admin">Quản lý</NavLink></li>
                        )}
                    </ul>
                </div>

                <Link to="/" className="flex items-center gap-2 select-none">
                    <span className="text-lg font-black tracking-tight hidden sm:block">
                        Nekusora<span className="text-primary">Cinema</span>
                    </span>
                </Link>
            </div>

            <nav className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal gap-1 p-0">
                    {NAV_LINKS.map(({ to, label, end }) => (
                        <li key={to}>
                            <NavLink to={to} end={end} className={navLinkClass}>
                                {label}
                            </NavLink>
                        </li>
                    ))}
                    {isAuthenticated && hasRole("STAFF", "MANAGER") && (
                        <li>
                            <NavLink to="/staff/checkin" className={navLinkClass}>Soát vé</NavLink>
                        </li>
                    )}
                    {isAuthenticated && hasRole("MANAGER") && (
                        <li>
                            <NavLink to="/admin" className={navLinkClass}>Quản lý</NavLink>
                        </li>
                    )}
                </ul>
            </nav>

            <div className="navbar-end flex items-center gap-2">

                <ThemeToggle />

                {isAuthenticated && hasRole("CUSTOMER") && (
                    <div className="badge badge-primary badge-outline hidden sm:flex gap-1 bg-primary-content/90">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {user?.loyalty_points ?? 0} pts
                    </div>
                )}

                {!isAuthenticated && (
                    <div className="flex gap-2">
                        <button
                            className="btn btn-ghost btn-sm border-2"
                            onClick={() => openAuthModal("login")}
                        >
                            Đăng nhập
                        </button>
                        <button
                            className="btn btn-secondary btn-sm border-2"
                            onClick={() => openAuthModal("register")}
                        >
                            Đăng ký
                        </button>
                    </div>
                )}

                {isAuthenticated && (
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar" aria-label="Tài khoản">
                            {user?.avatar ? (
                                <div className="w-8 rounded-full">
                                    <img src={user.avatar} alt={user.username} referrerPolicy="no-referrer" />
                                </div>
                            ) : (
                                <DefaultAvatar name={user?.first_name || user?.username} />
                            )}
                        </div>

                        <ul tabIndex={-1} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-56 p-2 shadow-lg border border-base-200">
                            <li className="menu-title px-3 py-2">
                                <div>
                                    <p className="font-semibold text-sm text-base-content">
                                        {user?.first_name
                                            ? `${user.first_name} ${user.last_name ?? ""}`.trim()
                                            : user?.username}
                                    </p>
                                    <p className="text-xs text-base-content/60">{user?.email}</p>
                                </div>
                            </li>
                            <div className="divider my-0" />

                            <li>
                                <Link to="/profile">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    Thông tin cá nhân
                                </Link>
                            </li>

                            {hasRole("CUSTOMER") && (
                                <li>
                                    <Link to="/history">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 00-2 2v4a2 2 0 002 2h8a2 2 0 002-2v-4a2 2 0 00-2-2H6z" clipRule="evenodd" />
                                        </svg>
                                        Lịch sử giao dịch
                                    </Link>
                                </li>
                            )}

                            {hasRole("STAFF", "MANAGER") && (
                                <li>
                                    <Link to="/staff/checkin">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Soát vé
                                    </Link>
                                </li>
                            )}

                            {hasRole("MANAGER") && (
                                <li>
                                    <Link to="/admin">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                        </svg>
                                        Quản lý hệ thống
                                    </Link>
                                </li>
                            )}

                            <div className="divider my-0" />
                            <li>
                                <button onClick={handleLogout} className="text-error">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                                    </svg>
                                    Đăng xuất
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;