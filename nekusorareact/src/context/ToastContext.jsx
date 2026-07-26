import { X } from "lucide-react";
import { createContext, useCallback, useRef, useState } from "react";

const ToastContext = createContext();
const MAX_TOASTS = 3;
const DURATION = 4000;

export function ToastProvider({ children, headerHeight = 64 }) {
    const [toasts, setToasts] = useState([]);
    const counterRef = useRef(0);

    const remove = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const push = useCallback((type, title, message) => {
        const id = ++counterRef.current;

        setToasts((prev) => {
            const next = prev.length >= MAX_TOASTS ? prev.slice(1) : prev;
            return [...next, { id, type, title, message }];
        });

        setTimeout(() => remove(id), DURATION);
        return id;
    }, [remove]);

    const toast = {
        success: (title, message) => push("success", title, message),
        error: (title, message) => push("error", title, message),
        warning: (title, message) => push("warning", title, message),
        info: (title, message) => push("info", title, message),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} onRemove={remove} headerHeight={headerHeight} />
        </ToastContext.Provider>
    );
}

const TYPE_STYLES = {
    success: {
        icon: "✓",
        iconClass: "bg-success/20 text-success",
        bar: "bg-success",
    },
    error: {
        icon: "✕",
        iconClass: "bg-error/20 text-error",
        bar: "bg-error",
    },
    warning: {
        icon: "!",
        iconClass: "bg-warning/20 text-warning",
        bar: "bg-warning",
    },
    info: {
        icon: "i",
        iconClass: "bg-info/20 text-info",
        bar: "bg-info",
    },
};

function ToastContainer({ toasts, onRemove, headerHeight }) {
    return (
        <div
            className="fixed right-4 z-9998 flex flex-col gap-2 w-80"
            style={{ top: headerHeight + 12 }}
        >
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onRemove={onRemove} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onRemove }) {
    const s = TYPE_STYLES[toast.type] || TYPE_STYLES.info;

    return (
        <div
            className="relative flex items-center gap-3 bg-base-100 border border-base-300 rounded-xl px-4 py-3 shadow-md overflow-hidden"
            style={{ animation: "slideInRight 0.28s cubic-bezier(0.34,1.2,0.64,1) both" }}
        >
            <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${s.iconClass}`}>
                {s.icon}
            </span>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-base-content leading-snug">{toast.title}</p>
                {toast.message && (
                    <p className="text-xs text-base-content/80 mt-0.5 leading-relaxed">{toast.message}</p>
                )}
            </div>

            <button
                className="text-base-content/40 hover:text-base-content text-sm leading-none shrink-0 mt-0.5"
                onClick={() => onRemove(toast.id)}
            >
                <X />
            </button>

            <span
                className={`absolute bottom-0 left-0 h-0.5 ${s.bar}`}
                style={{ animation: `shrinkWidth ${DURATION}ms linear forwards` }}
            />
        </div>
    );
}

export default ToastContext;