import { useEffect, useRef } from "react";

export default function GlobalLoading({ message = "Chờ xíu..." }) {
    const ref = useRef(null);

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (!dialog.open) dialog.showModal();
        return () => { if (dialog.open) dialog.close(); };
    }, []);

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

    return (
        <dialog ref={ref} className="modal">
            <div className="bg-base-200 border border-base-300 rounded-2xl px-10 py-6 flex flex-col items-center gap-4 min-w-30">
                <span className="loading loading-bars loading-md text-primary" />
                <p className="text-xs text-base-content/80">{message}</p>
            </div>
        </dialog>
    );
}