import { ReactNode, useEffect, useId } from "react";
import { BsX } from "react-icons/bs";

type InfoSheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

function InfoSheet({ open, title, onClose, children }: InfoSheetProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(92dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-master-light text-text-light shadow-2xl sm:rounded-2xl"
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-text-light/20 sm:hidden" />
        <div className="flex shrink-0 items-center justify-between gap-4 px-5 pb-4 pt-5">
          <h2 id={titleId} className="min-w-0 text-xl font-semibold leading-7">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="mpn-tap-solid flex size-11 shrink-0 items-center justify-center rounded-full border border-text-light/20 bg-master text-text-light/70"
            aria-label="Fechar"
          >
            <BsX size={24} aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default InfoSheet;
