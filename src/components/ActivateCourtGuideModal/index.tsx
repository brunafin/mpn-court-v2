import { useEffect, useId, useRef, useState } from "react";
import { BsX } from "react-icons/bs";
import { useColorMode } from "../../contexts/ColorModeContext";
import { buttonClassName } from "../Button";
import ThemeModeSwitch from "../ThemeModeSwitch";

type ActivateCourtGuideModalProps = {
  isOpen: boolean;
  onClose: () => void;
  publicUrl?: string | null;
};

function ActivateCourtGuideModal({
  isOpen,
  onClose,
  publicUrl,
}: ActivateCourtGuideModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const stepsTitleId = useId();
  const linkTitleId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const { setColorMode } = useColorMode();
  const setColorModeRef = useRef(setColorMode);
  const [copied, setCopied] = useState(false);
  onCloseRef.current = onClose;
  setColorModeRef.current = setColorMode;

  useEffect(() => {
    if (!isOpen) return;
    setCopied(false);
    setColorModeRef.current("light");

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
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-t-2xl bg-master p-5 text-text-light sm:rounded-2xl sm:p-6"
      >
        <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-text-light/20 sm:hidden" />

        <div className="mb-5 flex items-start justify-between gap-3">
          <h2
            id={titleId}
            className="text-2xl font-bold leading-8 tracking-tight"
          >
            Mostre horários livres aos seus clientes
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="mpn-tap-solid flex size-11 shrink-0 items-center justify-center rounded-full bg-master-light text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <BsX size={24} aria-hidden />
          </button>
        </div>

        <p
          id={descriptionId}
          className="text-base leading-6 text-text-light/70"
        >
          A pessoa vê só o que está livre e fala com você para reservar.
        </p>

        <section className="mt-5" aria-labelledby={stepsTitleId}>
          <h3 id={stepsTitleId} className="text-base font-semibold">
            Em 2 passos
          </h3>
          <ol className="mt-3 flex flex-col gap-3">
            <li className="flex gap-3">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-master-light text-base font-semibold"
              >
                1
              </span>
              <span className="pt-1 text-base leading-6">
                Marque na agenda o que já está ocupado.
              </span>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-master-light text-base font-semibold"
              >
                2
              </span>
              <span className="pt-1 text-base leading-6">
                Ative as quadras na página de quadras.
              </span>
            </li>
          </ol>
        </section>

        {publicUrl ? (
          <section className="mt-5" aria-labelledby={linkTitleId}>
            <h3 id={linkTitleId} className="text-base font-semibold">
              Link da arena
            </h3>
            <p className="mt-1 text-base leading-6 text-text-light/70">
              Para o WhatsApp, o Instagram ou grupos.
            </p>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className={buttonClassName({
                variant: "secondary",
                size: "md",
                className: "mt-3",
              })}
            >
              {copied ? "Link copiado" : "Copiar link"}
            </button>
          </section>
        ) : null}

        <div className="mt-5">
          <ThemeModeSwitch />
        </div>

        <button
          ref={confirmRef}
          type="button"
          onClick={onClose}
          className={buttonClassName({
            variant: "primary",
            size: "lg",
            className: "mt-5 w-full",
          })}
        >
          Ver a agenda
        </button>
      </div>
    </div>
  );
}

export default ActivateCourtGuideModal;
