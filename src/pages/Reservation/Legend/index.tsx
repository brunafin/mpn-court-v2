import { BsCashCoin } from "react-icons/bs";
import { FaRegCalendarCheck } from "react-icons/fa";
import {
  MdNotInterested,
  MdOutlineAccessTime,
  MdOutlineLockClock,
} from "react-icons/md";
import { ReservationStatusEnum } from "../enum";

interface LegendProps {
  statusSelected: ReservationStatusEnum | null;
  setStatusSelected: (status: ReservationStatusEnum | null) => void;
  courtSelected: string;
  setCourtSelected: (court: string) => void;
  courts: string[];
  isOpen: boolean;
}

function LegendAndFilters({
  setStatusSelected,
  statusSelected,
  courtSelected,
  setCourtSelected,
  courts,
  isOpen,
}: LegendProps) {
  return (
    <div
      className={`${
        isOpen
          ? "px-2 absolute top-28 w-full h-fit shadow-lg z-10 rounded-lg"
          : ""
      }`}
    >
      <div className="bg-neutral-900 rounded-lg">
        <div
          className={`bg-neutral-900 items-center text-neutral-100 justify-center p-2 pb-0 ${
            isOpen ? "rounded-tl-lg flex" : "hidden md:flex bg-neutral-900"
          }"`}
        >
          <p className="text-lg my-2">Selecione um status para filtrar</p>
        </div>
        <ul
          className={`bg-neutral-900 flex p-2 items-center gap-2 md:gap-8 justify-start flex-wrap md:justify-center ${
            isOpen ? "flex" : "hidden md:flex"
          }`}
        >
          <li>
            <button
              onClick={() => setStatusSelected(null)}
              className={`flex items-center justify-center gap-2 text-neutral-100 border-2 border-primary-500 rounded-sm py-1 px-2 hover:bg-primary-500 hover:text-neutral-100 ${
                statusSelected === null ? "bg-primary-500" : ""
              }`}
            >
              Todos
            </button>
          </li>
          <li>
            <button
              onClick={() => setStatusSelected(ReservationStatusEnum.AVAILABLE)}
              className={`flex items-center justify-center gap-2 text-neutral-100 border-2 border-tertiary-700 hover:bg-tertiary-700 rounded-sm py-1 px-2 ${
                statusSelected === ReservationStatusEnum.AVAILABLE
                  ? "bg-tertiary-700"
                  : ""
              }`}
            >
              <MdOutlineAccessTime size={18} />
              Livre
            </button>
          </li>
          <li>
            <button
              onClick={() => setStatusSelected(ReservationStatusEnum.FIXED)}
              className={`flex items-center justify-center gap-2 text-neutral-100 border-2 border-neutral-600 rounded-sm py-1 px-2 hover:bg-neutral-600 ${
                statusSelected === ReservationStatusEnum.FIXED
                  ? "bg-neutral-600"
                  : ""
              }`}
            >
              <MdOutlineLockClock size={18} />
              Fixo
            </button>
          </li>
          <li>
            <button
              onClick={() => setStatusSelected(ReservationStatusEnum.INACTIVE)}
              className={`flex items-center justify-center gap-2 text-neutral-100 border-2 border-danger-400 rounded-sm py-1 px-2 hover:bg-danger-400 ${
                statusSelected === ReservationStatusEnum.INACTIVE
                  ? "bg-danger-400"
                  : ""
              }`}
            >
              <MdNotInterested size={18} />
              Inativo
            </button>
          </li>
          <li>
            <button
              onClick={() => setStatusSelected(ReservationStatusEnum.RESERVED)}
              className={`flex items-center justify-center gap-2 text-neutral-100 border-2 border-secondary-500 hover:bg-secondary-500 rounded-sm py-1 px-2 ${
                statusSelected === ReservationStatusEnum.RESERVED
                  ? "bg-secondary-500"
                  : ""
              }`}
            >
              <FaRegCalendarCheck size={18} />
              Reservado
            </button>
          </li>
          <li>
            <button
              onClick={() => setStatusSelected(ReservationStatusEnum.PREPAID)}
              className={`flex items-center justify-center gap-2 text-neutral-100 border-2 border-warning-500 hover:bg-warning-500 hover:text-neutral-800 rounded-sm py-1 px-2 ${
                statusSelected === ReservationStatusEnum.PREPAID
                  ? "bg-warning-500 text-neutral-800"
                  : ""
              }`}
            >
              <BsCashCoin size={18} />
              Pagamento antecipado
            </button>
          </li>
        </ul>
      </div>
      <div
        className={`${
          isOpen ? "p-2 rounded-b-lg" : "hidden md:flex"
        } flex flex-col md:items-center gap-4 py-4 px-2 bg-neutral-900`}
      >
        <p className="text-lg">Selecione a quadra para filtrar:</p>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-neutral-100">
            <input
              type="radio"
              name="court"
              value="all"
              className="accent-primary-500"
              onChange={() => setCourtSelected("all")}
              checked={courtSelected === "all"}
            />
            Todas
          </label>
          {courts?.map((item) => (
            <label
              className="flex items-center gap-2 text-neutral-100"
              key={item}
            >
              <input
                type="radio"
                name="court"
                value={item}
                className="accent-primary-500"
                onChange={() => setCourtSelected(item)}
                checked={courtSelected === item}
              />
              {item}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
export default LegendAndFilters;
