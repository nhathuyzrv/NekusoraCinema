import { NavLink } from "react-router-dom";
import { Film, CalendarDays, MapPin, Users, ShoppingBag, Tag, ChevronRight, BookOpen } from "lucide-react";

const MENU_ITEMS = [
    { to: "/manage/movies", label: "Phim", icon: Film },
    { to: "/manage/showtimes", label: "Suất chiếu", icon: CalendarDays },
    { to: "/manage/locations", label: "Chi nhánh & Phòng chiếu", icon: MapPin },
    { to: "/manage/genres", label: "Thể loại phim", icon: BookOpen },
    { to: "/manage/products", label: "Sản phẩm & Combo", icon: ShoppingBag },
    { to: "/manage/promotions", label: "Khuyến mãi", icon: Tag },
    { to: "/manage/staffs", label: "Nhân viên", icon: Users },
];

const ManagerMonitor = () => (
    <div className="flex flex-col w-full gap-4">
        {MENU_ITEMS.filter((m) => !m.end).map(({ to, label, icon: Icon }) => (
            <NavLink
                key={to}
                to={to}
                className="card bg-base-100 border border-base-200 hover:border-primary hover:shadow-md transition-all group not-sm:w-full"
            >
                <div className="card-body p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Icon size={20} className="text-primary" />
                            </div>
                            <span className="font-semibold text-base-content">{label}</span>
                        </div>
                        <ChevronRight size={16} className="text-base-content/40 group-hover:text-primary transition-colors" />
                    </div>
                </div>
            </NavLink>
        ))}
    </div>
);

export default ManagerMonitor;