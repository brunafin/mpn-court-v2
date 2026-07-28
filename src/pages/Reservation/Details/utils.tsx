import { BsQuestionCircle, BsWhatsapp } from "react-icons/bs";
import type { ReactNode } from "react";
import { ReservationStatusEnum } from "../enum";
import { MdNotInterested, MdOutlineEdit } from "react-icons/md";
import { formatPhoneMask } from "../../../utils/formatPhone";
import { formatCurrencyBRL } from "../../../utils/formatCurrency";
import { getStatusIcon, StatusIcons } from "../statusIcons";
import { buttonClassName } from "../../../components/Button";

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
  // Tint leve (/20) + título saturado + ícone sólido — vivo e legível (WCAG AA+)
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return {
        surface: "bg-accent-purple/20",
        text: "text-accent-purple-bright",
        iconBg: "bg-accent-purple text-white",
      };
    case ReservationStatusEnum.INACTIVE:
      return {
        surface: "bg-danger-400/20",
        text: "text-danger-bright",
        iconBg: "bg-danger-400 text-white",
      };
    case ReservationStatusEnum.RESERVED:
      return {
        surface: "bg-accent-blue/20",
        text: "text-accent-blue-bright",
        iconBg: "bg-accent-blue text-white",
      };
    case ReservationStatusEnum.AVAILABLE:
      return {
        surface: "bg-accent-green/20",
        text: "text-accent-green",
        iconBg: "bg-accent-green text-master",
      };
    default:
      return {
        surface: "bg-master-light",
        text: "text-text-light",
        iconBg: "bg-text-light/15 text-text-light",
      };
  }
}

/** Meta dos cards: opacidade cheia para leitura confortável em qualquer público */
const statusCardMetaClass =
  "mt-0.5 text-base font-medium leading-snug text-text-light";
const statusCardDescriptionClass =
  "mt-1.5 text-base leading-6 text-text-light";

export function getStatusLabel(status?: ReservationStatusEnum | null) {
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return "Fixo";
    case ReservationStatusEnum.INACTIVE:
      return "Inativo";
    case ReservationStatusEnum.RESERVED:
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
  embedded = false,
}: {
  contactName?: string;
  contactPhone?: string;
  onEditContact?: () => void;
  /** Dentro do card de status (sem fundo/raio próprios). */
  embedded?: boolean;
}) {
  if (!contactName && !contactPhone) return null;

  return (
    <div
      className={
        embedded
          ? "flex min-h-14 items-center gap-3 border-t border-text-light/10 px-4 py-3.5"
          : "flex min-h-14 items-center gap-3 rounded-2xl bg-master-light px-4 py-3.5"
      }
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-semibold leading-snug text-text-light">
          {contactName || "Sem nome"}
        </p>
        {contactPhone ? (
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-base font-medium leading-snug text-text-light">
            <span className="truncate">{formatPhoneMask(contactPhone)}</span>
            <a
              href={`${import.meta.env.VITE_WHATSAPP_URL_BASE}${contactPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp de ${contactName || "contato"}`}
              title="Abrir WhatsApp"
              className="inline-flex shrink-0 items-center justify-center rounded-md p-0.5 text-accent-green/85 transition hover:bg-accent-green/10 hover:text-accent-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green"
            >
              <BsWhatsapp size={16} aria-hidden />
            </a>
          </p>
        ) : (
          <p className="mt-0.5 text-base font-medium leading-snug text-text-light/80">
            Sem telefone
          </p>
        )}
      </div>

      {onEditContact && (
        <button
          type="button"
          onClick={onEditContact}
          title="Editar contato"
          aria-label="Editar contato"
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-master text-text-light transition hover:bg-master/80 active:bg-master/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
        >
          <MdOutlineEdit size={22} aria-hidden />
        </button>
      )}
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
  }
) {
  if (!status) return null;

  const {
    sportName,
    contactName,
    contactPhone,
    courtName,
    price,
  } = details || {};

  const accent = getStatusAccent(status);
  const showContact =
    (!!contactName || !!contactPhone) &&
    [
      ReservationStatusEnum.FIXED,
      ReservationStatusEnum.RESERVED,
    ].includes(status);

  const priceLabel =
    price != null && price !== ""
      ? formatCurrencyBRL(parseFloat(price) || 0)
      : "";
  const metaLine = [sportName, courtName, priceLabel].filter(Boolean).join(" · ");

  const isCompactStatus =
    status === ReservationStatusEnum.AVAILABLE ||
    status === ReservationStatusEnum.RESERVED ||
    status === ReservationStatusEnum.FIXED;

  if (isCompactStatus) {
    const statusLabel = getStatusLabel(status);
    const ariaSummary = [
      statusLabel,
      metaLine,
      contactName,
      contactPhone ? formatPhoneMask(contactPhone) : "",
    ]
      .filter(Boolean)
      .join(". ");

    return (
      <div
        role="group"
        aria-label={ariaSummary}
        className={`mb-5 overflow-hidden rounded-2xl ${accent.surface}`}
      >
        <div className="flex min-h-14 items-center gap-3 px-4 py-3">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-full ${accent.iconBg}`}
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
              <p className={statusCardMetaClass} title={metaLine}>
                <span className="line-clamp-2 break-words">{metaLine}</span>
              </p>
            )}
          </div>
        </div>

        {showContact && (
          <ContactCard
            contactName={contactName}
            contactPhone={contactPhone}
            onEditContact={onEditContact}
            embedded
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
            className={`flex size-12 shrink-0 items-center justify-center rounded-full ${accent.iconBg}`}
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
              <p className={`${statusCardMetaClass} mt-1`} title={metaLine}>
                <span className="line-clamp-2 break-words">{metaLine}</span>
              </p>
            )}
            <p className={statusCardDescriptionClass}>
              {getStatusDescription(status)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type StatusActionHandlers = {
  onLiberarFixo: () => void;
  onAtivar: () => void;
  onFixar: () => void;
  onInativar: () => void;
};

export function renderButtonByStatus(
  status: ReservationStatusEnum | null,
  handlers: StatusActionHandlers
) {
  if (!status) return null;

  const wrap = (button: ReactNode) => (
    <div className="mb-5 flex justify-end">{button}</div>
  );

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
              "border-accent-green text-accent-green hover:bg-accent-green/10 focus-visible:outline-accent-green",
          })}
        >
          <StatusIcons.unlock size={20} className="shrink-0" aria-hidden />
          Liberar fixo
        </button>
      );
    case ReservationStatusEnum.INACTIVE:
      return wrap(
        <button
          type="button"
          onClick={handlers.onAtivar}
          className={buttonClassName({
            variant: "success",
            fullWidth: false,
          })}
        >
          <StatusIcons.available size={20} className="shrink-0" aria-hidden />
          Ativar horário
        </button>
      );
    case ReservationStatusEnum.RESERVED:
      return (
        <button
          type="button"
          onClick={handlers.onFixar}
          className={buttonClassName({
            variant: "secondary",
            size: "md",
            className:
              "border-accent-purple text-accent-purple hover:bg-accent-purple/10 focus-visible:outline-accent-purple",
          })}
        >
          <StatusIcons.fixed size={20} className="shrink-0" aria-hidden />
          Fixar horário
        </button>
      );
    case ReservationStatusEnum.AVAILABLE:
      return wrap(
        <button
          type="button"
          onClick={handlers.onInativar}
          className={buttonClassName({
            variant: "secondary",
            size: "md",
            fullWidth: false,
            className:
              "border-danger-400/70 text-danger-400 hover:bg-danger-400/10 focus-visible:outline-danger-400",
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
