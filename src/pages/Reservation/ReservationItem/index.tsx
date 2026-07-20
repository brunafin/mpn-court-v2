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
        iconWrapClass: "bg-accent-purple/15 text-accent-purple-soft",
        Icon,
        markerIconClass: "size-[16px] scale-110 sm:size-[18px]",
      };
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return {
        label: "Reservado",
        barClass: "bg-accent-blue",
        iconWrapClass: "bg-accent-blue/15 text-accent-blue",
        Icon,
        markerIconClass: "size-[16px] sm:size-[18px]",
      };
    case ReservationStatusEnum.AVAILABLE:
      return {
        label: "Disponível",
        barClass: "bg-accent-green-bar",
        iconWrapClass: "bg-accent-green/15 text-accent-green",
        Icon,
        markerIconClass: "size-[16px] sm:size-[18px]",
      };
    case ReservationStatusEnum.INACTIVE:
      return {
        label: "Inativo",
        barClass: "bg-danger-400",
        iconWrapClass: "bg-danger-400/15 text-danger-400",
        Icon,
        markerIconClass: "size-[16px] sm:size-[18px]",
      };
    default:
      return {
        label: "Status",
        barClass: "bg-text-light/40",
        iconWrapClass: "bg-text-light/10 text-text-light/70",
        Icon,
        markerIconClass: "size-[16px] sm:size-[18px]",
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
  const { label, barClass, iconWrapClass, Icon, markerIconClass } =
    getStatusMeta(status);
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

  const cardClassName =
    "relative flex min-h-14 items-stretch overflow-hidden rounded-2xl border border-text-light/8 bg-master-light transition hover:border-text-light/15 hover:bg-master-light/90 active:bg-master-light/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue";

  const cardBody = (
    <>
      <span
        className={`absolute inset-y-2.5 left-0 w-1 rounded-full ${barClass}`}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 pl-4 sm:gap-3 sm:px-4 sm:py-3 sm:pl-5">
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-full sm:size-9 ${iconWrapClass}`}
          aria-hidden
        >
          <Icon className={`shrink-0 ${markerIconClass}`} />
        </span>

        <div className="flex min-w-0 flex-1 items-center gap-2">
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
        </div>

        <span
          className={`max-w-[40%] shrink-0 truncate text-right text-base font-semibold ${
            isAvailable && !isPastDate
              ? "text-accent-green"
              : "text-text-light"
          }`}
        >
          {rightLabel}
        </span>

        {!isPastAvailable && (
          <MdChevronRight
            size={20}
            className="shrink-0 text-text-light/40"
            aria-hidden
          />
        )}
      </div>
    </>
  );

  return (
    <li className={isPastDate ? "opacity-55" : undefined}>
      {isPastAvailable ? (
        <div className={cardClassName} aria-label={ariaLabel}>
          {cardBody}
        </div>
      ) : (
        <Link
          to={`/reservas/${scheduleId}`}
          state={{ date }}
          aria-label={ariaLabel}
          className={cardClassName}
        >
          {cardBody}
        </Link>
      )}
    </li>
  );
}

export default ReservationItem;
