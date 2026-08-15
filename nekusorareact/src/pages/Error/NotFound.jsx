import { Link } from "react-router-dom";
import { Film } from "lucide-react";

const NotFound = () => {
    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 bg-base-200">
            <div className="w-full max-w-md">
                <div className="relative bg-base-100 rounded-2xl shadow-xl overflow-hidden border-t-4 border-primary">
                    <div className="grid grid-cols-[1fr_auto]">
                        <div className="p-8 sm:p-10">
                            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-base-content/40 uppercase mb-6">
                                <Film size={14} />
                                <span>NOTFOUND</span>
                            </div>

                            <p className="font-mono text-7xl sm:text-8xl font-black leading-none text-primary tracking-tight">
                                404
                            </p>

                            <h1 className="mt-4 text-xl font-bold text-base-content">
                                Không tìm thấy trang này
                            </h1>
                            <p className="mt-2 text-sm text-base-content/60 leading-relaxed">
                                Có vẻ bạn đi lạc rồi
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link to="/" className="btn btn-primary btn-sm gap-2">
                                    Về trang chủ
                                </Link>
                            </div>
                        </div>

                        <div className="w-24 sm:w-28 bg-base-300 flex flex-col items-center justify-center gap-3 border-l border-dashed border-base-300 py-8">
                            <span
                                className="font-mono text-[16px] tracking-widest text-base-content/40 uppercase"
                                style={{ writingMode: "vertical-rl" }}
                            >
                                ERR - 404 - NOTFOUND
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NotFound;