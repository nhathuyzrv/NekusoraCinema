import { useState, useRef } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { FileDown, Loader2 } from "lucide-react";
import { useStatsOverview, useStatsByMonth, useStatsByMovie, useStatsByBranch, useStatsByShowtime } from "../../hooks/useStats";
import { formatMoney } from "../../utils/Money";
import { useBranches, useManageMovies } from "../../hooks/useManagement";
import { useAuth } from "../../hooks/useAuth";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

const NOW_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => NOW_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const TABS = [
    { key: "revenue", label: "Tổng quan" },
    { key: "movies", label: "DT theo phim" },
    { key: "branches", label: "DT theo chi nhánh" },
    { key: "showtimes", label: "DT theo suất chiếu" },
];

function StatCard({ label, value, color = "border-primary" }) {
    return (
        <div className={`bg-base-100 border border-base-200 border-l-4 ${color} rounded-xl p-5`}>
            <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-2xl font-bold text-base-content">{value}</p>
        </div>
    );
}

function SectionTitle({ children }) {
    return <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-widest mb-4">{children}</h3>;
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-base-content/40 gap-2">
            <p className="text-sm">Không có dữ liệu</p>
        </div>
    );
}

const RevenueTab = ({ params, printRef }) => {
    const { data: overview, isPending: l1 } = useStatsOverview(params);
    const { data: byMonth, isPending: l2 } = useStatsByMonth(params);

    if (l1 || l2) return <div className="flex justify-center py-16"><Loader2 className="animate-spin" /></div>;
    if (!byMonth?.length) return <EmptyState />;

    return (
        <div ref={printRef} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Tổng doanh thu" value={formatMoney(overview?.total_revenue)} color="border-success" />
                <StatCard label="Số đơn đã thanh toán" value={overview?.total_bookings} color="border-info" />
                <StatCard label="Số vé bán ra" value={overview?.total_tickets} />
                <StatCard label="Doanh thu bắp/nước" value={formatMoney(overview?.total_product_revenue)} color="border-warning" />
                <StatCard label="Lượt dùng khuyến mãi" value={overview?.total_promotions_used} />
                <StatCard label="Tổng điểm đã dùng" value={overview?.total_points_used} />
            </div>

            <div className="bg-base-100 border border-base-200 rounded-xl p-5">
                <SectionTitle>Doanh thu theo tháng</SectionTitle>
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={byMonth}>
                        <XAxis dataKey="month" tickFormatter={(v) => `T${v}`} />
                        <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                        <Tooltip formatter={(v) => formatMoney(v)} labelFormatter={(v) => `Tháng ${v}`} />
                        <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} name="Doanh thu" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-base-100 border border-base-200 rounded-xl p-5">
                <SectionTitle>Số đơn đã thanh toán theo tháng</SectionTitle>
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={byMonth}>
                        <XAxis dataKey="month" tickFormatter={(v) => `T${v}`} />
                        <YAxis allowDecimals={false} />
                        <Tooltip labelFormatter={(v) => `Tháng ${v}`} />
                        <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Số đơn" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const MoviesTab = ({ params, printRef }) => {
    const { data, isPending } = useStatsByMovie(params);

    if (isPending) return <div className="flex justify-center py-16"><Loader2 className="animate-spin" /></div>;
    if (!data?.length) return <EmptyState />;

    return (
        <div ref={printRef} className="space-y-6">
            <div className="bg-base-100 border border-base-200 rounded-xl p-5">
                <SectionTitle>Top 15 phim có doanh thu cao nhất</SectionTitle>
                <ResponsiveContainer width="100%" height={Math.max(300, data.length * 36)}>
                    <BarChart data={data} layout="vertical">
                        <XAxis type="number" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                        <YAxis type="category" dataKey="movie" width={window.innerWidth < 640 ? 100 : 160} tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }} />
                        <Tooltip formatter={(v) => formatMoney(v)} />
                        <Bar dataKey="revenue" radius={[0, 4, 4, 0]} name="Doanh thu">
                            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-base-100 border border-base-200 rounded-xl p-5">
                <SectionTitle>Chi tiết</SectionTitle>
                <table className="table table-zebra w-full text-sm">
                    <thead><tr><th>#</th><th>Phim</th><th>Số đơn</th><th>Doanh thu</th></tr></thead>
                    <tbody>
                        {data.map((r, i) => (
                            <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{r.movie}</td>
                                <td>{r.bookings}</td>
                                <td>{formatMoney(r.revenue)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const BranchesTab = ({ params, printRef }) => {
    const { data, isPending } = useStatsByBranch(params);

    if (isPending) return <div className="flex justify-center py-16"><Loader2 className="animate-spin" /></div>;
    if (!data?.length) return <EmptyState />;

    return (
        <div ref={printRef} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-base-100 border border-base-200 rounded-xl p-5">
                    <SectionTitle>Doanh thu theo chi nhánh</SectionTitle>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart id="revenue">
                            <Pie data={data.map(item => ({ ...item, revenue: Number(item.revenue) }))} dataKey="revenue" nameKey="branch" cx="50%" cy="50%" outerRadius={90} label={({ branch }) => branch}>
                                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v) => formatMoney(v)} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-base-100 border border-base-200 rounded-xl p-5">
                    <SectionTitle>Số đơn theo chi nhánh</SectionTitle>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart id="bookings">
                            <Pie data={data} dataKey="bookings" nameKey="branch" cx="50%" cy="50%" outerRadius={90} label={({ branch }) => branch}>
                                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-base-100 border border-base-200 rounded-xl p-5">
                <SectionTitle>Chi tiết</SectionTitle>
                <table className="table table-zebra w-full text-sm">
                    <thead><tr><th>Chi nhánh</th><th>Số đơn</th><th>Doanh thu</th></tr></thead>
                    <tbody>
                        {data.map((r, i) => (
                            <tr key={i}>
                                <td>{r.branch}</td>
                                <td>{r.bookings}</td>
                                <td>{formatMoney(r.revenue)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ShowtimesTab = ({ params, printRef }) => {
    const { data, isPending } = useStatsByShowtime(params);

    if (isPending) return <div className="flex justify-center py-16"><Loader2 className="animate-spin" /></div>;
    if (!data?.length) return <EmptyState />;

    return (
        <div ref={printRef}>
            <div className="bg-base-100 border border-base-200 rounded-xl p-5">
                <SectionTitle>Top 20 suất chiếu có doanh thu cao nhất</SectionTitle>
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full text-sm">
                        <thead>
                            <tr><th>#</th><th>Phim</th><th>Chi nhánh</th><th>Ngày</th><th>Giờ</th><th>Đơn</th><th>Vé</th><th>Doanh thu</th></tr>
                        </thead>
                        <tbody>
                            {data.map((r, i) => (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td>{r.movie}</td>
                                    <td>{r.branch}</td>
                                    <td>{r.show_date}</td>
                                    <td>{r.start_time?.slice(0, 5)}</td>
                                    <td>{r.bookings}</td>
                                    <td>{r.tickets}</td>
                                    <td>{formatMoney(r.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const TAB_COMPONENTS = {
    revenue: RevenueTab,
    movies: MoviesTab,
    branches: BranchesTab,
    showtimes: ShowtimesTab,
};

const Reports = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState("revenue");
    const [year, setYear] = useState(NOW_YEAR);
    const [month, setMonth] = useState("");
    const [branchId, setBranchId] = useState("");
    const [movieId, setMovieId] = useState("");
    const [exporting, setExporting] = useState(false);
    const printRef = useRef(null);

    const { data: branches, isPending: branchesPending } = useBranches();
    const { data: movies, isPending: moviesPending } = useManageMovies();

    const params = { year, ...(month && { month }), ...(branchId && { branch_id: branchId }), ...(movieId && { movie_id: movieId }) };

    const ActiveTab = TAB_COMPONENTS[tab];

    const handleExportPDF = async () => {
        if (!printRef.current) return;
        setExporting(true);
        try {
            const { toPng } = await import("html-to-image");
            const { default: jsPDF } = await import("jspdf");

            const tabLabel = TABS.find(t => t.key === tab)?.label ?? tab;

            const titleEl = document.createElement("div");
            titleEl.style.cssText = "font-size:18px;font-weight:bold;color:#1a1a1a;margin-bottom:12px;font-family:sans-serif";
            titleEl.innerHTML =
                `Báo cáo ${tabLabel} - Năm ${year}${month ? `, Tháng ${month}` : ""}
                <br/>
                Quản lý: ${user.last_name} ${user.first_name}
                <br/>
                Chi nhánh: ${user.staff_profile?.branch?.name}
                <br/>
                <br/>`;
            printRef.current.insertBefore(titleEl, printRef.current.firstChild);

            const imgData = await toPng(printRef.current, {
                quality: 1,
                pixelRatio: 2,
                backgroundColor: "#ffffff",
            });

            printRef.current.removeChild(titleEl);

            const img = new Image();
            img.src = imgData;
            await new Promise(r => img.onload = r);

            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const imgW = pageW - 20;
            const imgH = (img.height * imgW) / img.width;

            if (imgH <= pageH - 20) {
                pdf.addImage(imgData, "PNG", 10, 10, imgW, imgH);
            } else {
                let srcY = 0;
                const sliceHeightPx = Math.floor(((pageH - 20) * img.width) / imgW);
                while (srcY < img.height) {
                    const sliceH = Math.min(sliceHeightPx, img.height - srcY);
                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = img.width;
                    tempCanvas.height = sliceH;
                    tempCanvas.getContext("2d").drawImage(img, 0, srcY, img.width, sliceH, 0, 0, img.width, sliceH);
                    const sliceData = tempCanvas.toDataURL("image/png");
                    const sliceImgH = (sliceH * imgW) / img.width;
                    pdf.addImage(sliceData, "PNG", 10, 10, imgW, sliceImgH);
                    srcY += sliceH;
                    if (srcY < img.height) pdf.addPage();
                }
            }

            pdf.save(`nekusora_reports_${tab}_${year}${month ? `_${month}` : ""}.pdf`);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-5 px-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-xl font-bold">Báo cáo & Thống kê</h1>
                <button className="btn btn-sm btn-outline gap-2" onClick={handleExportPDF} disabled={exporting}>
                    {exporting ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
                    Xuất PDF
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-base-100 border border-base-200 rounded-xl p-3">
                <select className="select select-sm select-bordered not-sm:w-full" value={year} onChange={e => setYear(Number(e.target.value))}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select className="select select-sm select-bordered not-sm:w-full" value={month} onChange={e => setMonth(e.target.value)}>
                    <option value="">Tất cả tháng</option>
                    {MONTHS.map(m => <option key={m} value={m}>Tháng {m}</option>)}
                </select>
                {!branchesPending && (
                    <select className="select select-sm select-bordered not-sm:w-full" value={branchId} onChange={e => setBranchId(e.target.value)}>
                        <option value="">Tất cả chi nhánh</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                )}
                {!moviesPending && (
                    <select className="select select-sm select-bordered not-sm:w-full" value={movieId} onChange={e => setMovieId(e.target.value)}>
                        <option value="">Tất cả phim</option>
                        {movies.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
                    </select>
                )}
            </div>

            <div className="mx-auto flex gap-2 overflow-x-auto pb-1 px-1">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        className={`btn btn-sm shrink-0 ${tab === t.key ? "btn-primary" : "btn-ghost border border-base-300"}`}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <ActiveTab params={params} printRef={printRef} />
        </div>
    );
};

export default Reports;