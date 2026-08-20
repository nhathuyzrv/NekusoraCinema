import { useState } from "react";
import { Plus, Pencil, X, Loader2, MapPin, ChevronDown } from "lucide-react";
import {
    useManageLocations,
    useCreateLocation,
    useUpdateLocation,
    useManageLocationBranches,
    useCreateBranchForLocation,
    useUpdateBranch,
    useManageBranchRooms,
    useCreateRoomForBranch,
    useUpdateRoom,
} from "../../hooks/useManagement";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import Configs from "../../configs/Configs";

const LocationFormModal = ({ location, onClose }) => {
    const isEdit = !!location;
    const { mutate: createLocation, isPending: createLocationPending } = useCreateLocation();
    const { mutate: updateLocation, isPending: updateLocationPending } = useUpdateLocation();
    const toast = useToast();
    const [name, setName] = useState(location?.name || "");

    const handleSubmit = () => {
        if (!name.trim()) {
            toast.warning("Vui lòng nhập tên khu vực");
            return;
        }

        if (isEdit) {
            updateLocation({ id: location.id, data: { name: name.trim() } }, {
                onSuccess: () => {
                    onClose();
                },
            });
        } else {
            createLocation({ name: name.trim() }, {
                onSuccess: () => {
                    onClose();
                },
            });
        }
    };

    const isPending = createLocationPending || updateLocationPending;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-sm">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" onClick={onClose}><X size={16} /></button>
                <h3 className="font-bold text-lg mb-4">{isEdit ? "Sửa khu vực" : "Thêm khu vực"}</h3>
                <label className="label label-text font-medium">Tên khu vực <span className="text-error">*</span></label>
                <input className="input input-bordered w-full" value={name} onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="TP. Hồ Chí Minh..." autoFocus />
                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onClose}>Hủy</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={isPending}>
                        {isPending ? <Loader2 size={15} className="animate-spin" /> : (isEdit ? "Lưu" : "Thêm")}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose} />
        </dialog>
    );
};

const BranchFormModal = ({ locationId, locationName, branch, onClose }) => {
    const isEdit = !!branch;
    const { mutate: createBranch, isPending: createBranchPending } = useCreateBranchForLocation(locationId);
    const { mutate: updateBranch, isPending: updateBranchPending } = useUpdateBranch();
    const toast = useToast();

    const [form, setForm] = useState({
        name: branch?.name || "",
        address: branch?.address || "",
        phone_number: branch?.phone_number || "",
        opening_time: branch?.opening_time || "08:00",
        closing_time: branch?.closing_time || "23:00",
    });

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const handleSubmit = () => {
        if (!form.name.trim() || !form.address.trim()) {
            toast.warning("Vui lòng nhập tên và địa chỉ chi nhánh");
            return;
        }

        if (isEdit) {
            updateBranch({ id: branch.id, data: form }, {
                onSuccess: () => {
                    onClose();
                },
            });
        } else {
            createBranch(form, {
                onSuccess: () => {
                    onClose();
                },
            });
        }
    };

    const isPending = createBranchPending || updateBranchPending;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-lg">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" onClick={onClose}><X size={16} /></button>
                <h3 className="font-bold text-lg mb-1">{isEdit ? "Sửa chi nhánh" : "Thêm chi nhánh"}</h3>
                <p className="text-sm text-base-content/60 mb-4">Khu vực: <span className="font-semibold text-base-content">{locationName}</span></p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <label className="label label-text font-medium">Tên chi nhánh <span className="text-error">*</span></label>
                        <input className="input input-bordered w-full" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="NekusoraCinema Quận 1..." />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="label label-text font-medium">Địa chỉ <span className="text-error">*</span></label>
                        <input className="input input-bordered w-full" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Nguyễn Huệ, Q.1..." />
                    </div>
                    <div>
                        <label className="label label-text font-medium">Số điện thoại</label>
                        <input className="input input-bordered w-full" value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} placeholder="028..." />
                    </div>
                    <div></div>
                    <div>
                        <label className="label label-text font-medium">Giờ mở cửa</label>
                        <input type="time" className="input input-bordered w-full" value={form.opening_time} onChange={(e) => set("opening_time", e.target.value)} />
                    </div>
                    <div>
                        <label className="label label-text font-medium">Giờ đóng cửa</label>
                        <input type="time" className="input input-bordered w-full" value={form.closing_time} onChange={(e) => set("closing_time", e.target.value)} />
                    </div>
                </div>

                <div className="modal-action mt-5">
                    <button className="btn btn-ghost" onClick={onClose}>Hủy</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={isPending}>
                        {isPending ? <Loader2 size={15} className="animate-spin" /> : (isEdit ? "Lưu" : "Thêm")}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose} />
        </dialog>
    );
};

const RoomFormModal = ({ branchId, branchName, room, onClose }) => {
    const isEdit = !!room;
    const { mutate: createRoom, isPending: createRoomPending } = useCreateRoomForBranch(branchId);
    const { mutate: updateRoom, isPending: updateRoomPending } = useUpdateRoom();
    const toast = useToast();

    const [form, setForm] = useState({
        name: room?.name || "",
        total_rows: room?.total_rows || 10,
        seats_per_row: room?.seats_per_row || 12,
        force_update: false,
    });

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            toast.warning("Vui lòng nhập tên phòng");
            return;
        }

        if (isEdit) {
            updateRoom({ id: room.id, data: form }, {
                onSuccess: () => {
                    onClose();
                },
            });
        } else {
            createRoom(form, {
                onSuccess: () => {
                    onClose();
                },
            });
        }
    };

    const isPending = createRoomPending || updateRoomPending;
    const totalSeats = Number(form.total_rows) * Number(form.seats_per_row);

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-sm">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" onClick={onClose}><X size={16} /></button>
                <h3 className="font-bold text-lg mb-1">{isEdit ? "Sửa phòng chiếu" : "Thêm phòng chiếu"}</h3>
                <p className="text-sm text-base-content/60 mb-4">Chi nhánh: <span className="font-semibold text-base-content">{branchName}</span></p>

                <div className="space-y-3">
                    <div>
                        <label className="label label-text font-medium">Tên phòng <span className="text-error">*</span></label>
                        <input className="input input-bordered w-full" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Phòng 1..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label label-text font-medium">Số hàng</label>
                            <input type="number" className="input input-bordered w-full" value={form.total_rows} onChange={(e) => set("total_rows", e.target.value)} min={1} max={30} />
                        </div>
                        <div>
                            <label className="label label-text font-medium">Ghế/hàng</label>
                            <input type="number" className="input input-bordered w-full" value={form.seats_per_row} onChange={(e) => set("seats_per_row", e.target.value)} min={1} max={30} />
                        </div>
                    </div>
                    <p className="text-xs text-base-content/60 text-right">Tổng: <span className="font-semibold text-base-content">{totalSeats} ghế</span></p>

                    {isEdit && (
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="checkbox checkbox-sm checkbox-warning"
                                checked={form.force_update} onChange={(e) => set("force_update", e.target.checked)} />
                            <span className="text-sm text-warning">Buộc cập nhật dù có suất chiếu đang hoạt động</span>
                        </label>
                    )}
                </div>

                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onClose}>Hủy</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={isPending}>
                        {isPending ? <Loader2 size={15} className="animate-spin" /> : (isEdit ? "Lưu" : "Thêm")}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose} />
        </dialog>
    );
};

const BranchRoomsPanel = ({ branch }) => {
    const { hasStaffPosition } = useAuth();
    const { data: rooms, isLoading } = useManageBranchRooms(branch.id);
    const [roomModal, setRoomModal] = useState(null);
    const [showAddRoom, setShowAddRoom] = useState(false);
    const roomList = rooms?.results || rooms || [];

    return (
        <div className="mt-2 ml-4 border-l-2 border-base-300 pl-4 space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Phòng chiếu</p>
                {hasStaffPosition(Configs.STAFF_POSITIONS.BRANCH_MANAGER) &&
                    <button className="btn btn-xs btn-ghost gap-1" onClick={() => setShowAddRoom(true)}>
                        <Plus size={12} /> Thêm phòng
                    </button>
                }
            </div>

            {isLoading ? (
                <div className="py-2"><Loader2 size={14} className="animate-spin" /></div>
            ) : roomList.length === 0 ? (
                <p className="text-xs text-base-content/40">Chưa có phòng chiếu nào</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {roomList.map((room) => (
                        <div key={room.id} className="flex items-center justify-between bg-base-200/60 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                                <div>
                                    <p className="text-sm font-medium">{room.name}</p>
                                    <p className="text-xs text-base-content/50">{room.total_rows * room.seats_per_row} ghế ({room.total_rows} hàng × {room.seats_per_row})</p>
                                </div>
                            </div>
                            {hasStaffPosition(Configs.STAFF_POSITIONS.BRANCH_MANAGER) &&
                                <button className="btn btn-ghost btn-xs" onClick={() => setRoomModal(room)}>
                                    <Pencil size={12} />
                                </button>
                            }
                        </div>
                    ))}
                </div>
            )}

            {showAddRoom && (
                <RoomFormModal branchId={branch.id} branchName={branch.name} room={null} onClose={() => setShowAddRoom(false)} />
            )}
            {roomModal && (
                <RoomFormModal branchId={branch.id} branchName={branch.name} room={roomModal} onClose={() => setRoomModal(null)} />
            )}
        </div>
    );
};

const LocationBranchesPanel = ({ location }) => {
    const { hasStaffPosition } = useAuth();
    const { data: detail, isLoading } = useManageLocationBranches(location.id);
    const [branchModal, setBranchModal] = useState(null);
    const [showAddBranch, setShowAddBranch] = useState(false);
    const [expandedBranch, setExpandedBranch] = useState(null);

    const branches = detail?.branches || detail || [];

    return (
        <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Chi nhánh</p>
                {hasStaffPosition(Configs.STAFF_POSITIONS.BRANCH_MANAGER) &&
                    <button className="btn btn-xs btn-ghost gap-1" onClick={() => setShowAddBranch(true)}>
                        <Plus size={12} /> Thêm chi nhánh
                    </button>
                }
            </div>

            {isLoading ? (
                <div className="flex justify-center py-3"><Loader2 size={16} className="animate-spin" /></div>
            ) : branches.length === 0 ? (
                <p className="text-sm text-base-content/40 py-2">Chưa có chi nhánh nào</p>
            ) : branches.map((branch) => (
                <div key={branch.id} className="border border-base-300 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-base-200/30">
                        <button
                            className="flex items-center gap-2 flex-1 text-left hover:text-primary transition-colors"
                            onClick={() => setExpandedBranch(expandedBranch === branch.id ? null : branch.id)}
                        >
                            <div>
                                <p className="font-semibold text-sm">{branch.name}</p>
                                <p className="text-xs text-base-content/50">{branch.address}</p>
                            </div>
                            <ChevronDown size={14} className={`ml-auto shrink-0 transition-transform ${expandedBranch === branch.id ? "rotate-180" : ""}`} />
                        </button>
                        {hasStaffPosition(Configs.STAFF_POSITIONS.BRANCH_MANAGER) &&
                            <button className="btn btn-ghost btn-xs ml-2" onClick={() => setBranchModal(branch)}>
                                <Pencil size={12} />
                            </button>
                        }
                    </div>

                    {expandedBranch === branch.id && (
                        <div className="px-4 py-3">
                            <BranchRoomsPanel branch={branch} />
                        </div>
                    )}
                </div>
            ))}

            {showAddBranch && (
                <BranchFormModal locationId={location.id} locationName={location.name} branch={null} onClose={() => setShowAddBranch(false)} />
            )}
            {branchModal && (
                <BranchFormModal locationId={location.id} locationName={location.name} branch={branchModal} onClose={() => setBranchModal(null)} />
            )}
        </div>
    );
};

const ManageLocations = () => {
    const { hasStaffPosition } = useAuth();
    const { data: locations, isLoading } = useManageLocations();
    const [locationModal, setLocationModal] = useState(null);
    const [showAddLocation, setShowAddLocation] = useState(false);
    const [expandedLocation, setExpandedLocation] = useState(null);

    const list = locations?.results || locations || [];

    return (
        <div className="card bg-base-100 border border-base-200">
            <div className="card-body p-0">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-base-200">
                    <h2 className="text-lg font-bold">Quản Lý Chi Nhánh & Phòng Chiếu</h2>
                    {hasStaffPosition(Configs.STAFF_POSITIONS.BRANCH_MANAGER) &&
                        <button className="btn btn-primary btn-sm gap-1" onClick={() => setShowAddLocation(true)}>
                            <Plus size={16} /> Thêm khu vực
                        </button>
                    }
                </div>

                <div className="divide-y divide-base-200 px-5 py-3 space-y-3">
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
                    ) : list.length === 0 ? (
                        <div className="text-center py-10 text-base-content/40">
                            Không có khu vực nào
                        </div>
                    ) : list.map((loc) => (
                        <div key={loc.id} className="border border-base-200 rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 bg-base-200/20">
                                <button
                                    className="flex items-center gap-2 flex-1 text-left hover:text-primary transition-colors"
                                    onClick={() => setExpandedLocation(expandedLocation === loc.id ? null : loc.id)}
                                >
                                    <MapPin size={16} className="text-primary shrink-0" />
                                    <span className="font-bold">{loc.name}</span>
                                    <ChevronDown size={14} className={`ml-auto shrink-0 transition-transform ${expandedLocation === loc.id ? "rotate-180" : ""}`} />
                                </button>
                                {hasStaffPosition(Configs.STAFF_POSITIONS.BRANCH_MANAGER) &&
                                    <button className="btn btn-ghost btn-xs ml-2" onClick={() => setLocationModal(loc)}>
                                        <Pencil size={13} />
                                    </button>
                                }
                            </div>

                            {expandedLocation === loc.id && (
                                <div className="px-4 pb-4">
                                    <LocationBranchesPanel location={loc} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {showAddLocation && <LocationFormModal location={null} onClose={() => setShowAddLocation(false)} />}
            {locationModal && <LocationFormModal location={locationModal} onClose={() => setLocationModal(null)} />}
        </div>
    );
};

export default ManageLocations;