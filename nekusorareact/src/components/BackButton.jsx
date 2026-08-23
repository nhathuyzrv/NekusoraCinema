import { ArrowLeft } from "lucide-react";

const BackButton = ({ label = 'Quay lại', onClick }) => {
    return (
        <button
            className="not-sm:hidden btn btn-ghost btn-sm mb-2"
            onClick={onClick}
        >
            <ArrowLeft size={16} />
            {label}
        </button>
    )
}

export default BackButton