import { useEffect, useId, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BsX } from "react-icons/bs";
import { MdExpandMore } from "react-icons/md";
import "react-day-picker/dist/style.css";

type Props = {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
};

function CalendarButton({ selectedDate, setSelectedDate }: Props) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(selectedDate);
  const titleId = useId();
  const monthLabel = format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });

  useEffect(() => {
    if (open) {
      setMonth(selectedDate);
    }
  }, [open, selectedDate]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Selecionar data. Mês atual: ${monthLabel}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex min-h-11 min-w-0 max-w-full items-center gap-1 rounded-xl px-1 text-left text-base font-semibold capitalize text-text-light transition hover:bg-master focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue active:bg-master"
      >
        <span className="truncate">{monthLabel}</span>
        <MdExpandMore
          size={22}
          className="shrink-0 text-text-light/70"
          aria-hidden
        />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Fechar calendário"
            className="absolute inset-0 bg-black/75"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex w-full max-h-[90dvh] flex-col rounded-t-3xl border border-text-light/10 bg-master-light shadow-2xl sm:mx-4 sm:max-w-sm sm:rounded-3xl"
          >
            <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-text-light/20 sm:hidden" />

            <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
              <h2
                id={titleId}
                className="text-xl font-semibold leading-7 text-text-light"
              >
                Selecionar data
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-master text-text-light/80 transition active:bg-master/80"
              >
                <BsX size={24} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <DayPicker
                mode="single"
                required
                month={month}
                onMonthChange={setMonth}
                selected={selectedDate}
                onSelect={handleSelect}
                locale={ptBR}
                weekStartsOn={1}
                navLayout="around"
                classNames={{
                  root: "w-full text-text-light",
                  months: "w-full !max-w-full",
                  month:
                    "relative grid w-full grid-cols-[2.75rem_1fr_2.75rem] items-center gap-y-4",
                  month_caption:
                    "col-start-2 row-start-1 !mx-0 flex items-center justify-center",
                  caption_label:
                    "text-xl font-semibold capitalize text-text-light",
                  button_previous:
                    "!static col-start-1 row-start-1 z-10 flex !size-12 items-center justify-center rounded-full text-text-light transition active:bg-master",
                  button_next:
                    "!static col-start-3 row-start-1 z-10 flex !size-12 items-center justify-center rounded-full text-text-light transition active:bg-master",
                  chevron: "fill-text-light !size-5 pointer-events-none",
                  month_grid: "col-span-3 row-start-2 w-full",
                  weekdays: "mb-2 grid grid-cols-7",
                  weekday:
                    "text-center text-sm font-semibold uppercase tracking-wide text-text-light/70",
                  weeks: "",
                  week: "mt-1.5 grid grid-cols-7",
                  day: "flex aspect-square items-center justify-center",
                  day_button:
                    "flex size-12 max-w-full items-center justify-center rounded-full text-lg font-semibold text-text-light transition active:bg-master",
                  today: "[&_button]:font-bold [&_button]:text-accent-blue",
                  selected:
                    "[&_button]:bg-accent-blue [&_button]:font-semibold [&_button]:text-white",
                  outside: "[&_button]:text-text-light/25",
                  disabled:
                    "[&_button]:text-text-light/20 [&_button]:opacity-40",
                  focused:
                    "[&_button]:outline [&_button]:outline-2 [&_button]:outline-accent-blue/50",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CalendarButton;
