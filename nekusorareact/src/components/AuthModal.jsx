import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, X, ArrowLeft, Mail, KeyRound, ShieldCheck } from "lucide-react";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { useResetPassword } from "../hooks/useResetPassword";
import GlobalLoading from "./GlobalLoading";
import MyAlert from "../configs/MyAlert";
import { useRegister } from "../hooks/useRegister";
import { Link } from "react-router-dom";

const emptyFieldError = "Trường này không được để trống";
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^0\d{9}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

function PasswordInput({ value, onChange, placeholder, error, disabled }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                type={show ? "text" : "password"}
                placeholder={placeholder}
                className={`input w-full pr-12 ${error ? "input-error" : ""}`}
                value={value}
                onChange={onChange}
                disabled={disabled}
            />
            <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                onClick={() => setShow(v => !v)}
                tabIndex={-1}
            >
                {show ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
        </div>
    );
}

function PasswordRules({ form }) {
    const passwordRules = [
        [/.{8,}/, "Ít nhất 8 ký tự"],
        [/[A-Z]/, "Có chữ hoa"],
        [/[a-z]/, "Có chữ thường"],
        [/\d/, "Có chữ số"],
        [/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, "Có ký tự đặc biệt"],
    ];

    return (
        <ul className="text-xs space-y-0.5 pl-1">
            {passwordRules.map(([regex, label]) => (
                <li key={label} className={`flex items-center gap-1.5 transition-colors ${regex.test(form.password) ? "text-success" : "text-base-content/40"}`}>
                    <span>{regex.test(form.password) ? "✓" : "·"}</span> {label}
                </li>
            ))}
        </ul>
    )
}

function ServerError({ msg }) {
    if (!msg) return null;
    return (
        <div className="badge badge-soft badge-error w-full py-4 text-sm">{msg}</div>
    );
}

const AuthModal = ({ onLogin }) => {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState("login");
    const { error, clearError } = useAuth();
    const resetPwHook = useResetPassword();
    const registerHook = useRegister();

    const close = useCallback(() => {
        setOpen(false);
        clearError();
        resetPwHook.reset();
        registerHook.reset();
    }, [clearError, resetPwHook.reset, registerHook.reset]); // eslint-disable-line react-hooks/exhaustive-deps

    const switchMode = useCallback((next) => {
        setMode(next);
        clearError();
        resetPwHook.reset();
        registerHook.reset();
    }, [clearError, resetPwHook.reset, registerHook.reset]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const modal = document.getElementById("auth_modal");
        if (!modal) return;
        modal.showModal = () => {
            const tab = modal.dataset.tab || "login";
            setMode(tab);
            clearError();
            resetPwHook.reset();
            registerHook.reset();
            setOpen(true);
        };
        modal.close = close;
    }, [close, clearError]); // eslint-disable-line react-hooks/exhaustive-deps

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
    }, [open]);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    const getTitle = () => {
        if (mode === "login") return "Đăng Nhập Tài Khoản";
        if (mode === "register") return registerHook.step === 2 ? "Xác Nhận Email" : "Đăng Ký Tài Khoản";
        return ({ 1: "Quên Mật Khẩu", 2: "Nhập Mã OTP", 3: "Đặt Mật Khẩu Mới" })[resetPwHook.step] ?? "Quên Mật Khẩu";
    };

    return (
        <>
            <div id="auth_modal" style={{ display: "none" }} />
            {open && createPortal(
                <div className="fixed inset-0 z-1000 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div className="relative z-10 w-11/12 max-w-sm max-h-[90dvh] overflow-y-auto bg-base-100 rounded-2xl shadow-xl">

                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10" onClick={close} aria-label="Đóng">
                            <X size={16} />
                        </button>

                        {mode === "forgot" && resetPwHook.step > 1 && resetPwHook.step < 4 && (
                            <button className="btn btn-sm btn-circle btn-ghost absolute left-2 top-2 z-10" onClick={resetPwHook.reset} aria-label="Quay lại">
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        {mode === "register" && registerHook.step === 2 && (
                            <button className="btn btn-sm btn-circle btn-ghost absolute left-2 top-2 z-10" onClick={registerHook.reset} aria-label="Quay lại">
                                <ArrowLeft size={16} />
                            </button>
                        )}

                        <div className="p-6">
                            <h3 className="text-xl font-bold text-center mb-6">{getTitle()}</h3>

                            {mode === "login" && (
                                <LoginForm onLogin={onLogin} onSwitch={() => switchMode("register")}
                                    onForgot={() => switchMode("forgot")} onClose={close} serverError={error} />
                            )}
                            {mode === "register" && (
                                <RegisterFlow hook={registerHook} onSwitch={() => switchMode("login")}
                                    onClose={(next) => next ? switchMode(next) : close()} />
                            )}
                            {mode === "forgot" && (
                                <ForgotPasswordFlow hook={resetPwHook} onBackToLogin={() => switchMode("login")} />
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

function LoginForm({ onLogin, onSwitch, onForgot, onClose, serverError }) {
    const [form, setForm] = useState({
        email: "",
        password: ""
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    const setField = (name, value) => {
        setForm(p => ({ ...p, [name]: value }));
        setErrors(p => ({ ...p, [name]: undefined }));
    };

    const validate = () => {
        const next = {};
        if (!form.email.trim()) next.email = emptyFieldError;
        else if (!emailRegex.test(form.email.trim())) next.email = "Email không đúng định dạng";
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
            toast.success("Đăng nhập thành công", "Chào mừng bạn quay trở lại");
            onClose?.();
        } catch {
            //
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-3">
            {submitting && <GlobalLoading message="Đang đăng nhập..." />}
            <ServerError msg={serverError} />

            <div className="form-control">
                <label className="label"><span className="label-text text-sm">Email</span></label>
                <input placeholder="Nhập Email" className={`input w-full ${errors.email ? "input-error" : ""}`}
                    value={form.email} onChange={e => setField("email", e.target.value)} disabled={submitting} />
                {errors.email && <span className="text-error text-xs mt-1">{errors.email}</span>}
            </div>

            <div className="form-control">
                <label className="label"><span className="label-text text-sm">Mật khẩu</span></label>
                <PasswordInput value={form.password} onChange={e => setField("password", e.target.value)}
                    placeholder="Nhập Mật khẩu" error={errors.password} disabled={submitting} />
                {errors.password && <span className="text-error text-xs mt-1">{errors.password}</span>}
            </div>

            <button className="btn btn-primary w-full uppercase" type="submit" disabled={submitting}>Đăng nhập</button>

            <div className="flex justify-end">
                <button type="button" className="link link-hover text-sm text-base-content/60" onClick={onForgot}>
                    Quên mật khẩu?
                </button>
            </div>

            <div className="divider my-1" />
            <div className="text-center space-y-2">
                <p className="text-sm">Bạn chưa có tài khoản?</p>
                <button type="button" className="btn btn-outline btn-primary w-full" onClick={onSwitch} disabled={submitting}>Đăng ký</button>
            </div>
        </form>
    );
}

function RegisterFlow({ hook, onSwitch, onClose }) {
    if (hook.step === 1) return <RegisterForm hook={hook} onSwitch={onSwitch} />;
    if (hook.step === 2) return <StepOtp hook={hook} onClose={onClose} />;
    return null;
}

function RegisterForm({ hook, onSwitch }) {
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        gender: "",
        date_of_birth: "",
        password: "",
        confirm_password: ""
    });
    const [agree, setAgree] = useState(false);
    const [errors, setErrors] = useState({});

    const setField = (name, value) => {
        setForm(p => ({ ...p, [name]: value }));
        setErrors(p => ({ ...p, [name]: undefined }));
    };

    const validate = () => {
        const next = {};
        if (!form.last_name.trim()) next.last_name = emptyFieldError;
        if (!form.first_name.trim()) next.first_name = emptyFieldError;
        if (!form.email.trim()) next.email = emptyFieldError;
        else if (!emailRegex.test(form.email.trim())) next.email = "Email không đúng định dạng";
        if (!form.phone_number.trim()) next.phone_number = emptyFieldError;
        else if (!phoneRegex.test(form.phone_number.trim())) next.phone_number = "Số điện thoại phải bao gồm 10 chữ số và bắt đầu bằng 0";
        if (!form.gender) next.gender = emptyFieldError;
        if (!form.date_of_birth) next.date_of_birth = emptyFieldError;
        if (!form.password) next.password = emptyFieldError;
        else if (!passwordRegex.test(form.password)) next.password = "Mật khẩu không đúng định dạng";
        if (form.confirm_password !== form.password) next.confirm_password = "Mật khẩu không khớp";
        if (!agree) next.agree = "Bạn phải đồng ý để tiếp tục";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            await hook.sendOtp(form);
        } catch {
            //
        }
    };

    return (
        <form onSubmit={submit} className="space-y-3">
            {hook.loading && <GlobalLoading message="Đang xử lý..." />}
            <ServerError msg={hook.error} />

            {[
                { label: "Họ", name: "last_name", placeholder: "Nhập họ" },
                { label: "Tên", name: "first_name", placeholder: "Nhập tên" },
                { label: "Email", name: "email", placeholder: "Nhập Email" },
                { label: "Số điện thoại", name: "phone_number", placeholder: "0xxxxxxxxx" },
            ].map(({ label, name, placeholder }) => (
                <div className="form-control" key={name}>
                    <label className="label"><span className="label-text text-sm">{label}</span></label>
                    <input placeholder={placeholder} className={`input w-full ${errors[name] ? "input-error" : ""}`}
                        value={form[name]} onChange={e => setField(name, e.target.value)} disabled={hook.loading} />
                    {errors[name] && <span className="text-error text-xs mt-1">{errors[name]}</span>}
                </div>
            ))}

            <div className="form-control">
                <label className="label"><span className="label-text text-sm">Giới tính</span></label>
                <div className="flex gap-6">
                    {[{ value: "MALE", label: "Nam" }, { value: "FEMALE", label: "Nữ" }, { value: "OTHER", label: "Khác" }].map(({ value, label }) => (
                        <label key={value} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="gender" className="radio radio-primary radio-sm"
                                checked={form.gender === value} onChange={() => setField("gender", value)} disabled={hook.loading} />
                            <span className="text-sm">{label}</span>
                        </label>
                    ))}
                </div>
                {errors.gender && <span className="text-error text-xs mt-1">{errors.gender}</span>}
            </div>

            <div className="form-control">
                <label className="label"><span className="label-text text-sm">Ngày sinh</span></label>
                <input type="date" className={`input w-full ${errors.date_of_birth ? "input-error" : ""}`}
                    value={form.date_of_birth} onChange={e => setField("date_of_birth", e.target.value)}
                    disabled={hook.loading} max={new Date().toISOString().split("T")[0]} />
                {errors.date_of_birth && <span className="text-error text-xs mt-1">{errors.date_of_birth}</span>}
            </div>

            {[
                { label: "Mật khẩu", name: "password", placeholder: "Nhập mật khẩu" },
                { label: "Nhập lại mật khẩu", name: "confirm_password", placeholder: "Nhập lại mật khẩu" },
            ].map(({ label, name, placeholder }) => (
                <div className="form-control" key={name}>
                    <label className="label"><span className="label-text text-sm">{label}</span></label>
                    <PasswordInput value={form[name]} onChange={e => setField(name, e.target.value)}
                        placeholder={placeholder} error={errors[name]} disabled={hook.loading} />
                    {errors[name] && <span className="text-error text-xs mt-1">{errors[name]}</span>}
                </div>
            ))}

            <PasswordRules form={form} />

            <div className="form-control">
                <label className="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" className="checkbox checkbox-sm checkbox-primary"
                        checked={agree} onChange={() => setAgree(p => !p)} disabled={hook.loading} />
                    <span className="label-text text-xs sm:text-sm whitespace-normal">
                        Bằng việc đăng ký, tôi đồng ý với <Link to="/terms" className="font-semibold text-info/80 hover:underline hover:underline-offset-3">Điều khoản dịch vụ</Link> và <Link to="/privacy" className="font-medium text-info/80 hover:underline hover:underline-offset-3">Chính sách bảo mật</Link>
                    </span>
                </label>
                {errors.agree && <span className="text-error text-xs">{errors.agree}</span>}
            </div>

            <button className="btn btn-primary w-full uppercase" type="submit" disabled={!agree || hook.loading}>Đăng ký</button>

            <div className="divider my-1" />
            <div className="text-center space-y-2">
                <p className="text-sm">Bạn đã có tài khoản?</p>
                <button type="button" className="btn btn-outline btn-primary w-full" onClick={onSwitch} disabled={hook.loading}>Đăng nhập</button>
            </div>
        </form >
    );
}

function ForgotPasswordFlow({ hook, onBackToLogin }) {
    if (hook.step === 1) return <StepEmail hook={hook} />;
    if (hook.step === 2) return <StepOtp hook={hook} />;
    if (hook.step === 3) return <StepNewPassword hook={hook} onBackToLogin={onBackToLogin} />;
    return null;
}

function StepEmail({ hook }) {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        if (!email.trim()) { setError(emptyFieldError); return; }
        if (!emailRegex.test(email.trim())) { setError("Email không đúng định dạng"); return; }
        setError("");
        try {
            await hook.sendOtp(email.trim());
        }
        catch {
            //
        }
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            {hook.loading && <GlobalLoading message="Đang xử lý..." />}
            <div className="flex flex-col items-center gap-2 pb-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail size={28} className="text-primary" />
                </div>
                <p className="text-sm text-base-content/60 text-center">
                    Nhập địa chỉ email của tài khoản để nhận mã OTP
                </p>
            </div>
            <ServerError msg={hook.error} />
            <div className="form-control">
                <label className="label"><span className="label-text text-sm">Email</span></label>
                <input placeholder="Nhập Email"
                    className={`input w-full ${(error || hook.error) ? "input-error" : ""}`}
                    value={email} onChange={e => { setEmail(e.target.value); setError(""); hook.clearError(); }}
                    disabled={hook.loading} />
                {error && <span className="text-error text-xs mt-1">{error}</span>}
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={hook.loading}>Tiếp tục</button>
        </form>
    );
}

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

function StepOtp({ hook, onClose }) {
    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
    const inputs = useRef([]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => setCooldown(c => c - 1), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    const handleChange = (i, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp];
        next[i] = val;
        setOtp(next);
        hook.clearError();
        if (val && i < OTP_LENGTH - 1) inputs.current[i + 1]?.focus();
    };

    const handleKeyDown = (i, e) => {
        if (e.key === "Backspace" && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        const next = [...otp];
        pasted.split("").forEach((ch, i) => { next[i] = ch; });
        setOtp(next);
        inputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    };

    const submit = async (e) => {
        e.preventDefault();
        const code = otp.join("");
        if (code.length < OTP_LENGTH) return;
        try {
            const result = await hook.verifyOtp(code);
            if (result?.success && onClose) {
                await MyAlert.alert("Đăng ký thành công", "Tài khoản của bạn đã được tạo. Vui lòng đăng nhập để tiếp tục.",
                    [{ text: "Đăng nhập", style: "primary", onClick: () => onClose("login") }]
                );
            }
        } catch {
            //
        };
    }

    const handleResend = async () => {
        try {
            await hook.resendOtp();
            setCooldown(RESEND_COOLDOWN);
            setOtp(Array(OTP_LENGTH).fill(""));
            inputs.current[0]?.focus();
        } catch {
            //
        };
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            {hook.loading && <GlobalLoading message="Đang xác thực..." />}
            <div className="flex flex-col items-center gap-2 pb-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShieldCheck size={28} className="text-primary" />
                </div>
                <p className="text-sm text-base-content/60 text-center">
                    Chúng tôi đã gửi mã OTP đến email của bạn. Vui lòng nhập OTP để tiếp tục.
                </p>
            </div>
            <ServerError msg={hook.error} />

            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                    <input key={i} ref={el => inputs.current[i] = el}
                        type="text" inputMode="numeric" maxLength={1}
                        className={`input w-11 h-12 text-center text-lg font-bold p-0
                            ${hook.error ? "input-error" : digit ? "input-primary" : ""}`}
                        value={digit}
                        onChange={e => handleChange(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        disabled={hook.loading} />
                ))}
            </div>

            <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-base-content/60">Chưa nhận được mã?</span>
                {cooldown > 0
                    ? <span className="text-base-content/40">Gửi lại sau {cooldown}s</span>
                    : <button type="button" className="link link-primary font-medium" onClick={handleResend} disabled={hook.loading}>Gửi lại OTP</button>
                }
            </div>

            <button className="btn btn-primary w-full" type="submit" disabled={hook.loading || otp.join("").length < OTP_LENGTH}>
                Xác nhận
            </button>
        </form>
    );
}

function StepNewPassword({ hook, onBackToLogin }) {
    const [form, setForm] = useState({
        password: "",
        confirm_password: ""
    });
    const [errors, setErrors] = useState({});

    const setField = (name, value) => {
        setForm(p => ({ ...p, [name]: value }));
        setErrors(p => ({ ...p, [name]: undefined }));
        hook.clearError();
    };

    const validate = () => {
        const next = {};
        if (!form.password) next.password = emptyFieldError;
        else if (!passwordRegex.test(form.password))
            next.password = "Mật khẩu không hợp lệ";
        if (!form.confirm_password) next.confirm_password = emptyFieldError;
        else if (form.confirm_password !== form.password) next.confirm_password = "Mật khẩu không đúng định dạng";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            await hook.resetPassword(form.password);
            await MyAlert.alert("Đặt lại mật khẩu thành công", "Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại để tiếp tục.",
                [{ text: "Đăng nhập", style: "primary", onClick: () => onBackToLogin() }]
            );
        } catch {
            //
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            {hook.loading && <GlobalLoading message="Đang đặt lại mật khẩu..." />}
            <div className="flex flex-col items-center gap-2 pb-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <KeyRound size={28} className="text-primary" />
                </div>
                <p className="text-sm text-base-content/60 text-center">Đặt mật khẩu mới cho tài khoản của bạn</p>
            </div>
            <ServerError msg={hook.error} />

            {[
                { label: "Mật khẩu mới", name: "password", placeholder: "Nhập mật khẩu mới" },
                { label: "Xác nhận mật khẩu", name: "confirm_password", placeholder: "Nhập lại mật khẩu mới" },
            ].map(({ label, name, placeholder }) => (
                <div className="form-control" key={name}>
                    <label className="label"><span className="label-text text-sm">{label}</span></label>
                    <PasswordInput value={form[name]} onChange={e => setField(name, e.target.value)}
                        placeholder={placeholder} error={errors[name]} disabled={hook.loading} />
                    {errors[name] && <span className="text-error text-xs mt-1">{errors[name]}</span>}
                </div>
            ))}

            <PasswordRules form={form} />

            <button className="btn btn-primary w-full" type="submit" disabled={hook.loading}>Đặt lại mật khẩu</button>
        </form>
    );
}

export default AuthModal;