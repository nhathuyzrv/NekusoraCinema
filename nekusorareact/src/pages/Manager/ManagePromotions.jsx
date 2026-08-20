import { useState } from "react";
import { Plus, X, Loader2, Percent, DollarSign } from "lucide-react";
import { useManagePromotions, useCreatePromotion } from "../../hooks/useManagement";
import { useToast } from "../../hooks/useToast";
import { formatDateTime } from "../../utils/DateTime";
import { formatMoney } from "../../utils/Money";
import Configs from "../../configs/Configs";
import { useAuth } from "../../hooks/useAuth";

const DISCOUNT_TYPE_LABELS = {
    PERCENT: { label: "Phần trăm (%)", icon: Percent, cls: "badge-info" },
    FIXED_AMOUNT: { label: "Cố định (đ)", icon: DollarSign, cls: "badge-warning" },
};

const EMPTY_FORM = {
    code: "", name: "", description: "",
    discount_type: "PERCENT", discount_value: "",
    min_order_amount: "0", max_discount_amount: "",
    start_date: "", end_date: "",
    usage_limit: "", per_user_limit: "1", active: true,
};

const PromotionFormModal = ({ onClose }) => {
    const { mutate: createPromotion, isPending } = useCreatePromotion();
    const toast = useToast();
    const [form, setForm] = useState(EMPTY_FORM);
    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const handleSubmit = () => {
        if (!form.code.trim() || !form.name.trim() || !form.discount_value || !form.start_date || !form.end_date) {
            toast.warning("Vui lòng nhập đầy đủ thông tin bắt buộc");
            return;
        }
        if (new Date(form.end_date) <= new Date(form.start_date)) {
            toast.error("Ngày kết thúc phải sau ngày bắt đầu");
            return;
        }
        const payload = {
            code: form.code.trim().toUpperCase(),
            name: form.name.trim(),
            description: form.description,
            discount_type: form.discount_type,
            discount_value: form.discount_value,
            min_order_amount: form.min_order_amount || "0",
            start_date: form.start_date,
            end_date: form.end_date,
            per_user_limit: form.per_user_limit || 1,
            active: form.active,
        };
        if (form.max_discount_amount) payload.max_discount_amount = form.max_discount_amount;
        if (form.usage_limit) payload.usage_limit = form.usage_limit;


        createPromotion(payload, {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" onClick={onClose}><X size={16} /></button>
                <h3 className="font-bold text-lg mb-4">Tạo khuyến mãi mới</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="label label-text font-medium">Mã khuyến mãi <span className="text-error">*</span></label>
                        <input className="input input-bordered w-full uppercase" value={form.code}
                            onChange={(e) => set("code", e.target.value.toUpperCase())}
                            placeholder="SUMMER2026..." />
                    </div>

                    <div>
                        <label className="label label-text font-medium">Loại giảm giá <span className="text-error">*</span></label>
                        <select className="select select-bordered w-full" value={form.discount_type} onChange={(e) => set("discount_type", e.target.value)}>
                            <option value="PERCENT">Phần trăm (%)</option>
                            <option value="FIXED_AMOUNT">Cố định (đ)</option>
                        </select>
                    </div>

                    <div className="sm:col-span-2">
                        <label className="label label-text font-medium">Tên chương trình <span className="text-error">*</span></label>
                        <input className="input input-bordered w-full" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Khuyến mãi hè 2026..." />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="label label-text font-medium">Mô tả</label>
                        <textarea className="textarea textarea-bordered w-full h-16" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Mô tả chương trình..." />
                    </div>

                    <div>
                        <label className="label label-text font-medium">
                            Giá trị giảm {form.discount_type === "PERCENT" ? "(%)" : "(đ)"} <span className="text-error">*</span>
                        </label>
                        <input type="number" className="input input-bordered w-full" value={form.discount_value}
                            onChange={(e) => set("discount_value", e.target.value)}
                            min={0} max={form.discount_type === "PERCENT" ? 100 : undefined}
                            placeholder={form.discount_type === "PERCENT" ? "20" : "50000"} />
                    </div>

                    <div>
                        <label className="label label-text font-medium">Giá trị đơn hàng tối thiểu (đ)</label>
                        <input type="number" className="input input-bordered w-full" value={form.min_order_amount} onChange={(e) => set("min_order_amount", e.target.value)} min={0} placeholder="0" />
                    </div>

                    {form.discount_type === "PERCENT" && (
                        <div>
                            <label className="label label-text font-medium">Giảm tối đa (đ)</label>
                            <input type="number" className="input input-bordered w-full" value={form.max_discount_amount} onChange={(e) => set("max_discount_amount", e.target.value)} min={0} placeholder="Không giới hạn..." />
                        </div>
                    )}

                    <div>
                        <label className="label label-text font-medium">Ngày bắt đầu <span className="text-error">*</span></label>
                        <input type="datetime-local" className="input input-bordered w-full" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
                    </div>

                    <div>
                        <label className="label label-text font-medium">Ngày kết thúc <span className="text-error">*</span></label>
                        <input type="datetime-local" className="input input-bordered w-full" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
                    </div>

                    <div>
                        <label className="label label-text font-medium">Số lượt dùng tối đa</label>
                        <input type="number" className="input input-bordered w-full" value={form.usage_limit} onChange={(e) => set("usage_limit", e.target.value)} min={1} placeholder="Không giới hạn..." />
                    </div>

                    <div>
                        <label className="label label-text font-medium">Giới hạn lượt dùng mỗi thành viên</label>
                        <input type="number" className="input input-bordered w-full" value={form.per_user_limit} onChange={(e) => set("per_user_limit", e.target.value)} min={1} />
                    </div>
                </div>

                <div className="modal-action mt-6">
                    <button className="btn btn-ghost" onClick={onClose}>Hủy</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={isPending}>
                        {isPending ? <Loader2 size={16} className="animate-spin" /> : "Tạo khuyến mãi"}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose} />
        </dialog>
    );
};

const ManagePromotions = () => {
    const { hasStaffPosition } = useAuth();
    const [discountTypeFilter, setDiscountTypeFilter] = useState("");
    const [showModal, setShowModal] = useState(false);

    const { data: promotions, isLoading } = useManagePromotions({ discount_type: discountTypeFilter });
    const list = promotions?.results || promotions || [];

    return (
        <div className="card bg-base-100 border border-base-200">
            <div className="card-body p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-base-200">
                    <h2 className="text-lg font-bold">Quản Lý Khuyến Mãi</h2>
                    {hasStaffPosition(Configs.STAFF_POSITIONS.SYSTEM_MANAGER) &&
                        <button className="btn btn-primary btn-sm gap-1" onClick={() => setShowModal(true)}>
                            <Plus size={16} />
                        </button>
                    }
                </div>

                <div className="flex gap-2 px-5 py-3 border-b border-base-200">
                    <select className="select select-sm select-bordered not-sm:w-full" value={discountTypeFilter} onChange={(e) => setDiscountTypeFilter(e.target.value)}>
                        <option value="">Tất cả loại</option>
                        <option value="PERCENT">Giảm theo phần trăm</option>
                        <option value="FIXED_AMOUNT">Giảm cố định</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr className="border-b border-base-200">
                                <th className="py-3 px-4 text-xs text-base-content/50 font-semibold">Mã</th>
                                <th className="py-3 px-4 text-xs text-base-content/50">Trạng thái</th>
                                <th className="py-3 px-4 text-xs text-base-content/50 font-semibold hidden sm:table-cell">Tên</th>
                                <th className="py-3 px-4 text-xs text-base-content/50 font-semibold">Loại</th>
                                <th className="py-3 px-4 text-xs text-base-content/50 font-semibold">Giá trị</th>
                                <th className="py-3 px-4 text-xs text-base-content/50 font-semibold hidden md:table-cell">Hiệu lực</th>
                                <th className="py-3 px-4 text-xs text-base-content/50 font-semibold hidden lg:table-cell">Đã dùng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={6} className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></td></tr>
                            ) : list.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-10 text-base-content/40">
                                    Không có khuyến mãi nào
                                </td></tr>
                            ) : list.map((promo) => {
                                const now = new Date();
                                const start = new Date(promo.start_date);
                                const end = new Date(promo.end_date);
                                const isAvailable = promo.active && now >= start && now <= end;
                                const isExpired = now > end;

                                return (
                                    <tr key={promo.id} className="hover:bg-base-200/50">
                                        <td className="py-3 px-4">
                                            <span className="font-mono font-bold text-sm text-primary">{promo.code}</span>
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            {!promo.active && <span className="badge badge-soft badge-error badge-xs">Không còn hiệu lực</span>}
                                            {isAvailable && <span className="badge badge-soft badge-success badge-xs">Đang có hiệu lực</span>}
                                            {isExpired && <span className="badge badge-ghost badge-xs">Hết hạn</span>}
                                        </td>
                                        <td className="py-3 px-4 text-sm hidden sm:table-cell">{promo.name}</td>
                                        <td className="py-3 px-4">
                                            <span className={`badge badge-sm badge-soft ${DISCOUNT_TYPE_LABELS[promo.discount_type]?.cls}`}>
                                                {promo.discount_type === "PERCENT" ? "%" : "đ"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            {promo.discount_type === "PERCENT"
                                                ? `${promo.discount_value}%`
                                                : `${formatMoney(promo.discount_value)}`
                                            }
                                            {promo.max_discount_amount && (
                                                <p className="text-xs text-base-content/50">Tối đa {formatMoney(promo.max_discount_amount)}</p>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-xs hidden md:table-cell text-base-content/60">
                                            <p>Từ {formatDateTime(promo.start_date)}</p>
                                            <p>Đến {formatDateTime(promo.end_date)}</p>
                                        </td>
                                        <td className="py-3 px-4 text-sm hidden lg:table-cell">
                                            {promo.used_count ?? 0}
                                            {promo.usage_limit && <span className="text-base-content/50"> / {promo.usage_limit}</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && <PromotionFormModal onClose={() => setShowModal(false)} />}
        </div>
    );
};

export default ManagePromotions;