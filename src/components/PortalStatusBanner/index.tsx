import { Link } from "react-router-dom";
import type { PortalStatus } from "../../utils/portalVisibility";
import {
  billingNavLabel,
  billingNavPath,
} from "../../utils/billingNav";
import { buttonClassName } from "../Button";

type Props = {
  status: PortalStatus;
  /** CTA quando falta ativar quadra. */
  showActivateCourtsCta?: boolean;
  /** CTA quando o bloqueio é de plano/acesso. */
  showBillingCta?: boolean;
  entitlement?: "trial" | "paid" | "none" | null;
  className?: string;
};

export default function PortalStatusBanner({
  status,
  showActivateCourtsCta = false,
  showBillingCta = false,
  entitlement = null,
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-xl px-3.5 py-3 ${
        status.onSite
          ? "bg-accent-green/15 text-accent-green"
          : "bg-master-light text-text-light/80"
      } ${className}`}
      role="status"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            status.onSite
              ? "bg-accent-green/25 text-accent-green"
              : "bg-text-light/10 text-text-light/65"
          }`}
        >
          {status.label}
        </span>
        <p className="text-sm leading-snug text-inherit opacity-90">
          {status.reason}
        </p>
      </div>
      {(showActivateCourtsCta || showBillingCta) && !status.onSite ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {showActivateCourtsCta ? (
            <Link
              to="/quadras"
              className={buttonClassName({
                variant: "primary",
                size: "md",
                fullWidth: false,
                className: "inline-flex !min-h-10 px-3 text-sm",
              })}
            >
              Ativar no site
            </Link>
          ) : null}
          {showBillingCta ? (
            <Link
              to={billingNavPath(entitlement)}
              className={buttonClassName({
                variant: "secondary",
                size: "md",
                fullWidth: false,
                className: "inline-flex !min-h-10 px-3 text-sm",
              })}
            >
              {entitlement === "paid"
                ? "Ver mensalidades"
                : `Ver ${billingNavLabel(entitlement).toLowerCase()}`}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
