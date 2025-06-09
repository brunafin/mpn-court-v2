import { Link } from "react-router-dom";
import { ReservationStatusEnum } from "../enum";
import {
  MdCheck,
  MdNotInterested,
  MdOutlineLockClock,
  MdOutlineRestaurant,
} from "react-icons/md";
import { BsCashCoin, BsChevronRight } from "react-icons/bs";
import { FaRegCalendarCheck } from "react-icons/fa";
import { IReservationItemProps } from "../interface";

function ReservationItem({
  scheduleId,
  court,
  customerName,
  date,
  status,
  time,
  isBarbecueIncluded = false,
}: IReservationItemProps) {
  const isPastDate =
    new Date(`${date}T${time}`) < new Date(new Date().setSeconds(0, 0));
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return (
        <li
          className={`hover:brightness-110 px-2 border-b-4 border-b-purple-800 bg-neutral-900 md:rounded-sm relative ${
            isPastDate ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <div className="absolute left-0 bg-purple-800 h-full p-1 rounded-tr-sm">
            <MdOutlineLockClock size={14} className="text-neutral-100" />
          </div>
          <Link
            className="flex items-start py-3   justify-between"
            to={`/reservas/${scheduleId}`}
            state={{ date }}
          >
            <span
              className="flex items-center w-6/12 ms-6"
              aria-label={`Data: ${date}, Hora: ${time}, Quadra: ${court}`}
            >
              {time} - {court}
              {isBarbecueIncluded && (
                <div className="bg-primary-300 p-1 rounded-sm ms-2">
                  <MdOutlineRestaurant className="text-neutral-800" />
                </div>
              )}
            </span>
            <div className="flex w-4/12">
              <span className="w-5/12">{customerName}</span>
            </div>
            <BsChevronRight size={24} className="w-1/12 text-neutral-100" />
          </Link>
        </li>
      );
    case ReservationStatusEnum.INACTIVE:
      return (
        <li
          className={`hover:brightness-110 px-2 border-b-4 border-b-danger-400 bg-neutral-900 relative md:rounded-sm  ${
            isPastDate ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <div className="absolute left-0 bg-danger-400 h-12 p-1 rounded-tr-sm md:rounded-t-sm ">
            <MdNotInterested size={14} className="text-neutral-100" />
          </div>
          <Link
            className="flex items-start py-3   justify-between"
            to={`/reservas/${scheduleId}`}
            state={{ date }}
          >
            <span
              className="w-5/12 ms-6"
              aria-label={`Data: ${date}, Hora: ${time}, Quadra: ${court}`}
            >
              {time} - {court}
            </span>
            <BsChevronRight size={24} className="w-1/12 text-neutral-100" />
          </Link>
        </li>
      );
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return (
        <li
          className={`hover:brightness-110 px-2 border-b-4 border-b-secondary-600 bg-neutral-900 relative md:rounded-sm  ${
            isPastDate ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <div className="absolute left-0 bg-secondary-600 h-full p-1 rounded-tr-sm md:rounded-t-sm ">
            <FaRegCalendarCheck size={14} className="text-neutral-100" />
          </div>
          <Link
            className="flex items-start py-3   justify-between"
            to={`/reservas/${scheduleId}`}
            state={{ date }}
          >
            <span
              className="flex items-center w-6/12 ms-6"
              aria-label={`Data: ${date}, Hora: ${time}, Quadra: ${court}`}
            >
              {time} - {court}
              {isBarbecueIncluded && (
                <div className="bg-primary-300 p-1 rounded-sm ms-2">
                  <MdOutlineRestaurant className="text-neutral-800" />
                </div>
              )}
            </span>
            <div className="flex items-center gap-2 w-4/12">
              <span>{customerName}</span>
              {status === ReservationStatusEnum.PREPAID && (
                <div className="bg-warning-500 p-1 rounded-sm">
                  <BsCashCoin size={14} className="text-neutral-800" />
                </div>
              )}
            </div>
            <BsChevronRight size={24} className="w-1/12 text-neutral-100" />
          </Link>
        </li>
      );
    case ReservationStatusEnum.AVAILABLE:
      return (
        <li
          className={`hover:brightness-110 px-2 border-b-4 border-b-tertiary-700 bg-neutral-900 relative md:rounded-sm ${
            isPastDate ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <div className="absolute left-0 bg-tertiary-700 h-12 p-1 rounded-tr-sm md:rounded-t-sm ">
            <MdCheck size={14} className="text-neutral-100" />
          </div>
          <Link
            className="flex items-start py-3   justify-between"
            to={`/reservas/${scheduleId}`}
            state={{ date }}
          >
            <span
              className="w-5/12 ms-6"
              aria-label={`Data: ${date}, Hora: ${time}, Quadra: ${court}`}
            >
              {time} - {court}
            </span>
            <div className="flex items-center gap-2 w-4/12"></div>
            <BsChevronRight size={24} className="w-1/12 text-neutral-100" />
          </Link>
        </li>
      );
    default:
      return <p>status inválido</p>;
  }
}
export default ReservationItem;
