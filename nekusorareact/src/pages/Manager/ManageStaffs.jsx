import { useEffect, useState } from "react";
import { Plus, Pencil, X, Loader2, Search } from "lucide-react";
import {
    useManageStaffs,
    useCreateStaff,
    useUpdateStaff,
    useManageLocations,
    useManageLocationBranches,
    useBranches,
} from "../../hooks/useManagement";
import { useToast } from "../../hooks/useToast";
import { formatDate } from "../../utils/DateTime";
import Configs from "../../configs/Configs";
import { useAuth } from "../../hooks/useAuth";
import MyAlert from "../../configs/MyAlert";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton";

const POSITION_CLS = {
    COUNTER_STAFF: "badge-info",
    CHECKER_STAFF: "badge-success",
    BRANCH_MANAGER: "badge-warning",
    SYSTEM_MANAGER: "badge-error",
};

const EMPTY_FORM = {
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    password: "",
    role: "STAFF",
    position: "COUNTER_STAFF",
    branch: "",
    hire_date: new Date().toISOString().slice(0, 10),
};

const BranchSelector = ({ locationId, value, onChange }) => {
    const { data: detail } = useManageLocationBranches(locationId);
    const branches = detail?.branches || detail || [];

    return (
        <select className="select select-bordered w-full" value={value} onChange={(e) => onChange(e.target.value)} disabled={!locationId}>
            <option value="">Chọn chi nhánh...</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
    );
};

const StaffFormModal = ({ staff, onClose }) => {
    const isEdit = !!staff;
    const { mutate: createStaff, isPending: createStaffPending } = useCreateStaff();
    const { mutate: updateStaff, isPending: updateStaffPending } = useUpdateStaff();
    const { data: locations } = useManageLocations();
    const { user: currentUser } = useAuth();
    const toast = useToast();

    const [selectedLocation, setSelectedLocation] = useState(staff?.branch?.location || "");
    const [form, setForm] = useState(() => {
        if (isEdit) {
            return {
                position: staff.position || "COUNTER_STAFF",
                branch: staff.branch?.id || "",
                hire_date: staff.hire_date || new Date().toISOString().slice(0, 10),
                active: staff.active ?? true,
            };
        }
        return { ...EMPTY_FORM };
    });

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
    const locationList = locations?.results || locations || [];

    const isSelf = isEdit && staff?.user?.email === currentUser?.email;
    const positionChanged = isEdit && form.position !== staff.position;
    const ROLE_AFFECTED_POSITIONS = ["BRANCH_MANAGER", "SYSTEM_MANAGER"];
    const willAffectRole = positionChanged && ROLE_AFFECTED_POSITIONS.includes(form.position);

    const doSubmit = () => {
        if (isEdit) {
            updateStaff({
                id: staff.id,
                data: {
                    position: form.position,
                    branch: form.branch || null,
                    hire_date: form.hire_date,
                    active: form.active,
                },
            }, {
                onSuccess: () => {
                    onClose();
                },
            });
        } else {
            createStaff({
                email: form.email.trim(),
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                phone_number: form.phone_number || undefined,
                password: form.password,
                role: form.position.split('_').pop(),
                staff_profile: {
                    position: form.position,
                    branch: form.branch || null,
                    hire_date: form.hire_date,
                },
            }, {
                onSuccess: () => {
                    onClose();
                },
            });
        }
    };

    const handleSubmit = async () => {
        if (!isEdit && (!form.email?.trim() || !form.password?.trim() || !form.first_name?.trim() || !form.last_name?.trim())) {
            toast.warning("Vui lòng nhập đầy đủ thông tin bắt buộc");
            return;
        }
        if (!form.position) {
            toast.warning("Vui lòng chọn chức danh");
            return;
        }

        if (isSelf && positionChanged && willAffectRole) {
            await MyAlert.alert(
                "Xác nhận thay đổi chức danh",
                `Thay đổi chức danh sang "${Configs.STAFF_POSITION_LABELS[form.position]}" sẽ ảnh hưởng đến vai trò tài khoản của bạn. Bạn có chắc chắn muốn tiếp tục?`,
                [
                    { text: "Hủy", style: "ghost" },
                    { text: "Xác nhận", style: "primary", onClick: doSubmit },
                ]
            );
            return;
        }

        await doSubmit();
    };

    const isPending = createStaffPending || updateStaffPending;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" onClick={onClose}><X size={16} /></button>
                <h3 className="font-bold text-lg mb-4">{isEdit ? "Sửa thông tin nhân viên" : "Tạo tài khoản nhân viên"}</h3>

                <div className="space-y-3">
                    {!isEdit && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label label-text font-medium">Họ <span className="text-error">*</span></label>
                                    <input className="input input-bordered w-full" value={form.last_name} onChange={(e) => set("last_name", e.target.value)} placeholder="Nguyễn" />
                                </div>
                                <div>
                                    <label className="label label-text font-medium">Tên <span className="text-error">*</span></label>
                                    <input className="input input-bordered w-full" value={form.first_name} onChange={(e) => set("first_name", e.target.value)} placeholder="Văn A" />
                                </div>
                            </div>
                            <div>
                                <label className="label label-text font-medium">Email <span className="text-error">*</span></label>
                                <input type="email" className="input input-bordered w-full" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="nhanvien@cinema.vn" />
                            </div>
                            <div>
                                <label className="label label-text font-medium">Số điện thoại</label>
                                <input className="input input-bordered w-full" value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} placeholder="0901234567" />
                            </div>
                            <div>
                                <label className="label label-text font-medium">Mật khẩu <span className="text-error">*</span></label>
                                <input type="password" className="input input-bordered w-full" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Tối thiểu 8 ký tự..." />
                            </div>
                            <div className="divider text-xs text-base-content/50">Thông tin công việc</div>
                        </>
                    )}

                    <div>
                        <label className="label label-text font-medium">Chức danh <span className="text-error">*</span></label>
                        <select className="select select-bordered w-full" value={form.position} onChange={(e) => set("position", e.target.value)}>
                            {Object.entries(Configs.STAFF_POSITION_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="label label-text font-medium">Khu vực</label>
                        <select className="select select-bordered w-full" value={selectedLocation}
                            onChange={(e) => { setSelectedLocation(e.target.value); set("branch", ""); }}>
                            <option value="">Chọn khu vực...</option>
                            {locationList.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="label label-text font-medium">Chi nhánh</label>
                        <BranchSelector locationId={selectedLocation} value={form.branch} onChange={(v) => set("branch", v)} />
                    </div>

                    <div>
                        <label className="label label-text font-medium">Ngày vào làm</label>
                        <input type="date" className="input input-bordered w-full" value={form.hire_date} onChange={(e) => set("hire_date", e.target.value)} />
                    </div>

                    {isEdit && (
                        <label className="flex items-center gap-3 cursor-pointer">
                            <span className="label-text font-medium">Tài khoản đang hoạt động?</span>
                            <input type="checkbox" className="toggle toggle-primary" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
                        </label>
                    )}
                </div>

                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onClose}>Hủy</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={isPending}>
                        {isPending ? <Loader2 size={16} className="animate-spin" /> : (isEdit ? "Lưu" : "Tạo tài khoản")}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose} />
        </dialog>
    );
};

const ManageStaffs = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [branchFilter, setBranchFilter] = useState("");
    const [positionFilter, setPositionFilter] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editStaff, setEditStaff] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput])

    const { data: staffs, isLoading } = useManageStaffs({ search, branch: branchFilter, position: positionFilter });
    const { data: branches } = useBranches();


    const list = staffs?.results || staffs || [];

    const openEdit = (staff) => { setEditStaff(staff); setShowModal(true); };
    const openCreate = () => { setEditStaff(null); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setEditStaff(null); };

    return (
        <>
            <BackButton label={"Quản lý"} onClick={() => navigate("/manage/")} />

            <div className="card bg-base-100 border border-base-200">
                <div className="card-body p-0">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-base-200">
                        <h2 className="text-lg font-bold">Quản lý nhân viên</h2>
                        <button className="btn btn-primary btn-sm gap-1" onClick={openCreate}>
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-base-200">
                        <label className="input input-sm input-bordered flex items-center gap-2 flex-1 min-w-48 not-sm:w-full">
                            <Search size={14} className="text-base-content/40" />
                            <input placeholder="Tìm theo tên, email..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="grow" />
                            {search && <button onClick={() => setSearchInput("")}><X size={12} /></button>}
                        </label>
                        <select className="select select-sm select-bordered not-sm:w-full" value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}>
                            <option value="">Tất cả chức danh</option>
                            {Object.entries(Configs.STAFF_POSITION_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                        <select className="select select-sm select-bordered not-sm:w-full" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
                            <option value="">Tất cả chi nhánh</option>
                            {(branches?.results || branches || []).map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr className="border-b border-base-200">
                                    <th className="py-3 px-4 text-xs text-base-content/50 font-semibold">Nhân viên</th>
                                    <th className="py-3 px-4 text-xs text-base-content/50 font-semibold">Chức danh</th>
                                    <th className="py-3 px-4 text-xs text-base-content/50 font-semibold hidden md:table-cell">Chi nhánh</th>
                                    <th className="py-3 px-4 text-xs text-base-content/50 font-semibold hidden lg:table-cell">Ngày vào làm</th>
                                    <th className="py-3 px-4 text-xs text-base-content/50 font-semibold">Trạng thái</th>
                                    <th className="py-3 px-4 w-16"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={6} className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></td></tr>
                                ) : list.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-base-content/40">
                                        Không có nhân viên nào
                                    </td></tr>
                                ) : list.map((s) => (
                                    <tr key={s.id} className={`hover:bg-base-200/50 ${!s.active ? "opacity-50" : ""}`}>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                {s.user?.avatar ? (
                                                    <img src={s.user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                                        <span className="text-xs font-bold text-primary">
                                                            {(s.user?.first_name || s.user?.email || "?")[0].toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-sm">
                                                        {s.user?.last_name} {s.user?.first_name}
                                                    </p>
                                                    <p className="text-xs text-base-content/50">{s.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`badge badge-xs sm:badge-sm badge-soft ${POSITION_CLS[s.position]}`}>
                                                {Configs.STAFF_POSITION_LABELS[s.position]}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm hidden md:table-cell">
                                            {s.branch?.name || <span className="text-base-content/40">Chưa phân công</span>}
                                        </td>
                                        <td className="py-3 px-4 text-sm hidden lg:table-cell">{formatDate(s.hire_date)}</td>
                                        <td className="py-3 px-4">
                                            {s.active
                                                ? <span className="badge badge-xs sm:badge-sm badge-soft badge-success">Hoạt động</span>
                                                : <span className="badge badge-xs sm:badge-sm badge-ghost">Vô hiệu</span>
                                            }
                                        </td>
                                        <td className="py-3 px-4">
                                            <button className="btn btn-ghost btn-xs" onClick={() => openEdit(s)}>
                                                <Pencil size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showModal && <StaffFormModal staff={editStaff} onClose={closeModal} />}
            </div>
        </>
    );
};

export default ManageStaffs;