import { useEffect, useId, useRef } from "react";
import { BsX } from "react-icons/bs";
import { buttonClassName, ButtonVariant } from "../Button";

export type ConfirmTone = "danger" | "primary" | "neutral" | "success";

type ConfirmSheetProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  loading?: boolean;
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
  onConfirm,
  onClose,
}: ConfirmSheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
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
  }, [isOpen, loading]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/75"
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
        className="relative z-10 w-full max-w-md rounded-t-3xl bg-master-light p-5 text-text-light shadow-2xl sm:rounded-3xl sm:p-6"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-text-light/20 sm:hidden" />

        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-xl font-semibold leading-7 text-text-light"
            >
              {title}
            </h2>
            <p
              id={descriptionId}
              className="mt-2 text-base leading-6 text-text-light/75"
            >
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Fechar"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-master text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue disabled:opacity-50"
          >
            <BsX size={24} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={buttonClassName({
              variant: "ghost",
              size: "lg",
              fullWidth: false,
              className: "bg-master sm:min-w-0",
            })}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={loading}
            onClick={() => {
              void onConfirm();
            }}
            className={buttonClassName({
              variant: toneToVariant[tone],
              size: "lg",
              className: "sm:flex-none sm:min-w-44",
            })}
          >
            {loading ? "Aguarde…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmSheet;
