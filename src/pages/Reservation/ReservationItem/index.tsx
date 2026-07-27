import { Link } from "react-router-dom";
import { ReservationStatusEnum } from "../enum";
import { MdChevronRight, MdOutlineCelebration, MdOutlineRestaurant } from "react-icons/md";
import { IReservationItemProps } from "../interface";
import VoleyNetIcon from "../../../components/Icons/VoleyNetIcon";
import { getStatusIcon } from "../statusIcons";
import OptionChip from "../../../components/OptionChip";

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

function OptionIcons({
  isNeedsNetting,
  isEvent,
  isBarbecueIncluded,
}: {
  isNeedsNetting: boolean;
  isEvent: boolean;
  isBarbecueIncluded: boolean;
}) {
  if (!isNeedsNetting && !isEvent && !isBarbecueIncluded) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      aria-label="Opções da reserva"
    >
      {isNeedsNetting && (
        <OptionChip
          label="Rede"
          icon={<VoleyNetIcon className="size-3.5" />}
        />
      )}
      {isEvent && (
        <OptionChip
          label="Evento"
          icon={<MdOutlineCelebration size={13} />}
        />
      )}
      {isBarbecueIncluded && (
        <OptionChip
          label="Churrasqueira"
          icon={<MdOutlineRestaurant size={14} />}
        />
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
  const statusMeta = getStatusMeta(status);
  const isAvailable = status === ReservationStatusEnum.AVAILABLE;
  const isInactive = status === ReservationStatusEnum.INACTIVE;
  const isPastAvailable = isAvailable && isPastDate;

  // Horário que ficou disponível e passou sem reserva: visual neutro, menor peso que reservados.
  const { label, barClass, iconWrapClass, Icon, markerIconClass } =
    isPastAvailable
      ? {
          label: "Encerrado",
          barClass: "bg-text-light/25",
          iconWrapClass: "bg-text-light/8 text-text-light/45",
          Icon: statusMeta.Icon,
          markerIconClass: statusMeta.markerIconClass,
        }
      : statusMeta;

  const ariaLabel = `${label}. ${time}. ${court}${customerName ? `. ${customerName}` : ""}`;

  const rightLabel = isPastAvailable
    ? "(Encerrado)"
    : isAvailable
      ? "Reservar"
      : isInactive
        ? "Inativo"
        : customerName || label;

  const hasOptions = isNeedsNetting || isEvent || isBarbecueIncluded;

  const cardClassName =
    "relative flex min-h-14 items-stretch overflow-hidden rounded-2xl border border-text-light/8 bg-master-light transition hover:border-text-light/15 hover:bg-master-light/90 active:bg-master-light/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue";

  const cardBody = (
    <>
      <span
        className={`absolute inset-y-2.5 left-0 w-1 rounded-full ${barClass}`}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 items-start gap-2 px-3 py-2.5 pl-4 sm:gap-3 sm:px-4 sm:py-3 sm:pl-5">
        <span
          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full sm:size-9 ${iconWrapClass}`}
          aria-hidden
        >
          <Icon className={`shrink-0 ${markerIconClass}`} />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`min-w-0 flex-1 truncate tabular-nums ${
                isPastAvailable
                  ? "text-sm font-medium text-text-light/55"
                  : "text-base font-semibold text-text-light"
              }`}
            >
              {time}
              <span
                className={
                  isPastAvailable
                    ? "font-medium text-text-light/40"
                    : "font-medium text-text-light/70"
                }
              >
                {" "}
                — {court}
              </span>
            </span>

            <span
              className={`max-w-[42%] shrink-0 truncate text-right ${
                isPastAvailable
                  ? "text-sm font-normal text-text-light/45"
                  : isAvailable
                    ? "text-base font-semibold text-accent-green"
                    : "text-base font-semibold text-text-light"
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

          {hasOptions && (
            <OptionIcons
              isNeedsNetting={isNeedsNetting}
              isEvent={isEvent}
              isBarbecueIncluded={isBarbecueIncluded}
            />
          )}
        </div>
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
