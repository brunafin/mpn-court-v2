import { ReactNode, useEffect, useId, useRef } from "react";
import { BsX } from "react-icons/bs";
import { buttonClassName, ButtonVariant } from "../Button";

export type ConfirmTone = "danger" | "primary" | "neutral" | "success";

type ConfirmSheetProps = {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  loading?: boolean;
  /** Só o botão de ação (ex.: erro que precisa ser lido). */
  alertOnly?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

const toneToVariant: Record<ConfirmTone, ButtonVariant> = {
  danger: "danger",
  primary: "primary",
  neutral: "purple",
  success: "success",
};

function ConfirmSheet({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  tone = "primary",
  loading = false,
  alertOnly = false,
  onConfirm,
  onClose,
}: ConfirmSheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const calmDanger = tone === "danger" && !alertOnly;

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      if (tone === "danger" && !alertOnly) {
        cancelRef.current?.focus();
        return;
      }
      confirmRef.current?.focus();
    }, 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, loading, tone, alertOnly]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/60"
        onClick={() => {
          if (!loading) onClose();
        }}
        disabled={loading}
      />

      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={loading}
        className="mpn-action-bar relative z-10 w-full max-w-md rounded-t-2xl bg-master p-5 text-text-light shadow-[0_24px_64px_rgba(0,0,0,0.55)] sm:rounded-2xl sm:p-6"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-text-light/20 sm:hidden" />

        <div className="mb-1.5 flex items-start justify-between gap-3">
          <h2
            id={titleId}
            className="min-w-0 text-lg font-semibold leading-6 text-text-light"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Fechar"
            className="mpn-tap-solid flex size-11 shrink-0 items-center justify-center rounded-full bg-master-light text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue disabled:opacity-50"
          >
            <BsX size={24} aria-hidden />
          </button>
        </div>
        <div
          id={descriptionId}
          className="mb-5 text-base leading-5 text-text-light/70"
        >
          {description}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
          <button
            ref={confirmRef}
            type="button"
            disabled={loading}
            onClick={() => {
              void onConfirm();
            }}
            className={
              calmDanger
                ? "mpn-tap inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-master-light px-4 text-base font-semibold text-danger-soft transition hover:bg-text-light/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-44"
                : buttonClassName({
                    variant: toneToVariant[tone],
                    size: "md",
                    fullWidth: false,
                    className: "w-full sm:w-auto sm:min-w-44",
                  })
            }
          >
            {loading ? "Aguarde…" : confirmLabel}
          </button>
          {!alertOnly && (
            <button
              ref={cancelRef}
              type="button"
              onClick={onClose}
              disabled={loading}
              className="mpn-tap inline-flex min-h-11 w-full items-center justify-center rounded-xl px-3 text-base font-semibold text-text-light/70 transition hover:bg-text-light/10 hover:text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {cancelLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConfirmSheet;
