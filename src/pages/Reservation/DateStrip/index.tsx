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
      inline: "center",
      block: "nearest",
    });
  }, [selectedDate]);

  return (
    <div className="overflow-hidden rounded-2xl bg-master">
      <div className="flex gap-3 overflow-x-auto px-2 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              className={`flex min-h-14 min-w-[3.5rem] shrink-0 flex-col items-center justify-center rounded-xl px-2.5 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue ${
                selected
                  ? "bg-accent-blue text-white"
                  : isPast
                    ? "text-text-light/55"
                    : "text-text-light hover:bg-text-light/10"
              }`}
            >
              <span className="text-xs font-semibold tracking-wide uppercase">
                {WEEKDAYS[day.getDay()]}
              </span>
              <span className="text-lg font-bold leading-tight">
                {format(day, "d")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default DateStrip;
