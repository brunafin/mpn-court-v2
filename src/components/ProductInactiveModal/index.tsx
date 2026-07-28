import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BsX } from "react-icons/bs";
import { Link } from "react-router-dom";
import { setProductInactiveHandler } from "../../api/axios";
import { buttonClassName } from "../Button";

function ProductInactiveModal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(
    "Seu teste grátis expirou. Contrate um plano para continuar usando a agenda.",
  );
  const titleId = useId();
  const descriptionId = useId();
  const confirmRef = useRef<HTMLAnchorElement>(null);

  const openModal = useCallback((nextMessage?: string) => {
    if (nextMessage?.trim()) setDetail(nextMessage.trim());
    setOpen(true);
  }, []);

  useEffect(() => {
    setProductInactiveHandler(openModal);
    return () => setProductInactiveHandler(null);
  }, [openModal]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      confirmRef.current?.focus();
    }, 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/80"
        onClick={() => setOpen(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 flex max-h-[min(92dvh,36rem)] w-full max-w-md flex-col overflow-y-auto rounded-3xl bg-master-light p-5 text-text-light shadow-2xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-xl font-semibold leading-7 text-text-light"
            >
              Teste grátis encerrado
            </h2>
            <p
              id={descriptionId}
              className="mt-2 text-base leading-6 text-text-light/75"
            >
              {detail}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="mpn-tap-solid flex size-11 shrink-0 items-center justify-center rounded-full bg-master text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
          >
            <BsX size={24} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={buttonClassName({
              variant: "ghost",
              size: "md",
              fullWidth: false,
              className: "bg-master sm:min-w-28",
            })}
          >
            Entendi
          </button>
          <Link
            ref={confirmRef}
            to="/planos"
            onClick={() => setOpen(false)}
            className={buttonClassName({
              variant: "primary",
              size: "md",
              fullWidth: false,
              className: "sm:min-w-40",
            })}
          >
            Contrate um plano
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProductInactiveModal;
