import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyColorMode,
  readColorMode,
  writeColorMode,
  type ColorMode,
} from "../theme/colorMode";

type ColorModeContextValue = {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
};

const ColorModeContext = createContext<ColorModeContextValue | undefined>(
  undefined,
);

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [colorMode, setColorModeState] = useState<ColorMode>(() => readColorMode());

  useEffect(() => {
    applyColorMode(colorMode);
  }, [colorMode]);

  const setColorMode = (mode: ColorMode) => {
    writeColorMode(mode);
    setColorModeState(mode);
  };

  const value = useMemo(
    () => ({ colorMode, setColorMode }),
    [colorMode],
  );

  return (
    <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>
  );
}

export function useColorMode() {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error("useColorMode deve ser usado dentro de ColorModeProvider");
  }
  return context;
}
