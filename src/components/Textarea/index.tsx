import React from "react";

interface ITextareaProps {
  placeholder?: string;
  title?: string;
  value?: string;
  name: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  mode: "light" | "dark";
  className?: string;
  rows?: number;
  cols?: number;
  maxLength?: number;
  describedBy?: string;
  showCount?: boolean;
}

function Textarea({
  name,
  title,
  placeholder,
  value,
  onBlur,
  onChange,
  onClick,
  required,
  mode = "light",
  className,
  rows = 3,
  cols,
  onFocus,
  onKeyDown,
  onKeyUp,
  onKeyPress,
  maxLength,
  describedBy,
  showCount = true,
}: ITextareaProps) {
  const isDark = mode === "dark";
  const countId = maxLength && showCount ? `${name}-count` : undefined;
  const describedByIds =
    [describedBy, countId].filter(Boolean).join(" ") || undefined;
  const currentLength = value?.length ?? 0;

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
      <textarea
        id={name}
        name={name}
        value={value}
        placeholder={placeholder}
        aria-required={required || undefined}
        aria-describedby={describedByIds}
        className={`w-full min-h-[6rem] resize-none rounded-xl px-4 py-3 text-lg font-medium leading-7 transition-colors duration-150 ease-in-out clarity-mask
          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          ${
            isDark
              ? "mpn-field-dark border-0 bg-master text-text-light placeholder:font-normal placeholder:text-text-light/40 focus-visible:ring-accent-blue/80 focus-visible:ring-offset-master-light"
              : "border border-neutral-300 bg-neutral-100 text-neutral-800 hover:border-neutral-400 focus-visible:ring-neutral-400 focus-visible:ring-offset-neutral-100 placeholder:font-normal placeholder-neutral-400"
          }
        `}
        data-clarity-mask="true"
        onChange={onChange}
        onBlur={onBlur}
        onClick={onClick}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onKeyPress={onKeyPress}
        required={required}
        rows={rows}
        cols={cols}
        maxLength={maxLength}
      />
      {maxLength && showCount && (
        <p
          id={countId}
          className={`mt-1.5 text-right text-sm font-medium ${
            isDark ? "text-text-light/70" : "text-neutral-600"
          }`}
        >
          {currentLength}/{maxLength}
        </p>
      )}
    </div>
  );
}

export default Textarea;
