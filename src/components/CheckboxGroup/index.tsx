import { MdCheck } from "react-icons/md";

interface ICheckboxOption {
  value: string;
  label: string;
}

interface ICheckboxGroupProps {
  name: string;
  title?: string;
  options: ICheckboxOption[];
  value: string[];
  onChange: (next: string[]) => void;
  mode: "light" | "dark";
  required?: boolean;
  error?: string;
  className?: string;
}

/**
 * Grupo de checkboxes para multisseleção de um conjunto pequeno e fixo.
 * Cada opção é um alvo de toque grande (min-h-14), acessível via <input type="checkbox">.
 */
function CheckboxGroup({
  name,
  title,
  options,
  value,
  onChange,
  mode = "dark",
  required,
  error,
  className,
}: ICheckboxGroupProps) {
  void mode;
  const errorId = error ? `${name}-error` : undefined;

  const toggle = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue]
    );
  };

  return (
    <fieldset
      className={`mb-3 flex flex-col ${className ?? ""}`}
      aria-describedby={errorId}
    >
      {title && (
        <legend
          className="mb-2 text-base font-semibold leading-6 text-text-light"
        >
          {title}
          {required && (
            <span className="font-semibold text-accent-blue-soft" aria-hidden="true">
              {" "}
              *
            </span>
          )}
        </legend>
      )}

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value.includes(option.value);
          return (
            <label
              key={option.value}
              className={`mpn-tap flex min-h-14 grow basis-[calc(50%-0.25rem)] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-base font-medium transition-colors
                ${
                  checked
                    ? "border-accent-blue bg-accent-blue/15"
                    : "border-text-light/15 bg-master hover:border-text-light/30"
                }
                text-text-light`}
            >
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => toggle(option.value)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={`flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors
                  ${
                    checked
                      ? "border-accent-blue bg-accent-blue text-text-light"
                      : "border-text-light/45"
                  }`}
              >
                {checked && <MdCheck size={18} />}
              </span>
              <span className="whitespace-nowrap">{option.label}</span>
            </label>
          );
        })}
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-base font-medium text-danger-soft"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}

export default CheckboxGroup;
