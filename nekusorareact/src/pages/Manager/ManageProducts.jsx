import { useEffect, useState } from "react";
import { Plus, Pencil, X, Loader2, ShoppingBag, Search } from "lucide-react";
import {
    useManageProducts,
    useManageProductDetail,
    useCreateProduct,
    useUpdateProduct,
} from "../../hooks/useManagement";
import { useToast } from "../../hooks/useToast";
import Configs from "../../configs/Configs";
import { useAuth } from "../../hooks/useAuth";

const TYPE_LABELS = {
    SINGLE: { label: "Đơn lẻ" },
    COMBO: { label: "Combo" },
};

const EMPTY_FORM = {
    name: "", description: "", price: "", product_type: "SINGLE", active: true, image: null,
    items: [],
};

const ProductFormModal = ({ productId, defaultType, onClose }) => {
    const isEdit = !!productId;
    const { data: detail, isLoading: loadingDetail } = useManageProductDetail(productId);
    const { data: singles } = useManageProducts({ product_type: "SINGLE", active: true });
    const { mutate: createProduct, isPending: createProductPending } = useCreateProduct();
    const { mutate: updateProduct, isPending: updateProductPending } = useUpdateProduct();
    const toast = useToast();

    const [form, setForm] = useState({ ...EMPTY_FORM, product_type: defaultType || "SINGLE" });
    const [imgPreview, setImgPreview] = useState(null);
    const [initialized, setInitialized] = useState(false);

    if (isEdit && detail && !initialized) {
        setForm({
            name: detail.name || "",
            description: detail.description || "",
            price: detail.price || "",
            product_type: detail.product_type || "SINGLE",
            active: detail.active ?? true,
            image: null,
            items: (detail.combo_items || []).map((ci) => ({ product: ci.item.id, quantity: ci.quantity })),
        });
        setImgPreview(detail.image || null);
        setInitialized(true);
    }

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
    const isCombo = form.product_type === "COMBO";

    const singleList = (singles?.results || singles || []).filter((s) => !productId || s.id !== productId);

    const setItemQty = (productId, qty) => {
        setForm((p) => ({
            ...p,
            items: p.items.map((i) => i.product === productId ? { ...i, quantity: qty } : i),
        }));
    };

    const toggleItem = (productId) => {
        setForm((p) => {
            const exists = p.items.find((i) => i.product === productId);
            return {
                ...p,
                items: exists
                    ? p.items.filter((i) => i.product !== productId)
                    : [...p.items, { product: productId, quantity: 1 }],
            };
        });
    };

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        set("image", file);
        setImgPreview(URL.createObjectURL(file));
    };

    const buildFormData = () => {
        const fd = new FormData();
        fd.append("name", form.name.trim());
        fd.append("description", form.description);
        fd.append("price", form.price);
        fd.append("product_type", form.product_type);
        fd.append("active", form.active);
        if (form.image) fd.append("image", form.image);
        if (isCombo) {
            fd.append("items", JSON.stringify(form.items));
        }
        return fd;
    };

    const handleSubmit = () => {
        if (!form.name.trim() || !form.price) {
            toast.warning("Vui lòng nhập tên và giá sản phẩm");
            return;
        }
        if (isCombo && form.items.length === 0) {
            toast.warning("Combo phải có ít nhất 1 sản phẩm đơn");
            return;
        }

        const fd = buildFormData();
        if (isEdit) {
            updateProduct({ id: productId, data: fd }, {
                onSuccess: () => {
                    onClose();
                },
            });
        } else {
            createProduct(fd, {
                onSuccess: () => {
                    onClose();
                },
            });
        }
    };

    const isPending = createProductPending || updateProductPending;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" onClick={onClose}><X size={16} /></button>
                <h3 className="font-bold text-lg mb-4">{isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h3>

                {isEdit && loadingDetail ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="space-y-4">
                        {!isEdit && (
                            <div>
                                <label className="label label-text font-medium">Loại sản phẩm</label>
                                <div className="flex gap-2">
                                    {["SINGLE", "COMBO"].map((t) => (
                                        <button key={t} type="button"
                                            className={`btn btn-sm flex-1 ${form.product_type === t ? "btn-primary" : "btn-outline"}`}
                                            onClick={() => set("product_type", t)}>
                                            {TYPE_LABELS[t].label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="label label-text font-medium">Tên sản phẩm <span className="text-error">*</span></label>
                            <input className="input input-bordered w-full" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Tên sản phẩm..." />
                        </div>

                        <div>
                            <label className="label label-text font-medium">Mô tả</label>
                            <textarea className="textarea textarea-bordered w-full h-20" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Mô tả..." />
                        </div>

                        <div>
                            <label className="label label-text font-medium">Giá (đ) <span className="text-error">*</span></label>
                            <input type="number" className="input input-bordered w-full" value={form.price} onChange={(e) => set("price", e.target.value)} min={0} placeholder="35000" />
                        </div>

                        <div>
                            <label className="label label-text font-medium">Hình ảnh</label>
                            <div className="flex items-start gap-3">
                                {imgPreview && <img src={imgPreview} alt="preview" className="w-20 h-20 object-cover rounded-lg border border-base-300" />}
                                <input type="file" accept="image/*" className="file-input file-input-bordered flex-1" onChange={handleImage} />
                            </div>
                        </div>

                        {isEdit && (
                            <label className="flex items-center gap-3 cursor-pointer">
                                <span className="label-text font-medium">Đang kinh doanh?</span>
                                <input type="checkbox" className="toggle toggle-primary" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
                            </label>
                        )}

                        {isCombo && (
                            <div>
                                <label className="label label-text font-medium">Thành phần combo <span className="text-error">*</span></label>
                                {singleList.length === 0 ? (
                                    <p className="text-sm text-base-content/50">Không có sản phẩm đơn nào</p>
                                ) : (
                                    <div className="space-y-2 max-h-52 overflow-y-auto border border-base-300 rounded-lg p-2">
                                        {singleList.map((s) => {
                                            const selected = form.items.find((i) => i.product === s.id);
                                            return (
                                                <div key={s.id} className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${selected ? "bg-primary/10" : "hover:bg-base-200"}`}>
                                                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                                                        <input type="checkbox" className="checkbox checkbox-sm checkbox-primary"
                                                            checked={!!selected} onChange={() => toggleItem(s.id)} />
                                                        <div>
                                                            <p className="text-sm font-medium">{s.name}</p>
                                                            <p className="text-xs text-base-content/50">{Number(s.price).toLocaleString("vi-VN")}đ</p>
                                                        </div>
                                                    </label>
                                                    {selected && (
                                                        <input type="number" className="input input-xs input-bordered w-16 text-center"
                                                            value={selected.quantity} min={1}
                                                            onChange={(e) => setItemQty(s.id, Number(e.target.value))} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="modal-action mt-6">
                    <button className="btn btn-ghost" onClick={onClose}>Hủy</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={isPending}>
                        {isPending ? <Loader2 size={16} className="animate-spin" /> : (isEdit ? "Lưu thay đổi" : "Thêm")}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose} />
        </dialog>
    );
};

const ManageProducts = () => {
    const { hasStaffPosition } = useAuth();
    const [typeFilter, setTypeFilter] = useState("");
    const [activeFilter, setActiveFilter] = useState("");
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [modalId, setModalId] = useState(null);
    const [defaultType, setDefaultType] = useState("SINGLE");
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data: products, isLoading } = useManageProducts({
        product_type: typeFilter,
        active: activeFilter,
    });

    const list = (products?.results || products || []).filter((p) =>
        !search || p.name.toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = (type = "SINGLE") => { setModalId(null); setDefaultType(type); setShowModal(true); };
    const openEdit = (id) => { setModalId(id); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setModalId(null); };

    return (
        <div className="card bg-base-100 border border-base-200">
            <div className="card-body p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-base-200">
                    <h2 className="text-lg font-bold">Quản Lý Sản Phẩm & Combo</h2>
                    {hasStaffPosition(Configs.STAFF_POSITIONS.SYSTEM_MANAGER) &&
                        <div className="flex gap-2">
                            <button className="btn btn-outline btn-sm gap-1" onClick={() => openCreate("SINGLE")}>
                                <Plus size={14} /> Sản phẩm đơn
                            </button>
                            <button className="btn btn-primary btn-sm gap-1" onClick={() => openCreate("COMBO")}>
                                <Plus size={14} /> Combo
                            </button>
                        </div>
                    }
                </div>

                <div className="flex flex-wrap not-sm:flex-col gap-2 px-5 py-3 border-b border-base-200">
                    <label className="input input-sm input-bordered flex items-center gap-2 flex-1 min-w-40 py-1.5 not-sm:w-full">
                        <Search size={14} className="text-base-content/40" />
                        <input placeholder="Tìm sản phẩm..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="grow" />
                        {search && <button onClick={() => setSearchInput("")}><X size={12} /></button>}
                    </label>
                    <select className="select select-sm select-bordered not-sm:w-full" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                        <option value="">Tất cả loại</option>
                        <option value="SINGLE">Đơn lẻ</option>
                        <option value="COMBO">Combo</option>
                    </select>
                    <select className="select select-sm select-bordered not-sm:w-full" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
                        <option value="">Tất cả trạng thái</option>
                        <option value="true">Đang kinh doanh</option>
                        <option value="false">Ngừng kinh doanh</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr className="border-b border-base-200">
                                <th className="py-3 px-4 text-xs text-base-content/50 font-semibold w-14">Ảnh</th>
                                <th className="py-3 px-4 text-xs text-base-content/50 font-semibold">Tên sản phẩm</th>
                                <th className="py-3 px-4 text-xs text-base-content/50 font-semibold hidden sm:table-cell">Loại</th>
                                <th className="py-3 px-4 text-xs text-base-content/50 font-semibold">Giá</th>
                                <th className="py-3 px-4 text-xs text-base-content/50 font-semibold hidden md:table-cell">Trạng thái</th>
                                {hasStaffPosition(Configs.STAFF_POSITIONS.SYSTEM_MANAGER) &&
                                    <th className="py-3 px-4 w-16"></th>
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={6} className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></td></tr>
                            ) : list.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-10 text-base-content/40">
                                    Không có sản phẩm nào
                                </td></tr>
                            ) : list.map((p) => (
                                <tr key={p.id} className={`hover:bg-base-200/50 ${!p.active ? "opacity-40" : ""}`}>
                                    <td className="py-2 px-4">
                                        {p.image
                                            ? <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-lg" />
                                            : <div className="w-10 h-10 bg-base-300 rounded-lg flex items-center justify-center"><ShoppingBag size={14} className="opacity-30" /></div>
                                        }
                                    </td>
                                    <td className="py-3 px-4">
                                        <p className="font-semibold text-sm">{p.name}</p>
                                        {p.description && <p className="text-xs text-base-content/50 line-clamp-1">{p.description}</p>}
                                    </td>
                                    <td className="py-3 px-4 hidden sm:table-cell">
                                        <span>{TYPE_LABELS[p.product_type]?.label}</span>
                                    </td>
                                    <td className="py-3 px-4 text-sm font-mono">{Number(p.price).toLocaleString("vi-VN")}đ</td>
                                    <td className="py-3 px-4 hidden md:table-cell">
                                        {p.active
                                            ? <span className="flex items-center gap-1 text-success text-xs">Kinh doanh</span>
                                            : <span className="flex items-center gap-1 text-base-content/70 text-xs">Ngừng kinh doanh</span>
                                        }
                                    </td>
                                    {hasStaffPosition(Configs.STAFF_POSITIONS.SYSTEM_MANAGER) &&
                                        <td className="py-3 px-4">
                                            <button className="btn btn-ghost btn-xs" onClick={() => openEdit(p.id)}>
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

            {showModal && <ProductFormModal productId={modalId} defaultType={defaultType} onClose={closeModal} />}
        </div>
    );
};

export default ManageProducts;