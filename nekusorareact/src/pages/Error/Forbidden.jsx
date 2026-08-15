import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

const Forbidden = () => {
    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 bg-base-200">
            <div className="w-full max-w-md">
                <div className="relative bg-base-100 rounded-2xl shadow-xl overflow-hidden border-t-4 border-error">
                    <div className="grid grid-cols-[1fr_auto]">
                        <div className="p-8 sm:p-10">
                            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-error/70 uppercase mb-6">
                                <ShieldAlert size={14} />
                                <span>FORBIDDEN</span>
                            </div>

                            <p className="font-mono text-7xl sm:text-8xl font-black leading-none text-error tracking-tight">
                                403
                            </p>

                            <h1 className="mt-4 text-xl font-bold text-base-content">
                                Bạn không có quyền truy cập vào khu vực này
                            </h1>
                            <p className="mt-2 text-sm text-base-content/60 leading-relaxed">
                                Tài khoản của bạn không được cấp quyền truy cập trang này.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link to="/" className="btn btn-primary btn-sm gap-2">
                                    Về trang chủ
                                </Link>
                            </div>
                        </div>

                        <div className="w-24 sm:w-28 bg-error/10 flex flex-col items-center justify-center gap-3 border-l border-dashed border-error/30 py-8">
                            <span
                                className="font-mono text-[16px] tracking-widest text-error/60 uppercase"
                                style={{ writingMode: "vertical-rl" }}
                            >
                                ERR - 403 - FORBIDDEN
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Forbidden;