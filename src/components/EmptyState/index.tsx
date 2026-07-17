import { ReactNode } from "react";
import { buttonClassName } from "../Button";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

function EmptyState({
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center px-6 py-16 ${className}`}
    >
      <p className="text-center text-lg font-medium text-text-light">{title}</p>
      {description && (
        <p className="mt-2 max-w-xs text-center text-base leading-6 text-text-light/65">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex w-full max-w-xs justify-center">{action}</div>}
    </div>
  );
}

/** CTA padrão secondary para empty states. */
export function emptyStateActionClassName(extra = "") {
  return buttonClassName({
    variant: "secondary",
    size: "md",
    fullWidth: false,
    className: `px-5 ${extra}`.trim(),
  });
}

export default EmptyState;
