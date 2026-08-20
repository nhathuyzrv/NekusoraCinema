import { useRef, useState } from "react";
import { User, Mail, Phone, Calendar, Venus, Mars, Camera, CircleUserRound, Flame } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useUpdateUser } from "../hooks/useUpdateUser";
import LocalLoading from "../components/LocalLoading";
import { useToast } from "../hooks/useToast";
import Configs from "../configs/Configs";

function calcAge(dateStr) {
    if (!dateStr) return null;
    const birth = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

function formatGender(g) {
    if (g === "MALE") return "Nam";
    if (g === "FEMALE") return "Nữ";
    if (g === "OTHER") return "Khác";
    return "—";
}

function GenderIcon({ gender }) {
    if (gender === "MALE") return <Mars size={15} className="text-info" />;
    if (gender === "FEMALE") return <Venus size={15} className="text-error" />;
    return <User size={15} />;
}

function AvatarDisplay({ src, name, size = "lg" }) {
    const dim = size === "lg" ? "w-28 h-28" : "w-20 h-20";
    const textSize = size === "lg" ? "text-4xl" : "text-2xl";
    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={`${dim} rounded-full object-cover ring-4 ring-primary/20`}
            />
        );
    }
    return (
        <div className={`${dim} rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20`}>
            {name
                ? <span className={`${textSize} font-bold text-primary`}>{name[0].toUpperCase()}</span>
                : <CircleUserRound className="text-primary w-1/2 h-1/2" />
            }
        </div>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-base-200 last:border-0">
            <div className="mt-0.5 text-primary shrink-0">{icon}</div>
            <div className="min-w-0">
                <p className="text-xs text-base-content/50 mb-0.5">{label}</p>
                <p className="text-sm font-medium text-base-content break-all">{value || "—"}</p>
            </div>
        </div>
    );
}

const Profile = () => {
    const { user, hasRole } = useAuth();
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const { mutate, isPending } = useUpdateUser({
        onSuccess: () => {
            setAvatarFile(null);
            setAvatarPreview(null);
            if (fileRef.current) fileRef.current.value = "";
        },
    });
    const [form, setForm] = useState({
        first_name: user.first_name,
        last_name: user.last_name,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        phone_number: user.phone_number,
    });
    const [errors, setErrors] = useState({});
    const fileRef = useRef(null);
    const toast = useToast();

    const fullName = user ? `${user.last_name ?? ""} ${user.first_name ?? ""}`.trim() || user.username : "...";

    const setField = (name, value) => {
        setForm((p) => ({ ...p, [name]: value }));
        setErrors((p) => ({ ...p, [name]: undefined }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const phoneRegex = /^0\d{9}$/;
    const validate = () => {
        const next = {};
        if (!form.first_name.trim()) next.first_name = "Trường này không được để trống";
        if (!form.last_name.trim()) next.last_name = "Trường này không được để trống";
        if (!form.date_of_birth) next.date_of_birth = "Trường này không được để trống";
        if (form.phone_number && !phoneRegex.test(form.phone_number.trim()))
            next.phone_number = "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        const diff = Object.entries(form).reduce((acc, [key, value]) => {
            if (user[key] !== value) acc[key] = value;
            return acc;
        }, {});

        const hasNewAvatar = avatarFile !== null;

        if (Object.keys(diff).length === 0 && !hasNewAvatar) {
            toast.info("Không có thông tin nào thay đổi");
            return;
        }

        if (hasNewAvatar) {
            const payload = new FormData();
            Object.entries(diff).forEach(([key, value]) => payload.append(key, value));
            payload.append("avatar", avatarFile);
            mutate(payload);
            setAvatarFile(null);
        } else {
            mutate(diff);
        }
    };

    const age = calcAge(user?.date_of_birth);
    const displayAvatar = avatarPreview || user?.avatar || null;

    return (
        <div className="max-w-5xl mx-auto px-4 py-10">

            <h1 className="text-2xl font-bold mb-8">Thông tin cá nhân</h1>

            <div className="flex flex-col lg:flex-row gap-6">
                <aside className="lg:w-[40%] flex flex-col">
                    <LocalLoading show={isPending}>
                        <div className="bg-base-100 border border-base-300 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
                            <AvatarDisplay src={displayAvatar} name={fullName} size="lg" />
                            <div className="mt-2">
                                <p className="text-lg font-bold">{fullName}</p>
                                <p className="text-sm text-base-content/60">{user?.email}</p>
                            </div>
                            <span className="mt-2 badge badge-soft badge-primary badge-outline text-xs">
                                {Configs.USER_ROLE_LABELS[user?.role]}
                            </span>
                            {hasRole("STAFF", "MANAGER") &&
                                <span className="badge badge-soft badge-secondary badge-outline text-xs">
                                    {Configs.STAFF_POSITION_LABELS[user?.staff_profile?.position]}
                                </span>
                            }
                        </div>

                        {hasRole("CUSTOMER") && <div className="bg-base-100 border border-base-300 rounded-2xl p-5 mt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Flame size={20} className="text-primary fill-primary" />
                                <p className="font-semibold text-md">Điểm thành viên</p>
                            </div>
                            <p className="text-3xl font-black text-primary">
                                {(user.loyalty_points.toLocaleString('vi-VN'))}
                                <span className="text-base font-medium text-base-content/60 ml-1">pts</span>
                            </p>
                            <div className="mt-3 space-y-1 text-xs text-base-content/50">
                                <p>Tích lũy: <span className="font-medium text-base-content/70">10.000 vnd = 1 pt</span></p>
                                <p>Quy đổi: <span className="font-medium text-base-content/70">2 pts = 1.000 vnd</span></p>
                            </div>
                        </div>}

                        <div className="bg-base-100 border border-base-300 rounded-2xl p-5 mt-4">
                            <InfoRow icon={<Mail size={15} />} label="Email" value={user?.email} />
                            <InfoRow icon={<Phone size={15} />} label="Số điện thoại" value={user?.phone_number} />
                            <InfoRow
                                icon={<Calendar size={15} />}
                                label="Tuổi"
                                value={age !== null ? `${age} tuổi` : null}
                            />
                            <InfoRow
                                icon={<GenderIcon gender={user.gender} />}
                                label="Giới tính"
                                value={formatGender(user.gender)}
                            />
                        </div>
                    </LocalLoading>
                </aside>

                <section className="lg:w-[60%]">
                    <LocalLoading show={isPending}>
                        <form
                            onSubmit={handleSubmit}
                            className="bg-base-100 border border-base-300 rounded-2xl p-6 space-y-5"
                        >
                            <p className="font-semibold text-base">Chỉnh sửa thông tin</p>

                            <div className="flex flex-col items-center gap-2">
                                <div className="relative">
                                    <AvatarDisplay src={displayAvatar} name={fullName} size="md" />
                                    <button
                                        type="button"
                                        className="btn btn-circle btn-xs btn-primary absolute bottom-0 right-0"
                                        onClick={() => fileRef.current?.click()}
                                        aria-label="Đổi ảnh đại diện"
                                        disabled={isPending}
                                    >
                                        <Camera size={12} />
                                    </button>
                                </div>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                                {avatarPreview && avatarFile && (
                                    <p className="text-xs text-base-content/50">
                                        Ảnh đai diện mới đã được chọn, nhấn <span className="font-bold">Lưu thay đổi</span> để cập nhật
                                    </p>
                                )}
                            </div>

                            <div className="divider my-0" />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label flex-row gap-1">
                                        <span className="label-text text-sm">Họ</span>
                                        <span className="text-error">*</span>
                                    </label>
                                    <input
                                        placeholder="Nhập họ"
                                        className={`input w-full ${errors.last_name ? "input-error" : ""}`}
                                        value={form.last_name}
                                        onChange={(e) => setField("last_name", e.target.value)}
                                        disabled={isPending}
                                    />
                                    {errors.last_name && (
                                        <span className="text-error text-xs mt-1">{errors.last_name}</span>
                                    )}
                                </div>
                                <div className="form-control">
                                    <label className="label flex-row gap-1">
                                        <span className="label-text text-sm">Tên</span>
                                        <span className="text-error">*</span>
                                    </label>
                                    <input
                                        placeholder="Nhập tên"
                                        className={`input w-full ${errors.first_name ? "input-error" : ""}`}
                                        value={form.first_name}
                                        onChange={(e) => setField("first_name", e.target.value)}
                                        disabled={isPending}
                                    />
                                    {errors.first_name && (
                                        <span className="text-error text-xs mt-1">{errors.first_name}</span>
                                    )}
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label flex-row gap-1">
                                    <span className="label-text text-sm">Giới tính</span>
                                    <span className="text-error">*</span>
                                </label>
                                <div className="flex gap-6">
                                    {[
                                        { value: "MALE", label: "Nam" },
                                        { value: "FEMALE", label: "Nữ" },
                                        { value: "OTHER", label: "Khác" },
                                    ].map(({ value, label }) => (
                                        <label key={value} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="gender"
                                                className="radio radio-primary radio-sm"
                                                checked={form.gender === value}
                                                onChange={() => setField("gender", value)}
                                                disabled={isPending}
                                            />
                                            <span className="text-sm">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label flex-row gap-1">
                                    <span className="label-text text-sm">Ngày sinh</span>
                                    <span className="text-error">*</span>
                                </label>
                                <input
                                    type="date"
                                    className={`input w-full ${errors.date_of_birth ? "input-error" : ""}`}
                                    value={form.date_of_birth}
                                    onChange={(e) => setField("date_of_birth", e.target.value)}
                                    disabled={isPending}
                                    max={new Date().toISOString().split("T")[0]}
                                />
                                {errors.date_of_birth && (
                                    <span className="text-error text-xs mt-1">{errors.date_of_birth}</span>
                                )}
                            </div>

                            <div className="form-control">
                                <label className="label flex-row gap-1">
                                    <span className="label-text text-sm">Số điện thoại</span>
                                    <span className="text-error">*</span>
                                </label>
                                <input
                                    placeholder="0xxxxxxxxx"
                                    className={`input w-full ${errors.phone_number ? "input-error" : ""}`}
                                    value={form.phone_number}
                                    onChange={(e) => setField("phone_number", e.target.value)}
                                    disabled={isPending}
                                />
                                {errors.phone_number && (
                                    <span className="text-error text-xs mt-1">{errors.phone_number}</span>
                                )}
                            </div>

                            <div className="pt-2 w-full flex lg:justify-end">
                                <button
                                    type="submit"
                                    className="btn btn-primary not-lg:w-full"
                                    disabled={isPending}
                                >
                                    Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </LocalLoading>
                </section>
            </div>
        </div>
    );
}

export default Profile;