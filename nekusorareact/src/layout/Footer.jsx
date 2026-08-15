import { Link } from "react-router-dom";

const NAV_COL = [
    {
        title: "Khám phá",
        links: [
            { label: "Trang chủ", to: "/" },
            { label: "Phim đang chiếu", to: "/movies" },
            { label: "Phim sắp chiếu", to: "/movies?status=coming_soon" },
            { label: "Đặt vé", to: "/order" },
        ],
    },
    {
        title: "Hỗ trợ",
        links: [
            { label: "Hướng dẫn đặt vé", to: "/help/order" },
            { label: "Câu hỏi thường gặp", to: "/help/faq" },
            { label: "Điều khoản dịch vụ", to: "/help/terms-of-service" },
            { label: "Chính sách bảo mật", to: "/help/privacy-policy" },
        ],
    },
];

const SOCIALS = [
    {
        label: "Facebook",
        href: "https://facebook.com",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        ),
    },
    {
        label: "YouTube",
        href: "https://youtube.com",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
        ),
    },
    {
        label: "TikTok",
        href: "https://tiktok.com",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z" />
            </svg>
        ),
    },
];

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-base-200 border-t border-base-300 mt-auto">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

                    <div className="sm:col-span-2 lg:col-span-1 space-y-4">
                        <Link to="/" className="flex items-center gap-2 select-none w-fit">
                            <span className="text-lg font-black tracking-tight">
                                Nekusora<span className="text-primary">Cinema</span>
                            </span>
                        </Link>
                        <p className="text-sm text-base-content/60 leading-relaxed sm:max-w-xs">
                            Đặt vé xem phim nhanh chóng, tiện lợi. Trải nghiệm điện ảnh đỉnh cao tại hệ thống rạp chiếu phim hiện đại.
                        </p>

                        <div className="flex gap-2">
                            {SOCIALS.map(({ label, href, icon }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-primary"
                                >
                                    {icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {NAV_COL.map(({ title, links }) => (
                        <div key={title} className="space-y-3">
                            <h6 className="font-semibold text-sm uppercase tracking-wider text-base-content">
                                {title}
                            </h6>
                            <ul className="space-y-2">
                                {links.map(({ label, to }) => (
                                    <li key={to}>
                                        <Link
                                            to={to}
                                            className="text-sm text-base-content/60 hover:text-primary transition-colors"
                                        >
                                            {label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <div className="space-y-3">
                        <h6 className="font-semibold text-sm uppercase tracking-wider text-base-content">
                            Liên hệ
                        </h6>
                        <ul className="space-y-2 text-sm text-base-content/60">
                            <li className="flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                TP.HCM
                            </li>
                            <li className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                                xxxx xxxx
                            </li>
                            <li className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                                support.nekusoracinema@gmail.com
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="border-t border-base-300">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-base-content/50">
                    <p>© {year} NekusoraCinema. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;