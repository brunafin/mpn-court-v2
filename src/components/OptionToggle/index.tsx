import { ReactNode, useId } from "react";
import { ChoiceCheck, choiceRowClass } from "../ChoiceCheck";

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
      className={`${choiceRowClass(checked, "w-full")} ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      }`}
    >
      <input
        type="checkbox"
        id={inputId}
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <ChoiceCheck checked={checked} />
      <span className="shrink-0 text-text-light/70" aria-hidden>
        {icon}
      </span>
      <span>{label}</span>
    </label>
  );
}

export default OptionToggle;
