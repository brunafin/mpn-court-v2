import React from "react";
import ReactSelect, { SingleValue } from "react-select";

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
}

function Select({
  name,
  title,
  value,
  options,
  onChange,
  onBlur,
  onFocus,
  mode = "light",
  className,
  disabled = false,
}: ISelectProps) {

  const selectOptions = options.map(opt => ({
    value: opt.id,
    label: opt.name
  }));

  const selectedOption = selectOptions.find(opt => String(opt.value) === String(value)) || null;

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: mode === "dark" ? "#1f2937" : "#fbfbfb",
      borderColor: "#d1d5db",
      borderRadius: "0.5rem",
      minHeight: "2.5rem",
      padding: "2px",
      boxShadow: "none",
      "&:hover": { borderColor: "#9ca3af" },
      cursor: disabled ? "not-allowed" : "pointer",
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: mode === "dark" ? "#f9fafb" : "#111827",
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "#9ca3af",
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: mode === "dark" ? "#1f2937" : "#f3f4f6",
      borderRadius: "0.5rem",
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? mode === "dark" ? "#374151" : "#e5e7eb"
        : mode === "dark" ? "#1f2937" : "#f3f4f6",
      color: mode === "dark" ? "#f9fafb" : "#111827",
      cursor: "pointer",
    }),
  };

  const handleChange = (option: SingleValue<{ value: string | number; label: string }>) => {
    if (onChange) {
      const event = {
        target: { name, value: option ? option.value : "" },
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(event);
    }
  };

  const handleBlur = () => {
    if (onBlur) onBlur({ target: { name, value: selectedOption?.value || "" } } as React.FocusEvent<HTMLSelectElement>);
  };

  const handleFocus = () => {
    if (onFocus) onFocus({ target: { name, value: selectedOption?.value || "" } } as React.FocusEvent<HTMLSelectElement>);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {title && (
        <label htmlFor={name} className={`mb-2 ${mode === "dark" ? "text-neutral-100" : "text-neutral-800"}`}>
          {title}
        </label>
      )}
      <ReactSelect
        inputId={name}
        value={selectedOption}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        options={selectOptions}
        styles={customStyles}
        isDisabled={disabled}
        placeholder="Selecione..."
        classNamePrefix="react-select"
      />
    </div>
  );
}

export default Select;
