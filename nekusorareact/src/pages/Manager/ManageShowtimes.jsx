import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Search, ChevronDown } from "lucide-react";
import {
    useManageMovies,
    useManageMovieShowtimes,
    useCreateMovieShowtime,
    useUpdateShowtime,
    useDeleteShowtime,
    useManageScreeningFormats,
    useBranches,
    useManageBranchRooms,
} from "../../hooks/useManagement";
import { useToast } from "../../hooks/useToast";
import { formatDate } from "../../utils/DateTime";
import MyAlert from "../../configs/MyAlert";
import Configs from "../../configs/Configs";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton";

const SHOWTIME_STATUS = {
    SCHEDULED: { label: "Đã lên lịch" },
    CANCELLED: { label: "Đã hủy" },
    COMPLETED: { label: "Đã kết thúc" },
};

const ShowtimeFormModal = ({ movieId, movieTitle, showtimeData, onClose }) => {
    const isEdit = !!showtimeData;
    const { data: formats } = useManageScreeningFormats();
    const { data: branches } = useBranches();
    const [selectedBranch, setSelectedBranch] = useState(showtimeData?.room?.branch || "");
    const { data: rooms } = useManageBranchRooms(selectedBranch);

    const { mutate: createShowtime, isPending: createShowtimePending } = useCreateMovieShowtime(movieId);
    const { mutate: updateShowtime, isPending: updateShowtimePending } = useUpdateShowtime();
    const toast = useToast();

    const [form, setForm] = useState({
        room: showtimeData?.room?.id || "",
        screening_format: showtimeData?.screening_format?.id || "",
        show_date: showtimeData?.show_date || "",
        start_time: showtimeData?.start_time || "",
        price: showtimeData?.price || "",
        status: showtimeData?.status || "SCHEDULED",
    });

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const handleSubmit = () => {
        if (!form.room || !form.screening_format || !form.show_date || !form.start_time || !form.price) {
            toast.warning("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        if (isEdit) {
            updateShowtime({ id: showtimeData.id, data: form }, {
                onSuccess: () => {
                    onClose();
                },
            });
        } else {
            createShowtime(form, {
                onSuccess: () => {
                    onClose();
                },
            });
        }
    };

    const isPending = createShowtimePending || updateShowtimePending;
    const roomList = rooms?.results || rooms || [];
    const formatList = formats?.results || formats || [];

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-lg w-full">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" onClick={onClose}><X size={16} /></button>
                <h3 className="font-bold text-lg mb-1">{isEdit ? "Sửa suất chiếu" : "Thêm suất chiếu"}</h3>
                <p className="text-sm text-base-content/60 mb-4">Phim: <span className="font-semibold text-base-content">{movieTitle}</span></p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <label className="label label-text font-medium">Chi nhánh <span className="text-error">*</span></label>
                        <select className="select select-bordered w-full"
                            value={selectedBranch}
                            onChange={(e) => { setSelectedBranch(e.target.value); set("room", ""); }}>
                            <option value="">Chọn chi nhánh...</option>
                            {(branches?.results || branches || []).map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:col-span-2">
                        <label className="label label-text font-medium">Phòng chiếu <span className="text-error">*</span></label>
                        <select className="select select-bordered w-full" value={form.room} onChange={(e) => set("room", e.target.value)} disabled={!selectedBranch}>
                            <option value="">Chọn phòng chiếu...</option>
                            {roomList.map((r) => (
                                <option key={r.id} value={r.id}>{r.name} ({r.total_rows * r.seats_per_row} ghế)</option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:col-span-2">
                        <label className="label label-text font-medium">Loại hình chiếu <span className="text-error">*</span></label>
                        <select className="select select-bordered w-full" value={form.screening_format} onChange={(e) => set("screening_format", e.target.value)}>
                            <option value="">Chọn loại hình chiếu...</option>
                            {formatList.map((f) => (
                                <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="label label-text font-medium">Ngày chiếu <span className="text-error">*</span></label>
                        <input type="date" className="input input-bordered w-full" value={form.show_date} onChange={(e) => set("show_date", e.target.value)} />
                    </div>

                    <div>
                        <label className="label label-text font-medium">Giờ bắt đầu <span className="text-error">*</span></label>
                        <input type="time" className="input input-bordered w-full" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} />
                    </div>

                    <div>
                        <label className="label label-text font-medium">Giá vé (đ) <span className="text-error">*</span></label>
                        <input type="number" className="input input-bordered w-full" value={form.price} onChange={(e) => set("price", e.target.value)} min={0} placeholder="85000" />
                    </div>

                    {isEdit && (
                        <div>
                            <label className="label label-text font-medium">Trạng thái</label>
                            <select className="select select-bordered w-full" value={form.status} onChange={(e) => set("status", e.target.value)}>
                                {Object.keys(SHOWTIME_STATUS).map((s) => (
                                    <option key={s} value={s}>{SHOWTIME_STATUS[s].label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="modal-action mt-6">
                    <button className="btn btn-ghost" onClick={onClose}>Hủy</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={isPending}>
                        {isPending ? <Loader2 size={16} className="animate-spin" /> : (isEdit ? "Lưu thay đổi" : "Thêm suất chiếu")}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose} />
        </dialog>
    );
};

const MovieShowtimesPanel = ({ movie }) => {
    const { hasStaffPosition } = useAuth();
    const [dateFilter, setDateFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [branchFilter, setBranchFilter] = useState("");
    const [availableBranches, setAvailableBranches] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editShowtime, setEditShowtime] = useState(null);
    const { mutate: deleteShowtime } = useDeleteShowtime();

    const { data: showtimes, isPending } = useManageMovieShowtimes(movie.id, {
        date: dateFilter,
        status: statusFilter,
        branch: branchFilter,
    });

    const list = showtimes?.results || showtimes || [];

    useEffect(() => {
        if (availableBranches.length === 0 && list.length > 0) {
            const branches = [...new Map(
                list.map((s) => [s.branch.id, s.branch])
            ).values()];
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAvailableBranches(branches);
        }
    }, [list]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDelete = async (st) => {
        MyAlert.alert("Xác nhận xóa suất chiếu",
            `Bạn có chắc chắn muốn xóa suất chiếu ${st.start_time} ngày ${st.show_date}?
            Sau khi xác nhận sẽ không thể hoàn tác`,
            [
                { text: "Hủy", style: "ghost" },
                {
                    text: "Xác nhận", style: "primary", onClick: () => deleteShowtime(st.id)
                }
            ])
    };

    return (
        <div className="card bg-base-100 border border-base-200 mt-2">
            <div className="card-body p-0">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 pb-3 border-b border-base-200 bg-base-200/40">
                    <div>
                        <p className="text-xs text-base-content/50 uppercase tracking-wide font-semibold">Suất chiếu</p>
                        <p className="font-bold text-sm">{movie.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasStaffPosition(Configs.STAFF_POSITIONS.SYSTEM_MANAGER) &&
                            <button className="btn btn-primary btn-xs gap-1" onClick={() => { setEditShowtime(null); setShowForm(true); }}>
                                <Plus size={13} />
                            </button>
                        }
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-base-200">
                    {availableBranches.length > 1 && (
                        <select
                            className="select select-xs sm:select-sm select-bordered not-sm:w-full"
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                        >
                            <option value="">Tất cả chi nhánh</option>
                            {availableBranches.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    )}
                    <input type="date" className="input input-sm input-bordered not-sm:w-full" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                    <select className="select select-xs sm:select-sm select-bordered not-sm:w-full" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">Tất cả trạng thái suất chiếu</option>
                        {Object.entries(SHOWTIME_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    {(dateFilter || statusFilter || branchFilter) && (
                        <div className="self-center not-sm:w-full not-sm:flex not-sm:justify-end">
                            <button className="btn btn-ghost btn-xs" onClick={() => { setDateFilter(""); setStatusFilter(""); setBranchFilter(""); }}>Xóa bộ lọc</button>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="table table-xs w-full">
                        <thead>
                            <tr className="border-b border-base-200">
                                <th className="py-2 px-4 text-xs font-semibold text-base-content/50">Ngày</th>
                                <th className="py-2 px-4 text-xs font-semibold text-base-content/50">Giờ</th>
                                <th className="py-2 px-4 text-xs font-semibold text-base-content/50 hidden sm:table-cell">Phòng</th>
                                <th className="py-2 px-4 text-xs font-semibold text-base-content/50 hidden md:table-cell">Loại hình</th>
                                <th className="py-2 px-4 text-xs font-semibold text-base-content/50">Giá ghế</th>
                                <th className="py-2 px-4 text-xs font-semibold text-base-content/50">Trạng thái</th>
                                {hasStaffPosition(Configs.STAFF_POSITIONS.SYSTEM_MANAGER) &&
                                    <th className="py-2 px-4 w-20"></th>
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {isPending ? (
                                <tr><td colSpan={7} className="py-6 text-center"><Loader2 className="animate-spin mx-auto" size={18} /></td></tr>
                            ) : list.length === 0 ? (
                                <tr><td colSpan={7} className="py-6 text-center text-base-content/40 text-xs">Không có suất chiếu</td></tr>
                            ) : list.map((st) => (
                                <tr key={st.id} className="hover:bg-base-200/50">
                                    <td className="py-2 px-4 text-sm">{formatDate(st.show_date)}</td>
                                    <td className="py-2 px-4 text-sm font-mono">{st.start_time?.slice(0, 5)} - {st.end_time?.slice(0, 5)}</td>
                                    <td className="py-2 px-4 text-sm hidden sm:table-cell">{st.room?.name}</td>
                                    <td className="py-2 px-4 text-sm hidden md:table-cell">{st.screening_format?.code}</td>
                                    <td className="py-2 px-4 text-sm">{Number(st.price).toLocaleString("vi-VN")}đ</td>
                                    <td className="py-2 px-4">
                                        <span>{SHOWTIME_STATUS[st.status]?.label}</span>
                                    </td>
                                    {hasStaffPosition(Configs.STAFF_POSITIONS.SYSTEM_MANAGER) &&
                                        <td className="py-2 px-4">
                                            <div className="flex gap-1">
                                                <button className="btn btn-ghost btn-xs" onClick={() => { setEditShowtime(st); setShowForm(true); }}>
                                                    <Pencil size={12} />
                                                </button>
                                                {st.status === "SCHEDULED" && (
                                                    <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(st)}>
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    }
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showForm && (
                <ShowtimeFormModal
                    movieId={movie.id}
                    movieTitle={movie.title}
                    showtimeData={editShowtime}
                    onClose={() => { setShowForm(false); setEditShowtime(null); }}
                />
            )}
        </div>
    );
};

const ManageShowtimes = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [expandedMovie, setExpandedMovie] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data: movies, isPending } = useManageMovies({ search, status: statusFilter });
    const list = movies?.results || movies || [];

    return (
        <>
            <BackButton label={"Quản lý"} onClick={() => navigate("/manage/")} />

            <div className="card bg-base-100 border border-base-200">
                <div className="card-body p-0">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-base-200">
                        <h2 className="text-lg font-bold">Quản Lý Suất Chiếu</h2>
                    </div>

                    <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-base-200">
                        <label className="input input-sm input-bordered flex items-center gap-2 flex-1 min-w-48">
                            <Search size={14} className="text-base-content/40" />
                            <input placeholder="Tìm theo tên phim..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="grow" />
                            {search && <button onClick={() => setSearchInput("")}><X size={12} /></button>}
                        </label>
                        <select className="select select-sm select-bordered not-sm:w-full" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">Tất cả trạng thái phim</option>
                            <option value="COMING_SOON">Sắp chiếu</option>
                            <option value="NOW_SHOWING">Đang chiếu</option>
                            <option value="ENDED">Ngừng chiếu</option>
                        </select>
                    </div>

                    <div className="divide-y divide-base-200">
                        {isPending ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
                        ) : list.length === 0 ? (
                            <div className="text-center py-10 text-base-content/40">
                                Không có phim nào
                            </div>
                        ) : list.map((movie) => (
                            <div key={movie.id} className="px-5 py-3">
                                <button
                                    className="w-full flex items-center justify-between gap-3 hover:text-primary transition-colors"
                                    onClick={() => setExpandedMovie(expandedMovie === movie.id ? null : movie.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        {movie.poster
                                            ? <img src={movie.poster} alt={movie.title} className="w-9 h-12 object-cover rounded shrink-0" />
                                            : <div className="w-9 h-12 bg-base-300 rounded shrink-0" />
                                        }
                                        <div className="text-left">
                                            <p className="font-semibold text-sm">{movie.title}</p>
                                            <p className="text-xs text-base-content/50">{movie.age_rating} · {movie.status}</p>
                                        </div>
                                    </div>
                                    <ChevronDown size={16} className={`shrink-0 transition-transform ${expandedMovie === movie.id ? "rotate-180" : ""}`} />
                                </button>

                                {expandedMovie === movie.id && (
                                    <MovieShowtimesPanel movie={movie} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ManageShowtimes;