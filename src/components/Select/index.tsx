import React from "react";

interface ISelectOption {
  id: number;
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
}: ISelectProps) {
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
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        required={required}
        disabled={disabled}
        className={`w-full px-4 py-2 mb-4 border border-neutral-300 rounded-lg shadow-sm
          hover:border-neutral-400
          focus:outline-none focus:ring-2 focus:ring-neutral-300
          transition-all duration-200 ease-in-out
          ${
            mode === "dark"
              ? "bg-neutral-800 text-neutral-100"
              : "bg-neutral-100 text-neutral-800"
          }
          ${
            mode === "dark"
              ? "placeholder-neutral-400"
              : "placeholder-neutral-500"
          }
        `}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Select;
