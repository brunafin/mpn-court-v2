import { useEffect, useId, useRef, useState } from "react";
import { BsX } from "react-icons/bs";
import { buttonClassName } from "../Button";

type ActivateCourtGuideModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onGoToCourts: () => void;
  publicUrl?: string | null;
};

function ActivateCourtGuideModal({
  isOpen,
  onClose,
  onGoToCourts,
  publicUrl,
}: ActivateCourtGuideModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const [copied, setCopied] = useState(false);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    setCopied(false);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      confirmRef.current?.focus();
    }, 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
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
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/75"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-md rounded-t-3xl bg-master-light p-5 text-text-light shadow-2xl sm:rounded-3xl sm:p-6"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-text-light/20 sm:hidden" />

        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-xl font-semibold leading-7 text-text-light"
            >
              Compartilhe horários livres no site
            </h2>
            <div
              id={descriptionId}
              className="mt-2 space-y-2 text-base leading-6 text-text-light/75"
            >
              <p>
                Cadastre na agenda as reservas e os horários fixos que já estão
                ocupados. Assim o público só vê o que está realmente livre.
              </p>
              <p>
                Quando estiver pronto, ative a quadra em{" "}
                <span className="font-semibold text-text-light">
                  Minhas quadras
                </span>
                .
              </p>
              {publicUrl ? (
                <p className="break-all rounded-xl bg-master px-3 py-2 text-sm">
                  {publicUrl}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="mpn-tap-solid flex size-11 shrink-0 items-center justify-center rounded-full bg-master text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
          >
            <BsX size={24} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {publicUrl ? (
            <button
              type="button"
              onClick={() => void handleCopy()}
              className={buttonClassName({
                variant: "secondary",
                size: "lg",
                className: "w-full",
              })}
            >
              {copied ? "Link copiado" : "Copiar link público"}
            </button>
          ) : null}
          <button
            ref={confirmRef}
            type="button"
            onClick={onGoToCourts}
            className={buttonClassName({
              variant: "primary",
              size: "lg",
              className: "w-full",
            })}
          >
            Ir para Minhas quadras
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActivateCourtGuideModal;
