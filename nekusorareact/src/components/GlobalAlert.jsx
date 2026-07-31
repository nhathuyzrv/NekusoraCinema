import { useEffect, useRef, useState, useCallback } from "react";
import { registerAlertHandler } from "../configs/MyAlert";

const GlobalAlert = () => {
    const ref = useRef(null);
    const resolveRef = useRef(null);

    const [config, setConfig] = useState(null);

    const close = useCallback((value) => {
        const dialog = ref.current;
        if (dialog?.open) dialog.close();
        if (resolveRef.current) {
            resolveRef.current(value);
            resolveRef.current = null;
        }
    }, []);

    useEffect(() => {
        registerAlertHandler((title, content, buttons) => {
            const finalButtons =
                buttons && buttons.length > 0 ? buttons : [{ text: "OK", style: "primary" }];
            setConfig({ title, content, buttons: finalButtons });
            return new Promise((resolve) => {
                resolveRef.current = resolve;
            });
        });
    }, []);

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog || !config) return;
        if (!dialog.open) dialog.showModal();
    }, [config]);

    useEffect(() => {
        const blockEsc = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        };
        document.addEventListener("keydown", blockEsc, true);
        return () => document.removeEventListener("keydown", blockEsc, true);
    }, []);

    const handleCancel = (e) => {
        e.preventDefault();
    };

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        const handleClose = () => {
            if (resolveRef.current && config) {
                dialog.showModal();
            }
        };
        dialog.addEventListener("close", handleClose);
        return () => dialog.removeEventListener("close", handleClose);
    }, [config]);

    if (!config) return <dialog ref={ref} className="modal" onCancel={handleCancel} />;

    const { title, content, buttons } = config;

    return (
        <dialog ref={ref} className="modal" onCancel={handleCancel}>
            <div className="modal-box">
                {title && <h3 className="font-bold text-lg">{title}</h3>}
                {content && <p className="py-4 text-sm text-base-content/90">{content}</p>}

                <div className="modal-action">
                    {buttons.map((btn, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className={`btn ${btn.style === "primary" ? "btn-primary" : ""} ${btn.style === "error" ? "btn-error" : ""} ${btn.style === "ghost" ? "btn-ghost" : ""}`}
                            onClick={() => {
                                btn.onPress?.();
                                close(btn.text);
                            }}
                        >
                            {btn.text}
                        </button>
                    ))}
                </div>
            </div>
        </dialog>
    );
}

export default GlobalAlert;