import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BillingSummary,
  getBillingSummary,
} from "../../api/billing";
import { getAccessTokenPayload } from "../../utils/authCookie";
import { formatCurrencyBRL } from "../../utils/formatCurrency";
import { buttonClassName } from "../Button";

const DISMISS_PREFIX = "mpn_billing_dismiss_";

function isDueOrOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const [y, m, d] = dueDate.split("-").map(Number);
  if (!y || !m || !d) return false;
  const due = new Date(y, m - 1, d);
  const today = new Date();
  const startDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const startToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return startDue <= startToday;
}

function PendingBillingModal() {
  const location = useLocation();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    const payload = getAccessTokenPayload<{ companyPublicId?: string }>();
    const companyPublicId = payload?.companyPublicId;
    if (!companyPublicId) return;
    try {
      const data = await getBillingSummary(companyPublicId);
      setSummary(data);
      const payment = data.openPayment;
      if (
        !payment ||
        payment.paid ||
        !isDueOrOverdue(payment.dueDate) ||
        location.pathname.startsWith("/mensalidades")
      ) {
        setOpen(false);
        return;
      }
      const dismissed =
        sessionStorage.getItem(`${DISMISS_PREFIX}${payment.id}`) === "1";
      setOpen(!dismissed);
    } catch {
      // modal é best-effort
    }
  }, [location.pathname]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!open || !summary?.openPayment) return null;

  const payment = summary.openPayment;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pending-billing-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-master-light p-5 shadow-xl">
        <p
          id="pending-billing-title"
          className="text-lg font-semibold text-text-light"
        >
          Mensalidade pendente
        </p>
        <p className="mt-2 text-sm text-text-light/70">
          Há uma cobrança de {formatCurrencyBRL(payment.value)}
          {payment.dueDate
            ? ` com vencimento em ${payment.dueDate.split("-").reverse().join("/")}`
            : ""}
          . Você pode pagar agora via PIX.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <Link
            to="/mensalidades"
            className={`${buttonClassName({ variant: "primary", size: "md" })} text-center`}
            onClick={() => setOpen(false)}
          >
            Ver mensalidades
          </Link>
          <button
            type="button"
            className={buttonClassName({ variant: "ghost", size: "md" })}
            onClick={() => {
              sessionStorage.setItem(`${DISMISS_PREFIX}${payment.id}`, "1");
              setOpen(false);
            }}
          >
            Depois
          </button>
        </div>
      </div>
    </div>
  );
}

export default PendingBillingModal;
