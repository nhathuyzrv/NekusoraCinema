import { useEffect, useState } from "react";
import { Plus, Pencil, Search, X, Loader2, Film } from "lucide-react";
import {
    useManageMovies,
    useManageMovieDetail,
    useCreateMovie,
    useUpdateMovie,
    useManageGenres,
} from "../../hooks/useManagement";
import { useToast } from "../../hooks/useToast";
import { formatDate } from "../../utils/DateTime";
import Configs from "../../configs/Configs";
import { useAuth } from "../../hooks/useAuth";

const STATUS_LABELS = {
    COMING_SOON: { label: "Sắp chiếu" },
    NOW_SHOWING: { label: "Đang chiếu" },
    ENDED: { label: "Ngừng chiếu" },
};

const AGE_RATINGS = ["P", "K", "T13", "T16", "T18"];
const MOVIE_STATUS = ["COMING_SOON", "NOW_SHOWING", "ENDED"];

const INIT_FORM = {
    title: "",
    age_rating: "P",
    duration: "",
    release_date: "",
    country: "",
    director: "",
    description: "",
    trailer_url: "",
    status: "COMING_SOON",
    poster: null,
    genre_ids: [],
    actors: [],
};

const MovieFormModal = ({ movieId, onClose }) => {
    const isEdit = !!movieId;
    const { data: detail, isPending: loadingDetail } = useManageMovieDetail(movieId);
    const { data: genres } = useManageGenres();
    const { mutate: createMovie, isPending: createMoviePending } = useCreateMovie();
    const { mutate: updateMovie, isPending: updateMoviePending } = useUpdateMovie();
    const toast = useToast();

    const [form, setForm] = useState(INIT_FORM);
    const [posterPreview, setPosterPreview] = useState(null);
    const [initialized, setInitialized] = useState(false);

    if (isEdit && detail && !initialized) {
        setForm({
            title: detail.title || "",
            age_rating: detail.age_rating || "P",
            duration: detail.duration || "",
            release_date: detail.release_date || "",
            country: detail.country || "",
            director: detail.director || "",
            description: detail.description || "",
            trailer_url: detail.trailer_url || "",
            status: detail.status || "COMING_SOON",
            poster: null,
            genre_ids: (detail.genres || []).map((g) => g.id),
            actors: (detail.actors || []).map((a) => a.name).join(", "),
        });
        setPosterPreview(detail.poster || null);
        setInitialized(true);
    }

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const toggleGenre = (id) => {
        set("genre_ids", form.genre_ids.includes(id)
            ? form.genre_ids.filter((g) => g !== id)
            : [...form.genre_ids, id]);
    };

    const handlePoster = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        set("poster", file);
        setPosterPreview(URL.createObjectURL(file));
    };

    const buildFormData = () => {
        const fd = new FormData();
        const fields = ["title", "age_rating", "duration", "release_date", "country", "director", "description", "trailer_url", "status"];
        fields.forEach((k) => { if (form[k] !== "") fd.append(k, form[k]); });
        if (form.poster) fd.append("poster", form.poster);
        form.genre_ids.forEach((id) => fd.append("genres", id));
        if (form.actors) {
            form.actors.split(",").map((s) => s.trim()).filter(Boolean).forEach((name) => fd.append("actor_names", name));
        }
        return fd;
    };

    const handleSubmit = () => {
        if (!form.title.trim() || !form.duration || !form.release_date || !form.country.trim() || !form.director.trim()) {
            toast.warning("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        const fd = buildFormData();
        if (isEdit) {
            updateMovie({ id: movieId, data: fd }, {
                onSuccess: () => {
                    onClose();
                },
            });

        } else {
            createMovie(fd, {
                onSuccess: () => {
                    onClose();
                },
            });
        }
    };

    const isPending = createMoviePending || updateMoviePending;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" onClick={onClose}><X size={16} /></button>
                <h3 className="font-bold text-lg mb-4">{isEdit ? "Chỉnh sửa phim" : "Thêm phim mới"}</h3>

                {isEdit && loadingDetail ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="label label-text font-medium">Tên phim <span className="text-error">*</span></label>
                            <input className="input input-bordered w-full" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Nhập tên phim..." />
                        </div>

                        <div>
                            <label className="label label-text font-medium">Độ tuổi <span className="text-error">*</span></label>
                            <select className="select select-bordered w-full" value={form.age_rating} onChange={(e) => set("age_rating", e.target.value)}>
                                {AGE_RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="label label-text font-medium">Trạng thái</label>
                            <select className="select select-bordered w-full" value={form.status} onChange={(e) => set("status", e.target.value)}>
                                {MOVIE_STATUS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]?.label}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="label label-text font-medium">Thời lượng (phút) <span className="text-error">*</span></label>
                            <input type="number" className="input input-bordered w-full" value={form.duration} onChange={(e) => set("duration", e.target.value)} min={1} />
                        </div>

                        <div>
                            <label className="label label-text font-medium">Ngày ra mắt <span className="text-error">*</span></label>
                            <input type="date" className="input input-bordered w-full" value={form.release_date} onChange={(e) => set("release_date", e.target.value)} />
                        </div>

                        <div>
                            <label className="label label-text font-medium">Quốc gia <span className="text-error">*</span></label>
                            <input className="input input-bordered w-full" value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="Việt Nam..." />
                        </div>

                        <div>
                            <label className="label label-text font-medium">Đạo diễn <span className="text-error">*</span></label>
                            <input className="input input-bordered w-full" value={form.director} onChange={(e) => set("director", e.target.value)} placeholder="Tên đạo diễn..." />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="label label-text font-medium">Diễn viên (cách nhau bởi dấu phẩy)</label>
                            <input className="input input-bordered w-full" value={form.actors} onChange={(e) => set("actors", e.target.value)} placeholder="Diễn viên A, Diễn viên B..." />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="label label-text font-medium">Trailer URL</label>
                            <input className="input input-bordered w-full" value={form.trailer_url} onChange={(e) => set("trailer_url", e.target.value)} placeholder="https://youtube.com/..." />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="label label-text font-medium">Mô tả</label>
                            <textarea className="textarea textarea-bordered w-full h-24" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Nội dung phim..." />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="label label-text font-medium">Thể loại</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {(genres?.results || genres || []).map((g) => (
                                    <button key={g.id} type="button"
                                        className={`badge badge-md cursor-pointer border transition-colors ${form.genre_ids.includes(g.id) ? "badge-primary" : "badge-ghost"}`}
                                        onClick={() => toggleGenre(g.id)}>
                                        {g.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="label label-text font-medium">Poster</label>
                            <div className="flex items-start gap-4">
                                {posterPreview && (
                                    <img src={posterPreview} alt="poster" className="w-24 h-36 object-cover rounded-lg border border-base-300" />
                                )}
                                <input type="file" accept="image/*" className="file-input file-input-bordered flex-1" onChange={handlePoster} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="modal-action mt-6">
                    <button className="btn btn-ghost" onClick={onClose}>Hủy</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={isPending}>
                        {isPending ? <Loader2 size={16} className="animate-spin" /> : (isEdit ? "Lưu thay đổi" : "Thêm phim")}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose} />
        </dialog>
    );
};

const ManageMovies = () => {
    const { hasStaffPosition } = useAuth();
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [modalId, setModalId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data: movies, isPending } = useManageMovies({ search, status: statusFilter });

    const openCreate = () => { setModalId(null); setShowModal(true); };
    const openEdit = (id) => { setModalId(id); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setModalId(null); };

    const list = movies?.results || movies || [];

    return (
        <div className="card bg-base-100 border border-base-200">
            <div className="card-body p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-base-200">
                    <h2 className="text-lg font-bold">Quản Lý Phim</h2>
                    {hasStaffPosition(Configs.STAFF_POSITIONS.SYSTEM_MANAGER) &&
                        <button className="btn btn-primary btn-sm gap-1" onClick={openCreate}>
                            <Plus size={16} />
                        </button>
                    }
                </div>

                <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-base-200">
                    <label className="input input-sm input-bordered flex items-center gap-2 flex-1 min-w-48">
                        <Search size={14} className="text-base-content/40" />
                        <input placeholder="Tìm theo tên phim..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="grow" />
                        {search && <button onClick={() => setSearchInput("")}><X size={12} /></button>}
                    </label>
                    <select className="select select-sm select-bordered not-sm:w-full" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">Tất cả trạng thái</option>
                        {MOVIE_STATUS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]?.label}</option>)}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr className="border-b border-base-200">
                                <th className="py-3 px-4 text-xs text-base-content/50 font-semibold w-14">Poster</th>
                                <th className="py-3 px-4 text-xs text-base-content/50 font-semibold">Tên phim</th>
                                <th className="py-3 px-4 text-xs text-base-content/50 font-semibold hidden sm:table-cell">Độ tuổi</th>
                                <th className="py-3 px-4 text-xs text-base-content/50 font-semibold hidden md:table-cell">Ra mắt</th>
                                <th className="py-3 px-4 text-xs text-base-content/50 font-semibold">Trạng thái</th>
                                {hasStaffPosition(Configs.STAFF_POSITIONS.SYSTEM_MANAGER) &&
                                    <th className="py-3 px-4 w-20"></th>
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {isPending ? (
                                <tr><td colSpan={6} className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></td></tr>
                            ) : list.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-10 text-base-content/40">
                                    Không có phim nào
                                </td></tr>
                            ) : list.map((m) => (
                                <tr key={m.id} className="hover:bg-base-200/50">
                                    <td className="py-2 px-4">
                                        {m.poster
                                            ? <img src={m.poster} alt={m.title} className="w-10 h-14 object-cover rounded" />
                                            : <div className="w-10 h-14 bg-base-300 rounded flex items-center justify-center"><Film size={16} className="opacity-30" /></div>
                                        }
                                    </td>
                                    <td className="py-3 px-4">
                                        <p className="font-semibold text-sm">{m.title}</p>
                                        <p className="text-xs text-base-content/50 hidden sm:block">{m.slug}</p>
                                    </td>
                                    <td className="py-3 px-4 hidden sm:table-cell">
                                        <span className="badge badge-outline badge-sm">{m.age_rating}</span>
                                    </td>
                                    <td className="py-3 px-4 text-sm hidden md:table-cell">{formatDate(m.release_date)}</td>
                                    <td className="py-3 px-4">
                                        <span>{STATUS_LABELS[m.status]?.label}</span>
                                    </td>
                                    {hasStaffPosition(Configs.STAFF_POSITIONS.SYSTEM_MANAGER) &&
                                        <td className="py-3 px-4">
                                            <button className="btn btn-ghost btn-xs" onClick={() => openEdit(m.id)}>
                                                <Pencil size={13} />
                                            </button>
                                        </td>
                                    }
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && <MovieFormModal movieId={modalId} onClose={closeModal} />}
        </div>
    );
};

export default ManageMovies;