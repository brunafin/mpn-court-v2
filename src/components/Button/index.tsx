import { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "purple"
  | "ghost";

export type ButtonSize = "md" | "lg";

type ButtonClassOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

const sizeClass: Record<ButtonSize, string> = {
  md: "min-h-12 rounded-xl px-4 text-base",
  lg: "min-h-14 rounded-2xl px-4 text-lg",
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-blue text-white hover:brightness-105 focus-visible:outline-white enabled:active:brightness-95",
  secondary:
    "border border-accent-blue-soft bg-master text-accent-blue-soft hover:bg-accent-blue/10 focus-visible:outline-accent-blue",
  danger:
    "bg-danger-400 text-white hover:brightness-110 focus-visible:outline-danger-400 enabled:active:brightness-95",
  success:
    "bg-accent-green text-master hover:brightness-110 focus-visible:outline-accent-green enabled:active:brightness-95",
  purple:
    "bg-accent-purple text-white hover:brightness-110 focus-visible:outline-accent-purple enabled:active:brightness-95",
  ghost:
    "bg-transparent text-text-light hover:bg-master-light focus-visible:outline-accent-blue",
};

/**
 * Classes compartilhadas para <button> e <Link>/<a>.
 * Preferir o componente Button quando for um button nativo.
 */
export function buttonClassName({
  variant = "primary",
  size = "lg",
  fullWidth = true,
  className = "",
}: ButtonClassOptions = {}): string {
  return [
    "inline-flex items-center justify-center gap-2 font-semibold transition",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    sizeClass[size],
    variantClass[variant],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
};

function Button({
  variant = "primary",
  size = "lg",
  fullWidth = true,
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
