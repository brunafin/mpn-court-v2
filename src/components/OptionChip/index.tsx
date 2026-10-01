import { ReactNode } from "react";

type OptionChipProps = {
  label: string;
  icon: ReactNode;
  /** Quando true, mostra só o ícone (lista compacta). */
  iconOnly?: boolean;
};

const chipClass =
  "inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-md bg-text-light/12 px-2 text-base font-medium leading-none text-text-light";

const iconWrapClass =
  "inline-flex size-4 shrink-0 items-center justify-center overflow-hidden [&>svg]:block [&>svg]:size-4";

/**
 * Chip visual único para opções da reserva (rede, evento, churrasqueira, etc.).
 */
function OptionChip({ label, icon, iconOnly = false }: OptionChipProps) {
  if (iconOnly) {
    return (
      <span
        className={`${chipClass} size-8 justify-center px-0`}
        aria-label={label}
      >
        <span className={iconWrapClass} aria-hidden>
          {icon}
        </span>
      </span>
    );
  }

  return (
    <span className={chipClass} aria-label={label}>
      <span className={iconWrapClass} aria-hidden>
        {icon}
      </span>
      <span className="leading-none">{label}</span>
    </span>
  );
}

export default OptionChip;
