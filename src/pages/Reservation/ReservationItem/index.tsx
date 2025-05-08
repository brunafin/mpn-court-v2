import { Link } from "react-router-dom";
import { ReservationStatusEnum } from "../enum";
import { MdCheck, MdNotInterested, MdOutlineLockClock } from "react-icons/md";
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
}: IReservationItemProps) {
  const isPastDate =
    new Date(`${date}T${time}`) < new Date(new Date().setSeconds(0, 0));
  // switch (status) {
  //   case ReservationStatusEnum.FIXED:
  //     return (
  //       <li
  //         className={`hover:brightness-110 px-2 bg-neutral-700 ${
  //           isPastDate ? "opacity-60 pointer-events-none" : ""
  //         }`}
  //       >
  //         <Link
  //           className="flex items-start py-3 justify-between"
  //           to={`/reservas/${scheduleId}`}
  //         >
  //           <MdOutlineLockClock size={18} className="w-1/12 ms-6" />
  //           <span
  //             className="w-5/12"
  //             aria-label={`Data: ${date}, Hora: ${time}, Quadra: ${court}`}
  //           >
  //             {time} - {court}
  //           </span>
  //           <span className="w-5/12">{customerName}</span>
  //           <BsChevronRight size={24} className="w-1/12" />
  //         </Link>
  //       </li>
  //     );
  //   case ReservationStatusEnum.INACTIVE:
  //     return (
  //       <li
  //         className={`hover:brightness-110 px-2 bg-danger-400 ${
  //           isPastDate ? "opacity-60 pointer-events-none" : ""
  //         }`}
  //       >
  //         <Link
  //           className="flex items-center py-3   justify-between"
  //           to={`/reservas/${scheduleId}`}
  //         >
  //           <MdNotInterested size={18} className="w-1/12 ms-6" />
  //           <span
  //             className="w-5/12"
  //             aria-label={`Data: ${date}, Hora: ${time}, Quadra: ${court}`}
  //           >
  //             {time} - {court}
  //           </span>
  //           <span className="w-5/12">-</span>
  //           <BsChevronRight size={24} className="w-1/12 text-neutral-100" />
  //         </Link>
  //       </li>
  //     );
  //   case ReservationStatusEnum.RESERVED:
  //     return (
  //       <li
  //         className={`hover:brightness-110 px-2 bg-secondary-600 ${
  //           isPastDate ? "opacity-60 pointer-events-none" : ""
  //         }`}
  //       >
  //         <Link
  //           className="flex items-start py-3   justify-between"
  //           to={`/reservas/${scheduleId}`}
  //         >
  //           <FaRegCalendarCheck size={18} className="w-1/12 ms-6" />
  //           <span
  //             className="w-5/12"
  //             aria-label={`Data: ${date}, Hora: ${time}, Quadra: ${court}`}
  //           >
  //             {time} - {court}
  //           </span>
  //           <span className="w-5/12">{customerName}</span>
  //           <BsChevronRight size={24} className="w-1/12 text-neutral-100" />
  //         </Link>
  //       </li>
  //     );
  //   case ReservationStatusEnum.AVAILABLE:
  //     return (
  //       <li
  //         className={`hover:brightness-110 px-2 bg-tertiary-700 ${
  //           isPastDate ? "opacity-60 pointer-events-none" : ""
  //         }`}
  //       >
  //         <Link
  //           className="flex items-center py-3 justify-between"
  //           to={`/reservas/${scheduleId}`}
  //         >
  //           <MdOutlineAccessTime size={18} className="w-1/12 ms-6" />
  //           <span
  //             className="w-5/12"
  //             aria-label={`Data: ${date}, Hora: ${time}, Quadra: ${court}`}
  //           >
  //             {time} - {court}
  //           </span>
  //           <span className="w-5/12">-</span>
  //           <BsChevronRight size={24} className="w-1/12 text-neutral-100" />
  //         </Link>
  //       </li>
  //     );
  //   case ReservationStatusEnum.PREPAID:
  //     return (
  //       <li
  //         className={`hover:brightness-110 px-2 bg-secondary-600 relative ${
  //           isPastDate ? "opacity-60 pointer-events-none" : ""
  //         }`}
  //       >
  //         <div className="absolute left-0 bg-warning-500 h-12 p-1 rounded-tr-sm rounded-br-sm">
  //           <BsCashCoin size={14} className="text-neutral-800" />
  //         </div>
  //         <Link
  //           className="flex items-start py-3   justify-between"
  //           to={`/reservas/${scheduleId}`}
  //         >
  //           <FaRegCalendarCheck size={18} className="w-1/12 ms-6" />
  //           <span
  //             className="w-5/12"
  //             aria-label={`Data: ${date}, Hora: ${time}, Quadra: ${court}`}
  //           >
  //             {time} - {court}
  //           </span>
  //           <span className="w-5/12">{customerName}</span>
  //           <BsChevronRight size={24} className="w-1/12 text-neutral-100" />
  //         </Link>
  //       </li>
  //     );
  //   default:
  //     return <p>status inválido</p>;
  // }
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return (
        <li
          className={`hover:brightness-110 px-2 border-b-4 border-b-purple-800 bg-neutral-900 relative ${
            isPastDate ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <div className="absolute left-0 bg-purple-800 h-12 p-1 rounded-tr-sm rounded-br-sm">
            <MdOutlineLockClock size={14} className="text-neutral-100" />
          </div>
          <Link
            className="flex items-start py-3   justify-between"
            to={`/reservas/${scheduleId}`}
          >
            {/* <MdOutlineLockClock size={18} className="w-1/12 ms-6" /> */}
            <span
              className="w-5/12 ms-6"
              aria-label={`Data: ${date}, Hora: ${time}, Quadra: ${court}`}
            >
              {time} - {court}
            </span>
            <span className="w-5/12">{customerName}</span>
            <BsChevronRight size={24} className="w-1/12 text-neutral-100" />
          </Link>
        </li>
      );
    case ReservationStatusEnum.INACTIVE:
      return (
        <li
          className={`hover:brightness-110 px-2 border-b-4 border-b-danger-400 bg-neutral-900 relative ${
            isPastDate ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <div className="absolute left-0 bg-danger-400 h-12 p-1 rounded-tr-sm rounded-br-sm">
            <MdNotInterested size={14} className="text-neutral-100" />
          </div>
          <Link
            className="flex items-start py-3   justify-between"
            to={`/reservas/${scheduleId}`}
          >
            {/* <MdNotInterested size={18} className="w-1/12 ms-6" /> */}
            <span
              className="w-5/12 ms-6"
              aria-label={`Data: ${date}, Hora: ${time}, Quadra: ${court}`}
            >
              {time} - {court}
            </span>
            <span className="w-5/12">{customerName}</span>
            <BsChevronRight size={24} className="w-1/12 text-neutral-100" />
          </Link>
        </li>
      );
    case ReservationStatusEnum.RESERVED:
      return (
        <li
          className={`hover:brightness-110 px-2 border-b-4 border-b-secondary-600 bg-neutral-900 relative ${
            isPastDate ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <div className="absolute left-0 bg-secondary-600 h-12 p-1 rounded-tr-sm rounded-br-sm">
            <FaRegCalendarCheck size={14} className="text-neutral-100" />
          </div>
          <Link
            className="flex items-start py-3   justify-between"
            to={`/reservas/${scheduleId}`}
          >
            {/* <FaRegCalendarCheck size={18} className="w-1/12 ms-6" /> */}
            <span
              className="w-5/12 ms-6"
              aria-label={`Data: ${date}, Hora: ${time}, Quadra: ${court}`}
            >
              {time} - {court}
            </span>
            <span className="w-5/12">{customerName}</span>
            <BsChevronRight size={24} className="w-1/12 text-neutral-100" />
          </Link>
        </li>
      );
    case ReservationStatusEnum.AVAILABLE:
      return (
        <li
          className={`hover:brightness-110 px-2 border-b-4 border-b-tertiary-700 bg-neutral-900 relative ${
            isPastDate ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <div className="absolute left-0 bg-tertiary-700 h-12 p-1 rounded-tr-sm rounded-br-sm">
            <MdCheck size={14} className="text-neutral-100" />
          </div>
          <Link
            className="flex items-start py-3   justify-between"
            to={`/reservas/${scheduleId}`}
          >
            {/* <MdOutlineAccessTime size={18} className="w-1/12 ms-6" /> */}
            <span
              className="w-5/12 ms-6"
              aria-label={`Data: ${date}, Hora: ${time}, Quadra: ${court}`}
            >
              {time} - {court}
            </span>
            <span className="w-5/12">{customerName}</span>
            <BsChevronRight size={24} className="w-1/12 text-neutral-100" />
          </Link>
        </li>
      );
    case ReservationStatusEnum.PREPAID:
      return (
        <li
          className={`hover:brightness-110 px-2 border-b-4 border-b-secondary-600 bg-neutral-900 relative ${
            isPastDate ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <div className="absolute left-0 bg-warning-500 h-12 p-1 rounded-tr-sm rounded-br-sm">
            <BsCashCoin size={14} className="text-neutral-800" />
          </div>
          <Link
            className="flex items-start py-3   justify-between"
            to={`/reservas/${scheduleId}`}
          >
            {/* <FaRegCalendarCheck size={18} className="w-1/12 ms-6" /> */}
            <span
              className="w-5/12 ms-6"
              aria-label={`Data: ${date}, Hora: ${time}, Quadra: ${court}`}
            >
              {time} - {court}
            </span>
            <span className="w-5/12">{customerName}</span>
            <BsChevronRight size={24} className="w-1/12 text-neutral-100" />
          </Link>
        </li>
      );
    default:
      return <p>status inválido</p>;
  }
}
export default ReservationItem;
