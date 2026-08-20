import { Outlet } from "react-router-dom";

const ManagerDashboard = () => {
    return (
        <div className="min-h-screen bg-base-200/40">
            <div className="max-w-7xl mx-auto sm:px-2 py-6">
                <main className="flex-1 min-w-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default ManagerDashboard;