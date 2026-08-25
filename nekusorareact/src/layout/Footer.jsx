import { Link } from "react-router-dom";

const NAV_COL = [
    {
        title: "Khám phá",
        links: [
            { label: "Trang chủ", to: "/" },
            { label: "Phim đang chiếu", to: "/movies" },
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
        label: "Github",
        href: "https://github.com/nhathuyzrv",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-github" viewBox="0 0 16 16">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
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
                                    className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-primary not-sm:text-base-content"
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
                    <p>©{year} NekusoraCinema. All rights reserved.</p>
                    <p>Dự án này chỉ được thực hiện cho mục đích học tập và nghiên cứu / This project is developed strictly for educational and research purposes only</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;