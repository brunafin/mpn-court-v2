import { BsBell } from "react-icons/bs";
import { Link } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";

function Notifications() {
    const { unreadCount } = useNotification();

    return (
        <Link to="/notificacoes" className="flex items-center gap-4">
            <BsBell className="text-neutral-800" size={24} />
            {unreadCount && unreadCount > 0 && (
                <span className="bg-danger-500 font-bold text-xs text-neutral-100 w-6 h-4 rounded-md flex items-center justify-center relative right-6 bottom-2">{unreadCount}</span>
            )}
        </Link>
    );
}

export default Notifications;