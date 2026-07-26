export default function LocalLoading({ show, children }) {
    return (
        <div className="relative">
            {children}
            {show && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/35 rounded-[inherit]">
                    <span className="loading loading-bars loading-md text-primary" />
                </div>
            )}
        </div>
    );
}