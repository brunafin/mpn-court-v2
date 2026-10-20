import { useState } from "react";
import { ChoiceCheck, choiceRowClass } from "../ChoiceCheck";

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
  /** Quantas opções ficam visíveis antes de "Ver mais". */
  previewCount?: number;
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
  previewCount,
}: ICheckboxGroupProps) {
  void mode;
  const errorId = error ? `${name}-error` : undefined;
  const [expanded, setExpanded] = useState(false);
  const limit =
    previewCount != null && previewCount > 0 ? previewCount : options.length;
  const canPreview = limit < options.length;
  const visibleOptions =
    !canPreview || expanded
      ? options
      : options.filter(
          (option, index) => index < limit || value.includes(option.value),
        );
  const hasHidden =
    canPreview && !expanded && visibleOptions.length < options.length;

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
            <span className="font-semibold text-danger-soft" aria-hidden="true">
              {" "}
              *
            </span>
          )}
        </legend>
      )}

      <div className="flex flex-wrap gap-2">
        {visibleOptions.map((option) => {
          const checked = value.includes(option.value);
          return (
            <label
              key={option.value}
              className={choiceRowClass(
                checked,
                "grow basis-[calc(50%-0.25rem)]",
              )}
            >
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => toggle(option.value)}
                className="peer sr-only"
              />
              <ChoiceCheck checked={checked} />
              <span className="whitespace-nowrap">{option.label}</span>
            </label>
          );
        })}
      </div>

      {(hasHidden || expanded) && (
        <button
          type="button"
          className="mpn-tap mt-2 min-h-12 self-start px-1 text-base font-semibold text-accent-blue"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      )}

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
