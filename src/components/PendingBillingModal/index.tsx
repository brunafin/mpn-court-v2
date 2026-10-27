import { useCallback, useEffect, useState } from "react";
import { BsX } from "react-icons/bs";
import { Link, useLocation } from "react-router-dom";
import { getBillingSummary } from "../../api/billing";
import { useCompanyPublicId } from "../../hooks/useCompanyPublicId";
import { buttonClassName } from "../Button";
import { useCompanyCapabilities } from "../../contexts/CompanyBrandingContext";

const DISMISS_PREFIX = "mpn_billing_remind_";

function formatBrDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function PendingBillingModal() {
  const location = useLocation();
  const caps = useCompanyCapabilities();
  const companyPublicId = useCompanyPublicId();
  const [reminder, setReminder] = useState<{
    paymentId: number;
    dueDate: string;
    suspendsOn: string;
    daysAfterDue: number;
  } | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!companyPublicId) return;
    if (caps.ready && (caps.accessMode === "read_only" || !caps.canPayBilling)) {
      setOpen(false);
      return;
    }
    const onBilling =
      location.pathname.startsWith("/mensalidades") ||
      location.pathname.startsWith("/planos");
    if (onBilling) {
      setOpen(false);
      return;
    }
    try {
      const data = await getBillingSummary(companyPublicId);
      const next = data.delinquencyReminder;
      setReminder(next);
      if (!next) {
        setOpen(false);
        return;
      }
      const dismissed =
        localStorage.getItem(
          `${DISMISS_PREFIX}${next.paymentId}_${next.daysAfterDue}`,
        ) === "1";
      setOpen(!dismissed);
    } catch {
      // modal é best-effort
    }
  }, [
    location.pathname,
    caps.ready,
    caps.accessMode,
    caps.canPayBilling,
    companyPublicId,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!open || !reminder) return null;

  const dismiss = () => {
    localStorage.setItem(
      `${DISMISS_PREFIX}${reminder.paymentId}_${reminder.daysAfterDue}`,
      "1",
    );
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pending-billing-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-master p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <p
            id="pending-billing-title"
            className="text-lg font-bold text-text-light"
          >
            Mensalidade pendente
          </p>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Fechar"
            className="mpn-tap-solid flex size-11 shrink-0 items-center justify-center rounded-full bg-master-light text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <BsX size={24} aria-hidden />
          </button>
        </div>
        <p className="mt-2 text-base leading-6 text-text-light/70">
          Sua mensalidade do dia {formatBrDate(reminder.dueDate)} está em
          aberto.
        </p>
        <p className="mt-3 text-base leading-6 text-text-light/70">
          A partir de{" "}
          <span className="font-bold text-text-light">
            {formatBrDate(reminder.suspendsOn)}
          </span>
          , as ações de reservar, cancelar e alterar horários ficarão
          temporariamente suspensas.
        </p>
        <p className="mt-3 text-base leading-6 text-text-light/70">
          Após a confirmação do pagamento, tudo continua funcionando
          normalmente.
        </p>
        <Link
          to="/mensalidades"
          className={`${buttonClassName({ variant: "primary", size: "md" })} mt-5 text-center`}
          onClick={dismiss}
        >
          Regularizar pagamento
        </Link>
      </div>
    </div>
  );
}

export default PendingBillingModal;
