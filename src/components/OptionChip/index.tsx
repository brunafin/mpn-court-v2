import { ReactNode } from "react";

type OptionChipProps = {
  label: string;
  icon: ReactNode;
  /** Quando true, mostra só o ícone (lista compacta). */
  iconOnly?: boolean;
  /** Preenchimento e tinta mais leves no tema claro. */
  soft?: boolean;
};

const chipLayout =
  "inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-base font-medium leading-none";

const chipSurface = "bg-text-light/12 text-text-light";

const iconWrapClass =
  "inline-flex size-4 shrink-0 items-center justify-center overflow-hidden [&>svg]:block [&>svg]:size-4";

/**
 * Chip visual único para opções da reserva (rede, evento, churrasqueira, etc.).
 */
function OptionChip({ label, icon, iconOnly = false, soft = false }: OptionChipProps) {
  const surface = soft ? "mpn-option-chip-soft" : chipSurface;

  if (iconOnly) {
    return (
      <span
        className={`${chipLayout} ${surface} size-8 justify-center px-0`}
        aria-label={label}
      >
        <span className={iconWrapClass} aria-hidden>
          {icon}
        </span>
      </span>
    );
  }

  return (
    <span className={`${chipLayout} ${surface}`} aria-label={label}>
      <span className={iconWrapClass} aria-hidden>
        {icon}
      </span>
      <span className="leading-none">{label}</span>
    </span>
  );
}

export default OptionChip;
