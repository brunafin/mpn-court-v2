interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

function Button({ children, disabled, onClick, type }: ButtonProps) {
  return <button type={type} disabled={disabled} onClick={onClick} className="bg-secondary-600 text-white font-semibold py-2 px-16 mt-4 rounded-lg shadow-md 
  hover:bg-secondary-700 hover:shadow-lg 
  active:bg-secondary-800 active:shadow-inner 
  focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 
  transition-all duration-200 ease-in-out cursor-pointer">{children}</button>;
}
export default Button;