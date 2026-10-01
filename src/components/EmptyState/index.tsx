import { ReactNode } from "react";

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
      className={`mx-auto flex w-full max-w-sm flex-col items-center px-6 py-10 text-center ${className}`}
    >
      <h2 className="text-base font-semibold text-text-light">{title}</h2>
      {description ? (
        <p className="mt-1.5 text-base leading-5 text-text-light/70">{description}</p>
      ) : null}
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </div>
  );
}

/** Ação do vazio, só texto. */
export function emptyStateActionClassName(extra = "") {
  return [
    "inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-base font-semibold text-accent-blue-soft transition",
    "hover:bg-text-light/10",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export default EmptyState;
