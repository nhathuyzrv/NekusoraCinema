import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, X } from "lucide-react";
import "cally";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import GlobalLoading from "./GlobalLoading";
import MyAlert from "../configs/MyAlert";

const emptyFieldError = "Trường này không được để trống";
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^0\d{9}$/;
const passwordRegex = /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/;

export default function AuthModal({ onLogin, onRegister }) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState("login");
    const { error, clearError } = useAuth();

    const close = useCallback(() => {
        setOpen(false);
        clearError();
    }, [clearError]);

    const switchMode = useCallback((next) => {
        setMode(next);
        clearError();
    }, [clearError]);

    useEffect(() => {
        const modal = document.getElementById("auth_modal");
        if (!modal) return;
        modal.showModal = () => {
            const tab = modal.dataset.tab || "login";
            setMode(tab);
            clearError();
            setOpen(true);
        };
        modal.close = close;
    }, [close, clearError]);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        };
        document.addEventListener("keydown", onKeyDown, true);
        return () => document.removeEventListener("keydown", onKeyDown, true);
    }, [open, close]);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    return (
        <>
            <div id="auth_modal" style={{ display: "none" }} />
            {open && createPortal(
                <div className="fixed inset-0 z-1000 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
                    />

                    <div className="relative z-10 w-11/12 max-w-sm max-h-[90dvh] overflow-y-auto bg-base-100 rounded-2xl shadow-xl">
                        <button
                            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10"
                            onClick={close}
                            aria-label="Đóng"
                        >
                            <X size={16} />
                        </button>

                        <div className="p-6">
                            <h3 className="text-xl font-bold text-center mb-6">
                                {mode === "login" ? "Đăng Nhập Tài Khoản" : "Đăng Ký Tài Khoản"}
                            </h3>

                            {mode === "login" ? (
                                <LoginForm
                                    onLogin={onLogin}
                                    onSwitch={() => switchMode("register")}
                                    onClose={close}
                                    serverError={error}
                                />
                            ) : (
                                <RegisterForm
                                    onRegister={onRegister}
                                    onSwitch={() => switchMode("login")}
                                    onClose={close}
                                    serverError={error}
                                />
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

function LoginForm({ onLogin, onSwitch, onClose, serverError }) {
    const [form, setForm] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();
    const serverErrorRef = useRef(serverError);
    useEffect(() => { serverErrorRef.current = serverError; }, [serverError]);

    const setField = (name, value) => {
        setForm((p) => ({ ...p, [name]: value }));
        setErrors((p) => ({ ...p, [name]: undefined }));
    };

    const validate = () => {
        const next = {};
        if (!form.email.trim())
            next.email = emptyFieldError;
        else if (!emailRegex.test(form.email.trim()))
            next.email = "Email không đúng định dạng";
        if (!form.password) next.password = emptyFieldError;
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        try {
            await onLogin?.({ username: form.email, password: form.password });
            toast.success("Đăng nhập thành công", "Chào mừng bạn quay trở lại!");
            onClose?.();
        } catch {
            //
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-2">
            {submitting && <GlobalLoading message="Đang đăng nhập..." />}

            {serverError && (
                <div className="badge badge-soft badge-error w-full py-4">
                    {serverError}
                </div>
            )}

            <div className="form-control">
                <label className="label">
                    <span className="label-text text-sm">Email</span>
                </label>
                <input
                    placeholder="Nhập Email"
                    className={`input w-full ${errors.email ? "input-error" : ""}`}
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    disabled={submitting}
                />
                {errors.email && <span className="text-error text-sm mt-1">{errors.email}</span>}
            </div>

            <div className="form-control">
                <label className="label">
                    <span className="label-text text-sm">Mật khẩu</span>
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Nhập Mật khẩu"
                        className={`input w-full pr-12 ${errors.password ? "input-error" : ""}`}
                        value={form.password}
                        onChange={(e) => setField("password", e.target.value)}
                        disabled={submitting}
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword((v) => !v)}
                    >
                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                </div>
                {errors.password && <span className="text-error text-sm mt-1">{errors.password}</span>}
            </div>

            <button
                className="btn btn-primary w-full uppercase my-4"
                type="submit"
                disabled={submitting}
            >
                Đăng nhập
            </button>

            <div className="flex justify-end">
                <button type="button" className="link link-hover text-sm" onClick={() => MyAlert.alert('Tính năng chưa phát triển', 'Vui lòng đợi cập nhật trong tương lai')}>
                    Quên mật khẩu?
                </button>
            </div>

            <div className="divider my-2" />

            <div className="text-center space-y-2">
                <p className="text-sm">Bạn chưa có tài khoản?</p>
                <button
                    type="button"
                    className="btn btn-outline btn-primary w-full"
                    onClick={onSwitch}
                    disabled={submitting}
                >
                    Đăng ký
                </button>
            </div>
        </form>
    );
}

function RegisterForm({ onRegister, onSwitch, serverError }) {
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        gender: "",
        date_of_birth: "",
        password: "",
        confirm_password: "",
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [agree, setAgree] = useState(false);
    const serverErrorRef = useRef(serverError);
    useEffect(() => { serverErrorRef.current = serverError; }, [serverError]);

    const setField = (name, value) => {
        setForm((p) => ({ ...p, [name]: value }));
        setErrors((p) => ({ ...p, [name]: undefined }));
    };

    const validate = () => {
        const next = {};
        if (!form.first_name.trim()) next.first_name = emptyFieldError;
        if (!form.last_name.trim()) next.last_name = emptyFieldError;
        if (!form.email.trim())
            next.email = emptyFieldError;
        else if (!emailRegex.test(form.email.trim()))
            next.email = "Email không đúng định dạng";
        if (!form.phone_number.trim())
            next.phone_number = emptyFieldError;
        else if (!phoneRegex.test(form.phone_number.trim()))
            next.phone_number = "Số điện thoại chỉ chứa 10 chữ số và bắt đầu bằng 0";
        if (!form.gender) next.gender = emptyFieldError;
        if (!form.date_of_birth) next.date_of_birth = emptyFieldError;
        if (!form.password)
            next.password = emptyFieldError;
        else if (!passwordRegex.test(form.password.trim()))
            next.password = "Mật khẩu phải chứa ít nhất 8 kí tự, bao gồm chữ hoa, chữ thường, số và kí tự đặc biệt"
        if (form.confirm_password !== form.password)
            next.confirm_password = "Mật khẩu không khớp.";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        try {
            await onRegister?.(form);
            console.log(MyAlert);
            await MyAlert.alert("Đăng ký thành công", "Vui lòng đăng nhập để tiếp tục", [
                { text: "Đăng nhập", style: "primary", onPress: () => onSwitch() },
            ])
        } catch {
            //
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-2">
            {submitting && <GlobalLoading message="Đang đăng ký..." />}

            {serverError && (
                <div className="badge badge-soft badge-error w-full py-4">
                    {serverError}
                </div>
            )}

            <div className="form-control">
                <label className="label"><span className="label-text text-sm">Họ</span></label>
                <input
                    placeholder="Nhập họ"
                    className={`input w-full ${errors.last_name ? "input-error" : ""}`}
                    value={form.last_name}
                    onChange={(e) => setField("last_name", e.target.value)}
                    disabled={submitting}
                />
                {errors.last_name && <span className="text-error text-sm mt-1">{errors.last_name}</span>}
            </div>

            <div className="form-control">
                <label className="label"><span className="label-text text-sm">Tên</span></label>
                <input
                    placeholder="Nhập tên"
                    className={`input w-full ${errors.first_name ? "input-error" : ""}`}
                    value={form.first_name}
                    onChange={(e) => setField("first_name", e.target.value)}
                    disabled={submitting}
                />
                {errors.first_name && <span className="text-error text-sm mt-1">{errors.first_name}</span>}
            </div>

            <div className="form-control">
                <label className="label"><span className="label-text text-sm">Email</span></label>
                <input
                    placeholder="Nhập Email"
                    className={`input w-full ${errors.email ? "input-error" : ""}`}
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    disabled={submitting}
                />
                {errors.email && <span className="text-error text-sm mt-1">{errors.email}</span>}
            </div>

            <div className="form-control">
                <label className="label"><span className="label-text text-sm">Số điện thoại</span></label>
                <input
                    placeholder="Nhập Số điện thoại"
                    className={`input w-full ${errors.phone_number ? "input-error" : ""}`}
                    value={form.phone_number}
                    onChange={(e) => setField("phone_number", e.target.value)}
                    disabled={submitting}
                />
                {errors.phone_number && <span className="text-error text-sm mt-1">{errors.phone_number}</span>}
            </div>

            <div className="form-control">
                <label className="label"><span className="label-text text-sm">Giới tính</span></label>
                <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="gender"
                            className="radio radio-primary radio-sm"
                            checked={form.gender === "MALE"}
                            onChange={() => setField("gender", "MALE")}
                            disabled={submitting}
                        />
                        Nam
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="gender"
                            className="radio radio-primary radio-sm"
                            checked={form.gender === "FEMALE"}
                            onChange={() => setField("gender", "FEMALE")}
                            disabled={submitting}
                        />
                        Nữ
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="gender"
                            className="radio radio-primary radio-sm"
                            checked={form.gender === "OTHER"}
                            onChange={() => setField("gender", "OTHER")}
                            disabled={submitting}
                        />
                        Khác
                    </label>
                </div>
                {errors.gender && <span className="text-error text-sm mt-1">{errors.gender}</span>}
            </div>

            <div className="form-control">
                <label className="label"><span className="label-text text-sm">Ngày sinh</span></label>
                <input
                    type="date"
                    className={`input w-full ${errors.date_of_birth ? "input-error" : ""}`}
                    value={form.date_of_birth || ""}
                    onChange={(e) => setField("date_of_birth", e.target.value)}
                    disabled={submitting}
                    max={new Date().toISOString().split("T")[0]}
                />
                {errors.date_of_birth && <span className="text-error text-sm mt-1">{errors.date_of_birth}</span>}
            </div>

            <div className="form-control">
                <label className="label"><span className="label-text text-sm">Mật khẩu</span></label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Nhập Mật khẩu"
                        className={`input w-full pr-12 ${errors.password ? "input-error" : ""}`}
                        value={form.password}
                        onChange={(e) => setField("password", e.target.value)}
                        disabled={submitting}
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword((v) => !v)}
                    >
                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                </div>
                {errors.password && <span className="text-error text-sm mt-1">{errors.password}</span>}
            </div>

            <div className="form-control">
                <label className="label"><span className="label-text text-sm">Nhập lại mật khẩu</span></label>
                <div className="relative">
                    <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Nhập lại Mật khẩu"
                        className={`input w-full pr-12 ${errors.confirm_password ? "input-error" : ""}`}
                        value={form.confirm_password}
                        onChange={(e) => setField("confirm_password", e.target.value)}
                        disabled={submitting}
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        onClick={() => setShowConfirm((v) => !v)}
                    >
                        {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                </div>
                {errors.confirm_password && <span className="text-error text-sm mt-1">{errors.confirm_password}</span>}
            </div>

            <div className="form-control">
                <label className="label cursor-pointer justify-start gap-2">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={agree}
                        onChange={() => setAgree(prev => !prev)}
                        disabled={submitting}
                    />
                    <span className="label-text text-sm wrap-break-word whitespace-normal">
                        Bằng việc đăng ký tài khoản, tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.
                    </span>
                </label>
            </div>

            <button
                className="btn btn-primary w-full uppercase"
                type="submit"
                disabled={!agree || submitting}
            >
                Đăng ký
            </button>

            <div className="divider my-2" />

            <div className="text-center space-y-2">
                <p className="text-sm">Bạn đã có tài khoản?</p>
                <button
                    type="button"
                    className="btn btn-outline btn-primary w-full"
                    onClick={onSwitch}
                    disabled={submitting}
                >
                    Đăng nhập
                </button>
            </div>
        </form>
    );
}