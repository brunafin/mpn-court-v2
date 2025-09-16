// import { BsCashCoin } from "react-icons/bs";
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
  isOpen: boolean;
  setIsOpenFilters: (isOpen: boolean) => void;
}

function LegendAndFilters({
  setStatusSelected,
  statusSelected,
  isOpen,
  setIsOpenFilters,
}: LegendProps) {
  return (
    <div
      className={`${
        isOpen
          ? "absolute top-36 w-full shadow-lg z-10 md:w-1/2 md:left-100"
          : ""
      }`}
    >
      <div className="bg-neutral-900 rounded-lg">
        <div
          className={`bg-neutral-900 items-center text-neutral-100 justify-center p-2 pb-0 ${
            isOpen ? "rounded-t-lg flex" : "hidden bg-neutral-900"
          }"`}
        >
          <p className="text-lg my-2 md:text-center">
            Selecione um status para filtrar
          </p>
        </div>
        <ul
          className={`bg-neutral-900 flex p-4 items-center gap-4 justify-start flex-wrap md:justify-center ${
            isOpen ? "flex" : "hidden"
          }`}
        >
          <li>
            <button
              onClick={() => {
                setStatusSelected(null);
                setIsOpenFilters(false);
              }}
              className={`flex items-center justify-center gap-2 text-neutral-100 border-1 border-neutral-400 rounded-sm py-1 px-2 hover:text-neutral-100 active:bg-neutral-100 active:text-neutral-800 ${
                statusSelected === null ? "bg-neutral-900" : ""
              }`}
            >
              Todos
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setStatusSelected(ReservationStatusEnum.AVAILABLE);
                setIsOpenFilters(false);
              }}
              className={`flex items-center justify-center gap-2 text-neutral-100 border-2 border-tertiary-800 hover:bg-tertiary-800 rounded-sm py-1 px-2 ${
                statusSelected === ReservationStatusEnum.AVAILABLE
                  ? "bg-tertiary-800"
                  : ""
              }`}
            >
              <MdOutlineAccessTime size={18} />
              Disponível
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setStatusSelected(ReservationStatusEnum.RESERVED);
                setIsOpenFilters(false);
              }}
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
              onClick={() => {
                setStatusSelected(ReservationStatusEnum.FIXED);
                setIsOpenFilters(false);
              }}
              className={`flex items-center justify-center gap-2 text-neutral-100 border-2 border-purple-800 rounded-sm py-1 px-2 hover:bg-purple-900 ${
                statusSelected === ReservationStatusEnum.FIXED
                  ? "bg-purple-900 border-purple-900"
                  : ""
              }`}
            >
              <MdOutlineLockClock size={18} />
              Fixo
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setStatusSelected(ReservationStatusEnum.INACTIVE);
                setIsOpenFilters(false);
              }}
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
          {/* <li>
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
          </li> */}
        </ul>
      </div>
    </div>
  );
}
export default LegendAndFilters;
