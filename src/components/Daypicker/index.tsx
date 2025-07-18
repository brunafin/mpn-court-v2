"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format, addDays, subDays } from "date-fns";
import { BsCalendar4Event, BsChevronLeft, BsChevronRight } from "react-icons/bs";
import "react-day-picker/dist/style.css";

type Props = {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

export default function Daypicker({ selectedDate, setSelectedDate }: Props) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const defaultClassNames = getDefaultClassNames();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleSelect = (date: Date) => {
    setSelectedDate(date);
    setOpen(false);
  };

  const goPreviousDay = () => {
    setSelectedDate(selectedDate ? subDays(selectedDate, 1) : new Date());
  };

  const goNextDay = () => {
    setSelectedDate(selectedDate ? addDays(selectedDate, 1) : new Date());
  };

  return (
    <div className="relative inline-flex items-center space-x-2 font-sans text-neutral-700">
      <button
        disabled={
          !selectedDate ||
          format(selectedDate, "yyyy-MM-dd") <= format(new Date(), "yyyy-MM-dd")
        }
        onClick={goPreviousDay}
        aria-label="Dia anterior"
        className="p-2 hover:cursor-pointer disabled:cursor-not-allowed rounded-md text-neutral-300 hover:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-500"
        type="button"
      >
        <BsChevronLeft size={20} />
      </button>

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 border-1 border-neutral-200 px-4 py-2 rounded-md bg-neutral-800 text-neutral-100 hover:brightness-95 active:brightness-95 focus:outline-none focus:ring-2 focus:ring-neutral-500"
        type="button"
      >
        {selectedDate
          ? `${format(selectedDate, "EEE", {
            locale: ptBR,
          })}, ${selectedDate.toLocaleDateString("pt-BR")}`
          : "Selecione uma data"}
          <BsCalendar4Event className="text-neutral-100" />
      </button>

      <button
        onClick={goNextDay}
        aria-label="Próximo dia"
        className="hover:cursor-pointer p-2 rounded-md text-neutral-300 hover:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-500"
        type="button"
      >
        <BsChevronRight size={20} />
      </button>

      {/* Popover do calendário */}
      {open && (
        <div
          ref={popoverRef}
          className="absolute z-20 mt-48 left-1/2 transform -translate-x-1/2 bg-neutral-100 border border-neutral-300 rounded-md shadow-sm"
          style={{ minWidth: 280 }}
        >
          <DayPicker
            mode="single"
            required
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={{ before: new Date() }}
            locale={ptBR}
            weekStartsOn={1}
            classNames={{
              root: `${defaultClassNames.root} shadow-lg p-5`,
              chevron: "fill-neutral-600",
              today: "text-neutral-800 font-bold",
              selected: "bg-secondary-500 text-white rounded-full active:bg-secondary-400",
            }}
          />
        </div>
      )}
    </div>
  );
}
