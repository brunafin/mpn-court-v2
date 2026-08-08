import { ReactNode, useId } from "react";

type OptionToggleProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: ReactNode;
  id?: string;
  name?: string;
  disabled?: boolean;
};

/**
 * Toggle de opção da reserva — alvo grande, estado selecionado com ring.
 * Usado nos fluxos de criar e editar reserva.
 */
function OptionToggle({
  label,
  checked,
  onChange,
  icon,
  id,
  name,
  disabled = false,
}: OptionToggleProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label
      htmlFor={inputId}
      aria-disabled={disabled || undefined}
      className={`mpn-tap flex min-h-14 items-center justify-between gap-3 rounded-xl px-3.5 py-3 transition focus-within:ring-2 focus-within:ring-accent-blue/70 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${
        checked
          ? "bg-accent-blue/15 ring-2 ring-accent-blue/60"
          : disabled
            ? "bg-master/50"
            : "bg-master/50 hover:bg-master/80"
      }`}
    >
      <span className="flex min-w-0 items-center gap-3 text-base font-medium text-text-light">
        <span className="shrink-0 text-text-light/75" aria-hidden>
          {icon}
        </span>
        {label}
      </span>
      <input
        type="checkbox"
        id={inputId}
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="size-6 shrink-0 rounded accent-accent-blue disabled:cursor-not-allowed"
      />
    </label>
  );
}

export default OptionToggle;
