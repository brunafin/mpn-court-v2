import { Link } from "react-router-dom";
import { ReservationStatusEnum } from "../enum";
import {
  MdChevronRight,
  MdOutlineRestaurant,
} from "react-icons/md";
import { BsCashCoin } from "react-icons/bs";
import { IReservationItemProps } from "../interface";
import VoleyNetIcon from "../../../components/Icons/VoleyNetIcon";
import { LuPartyPopper } from "react-icons/lu";
import { getStatusIcon } from "../statusIcons";

function getStatusMeta(status: ReservationStatusEnum) {
  const Icon = getStatusIcon(status);
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return {
        label: "Fixo",
        barClass: "bg-accent-purple",
        Icon,
        // Outline lock tem mais padding no glyph — escala para paridade visual
        markerIconClass: "size-[18px] scale-110",
      };
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return {
        label: "Reservado",
        barClass: "bg-accent-blue",
        Icon,
        markerIconClass: "size-[18px]",
      };
    case ReservationStatusEnum.AVAILABLE:
      return {
        label: "Disponível",
        barClass: "bg-accent-green-bar",
        Icon,
        markerIconClass: "size-[18px]",
      };
    case ReservationStatusEnum.INACTIVE:
      return {
        label: "Inativo",
        barClass: "bg-danger-400",
        Icon,
        markerIconClass: "size-[18px]",
      };
    default:
      return {
        label: "Status",
        barClass: "bg-text-light/40",
        Icon,
        markerIconClass: "size-[18px]",
      };
  }
}

const optionBadgeClass =
  "flex size-6 shrink-0 items-center justify-center rounded-md bg-text-light/15 text-text-light";

function OptionIcons({
  status,
  isNeedsNetting,
  isEvent,
  isBarbecueIncluded,
}: {
  status: ReservationStatusEnum;
  isNeedsNetting: boolean;
  isEvent: boolean;
  isBarbecueIncluded: boolean;
}) {
  if (
    !isNeedsNetting &&
    !isEvent &&
    !isBarbecueIncluded &&
    status !== ReservationStatusEnum.PREPAID
  ) {
    return null;
  }

  return (
    <div
      className="flex shrink-0 items-center gap-1.5 text-text-light"
      aria-label="Opções da reserva"
    >
      {isNeedsNetting && (
        <VoleyNetIcon className="size-4 shrink-0" aria-label="Rede" />
      )}
      {isEvent && (
        <span className={optionBadgeClass} aria-label="Evento">
          <LuPartyPopper size={14} aria-hidden />
        </span>
      )}
      {isBarbecueIncluded && (
        <span className={optionBadgeClass} aria-label="Com churrasqueira">
          <MdOutlineRestaurant size={14} aria-hidden />
        </span>
      )}
      {status === ReservationStatusEnum.PREPAID && (
        <BsCashCoin size={16} aria-label="Pré-pago" />
      )}
    </div>
  );
}

function ReservationItem({
  scheduleId,
  court,
  customerName,
  date,
  status,
  time,
  isBarbecueIncluded = false,
  isEvent = false,
  isNeedsNetting = false,
}: IReservationItemProps) {
  const isPastDate =
    new Date(`${date}T${time}`) < new Date(new Date().setSeconds(0, 0));
  const { label, barClass, Icon, markerIconClass } = getStatusMeta(status);
  const isAvailable = status === ReservationStatusEnum.AVAILABLE;
  const isInactive = status === ReservationStatusEnum.INACTIVE;
  const ariaLabel = `${label}. ${time}. ${court}${customerName ? `. ${customerName}` : ""}`;

  const rightLabel = isAvailable
    ? isPastDate
      ? "Encerrado"
      : "Reservar"
    : isInactive
      ? "Inativo"
      : customerName || label;

  const isPastAvailable = isAvailable && isPastDate;

  const rowClassName =
    "flex min-h-16 items-stretch border-b border-text-light/10";

  const rowBody = (
    <>
      <span
        className={`flex w-8 shrink-0 items-center justify-center ${barClass}`}
        aria-hidden
      >
        <Icon className={`shrink-0 text-white ${markerIconClass}`} />
      </span>

      <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-3.5">
        <span className="min-w-0 truncate text-base font-semibold tabular-nums text-text-light">
          {time}
          <span className="font-medium text-text-light/70"> — {court}</span>
        </span>

        <OptionIcons
          status={status}
          isNeedsNetting={isNeedsNetting}
          isEvent={isEvent}
          isBarbecueIncluded={isBarbecueIncluded}
        />

        <span
          className={`ml-auto max-w-[40%] truncate text-right text-base font-semibold ${
            isAvailable && !isPastDate
              ? "text-accent-green"
              : "text-text-light"
          }`}
        >
          {rightLabel}
        </span>

        {!isPastAvailable && (
          <MdChevronRight
            size={22}
            className="shrink-0 text-text-light/50"
            aria-hidden
          />
        )}
      </div>
    </>
  );

  return (
    <li className={isPastDate ? "opacity-55" : undefined}>
      {isPastAvailable ? (
        <div className={rowClassName} aria-label={ariaLabel}>
          {rowBody}
        </div>
      ) : (
        <Link
          to={`/reservas/${scheduleId}`}
          state={{ date }}
          aria-label={ariaLabel}
          className={`${rowClassName} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-blue`}
        >
          {rowBody}
        </Link>
      )}
    </li>
  );
}

export default ReservationItem;
