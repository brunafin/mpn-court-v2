import { MdCheck } from "react-icons/md";

type ChoiceCheckProps = {
  checked: boolean;
};

/** Mesma caixa do checkbox do padrão, na cor da agenda. */
export function ChoiceCheck({ checked }: ChoiceCheckProps) {
  return (
    <span
      aria-hidden
      className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-on-accent peer-disabled:opacity-50 ${
        checked
          ? "border-accent bg-accent text-on-accent"
          : "border-text-light/45 bg-transparent"
      }`}
    >
      {checked ? <MdCheck size={16} /> : null}
    </span>
  );
}

export function choiceRowClass(checked: boolean, className = "") {
  return `mpn-tap flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-base font-medium text-text-light transition-colors ${
    checked
      ? "border-accent bg-accent/15"
      : "border-text-light/30 bg-master hover:border-text-light/45"
  } ${className}`;
}
