import { Link } from "react-router-dom";
import CompanyAvatar from "../CompanyAvatar";
import ReminderBadge from "../ReminderBadge";
import { useNotification } from "../../contexts/NotificationContext";
import { useCompanyBranding } from "../../contexts/CompanyBrandingContext";

type ArenaHomeLinkProps = {
  sizeClass?: string;
  roundedClass?: string;
};

function ArenaHomeLink({
  sizeClass = "size-12",
  roundedClass = "rounded-md",
}: ArenaHomeLinkProps) {
  const { unreadCount, reminderDate } = useNotification();
  const { companyName } = useCompanyBranding();
  const homeLabel = companyName ? `Início, ${companyName}` : "Início";

  return (
    <div className="relative shrink-0">
      <Link
        to="/reservas"
        aria-label={homeLabel}
        className="block rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
      >
        <CompanyAvatar sizeClass={sizeClass} roundedClass={roundedClass} decorative />
      </Link>
      {unreadCount > 0 ? (
        <Link
          to="/notificacoes"
          state={reminderDate ? { date: reminderDate } : undefined}
          aria-label={`${unreadCount} lembrete${unreadCount > 1 ? "s" : ""} não lido${unreadCount > 1 ? "s" : ""}`}
          className="absolute -right-1.5 -top-1.5 z-10 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
        >
          <span aria-hidden>
            <ReminderBadge count={unreadCount} />
          </span>
        </Link>
      ) : null}
    </div>
  );
}

export default ArenaHomeLink;
