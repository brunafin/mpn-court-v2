import { useCallback, useRef } from "react";

type DaySwipeHandlers = {
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchEnd: (event: React.TouchEvent) => void;
  onTouchCancel: () => void;
};

type Options = {
  /** Deslocamento mínimo em px para trocar o dia. */
  thresholdPx?: number;
  /** Exige que o horizontal domine o vertical por este fator. */
  horizontalDominance?: number;
  enabled?: boolean;
};

const NO_SWIPE_SELECTOR = "[data-no-day-swipe]";

/**
 * Swipe horizontal na lista da agenda: esquerda = dia seguinte, direita = dia anterior.
 * Só decide no touchend (sem touchmove/preventDefault) para não travar a rolagem vertical.
 */
export function useDaySwipe(
  onSwipeDay: (deltaDays: -1 | 1) => void,
  options: Options = {},
): DaySwipeHandlers {
  const {
    thresholdPx = 72,
    horizontalDominance = 1.6,
    enabled = true,
  } = options;
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const onSwipeDayRef = useRef(onSwipeDay);
  onSwipeDayRef.current = onSwipeDay;

  const reset = useCallback(() => {
    startRef.current = null;
  }, []);

  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || event.touches.length !== 1) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(NO_SWIPE_SELECTOR)
      ) {
        startRef.current = null;
        return;
      }
      const touch = event.touches[0];
      startRef.current = { x: touch.clientX, y: touch.clientY };
    },
    [enabled],
  );

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || !startRef.current) {
        reset();
        return;
      }

      const touch = event.changedTouches[0];
      if (!touch) {
        reset();
        return;
      }

      const dx = touch.clientX - startRef.current.x;
      const dy = touch.clientY - startRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Só troca o dia se o gesto for claramente horizontal (não uma rolagem).
      if (
        absDx >= thresholdPx &&
        absDx >= absDy * horizontalDominance
      ) {
        onSwipeDayRef.current(dx < 0 ? 1 : -1);
      }

      reset();
    },
    [enabled, horizontalDominance, reset, thresholdPx],
  );

  return {
    onTouchStart,
    onTouchEnd,
    onTouchCancel: reset,
  };
}
