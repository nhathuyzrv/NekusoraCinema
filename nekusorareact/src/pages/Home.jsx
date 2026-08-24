import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMovies } from "../hooks/useMovies";
import { ChevronLeft, ChevronRight, ArrowRight, Gift, Film, Users, Moon, Ticket } from "lucide-react";
import { MovieCardHome, ComingSoonCard, MovieCardSkeleton } from "../components/MovieComponents";


const SCREEN_TYPES = [
    { id: 1, name: "Phòng chiếu Tiêu chuẩn", desc: "Màn hình lớn, âm thanh vòm, ghế ngồi rộng rãi cho suất chiếu hàng ngày.", Icon: Film },
    { id: 2, name: "Phòng chiếu Đôi", desc: "Ghế sofa đôi liền khối, phù hợp cho cặp đôi hoặc nhóm bạn thân.", Icon: Users },
    { id: 3, name: "SkyBox", desc: "Phòng chiếu cao cấp, trần kính mô phỏng bầu trời đêm, âm thanh Dolby Atmos.", Icon: Moon },
];

const PROMOS = [
    { id: 1, title: "Thành viên mới", desc: "Giảm 20% cho vé đầu tiên khi đăng ký tài khoản.", tag: "Đến 30/09" },
    { id: 2, title: "Vé đôi thứ Tư", desc: "Mua 1 tặng 1 cho suất chiếu trước 18:00 vào thứ Tư hàng tuần.", tag: "Áp dụng mỗi tuần" },
    { id: 3, title: "Combo bắp nước", desc: "Giảm 15% khi mua combo bắp rang và nước cùng vé.", tag: "Không giới hạn" },
];

const HERO_STARS = Array.from({ length: 36 }).map((_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: 1 + Math.random() * 2,
    delay: Math.random() * 3,
}));

const HOME_MOVIE_LIMIT = 4;

function useInView() {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.unobserve(el);
                }
            },
            { threshold: 0.15 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return [ref, visible];
}

function SectionHeading({ eyebrow, title, to }) {
    return (
        <div className="flex items-end justify-between mb-6">
            <div>
                {eyebrow && (
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">{eyebrow}</p>
                )}
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-base-content">{title}</h2>
            </div>
            {to && (
                <Link to={to} className="btn btn-ghost btn-sm gap-1 shrink-0">
                    Xem tất cả
                    <ArrowRight size={16} />
                </Link>
            )}
        </div>
    );
}

const Home = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [activeSlide, setActiveSlide] = useState(0);
    const [paused, setPaused] = useState(false);

    const {
        data: nowShowingData,
        isPending: nowShowingPending,
    } = useMovies({ status: "NOW_SHOWING" });

    const {
        data: comingSoonData,
        isPending: comingSoonPending,
    } = useMovies({ status: "COMING_SOON" });

    const nowShowing = (nowShowingData ?? []).slice(0, HOME_MOVIE_LIMIT);
    const comingSoon = (comingSoonData ?? []).slice(0, HOME_MOVIE_LIMIT);

    const heroSlides = useMemo(() => {
        if (!nowShowingData?.length) return [];
        return nowShowingData.slice(0, 4).map((m) => ({
            id: m.id,
            title: m.title,
            genre: m.genres?.map((g) => g.name).join(" • ") ?? "",
            note: m.description ?? "",
            image: m.backdrop ?? m.poster ?? "",
            slug: m.slug,
        }));
    }, [nowShowingData]);

    useEffect(() => {
        if (paused || !heroSlides.length) return;
        const t = setInterval(() => {
            setActiveSlide((i) => (i + 1) % heroSlides.length);
        }, 6000);
        return () => clearInterval(t);
    }, [paused, heroSlides.length]);

    const clampedSlide = heroSlides.length ? activeSlide % heroSlides.length : 0;
    const currentSlide = heroSlides[clampedSlide];

    const [nowShowingRef, nowShowingVisible] = useInView();
    const [comingSoonRef, comingSoonVisible] = useInView();
    const [screensRef, screensVisible] = useInView();
    const [promosRef, promosVisible] = useInView();
    const [ctaRef, ctaVisible] = useInView();

    return (
        <div className="pb-16">
            <section
                className="relative w-full h-120 sm:h-140 lg:h-160 overflow-hidden bg-neutral"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
            >
                {HERO_STARS.map((s) => (
                    <span
                        key={s.id}
                        className="hero-star"
                        style={{
                            top: `${s.top}%`,
                            left: `${s.left}%`,
                            width: `${s.size}px`,
                            height: `${s.size}px`,
                            animationDelay: `${s.delay}s`,
                        }}
                    />
                ))}
                <span className="hero-shooting-star" style={{ top: "10%", left: "70%", animationDelay: "0s" }} />
                <span className="hero-shooting-star" style={{ top: "25%", left: "90%", animationDelay: "3.5s" }} />

                {heroSlides.length === 0 ? (
                    <div className="w-full h-full animate-pulse bg-base-300" />
                ) : (
                    heroSlides.map((slide, i) => (
                        <div key={slide.id} className={`banner-slide ${i === activeSlide ? "is-active" : ""}`}>
                            {slide.image && (
                                <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-linear-to-t from-neutral via-neutral/50 to-neutral/20" />
                            <div className="absolute inset-0 bg-linear-to-r from-neutral/80 via-neutral/20 to-transparent" />
                        </div>
                    ))
                )}

                {currentSlide && (
                    <div className="absolute inset-0 flex items-center">
                        <div className="max-w-7xl mx-auto px-4 lg:px-8 w-full">
                            <div className="max-w-xl">
                                <p key={`eyebrow-${activeSlide}`} className="hero-fade-up text-xs font-semibold uppercase tracking-widest text-secondary mb-3">
                                    {currentSlide.genre}
                                </p>
                                <h1 key={`title-${activeSlide}`} className="hero-fade-up delay-100 text-3xl sm:text-4xl lg:text-5xl font-bold text-[#f4e4dc] leading-tight mb-3">
                                    {currentSlide.title}
                                </h1>
                                {currentSlide.note && (
                                    <p key={`note-${activeSlide}`} className="hero-fade-up delay-200 text-sm sm:text-base text-[#f4e4dc]/80 mb-6 line-clamp-2">
                                        {currentSlide.note}
                                    </p>
                                )}
                                <div className="hero-fade-up delay-300 flex flex-wrap gap-3">
                                    <button
                                        onClick={() => navigate(`/movies/${currentSlide.slug}`)}
                                        className="btn btn-secondary gap-2"
                                    >
                                        <Ticket size={18} />
                                        Đặt vé ngay
                                    </button>
                                    <a href="#now-showing" className="btn btn-outline border-[#f4e4dc] border-2 text-[#f4e4dc] hover:bg-[#f4e4dc] hover:text-neutral gap-2">
                                        Xem lịch chiếu
                                        <ArrowRight size={18} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {heroSlides.length > 1 && (
                    <>
                        <button
                            onClick={() => setActiveSlide((i) => (i - 1 + heroSlides.length) % heroSlides.length)}
                            className="btn btn-circle btn-ghost text-[#f4e4dc] absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 hidden sm:flex"
                            aria-label="Slide trước"
                        >
                            <ChevronLeft size={42} />
                        </button>
                        <button
                            onClick={() => setActiveSlide((i) => (i + 1) % heroSlides.length)}
                            className="btn btn-circle btn-ghost text-[#f4e4dc] absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 hidden sm:flex"
                            aria-label="Slide tiếp theo"
                        >
                            <ChevronRight size={42} />
                        </button>
                    </>
                )}

                {heroSlides.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                        {heroSlides.map((slide, i) => (
                            <button
                                key={slide.id}
                                onClick={() => setActiveSlide(i)}
                                aria-label={`Chuyển đến slide ${i + 1}`}
                                className="relative h-1.5 rounded-full overflow-hidden transition-all bg-base-100/50"
                                style={{ width: i === activeSlide ? "2rem" : "0.75rem" }}
                            >
                                {i === activeSlide && !paused && (
                                    <span className="absolute inset-0 origin-left banner-dot-progress bg-secondary rounded-full" />
                                )}
                                {i === activeSlide && paused && (
                                    <span className="absolute inset-0 bg-secondary rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                )}

                <div className="film-perf absolute top-0 left-0 right-0" />
                <div className="film-perf absolute bottom-0 left-0 right-0" />
            </section>

            <div className="relative -mt-12 sm:-mt-16 z-10 px-4">
                <div className="max-w-6xl mx-auto bg-base-100 rounded-box shadow-xl border border-base-300 p-4 sm:p-6">
                    <Link className="btn btn-primary w-full my-2" to="/order">
                        Đặt vé ngay
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 lg:px-8">
                <section
                    id="now-showing"
                    ref={nowShowingRef}
                    className={`section-reveal pt-20 ${nowShowingVisible ? "is-visible" : ""}`}
                >
                    <SectionHeading eyebrow="Lịch chiếu" title="Phim đang chiếu" to="/movies" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {nowShowingPending
                            ? Array.from({ length: HOME_MOVIE_LIMIT }).map((_, i) => (
                                <MovieCardSkeleton key={i} />
                            ))
                            : nowShowing.length === 0
                                ? <p className="col-span-4 text-center py-10 text-base-content/50">Chưa có phim đang chiếu</p>
                                : nowShowing.map((m) => <MovieCardHome key={m.id} movie={m} />)
                        }
                    </div>
                </section>

                <section
                    ref={comingSoonRef}
                    className={`section-reveal pt-16 ${comingSoonVisible ? "is-visible" : ""}`}
                >
                    <SectionHeading eyebrow="Sắp ra mắt" title="Phim sắp chiếu" to="/movies" />
                    <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
                        {comingSoonPending
                            ? Array.from({ length: HOME_MOVIE_LIMIT }).map((_, i) => (
                                <div key={i} className="shrink-0 w-37.5 sm:w-47.5">
                                    <MovieCardSkeleton />
                                </div>
                            ))
                            : comingSoon.length === 0
                                ? <p className="text-base-content/50 py-10">Chưa có phim sắp chiếu</p>
                                : comingSoon.map((m) => <ComingSoonCard key={m.id} movie={m} />)
                        }
                    </div>
                </section>

                <section
                    ref={screensRef}
                    className={`section-reveal pt-16 ${screensVisible ? "is-visible" : ""}`}
                >
                    <SectionHeading eyebrow="Không gian" title="Phòng chiếu" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        {SCREEN_TYPES.map(({ id, name, desc, Icon }) => (
                            <div key={id} className="card bg-base-200 border border-base-300">
                                <div className="card-body">
                                    <div className="w-10 h-10 rounded-field bg-primary text-primary-content flex items-center justify-center mb-2">
                                        <Icon size={20} />
                                    </div>
                                    <h3 className="font-display font-semibold text-base-content">{name}</h3>
                                    <p className="text-sm text-base-content/60">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section
                    ref={promosRef}
                    className={`section-reveal pt-16 ${promosVisible ? "is-visible" : ""}`}
                >
                    <SectionHeading eyebrow="Ưu đãi" title="Khuyến mãi hiện có" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        {PROMOS.map((p) => (
                            <div key={p.id} className="card bg-base-200 border border-base-300">
                                <div className="card-body">
                                    <div className="w-10 h-10 rounded-field bg-secondary text-secondary-content flex items-center justify-center mb-2">
                                        <Gift size={20} />
                                    </div>
                                    <h3 className="font-display font-semibold text-base-content">{p.title}</h3>
                                    <p className="text-sm text-base-content/60 mb-2">{p.desc}</p>
                                    <span className="badge badge-outline badge-sm w-fit">{p.tag}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {!isAuthenticated && (
                    <section
                        ref={ctaRef}
                        className={`section-reveal pt-16 ${ctaVisible ? "is-visible" : ""}`}
                    >
                        <div className="relative overflow-hidden rounded-box bg-primary text-primary-content px-6 py-10 sm:px-12 sm:py-14 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div>
                                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">Tích điểm mỗi lần đặt vé</h2>
                                <p className="text-primary-content/80 max-w-md">
                                    Đăng ký tài khoản để tích điểm, theo dõi vé đã đặt và nhận ưu đãi dành riêng cho thành viên.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    const modal = document.getElementById("auth_modal");
                                    if (modal) {
                                        modal.dataset.tab = "register";
                                        modal.showModal();
                                    }
                                }}
                                className="btn btn-secondary btn-lg shrink-0"
                            >
                                ĐĂNG KÝ NGAY
                            </button>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default Home;