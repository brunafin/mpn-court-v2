import { BsQuestionCircle, BsWhatsapp } from "react-icons/bs";
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
      return <MdOutlineLockClock size={18} />;
    case ReservationStatusEnum.INACTIVE:
      return <MdNotInterested size={18} />;
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return <FaRegCalendarCheck size={18} />;
    case ReservationStatusEnum.AVAILABLE:
      return <MdOutlineAccessTime size={18} />;
    default:
      return <BsQuestionCircle size={18} />;
  }
}

export function getColorByStatus(status?: ReservationStatusEnum | null) {
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return "border-b-8 border-b-purple-900";
    case ReservationStatusEnum.INACTIVE:
      return "border-b-8 border-b-danger-400";
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return "border-b-8 border-b-secondary-600";
    case ReservationStatusEnum.AVAILABLE:
      return "border-b-8 border-b-tertiary-700";
    default:
      return "border-b-8 border-b-gray-400";
  }
}

export function getBackgroundColorByStatus(
  status?: ReservationStatusEnum | null
) {
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return "bg-purple-900";
    case ReservationStatusEnum.INACTIVE:
      return "bg-danger-400";
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return "bg-secondary-600";
    case ReservationStatusEnum.AVAILABLE:
      return "bg-tertiary-800";
    default:
      return "bg-gray-400";
  }
}

export function getMeanByStatus(
  status?: ReservationStatusEnum | null,
  contactName?: string,
  contactPhone?: string
) {
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return (
        <div
          className={`flex items-center shadow-lg gap-1 h-14 justify-between md:justify-center px-4 ${getBackgroundColorByStatus(
            status
          )}`}
        >
          <div className="flex items-start gap-1">
            {getReservationIcon(status)}
            <p>Fixo</p>
          </div>
          {contactPhone && (
            <div>
              <a
                href={`${
                  import.meta.env.VITE_WHATSAPP_URL_BASE
                }${contactPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-2 p-2 justify-center items-center"
              >
                {contactName}
                <div className="bg-tertiary-600 p-1 rounded-sm">
                  <BsWhatsapp size={20} />
                </div>
              </a>
            </div>
          )}
        </div>
      );
    case ReservationStatusEnum.INACTIVE:
      return (
        <div
          className={`flex items-center shadow-lg gap-1 h-14 justify-center ${getBackgroundColorByStatus(
            status
          )}`}
        >
          <div className="flex gap-1">
            {getReservationIcon(status)}
            <p>Inativo</p>
          </div>
        </div>
      );
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return (
        <div
          className={`flex items-center shadow-lg gap-1 h-14 justify-between md:justify-center px-4 ${getBackgroundColorByStatus(
            status
          )}`}
        >
          <div className="flex items-start gap-1">
            {getReservationIcon(status)}
            <p>Reservado</p>
          </div>
          {contactPhone && (
            <div>
              <a
                href={`${
                  import.meta.env.VITE_WHATSAPP_URL_BASE
                }${contactPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-2 p-2 justify-center items-center"
              >
                {contactName}
                <div className="bg-tertiary-600 p-1 rounded-sm">
                  <BsWhatsapp size={20} />
                </div>
              </a>
            </div>
          )}
        </div>
      );
    case ReservationStatusEnum.AVAILABLE:
      return (
        <div
          className={`flex items-center shadow-lg gap-1 h-14 justify-center ${getBackgroundColorByStatus(
            status
          )}`}
        >
          <div className="flex gap-1">
            {getReservationIcon(status)}
            <p>Disponível</p>
          </div>
        </div>
      );
    default:
      return "";
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
      return (
        <button
          onClick={async () => {
            await changeAvailability(courtScheduleId, true);
            navigate("/reservas");
          }}
          className="flex items-stretch justify-center w-fit rounded-sm bg-tertiary-800 text-neutral-100 gap-1 text-sm py-1 pt-2 px-2 mt-4 mx-2"
        >
          <MdOutlineLockOpen size={18} />
          Liberar horário fixo
        </button>
      );
    case ReservationStatusEnum.INACTIVE:
      return (
        <button
          onClick={async () => {
            await changeAvailability(courtScheduleId, true);
            navigate("/reservas");
          }}
          className="flex items-stretch justify-center w-fit rounded-sm bg-tertiary-800 text-neutral-100 gap-1 text-sm p-2 px-2 mt-4 mx-2"
        >
          <MdOutlineLockOpen size={18} />
          Reativar horário
        </button>
      );
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return (
        <button className="flex items-stretch justify-center w-fit rounded-sm bg-purple-900 text-neutral-100 gap-1 text-sm p-2 px-2 mt-4 mx-2">
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
          className="flex items-stretch justify-center w-fit rounded-sm bg-danger-400 text-neutral-100 gap-1 text-sm p-2 px-2 mt-4 mx-2"
        >
          <MdNotInterested size={18} />
          Inativar horário
        </button>
      );
    default:
      return null;
  }
}
