import { useCallback, useRef } from "react";

type DaySwipeHandlers = {
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchMove: (event: React.TouchEvent) => void;
  onTouchEnd: (event: React.TouchEvent) => void;
  onTouchCancel: () => void;
};

type Options = {
  /** Deslocamento mínimo em px para trocar o dia. */
  thresholdPx?: number;
  enabled?: boolean;
};

/**
 * Swipe horizontal na lista da agenda: esquerda = dia seguinte, direita = dia anterior.
 * Ignora gestos predominantemente verticais (rolagem).
 */
export function useDaySwipe(
  onSwipeDay: (deltaDays: -1 | 1) => void,
  options: Options = {},
): DaySwipeHandlers {
  const { thresholdPx = 56, enabled = true } = options;
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const axisRef = useRef<"h" | "v" | null>(null);
  const onSwipeDayRef = useRef(onSwipeDay);
  onSwipeDayRef.current = onSwipeDay;

  const reset = useCallback(() => {
    startRef.current = null;
    axisRef.current = null;
  }, []);

  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || event.touches.length !== 1) return;
      const touch = event.touches[0];
      startRef.current = { x: touch.clientX, y: touch.clientY };
      axisRef.current = null;
    },
    [enabled],
  );

  const onTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || !startRef.current || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const dx = touch.clientX - startRef.current.x;
      const dy = touch.clientY - startRef.current.y;

      if (!axisRef.current) {
        if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
        axisRef.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      }
    },
    [enabled],
  );

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || !startRef.current) {
        reset();
        return;
      }

      if (axisRef.current === "h") {
        const touch = event.changedTouches[0];
        const dx = touch.clientX - startRef.current.x;
        if (Math.abs(dx) >= thresholdPx) {
          onSwipeDayRef.current(dx < 0 ? 1 : -1);
        }
      }

      reset();
    },
    [enabled, reset, thresholdPx],
  );

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: reset,
  };
}
