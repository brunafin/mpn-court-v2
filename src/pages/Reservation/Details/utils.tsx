import { BsQuestionCircle, BsWhatsapp } from "react-icons/bs";
import { ReservationStatusEnum } from "../enum";
import {
  MdNotInterested,
  MdOutlineAccessTime,
  MdOutlineEdit,
  MdOutlineLockClock,
  MdOutlineLockOpen,
} from "react-icons/md";
import { FaRegCalendarCheck } from "react-icons/fa";
import {
  changeAvailability,
  fixSchedule,
  unfixSchedule,
} from "../../../api/schedules";
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
  setShowInfoCustomer: (value: boolean) => void,
  status?: ReservationStatusEnum | null,
  sportName?: string,
  contactName?: string,
  contactPhone?: string,

) {
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return (
        <div
          className={`flex items-center shadow-lg gap-1 md:gap-4 h-18 justify-between md:justify-center px-4 ${getBackgroundColorByStatus(
            status
          )}`}
        >
          <div className="flex flex-col md:flex-row md:gap-1 items-center">
            <div className="flex items-start gap-1">
              {getReservationIcon(status)}
              <p className="font-bold">Fixo</p>
            </div>
            <span className="text-sm">({sportName})</span>
          </div>
          {contactPhone && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => {
                setShowInfoCustomer(true);
              }} title="Editar telefone" className="bg-purple-800 rounded-sm p-1 cursor-pointer active:bg-purple-700">
                <MdOutlineEdit size={18} />
              </button>
              <a
                href={`${import.meta.env.VITE_WHATSAPP_URL_BASE
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
          <div className="flex items-center gap-1">
            {getReservationIcon(status)}
            <p className="font-bold">Inativo</p>
          </div>
        </div>
      );
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return (
        <div
          className={`flex items-center shadow-lg gap-1 md:gap-4 h-18 justify-between md:justify-center px-4 ${getBackgroundColorByStatus(
            status
          )}`}
        >
          <div className="flex flex-col md:flex-row md:gap-1 items-center">
            <div className="flex items-start gap-1">
              {getReservationIcon(status)}
              <p className="font-bold">Reservado</p>
            </div>
            <span className="text-sm">({sportName})</span>
          </div>
          {contactPhone && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowInfoCustomer(true)} title="Editar telefone" className="bg-secondary-500 rounded-sm p-1 cursor-pointer active:bg-secondary-700">
                <MdOutlineEdit size={18} />
              </button>
              <a
                href={`${import.meta.env.VITE_WHATSAPP_URL_BASE
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
          className={`shadow-lg flex justify-center items-center h-14  ${getBackgroundColorByStatus(
            status
          )}`}
        >
          <div className="flex items-center gap-1">
            {getReservationIcon(status)}
            <p className="font-bold pt-1">Disponível</p>
          </div>
        </div>
      );
    default:
      return "";
  }
}

export function renderButtonByStatus(
  courtScheduleId: string,
  isBarbecueIncluded: boolean,
  status: ReservationStatusEnum | null,
  dateFrom: Date,
  navigate: ReturnType<typeof useNavigate>,
  withLoading: (asyncFunction: () => Promise<void>) => Promise<void>
) {
  if (!status) return null;
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return (
        <button
          onClick={async () => {
            const confirmed = window.confirm(
              "Tem certeza que deseja liberar este horário fixo? Essa ação vai cancelar todas as reservas futuras para este horário/cliente."
            );
            if (!confirmed) return;
            await withLoading(async () => {
              await unfixSchedule({
                court_schedule_public_id: courtScheduleId,
              });
              navigate("/reservas", {
                state: { date: dateFrom },
              });
            });
          }}
          className="w-full flex items-center justify-center text-tertiary-900 gap-2 mx-4 my-2 py-2 px-4 bg-tertiary-50 border-tertiary-800 border-1 rounded-sm shadow-md hover:bg-tertiary-800 hover:text-neutral-100 active:bg-tertiary-800 active:text-neutral-100 active:ring-2 active:ring-tertiary-200 md:w-fit"
        >
          <MdOutlineLockOpen size={18} />
          Liberar fixo
        </button>
      );
    case ReservationStatusEnum.INACTIVE:
      return (
        <button
          onClick={async () => {
            await withLoading(async () => {
              await changeAvailability(courtScheduleId, true);
              navigate("/reservas", {
                state: { date: dateFrom },
              });
            });
          }}
          className="w-full flex items-center justify-center text-tertiary-900 gap-2 mx-4 my-2 py-2 px-4 bg-tertiary-50 border-tertiary-800 border-1 rounded-sm shadow-md hover:bg-tertiary-800 hover:text-neutral-100 active:bg-tertiary-800 active:text-neutral-100 active:ring-2 active:ring-tertiary-200 md:w-fit"
        >
          <MdOutlineLockOpen size={18} />
          Reativar
        </button>
      );
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return (
        <button
          onClick={async () => {
            try {
              {
                isBarbecueIncluded &&
                  alert(
                    "Atenção: A churrasqueira não será agendada para as reservas futuras."
                  );
              }
              await withLoading(async () => {
                await fixSchedule({
                  court_schedule_public_id: courtScheduleId,
                });
                navigate("/reservas", {
                  state: { date: dateFrom },
                });
              });
            } catch (error: any) {
              console.log(error);
              alert(
                error?.response.data.message ||
                "Ocorreu um erro ao fixar o horário."
              );
            }
          }}
          className="w-full flex items-center justify-center text-purple-800 gap-2 mx-4 my-2 py-2 px-4 bg-fixed-50 border-purple-800 border-1 rounded-sm shadow-md hover:bg-purple-900 hover:text-neutral-100 active:bg-purple-900 active:text-neutral-100 active:ring-2 active:ring-purple-200 md:w-fit"
        >
          <MdOutlineLockClock size={24} />
          Fixar horário
        </button>
      );
    case ReservationStatusEnum.AVAILABLE:
      return (
        <button
          onClick={async () => {
            await withLoading(async () => {
              await changeAvailability(courtScheduleId, false);
              navigate("/reservas", {
                state: { date: dateFrom },
              });
            });
          }}
          className="w-full flex items-center justify-center text-red-800 gap-2 mx-4 my-2 py-2 px-4 bg-red-100 border-red-800 border-1 rounded-sm shadow-md hover:bg-red-700 hover:text-neutral-100 active:bg-red-700 active:text-neutral-100 active:ring-2 active:ring-red-200 md:w-fit"
        >
          <MdNotInterested size={18} />
          Inativar
        </button>
      );
    default:
      return null;
  }
}
