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
  mode = "light",
  required,
  error,
  className,
}: ICheckboxGroupProps) {
  const isDark = mode === "dark";
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
          className={`mb-2 text-base font-semibold leading-6 ${
            isDark ? "text-text-light" : "text-neutral-800"
          }`}
        >
          {title}
          {required && (
            <span className="font-semibold text-accent-blue" aria-hidden="true">
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
                    : isDark
                      ? "border-white/12 bg-master hover:border-white/25"
                      : "border-neutral-300 bg-neutral-100 hover:border-neutral-400"
                }
                ${isDark ? "text-text-light" : "text-neutral-800"}`}
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
                      ? "border-accent-blue bg-accent-blue text-white"
                      : isDark
                        ? "border-white/30"
                        : "border-neutral-400"
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
          className="mt-1.5 text-base font-medium text-danger-400"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}

export default CheckboxGroup;
