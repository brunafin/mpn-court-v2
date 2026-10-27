import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCompanyCapabilities } from "../../contexts/CompanyBrandingContext";
import { billingNavPath } from "../../utils/billingNav";
import { buttonClassName } from "../Button";
import PendingBillingModal from "../PendingBillingModal";

const ACK_KEY = "mpn_readonly_notice_ack";

export function useReadOnlyNotice() {
  const caps = useCompanyCapabilities();
  const restricted = caps.ready && caps.accessMode === "read_only";
  const [acked, setAcked] = useState(
    () => localStorage.getItem(ACK_KEY) === "1",
  );

  useEffect(() => {
    if (!caps.ready || caps.accessMode !== "full") return;
    localStorage.removeItem(ACK_KEY);
    setAcked(false);
  }, [caps.ready, caps.accessMode]);

  const acknowledge = useCallback(() => {
    localStorage.setItem(ACK_KEY, "1");
    setAcked(true);
  }, []);

  return {
    restricted,
    acked,
    acknowledge,
    entitlement: caps.entitlement,
  };
}

type ReadOnlyNotice = ReturnType<typeof useReadOnlyNotice>;

export function ReadOnlyAccessBanner({ notice }: { notice: ReadOnlyNotice }) {
  const location = useLocation();
  if (!notice.restricted || !notice.acked) return null;

  const onBilling =
    location.pathname.startsWith("/mensalidades") ||
    location.pathname.startsWith("/planos");
  const onHome = location.pathname === "/reservas";

  return (
    <div
      role="status"
      className="shrink-0 border-b border-warning-500/35 bg-warning-500/15 px-4 py-3"
    >
      <p className="text-base leading-6 text-text-light">
        <span className="font-bold">Mensalidade pendente.</span> Regularize para
        voltar a ter o acesso completo.
      </p>
      {!onBilling ? (
        <div className={onHome ? "flex justify-center" : undefined}>
          <Link
            to={billingNavPath(notice.entitlement)}
            className="mt-1 inline-flex min-h-11 items-center text-base font-semibold text-accent-badge underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Regularizar pagamento
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function ReadOnlyAccessModal({ notice }: { notice: ReadOnlyNotice }) {
  const location = useLocation();

  const onBilling =
    location.pathname.startsWith("/mensalidades") ||
    location.pathname.startsWith("/planos");
  const open = notice.restricted && !notice.acked && !onBilling;

  const dismiss = notice.acknowledge;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="readonly-billing-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-master p-5 shadow-2xl">
        <p
          id="readonly-billing-title"
          className="text-lg font-bold text-text-light"
        >
          Mensalidade pendente
        </p>
        <p className="mt-2 text-base leading-6 text-text-light/70">
          Reservar, cancelar e alterar horários ficam indisponíveis até a
          regularização da mensalidade.
        </p>
        <p className="mt-3 text-base leading-6 text-text-light/70">
          Após a confirmação do pagamento você voltará a ter o acesso de todas
          as funcionalidades.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <Link
            to={billingNavPath(notice.entitlement)}
            className={`${buttonClassName({ variant: "primary", size: "md" })} text-center`}
            onClick={dismiss}
          >
            Regularizar pagamento
          </Link>
          <button
            type="button"
            className={buttonClassName({ variant: "ghost", size: "md" })}
            onClick={dismiss}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}

/** Tarja e modais para páginas que não usam o AppLayout. */
export function BillingAccessNotices() {
  const notice = useReadOnlyNotice();
  return (
    <>
      <ReadOnlyAccessBanner notice={notice} />
      <ReadOnlyAccessModal notice={notice} />
      <PendingBillingModal />
    </>
  );
}

export default ReadOnlyAccessModal;
