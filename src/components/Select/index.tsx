import { MdKeyboardArrowDown } from "react-icons/md";

interface ISelectOption {
  id: number | string;
  name: string;
}

interface ISelectProps {
  name: string;
  title?: string;
  value?: number | string;
  options: ISelectOption[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  required?: boolean;
  mode: "light" | "dark";
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

function Select({
  name,
  title,
  value,
  options,
  onChange,
  onBlur,
  onFocus,
  required,
  mode = "light",
  className,
  disabled = false,
  placeholder = "Selecione...",
}: ISelectProps) {
  const isDark = mode === "dark";
  const hasValue = value !== undefined && value !== null && value !== "";

  return (
    <div className={`mb-3 flex flex-col ${className ?? ""}`}>
      {title && (
        <label
          htmlFor={name}
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
        </label>
      )}

      <div className="relative">
        <select
          id={name}
          name={name}
          value={hasValue ? String(value) : ""}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          required={required}
          disabled={disabled}
          aria-required={required || undefined}
          className={`w-full min-h-14 appearance-none rounded-xl px-4 py-3.5 pr-12 text-lg font-medium leading-7 transition-colors duration-150 ease-in-out
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-60
            ${
              isDark
                ? "mpn-field-dark border-0 bg-master text-text-light focus-visible:ring-accent-blue/80 focus-visible:ring-offset-master-light"
                : "border border-neutral-300 bg-neutral-100 text-neutral-800 hover:border-neutral-400 focus-visible:ring-neutral-400 focus-visible:ring-offset-neutral-100"
            }
            ${!hasValue ? (isDark ? "font-normal text-text-light/40" : "font-normal text-neutral-400") : ""}
          `}
        >
          <option value="" disabled={required}>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={String(opt.id)} value={String(opt.id)}>
              {opt.name}
            </option>
          ))}
        </select>

        <MdKeyboardArrowDown
          size={28}
          aria-hidden
          className={`pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 ${
            isDark ? "text-text-light" : "text-neutral-600"
          } ${disabled ? "opacity-50" : ""}`}
        />
      </div>
    </div>
  );
}

export default Select;
