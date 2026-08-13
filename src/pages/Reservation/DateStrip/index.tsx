import { useEffect, useMemo, useRef } from "react";
import { addDays, format, isSameDay, startOfDay } from "date-fns";

type Props = {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  daysBefore?: number;
  daysAfter?: number;
};

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function DateStrip({
  selectedDate,
  setSelectedDate,
  daysBefore = 7,
  daysAfter = 21,
}: Props) {
  const selectedRef = useRef<HTMLButtonElement>(null);
  const today = useMemo(() => startOfDay(new Date()), []);

  const days = useMemo(() => {
    let start = addDays(today, -daysBefore);
    let end = addDays(today, daysAfter);
    const selected = startOfDay(selectedDate);

    if (selected < start) start = selected;
    if (selected > end) end = selected;

    const length =
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return Array.from({ length }, (_, i) => addDays(start, i));
  }, [today, selectedDate, daysBefore, daysAfter]);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }, [selectedDate]);

  return (
    <div className="overflow-hidden rounded-2xl bg-master lg:rounded-2xl lg:bg-master-light">
      <div className="flex gap-3 overflow-x-auto scroll-px-3 px-3 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:gap-2.5 lg:scroll-px-2 lg:px-2 lg:py-1.5">
        {days.map((day) => {
          const selected = isSameDay(day, selectedDate);
          const isPast = day < today;

          return (
            <button
              key={day.toISOString()}
              ref={selected ? selectedRef : undefined}
              type="button"
              onClick={() => setSelectedDate(day)}
              aria-label={`${WEEKDAYS[day.getDay()]} ${format(day, "d")}`}
              aria-pressed={selected}
              className={`flex min-h-14 min-w-[3.5rem] shrink-0 flex-col items-center justify-center rounded-xl px-2.5 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue lg:min-h-[4.25rem] lg:min-w-[3.75rem] lg:rounded-2xl ${
                selected
                  ? "bg-text-light/90 text-master active:brightness-95"
                  : isPast
                    ? "mpn-tap text-text-light/55 hover:bg-text-light/10"
                    : "mpn-tap text-text-light hover:bg-text-light/10"
              }`}
            >
              <span className="text-xs font-semibold tracking-wide uppercase">
                {WEEKDAYS[day.getDay()]}
              </span>
              <span className="text-lg font-bold leading-tight lg:text-xl">
                {format(day, "d")}
              </span>
            </button>
          );
        })}
        <span className="w-1 shrink-0" aria-hidden />
      </div>
    </div>
  );
}

export default DateStrip;
