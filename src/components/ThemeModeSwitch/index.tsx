import { useId } from "react";
import { useColorMode } from "../../contexts/ColorModeContext";
import type { ColorMode } from "../../theme/colorMode";

const OPTIONS: { id: ColorMode; label: string }[] = [
  { id: "light", label: "Claro" },
  { id: "dark", label: "Escuro" },
];

function ThemeModeSwitch({ showLabel = false }: { showLabel?: boolean }) {
  const { colorMode, setColorMode } = useColorMode();
  const labelId = useId();

  return (
    <div className={showLabel ? "mb-3" : undefined}>
      <p
        id={labelId}
        className={
          showLabel
            ? "mb-2 text-base font-semibold leading-6 text-text-light"
            : "sr-only"
        }
      >
        Aparência
      </p>
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex gap-1 rounded-full bg-master-light p-1"
      >
        {OPTIONS.map((option) => {
          const selected = colorMode === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setColorMode(option.id)}
              className={`min-h-11 flex-1 rounded-full px-4 text-base font-semibold ${
                selected ? "mpn-court-chip-selected" : "text-text-light/75"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ThemeModeSwitch;
