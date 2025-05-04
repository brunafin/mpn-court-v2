import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BsCalendar4Event } from "react-icons/bs";
import { ptBR } from "date-fns/locale";

interface CustomDatepickerProps {
  dateSelected: Date | null;
  onFocus?: () => void;
  onChange?: (date: Date | null) => void;
}

export default function CustomDatepicker({
  dateSelected,
  onChange,
  onFocus,
}: CustomDatepickerProps) {
  return (
    <div className="relative max-w-xs">
      <DatePicker
        locale={ptBR}
        selected={dateSelected}
        onChange={onChange}
        onFocus={onFocus}
        dateFormat="dd/MM/yyyy"
        className="w-full bg-neutral-800 text-neutral-100 p-2 pr-10 rounded-md border border-neutral-500 focus:outline-none focus:ring-2 focus:ring-secondary-500"
        calendarClassName="!bg-neutral-800 !text-white !border-neutral-700"
        dayClassName={() =>
          "!bg-neutral-800 rounded-sm hover:!bg-primary-600 active:scale-95 active:!bg-primary-700 transition duration-100 !text-neutral-100"
        }
        popperClassName="z-50"
        placeholderText="Selecionar data"
      />
      <BsCalendar4Event
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white pointer-events-none"
        size={18}
      />
    </div>
  );
}
