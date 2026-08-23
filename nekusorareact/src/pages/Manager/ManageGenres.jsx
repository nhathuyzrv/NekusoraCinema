import { useState } from "react";
import { Plus, Pencil, X, Check, Loader2 } from "lucide-react";
import { useManageGenres, useCreateGenre, useUpdateGenre } from "../../hooks/useManagement";
import { useToast } from "../../hooks/useToast";
import { formatDateTime } from "../../utils/DateTime";
import { useAuth } from "../../hooks/useAuth";
import Configs from "../../configs/Configs";
import BackButton from "../../components/BackButton";
import { useNavigate } from "react-router-dom";

const GenreRow = ({ genre }) => {
    const { hasStaffPosition } = useAuth();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(genre.name);
    const [slug, setSlug] = useState(genre.slug);
    const { mutate: updateGenre, isPending } = useUpdateGenre();
    const toast = useToast();

    const handleSave = async () => {
        if (!name.trim() || !slug.trim()) {
            toast.warning("Vui lòng nhập đầy đủ thông tin");
            return;
        }
        updateGenre({ id: genre.id, data: { name: name.trim(), slug: slug.trim() } }, {
            onSuccess: () => {
                setEditing(false);
            },
        });
    };

    return (
        <tr className="hover:bg-base-200/50">
            <td className="py-3 px-4 text-sm text-base-content/50">{genre.id}</td>
            <td className="py-3 px-4">
                {editing ? (
                    <input
                        className="input input-sm input-bordered w-full max-w-xs"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        disabled={isPending}
                        autoFocus
                    />
                ) : (
                    <span className="font-medium">{genre.name}</span>
                )}
            </td>
            <td className="py-3 px-4">
                {editing ? (
                    <input
                        className="input input-sm input-bordered w-full max-w-xs"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        disabled={isPending}
                        autoFocus
                    />
                ) : (
                    <span className="font-medium">{genre.slug}</span>
                )}
            </td>
            <td className="py-3 px-4 text-sm text-base-content/50">{formatDateTime(genre.updated_at)}</td>
            {hasStaffPosition(Configs.STAFF_POSITIONS.SYSTEM_MANAGER) &&
                <td className="py-3 px-4">
                    <div className="flex gap-1 justify-end">
                        {editing ? (
                            <>
                                <button
                                    className="btn btn-sm btn-success btn-ghost"
                                    onClick={handleSave}
                                    disabled={isPending}
                                >
                                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                </button>
                                <button className="btn btn-sm btn-ghost" onClick={() => { setEditing(false); setName(genre.name); }}>
                                    <X size={14} />
                                </button>
                            </>
                        ) : (
                            <button className="btn btn-sm btn-ghost" onClick={() => setEditing(true)}>
                                <Pencil size={14} />
                            </button>
                        )}
                    </div>
                </td>
            }
        </tr>
    );
};

const ManageGenres = () => {
    const navigate = useNavigate();
    const { hasStaffPosition } = useAuth();
    const { data: genres, isLoading } = useManageGenres();
    const { mutate: createGenre, isPending } = useCreateGenre();
    const [newName, setNewName] = useState("");
    const [adding, setAdding] = useState(false);
    const toast = useToast();

    const handleCreate = async () => {
        if (!newName.trim()) {
            toast.warning("Vui lòng nhập đầy đủ thông tin");
            return;
        }
        createGenre({ name: newName.trim() }, {
            onSuccess: () => {
                setNewName("");
                setAdding(false);
            },
        });
    };

    return (
        <>
            <BackButton label={"Quản lý"} onClick={() => navigate("/manage/")} />

            <div className="px-2 card bg-base-100 border border-base-200">
                <div className="card-body p-0">
                    <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-base-200">
                        <h2 className="text-lg font-bold">Quản Lý Thể Loại Phim</h2>
                        {hasStaffPosition(Configs.STAFF_POSITIONS.SYSTEM_MANAGER) &&
                            <button className="btn btn-primary btn-sm gap-1" onClick={() => setAdding(true)}>
                                <Plus size={16} />
                            </button>
                        }
                    </div>

                    {adding && (
                        <div className="flex items-center gap-2 px-5 py-3 bg-base-200/50 border-b border-base-200">
                            <input
                                className="input input-sm input-bordered flex-1"
                                placeholder="Tên thể loại..."
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                disabled={isPending}
                                autoFocus
                            />
                            <button className="btn btn-sm btn-primary" onClick={handleCreate} disabled={isPending}>
                                {isPending ? <Loader2 size={14} className="animate-spin" /> : "Lưu"}
                            </button>
                            <button className="btn btn-sm btn-ghost" onClick={() => { setAdding(false); setNewName(""); }}>
                                Hủy
                            </button>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr className="border-b border-base-200">
                                    <th className="py-3 px-4 text-xs text-base-content/50 font-semibold w-16">ID</th>
                                    <th className="py-3 px-4 text-xs text-base-content/50 font-semibold">Tên</th>
                                    <th className="py-3 px-4 text-xs text-base-content/50 font-semibold">Slug</th>
                                    <th className="py-3 px-4 text-xs text-base-content/50 font-semibold">Cập nhật lần cuối</th>
                                    {hasStaffPosition(Configs.STAFF_POSITIONS.SYSTEM_MANAGER) &&
                                        <th className="py-3 px-4 w-24"></th>
                                    }
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={4} className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></td></tr>
                                ) : genres?.results?.length === 0 || genres?.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-10 text-base-content/40">Không có thể loại nào</td></tr>
                                ) : (
                                    (genres?.results || genres || []).map((g) => <GenreRow key={g.id} genre={g} />)
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ManageGenres;