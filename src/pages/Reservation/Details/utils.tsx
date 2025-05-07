import { BsQuestionCircle } from "react-icons/bs";
import { ReservationStatusEnum } from "../enum";
import {
  MdNotInterested,
  MdOutlineAccessTime,
  MdOutlineLockClock,
  MdOutlineLockOpen,
} from "react-icons/md";
import { FaRegCalendarCheck } from "react-icons/fa";
import { changeAvailability } from "../../../api/schedules";
import { useNavigate } from "react-router-dom";

export function getReservationIcon(status?: ReservationStatusEnum | null) {
  if (!status) return <BsQuestionCircle size={18} />;
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return <MdOutlineLockClock className="mt-1" size={18} />;
    case ReservationStatusEnum.INACTIVE:
      return <MdNotInterested className="mt-1" size={18} />;
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return <FaRegCalendarCheck className="mt-1" size={18} />;
    case ReservationStatusEnum.AVAILABLE:
      return <MdOutlineAccessTime className="mt-1" size={18} />;
    default:
      return <BsQuestionCircle className="mt-1" size={18} />;
  }
}

export function getColorByStatus(status?: ReservationStatusEnum | null) {
  if (!status) return "bg-gray-400";
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return "bg-neutral-600";
    case ReservationStatusEnum.INACTIVE:
      return "bg-danger-400";
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return "bg-secondary-600";
    case ReservationStatusEnum.AVAILABLE:
      return "bg-tertiary-700";
    default:
      return "bg-gray-400";
  }
}

export function renderButtonByStatus(
  courtScheduleId: string,
  status: ReservationStatusEnum | null,
  navigate: ReturnType<typeof useNavigate>
) {
  if (!status) return null;
  switch (status) {
    case ReservationStatusEnum.FIXED:
    case ReservationStatusEnum.INACTIVE:
      return (
        <button
          onClick={async () => {
            await changeAvailability(courtScheduleId, true);
            navigate("/reservas");
          }}
          className="flex items-center justify-center w-fit rounded-sm bg-tertiary-700 text-neutral-100 gap-1 text-sm py-1 px-2"
        >
          <MdOutlineLockOpen size={18} />
          Liberar horário
        </button>
      );
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return (
        <button className="flex items-start justify-center w-fit rounded-sm bg-neutral-700 text-neutral-100 gap-1 text-sm py-1 px-2">
          <MdOutlineLockClock size={18} />
          Fixar horário
        </button>
      );
    case ReservationStatusEnum.AVAILABLE:
      return (
        <button
          onClick={async () => {
            await changeAvailability(courtScheduleId, false);
            navigate("/reservas");
          }}
          className="flex items-center justify-center w-fit rounded-sm bg-danger-400 text-neutral-100 gap-1 text-xs py-1 px-2"
        >
          <MdNotInterested size={18} />
          Inativar horário
        </button>
      );
    default:
      return null;
  }
}
