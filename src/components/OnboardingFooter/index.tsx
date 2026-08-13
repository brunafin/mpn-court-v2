import { useEffect, useId, useRef, useState } from "react";
import { BsX } from "react-icons/bs";
import { buttonClassName } from "../Button";
import { logoutAndRedirect } from "../../utils/authCookie";

/** Rodapé discreto das telas de configuração (full, sem header de app). */
function OnboardingFooter() {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const keepRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      keepRef.current?.focus();
    }, 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !leaving) {
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
  }, [open, leaving]);

  const leave = (keepDraft: boolean) => {
    if (leaving) return;
    setLeaving(true);
    void logoutAndRedirect({ keepOnboardingDraft: keepDraft });
  };

  return (
    <>
      <footer className="mt-10 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-base font-semibold text-text-light/55 underline-offset-2 hover:text-text-light/80 hover:underline"
        >
          Sair
        </button>
      </footer>

      {open ? (
        <div
          className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/75"
            onClick={() => {
              if (!leaving) setOpen(false);
            }}
            disabled={leaving}
          />

          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            aria-busy={leaving}
            className="mpn-action-bar relative z-10 w-full max-w-md rounded-t-3xl bg-master-light p-5 text-text-light shadow-2xl sm:rounded-3xl sm:p-6"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-text-light/20 sm:hidden" />

            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="text-xl font-semibold leading-7 text-text-light"
                >
                  Sair da configuração?
                </h2>
                <p
                  id={descriptionId}
                  className="mt-2 text-base leading-6 text-text-light/75"
                >
                  Você será desconectado. Pode manter a configuração neste
                  aparelho para continuar depois, ou apagá-la agora.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={leaving}
                aria-label="Fechar"
                className="mpn-tap-solid flex size-11 shrink-0 items-center justify-center rounded-full bg-master text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue disabled:opacity-50"
              >
                <BsX size={24} aria-hidden />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <button
                ref={keepRef}
                type="button"
                disabled={leaving}
                onClick={() => leave(true)}
                className={buttonClassName({
                  variant: "primary",
                  size: "lg",
                })}
              >
                {leaving ? "Saindo…" : "Manter a configuração e sair"}
              </button>
              <button
                type="button"
                disabled={leaving}
                onClick={() => leave(false)}
                className={buttonClassName({
                  variant: "danger",
                  size: "lg",
                })}
              >
                Apagar a configuração e sair
              </button>
              <button
                type="button"
                disabled={leaving}
                onClick={() => setOpen(false)}
                className={buttonClassName({
                  variant: "ghost",
                  size: "lg",
                  className: "bg-master",
                })}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default OnboardingFooter;
