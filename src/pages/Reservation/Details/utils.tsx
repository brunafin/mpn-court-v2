import { BsQuestionCircle, BsWhatsapp } from "react-icons/bs";
import { ReservationStatusEnum } from "../enum";
import { MdNotInterested, MdOutlineEdit, MdOutlinePostAdd } from "react-icons/md";
import { formatPhoneMask } from "../../../utils/formatPhone";
import { formatCurrencyBRL } from "../../../utils/formatCurrency";
import { getStatusIcon, StatusIcons } from "../statusIcons";
import { buttonClassName } from "../../../components/Button";
import VoleyNetIcon from "../../../components/Icons/VoleyNetIcon";

/** Ex.: 16/07/2026 (qui) — 10:00 */
export function formatSchedulePageTitle(
  date: string,
  weekday: string,
  time: string
) {
  let shortDate = date.trim();
  const brFull = shortDate.match(/^(\d{2}\/\d{2}\/\d{4})$/);
  if (brFull) {
    shortDate = brFull[1];
  } else {
    const iso = shortDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) shortDate = `${iso[3]}/${iso[2]}/${iso[1]}`;
  }

  const dayKey = weekday
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
  const weekdayAbbrev: Record<string, string> = {
    domingo: "dom",
    "segunda-feira": "seg",
    segunda: "seg",
    "terca-feira": "ter",
    terca: "ter",
    "quarta-feira": "qua",
    quarta: "qua",
    "quinta-feira": "qui",
    quinta: "qui",
    "sexta-feira": "sex",
    sexta: "sex",
    sabado: "sáb",
  };
  const shortWeekday =
    weekdayAbbrev[dayKey] ??
    weekday.replace(/-feira$/i, "").slice(0, 3).toLowerCase();

  return `${shortDate} (${shortWeekday}) — ${time}`;
}

export function getReservationIcon(
  status?: ReservationStatusEnum | null,
  size = 20
) {
  if (!status) return <BsQuestionCircle size={size} />;
  const Icon = getStatusIcon(status);
  return <Icon size={size} aria-hidden />;
}

export function getStatusAccent(status?: ReservationStatusEnum | null) {
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return {
        surface: "bg-accent-purple/25",
        text: "text-accent-purple-soft",
        iconBg: "bg-accent-purple/40",
      };
    case ReservationStatusEnum.INACTIVE:
      return {
        surface: "bg-danger-400/20",
        text: "text-danger-soft",
        iconBg: "bg-danger-400/35",
      };
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return {
        surface: "bg-accent-blue/25",
        text: "text-accent-blue-soft",
        iconBg: "bg-accent-blue/40",
      };
    case ReservationStatusEnum.AVAILABLE:
      return {
        surface: "bg-accent-green/25",
        text: "text-accent-green",
        iconBg: "bg-accent-green/40",
      };
    default:
      return {
        surface: "bg-master-light",
        text: "text-text-light",
        iconBg: "bg-text-light/15",
      };
  }
}

export function getStatusLabel(status?: ReservationStatusEnum | null) {
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return "Fixo";
    case ReservationStatusEnum.INACTIVE:
      return "Inativo";
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return "Reservado";
    case ReservationStatusEnum.AVAILABLE:
      return "Horário disponível";
    default:
      return "Status";
  }
}

export function getStatusDescription(status?: ReservationStatusEnum | null) {
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return "Reservado de forma recorrente para este cliente.";
    case ReservationStatusEnum.INACTIVE:
      return "Não aparece como disponível para reserva.";
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return "Já possui cliente neste horário.";
    case ReservationStatusEnum.AVAILABLE:
      return "Pronto para nova reserva.";
    default:
      return "";
  }
}

function ContactCard({
  contactName,
  contactPhone,
  onEditContact,
}: {
  contactName?: string;
  contactPhone?: string;
  onEditContact?: () => void;
}) {
  if (!contactName && !contactPhone) return null;

  return (
    <div className="flex min-h-14 items-center gap-3 rounded-2xl bg-master-light px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-semibold leading-snug text-text-light">
          {contactName || "Sem nome"}
        </p>
        {contactPhone ? (
          <p className="mt-0.5 truncate text-base font-medium leading-snug text-text-light/85">
            {formatPhoneMask(contactPhone)}
          </p>
        ) : (
          <p className="mt-0.5 text-base font-medium leading-snug text-text-light/70">
            Sem telefone
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-2">
        {onEditContact && (
          <button
            type="button"
            onClick={onEditContact}
            title="Editar contato"
            aria-label="Editar contato"
            className="flex size-12 items-center justify-center rounded-xl bg-master text-text-light transition hover:bg-master/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
          >
            <MdOutlineEdit size={22} aria-hidden />
          </button>
        )}
        {contactPhone && (
          <a
            href={`${import.meta.env.VITE_WHATSAPP_URL_BASE}${contactPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp de ${contactName || "contato"}`}
            className="flex size-12 items-center justify-center rounded-xl bg-accent-green text-master transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green"
          >
            <BsWhatsapp size={22} aria-hidden />
          </a>
        )}
      </div>
    </div>
  );
}

export function getMeanByStatus(
  onEditContact: (() => void) | undefined,
  status?: ReservationStatusEnum | null,
  details?: {
    sportName?: string;
    contactName?: string;
    contactPhone?: string;
    courtName?: string;
    price?: string;
    isNeedsNetting?: boolean;
    onCreateReminder?: () => void;
  }
) {
  if (!status) return null;

  const {
    sportName,
    contactName,
    contactPhone,
    courtName,
    price,
    isNeedsNetting,
    onCreateReminder,
  } = details || {};

  const accent = getStatusAccent(status);
  const showContact =
    (!!contactName || !!contactPhone) &&
    [
      ReservationStatusEnum.FIXED,
      ReservationStatusEnum.RESERVED,
      ReservationStatusEnum.PREPAID,
    ].includes(status);

  const priceLabel =
    price != null && price !== ""
      ? formatCurrencyBRL(parseFloat(price) || 0)
      : "";
  const metaLine = [sportName, courtName, priceLabel].filter(Boolean).join(" · ");

  const reminderButton = onCreateReminder ? (
    <button
      type="button"
      onClick={onCreateReminder}
      title="Criar lembrete"
      aria-label="Criar lembrete"
      className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-master/55 text-text-light transition hover:bg-master/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
    >
      <MdOutlinePostAdd size={22} aria-hidden />
    </button>
  ) : null;

  const isCompactStatus =
    status === ReservationStatusEnum.AVAILABLE ||
    status === ReservationStatusEnum.RESERVED ||
    status === ReservationStatusEnum.PREPAID ||
    status === ReservationStatusEnum.FIXED;

  if (isCompactStatus) {
    const statusLabel = getStatusLabel(status);
    const ariaSummary = metaLine
      ? `${statusLabel}. ${metaLine}`
      : statusLabel;
    const hasExtras = showContact || isNeedsNetting;

    return (
      <div className={hasExtras ? "mb-5 space-y-3" : "mb-4"}>
        <div
          role="group"
          aria-label={ariaSummary}
          className={`flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 ${accent.surface}`}
        >
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-full ${accent.iconBg} ${accent.text}`}
            aria-hidden
          >
            {getReservationIcon(status, 22)}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`text-lg font-bold leading-snug tracking-tight ${accent.text}`}
            >
              {statusLabel}
            </p>
            {metaLine && (
              <p
                className="mt-0.5 text-base font-medium leading-snug text-text-light/90"
                title={metaLine}
              >
                <span className="line-clamp-2 break-words">{metaLine}</span>
              </p>
            )}
          </div>
          {reminderButton}
        </div>

        {isNeedsNetting && (
          <div className="flex min-h-12 items-center gap-2.5 rounded-xl bg-master-light px-4 py-3">
            <VoleyNetIcon className="size-5 shrink-0 text-text-light/90" />
            <p className="text-base font-medium leading-snug text-text-light/90">
              Precisa de rede
            </p>
          </div>
        )}

        {showContact && (
          <ContactCard
            contactName={contactName}
            contactPhone={contactPhone}
            onEditContact={onEditContact}
          />
        )}
      </div>
    );
  }

  const statusLabel = getStatusLabel(status);
  const ariaSummary = metaLine ? `${statusLabel}. ${metaLine}` : statusLabel;

  return (
    <div className="mb-5 space-y-3">
      <div
        role="group"
        aria-label={ariaSummary}
        className={`rounded-2xl px-4 py-4 ${accent.surface}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-full ${accent.iconBg} ${accent.text}`}
            aria-hidden
          >
            {getReservationIcon(status, 24)}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`text-xl font-bold leading-snug tracking-tight ${accent.text}`}
            >
              {statusLabel}
            </p>
            {metaLine && (
              <p
                className="mt-1 text-base font-medium leading-snug text-text-light/90"
                title={metaLine}
              >
                <span className="line-clamp-2 break-words">{metaLine}</span>
              </p>
            )}
            <p className="mt-1.5 text-base leading-6 text-text-light/80">
              {getStatusDescription(status)}
            </p>
          </div>
        </div>
      </div>

      {isNeedsNetting && (
        <div className="flex min-h-12 items-center gap-2.5 rounded-xl bg-master-light px-4 py-3">
          <VoleyNetIcon className="size-5 shrink-0 text-text-light/90" />
          <p className="text-base font-medium leading-snug text-text-light/90">
            Precisa de rede
          </p>
        </div>
      )}
    </div>
  );
}

type StatusActionHandlers = {
  onLiberarFixo: () => void;
  onReativar: () => void;
  onFixar: () => void;
  onInativar: () => void;
};

export function renderButtonByStatus(
  status: ReservationStatusEnum | null,
  handlers: StatusActionHandlers
) {
  if (!status) return null;

  switch (status) {
    case ReservationStatusEnum.FIXED:
      return (
        <button
          type="button"
          onClick={handlers.onLiberarFixo}
          className={buttonClassName({
            variant: "secondary",
            size: "md",
            className:
              "mx-auto mb-5 justify-center border-accent-green text-accent-green hover:bg-accent-green/10 focus-visible:outline-accent-green",
          })}
        >
          <StatusIcons.unlock size={20} className="shrink-0" aria-hidden />
          Liberar fixo
        </button>
      );
    case ReservationStatusEnum.INACTIVE:
      return (
        <button
          type="button"
          onClick={handlers.onReativar}
          className={buttonClassName({
            variant: "success",
            className: "mx-auto mb-5 justify-center",
          })}
        >
          <StatusIcons.unlock size={20} className="shrink-0" aria-hidden />
          Reativar
        </button>
      );
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return (
        <button
          type="button"
          onClick={handlers.onFixar}
          className={buttonClassName({
            variant: "secondary",
            size: "md",
            className:
              "mx-auto mb-5 justify-center border-accent-purple text-accent-purple hover:bg-accent-purple/10 focus-visible:outline-accent-purple",
          })}
        >
          <StatusIcons.fixed size={20} className="shrink-0" aria-hidden />
          Fixar horário
        </button>
      );
    case ReservationStatusEnum.AVAILABLE:
      return (
        <button
          type="button"
          onClick={handlers.onInativar}
          className={buttonClassName({
            variant: "secondary",
            size: "md",
            className:
              "mx-auto mb-5 justify-center border-danger-400/70 text-danger-400 hover:bg-danger-400/10 focus-visible:outline-danger-400",
          })}
        >
          <MdNotInterested size={18} className="shrink-0" aria-hidden />
          Inativar horário
        </button>
      );
    default:
      return null;
  }
}
