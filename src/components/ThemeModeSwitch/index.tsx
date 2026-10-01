import { useId } from "react";
import { useColorMode } from "../../contexts/ColorModeContext";
import type { ColorMode } from "../../theme/colorMode";

const OPTIONS: { id: ColorMode; label: string }[] = [
  { id: "dark", label: "Escuro" },
  { id: "light", label: "Claro" },
];

function ThemeModeSwitch() {
  const { colorMode, setColorMode } = useColorMode();
  const labelId = useId();

  return (
    <div className="flex flex-col gap-2">
      <p id={labelId} className="text-sm font-semibold text-text-light/70">
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
              className={`min-h-10 flex-1 rounded-full px-4 text-sm font-semibold ${
                selected
                  ? "bg-accent-blue text-text-light"
                  : "text-text-light/70"
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
