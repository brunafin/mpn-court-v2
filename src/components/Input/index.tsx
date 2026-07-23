import { useState } from "react";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

interface IInputProps {
  type?: string;
  placeholder?: string;
  title?: string;
  value?: string;
  name: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
  required?: boolean;
  readOnly?: boolean;
  mode: "light" | "dark";
  className?: string;
  inputMode?:
    | "text"
    | "numeric"
    | "decimal"
    | "tel"
    | "search"
    | "email"
    | "url";
  autoComplete?: string;
  autoCapitalize?: string;
  enterKeyHint?:
    | "enter"
    | "done"
    | "go"
    | "next"
    | "previous"
    | "search"
    | "send";
  describedBy?: string;
  error?: string;
}

function Input({
  type = "text",
  name,
  title,
  placeholder,
  value,
  onBlur,
  onChange,
  onClick,
  required,
  readOnly = false,
  mode = "light",
  inputMode,
  className,
  autoComplete,
  autoCapitalize,
  enterKeyHint,
  describedBy,
  error,
}: IInputProps) {
  const isDark = mode === "dark";
  const isPassword = type === "password";
  const maskClarity =
    isPassword ||
    type === "email" ||
    type === "tel" ||
    /password|email|phone|telefone|cpf|senha|contato|^name$/i.test(name);
  const [showPassword, setShowPassword] = useState(false);
  const errorId = error ? `${name}-error` : undefined;
  const describedByIds =
    [describedBy, errorId].filter(Boolean).join(" ") || undefined;
  const inputType = isPassword && showPassword ? "text" : type;

  const fieldClass = `w-full min-h-14 rounded-xl px-4 py-3.5 text-lg font-medium leading-7 tracking-normal
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:cursor-not-allowed disabled:opacity-60
    ${isPassword ? "pr-14" : ""}
    ${
      isDark
        ? `mpn-field-dark border-0 bg-master text-text-light placeholder:font-normal placeholder:text-text-light/40 focus-visible:ring-accent-blue/80 focus-visible:ring-offset-master-light ${
            error ? "ring-2 ring-danger-400" : ""
          }`
        : "border border-neutral-300 bg-neutral-100 text-neutral-800 transition-colors duration-150 ease-in-out hover:border-neutral-400 focus-visible:ring-neutral-400 focus-visible:ring-offset-neutral-100 placeholder:font-normal placeholder-neutral-400"
    }`;

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
        <input
          id={name}
          name={name}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          type={inputType}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          enterKeyHint={enterKeyHint}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedByIds}
          className={`${fieldClass}${maskClarity ? " clarity-mask" : ""}`}
          data-clarity-mask={maskClarity ? "true" : undefined}
          onChange={onChange}
          onBlur={onBlur}
          onClick={onClick}
          required={required}
          readOnly={readOnly}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((open) => !open)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
            className={`absolute right-1.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isDark
                ? "text-text-light/80 hover:bg-master-light focus-visible:outline-accent-blue"
                : "text-neutral-600 hover:bg-neutral-200 focus-visible:outline-neutral-500"
            }`}
          >
            {showPassword ? (
              <MdVisibilityOff size={22} aria-hidden />
            ) : (
              <MdVisibility size={22} aria-hidden />
            )}
          </button>
        )}
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
    </div>
  );
}

export default Input;
