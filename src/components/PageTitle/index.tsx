import { ReactNode } from "react";

/** Rótulo discreto em hubs com Header (ex.: Reservas, Minhas infos). */
export function PageEyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`min-w-0 truncate px-0.5 text-sm font-semibold uppercase tracking-wide text-text-light/55 ${className}`}
    >
      {children}
    </h2>
  );
}

/** Título principal em subpáginas com barra de voltar. */
export function PageTitle({
  children,
  align = "left",
  className = "",
  as: Tag = "h1",
}: {
  children: ReactNode;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <Tag
      className={`min-w-0 truncate text-xl font-semibold tracking-tight text-text-light ${
        align === "center" ? "text-center" : ""
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
