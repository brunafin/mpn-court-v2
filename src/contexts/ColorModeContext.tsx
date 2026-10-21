import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import {
  getColorModePreference,
  updateColorModePreference,
} from "../api/preferences";
import { getAccessToken } from "../utils/authCookie";
import {
  readAgendaColorMode,
  writeAgendaColorMode,
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
  const { pathname } = useLocation();
  const [colorMode, setColorModeState] = useState<ColorMode>(() =>
    readAgendaColorMode(),
  );
  const colorModeRef = useRef(colorMode);
  const loadedToken = useRef<string | null>(null);
  colorModeRef.current = colorMode;

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      loadedToken.current = null;
      return;
    }
    if (loadedToken.current === token) return;

    let cancelled = false;
    getColorModePreference()
      .then((saved) => {
        if (cancelled) return;
        loadedToken.current = token;
        writeAgendaColorMode(saved);
        setColorModeState(saved);
      })
      .catch(() => {
        if (!cancelled) loadedToken.current = null;
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const setColorMode = (mode: ColorMode) => {
    const previous = colorModeRef.current;
    writeAgendaColorMode(mode);
    setColorModeState(mode);
    if (!getAccessToken()) return;
    void updateColorModePreference(mode).catch(() => {
      if (colorModeRef.current !== mode) return;
      writeAgendaColorMode(previous);
      setColorModeState(previous);
    });
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
