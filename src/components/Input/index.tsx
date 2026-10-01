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
  disabled?: boolean;
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
  maxLength?: number;
  showCount?: boolean;
  onBeforeInput?: (e: React.FormEvent<HTMLInputElement>) => void;
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
  onFocus,
  onKeyDown,
  onKeyUp,
  onKeyPress,
  required,
  readOnly = false,
  disabled = false,
  mode = "light",
  inputMode,
  className,
  autoComplete,
  autoCapitalize,
  enterKeyHint,
  describedBy,
  error,
  maxLength,
  showCount = false,
  onBeforeInput,
}: IInputProps) {
  void mode;
  const isPassword = type === "password";
  const maskClarity =
    isPassword ||
    type === "email" ||
    type === "tel" ||
    /password|email|phone|telefone|cpf|senha|contato|^name$/i.test(name);
  const [showPassword, setShowPassword] = useState(false);
  const errorId = error ? `${name}-error` : undefined;
  const countId = maxLength && showCount ? `${name}-count` : undefined;
  const describedByIds =
    [describedBy, errorId, countId].filter(Boolean).join(" ") || undefined;
  const inputType = isPassword && showPassword ? "text" : type;
  const currentLength = value?.length ?? 0;

  const fieldClass = `w-full min-h-14 rounded-xl px-4 py-3.5 text-lg font-medium leading-7 tracking-normal
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:cursor-not-allowed disabled:opacity-60
    ${isPassword ? "pr-14" : ""}
    mpn-field-dark border-0 bg-master text-text-light placeholder:font-normal placeholder:text-text-light/55 focus-visible:ring-accent-blue/80 focus-visible:ring-offset-master-light ${
      error ? "ring-2 ring-danger-soft" : ""
    }`;

  return (
    <div className={`mb-3 flex flex-col ${className ?? ""}`}>
      {title && (
        <label
          htmlFor={name}
          className="mb-2 text-base font-semibold leading-6 text-text-light"
        >
          {title}
          {required && (
            <span className="font-semibold text-accent-blue-soft" aria-hidden="true">
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
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onKeyPress={onKeyPress}
          onBeforeInput={onBeforeInput}
          onClick={onClick}
          required={required}
          readOnly={readOnly}
          disabled={disabled}
          maxLength={maxLength}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((open) => !open)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
            disabled={disabled}
            className="absolute right-1.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-text-light/70 transition hover:bg-master-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue disabled:cursor-not-allowed disabled:opacity-60"
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
          className="mt-1.5 text-base font-medium text-danger-soft"
        >
          {error}
        </p>
      )}
      {maxLength && showCount && (
        <p
          id={countId}
          className="mt-1.5 text-right text-base font-medium text-text-light/70"
        >
          {currentLength}/{maxLength}
        </p>
      )}
    </div>
  );
}

export default Input;
