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
  rows,
  cols,
  onFocus,
  onKeyDown,
  onKeyUp,
  onKeyPress,
  maxLength,
}: ITextareaProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      {title && (
        <label
          htmlFor={name}
          className={`${
            mode === "dark" ? "text-neutral-100" : "text-neutral-800"
          } mb-2`}
        >
          {title}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        placeholder={placeholder}
        className={`w-full px-4 py-2 mb-4 border border-neutral-300 rounded-lg shadow-sm
          hover:border-neutral-400
          focus:outline-none focus:ring-2 focus:ring-neutral-300
          transition-all duration-200 ease-in-out
          ${mode === "dark" ? "bg-neutral-800 text-neutral-100" : "bg-neutral-100 text-neutral-800"}
          ${mode === "dark" ? "placeholder-neutral-400" : "placeholder-neutral-500"}
        `}
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
    </div>
  );
}

export default Textarea;