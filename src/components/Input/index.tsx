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
  mode: "light" | "dark";
  className?: string;
}

function Input({
  type,
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
}: IInputProps) {
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
      <input
        id={name}
        value={value}
        placeholder={placeholder}
        type={type}
        className={`w-full px-4 py-2 mb-4 border border-neutral-300 rounded-lg shadow-sm
       hover:border-neutral-400
      focus:outline-none focus:ring-2 focus:ring-primary-300
       transition-all duration-200 ease-in-out 
       ${mode === "dark" ? "bg-neutral-800" : "bg-neutral-100"}
       ${
         mode === "dark" ? "placeholder-neutral-400" : "placeholder-neutral-500"
       }`}
        onChange={onChange}
        onBlur={onBlur}
        onClick={onClick}
        required={required}
      />
    </div>
  );
}
export default Input;
