import { useEffect, useId, useRef } from "react";
import { BsX } from "react-icons/bs";
import { buttonClassName } from "../Button";

type ActivateCourtGuideModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function ActivateCourtGuideModal({
  isOpen,
  onClose,
}: ActivateCourtGuideModalProps) {
  const titleId = useId();
  const descriptionId = useId();
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
                Quando estiver pronto, toque em{" "}
                <span className="font-semibold text-text-light">
                  Ativar a minha quadra
                </span>{" "}
                na agenda para publicar a quadra no site.
              </p>
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

        <button
          ref={confirmRef}
          type="button"
          onClick={onClose}
          className={buttonClassName({
            variant: "primary",
            size: "lg",
            className: "w-full",
          })}
        >
          Entendi
        </button>
      </div>
    </div>
  );
}

export default ActivateCourtGuideModal;
