import { BsX } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { useLocation, useParams } from "react-router";
import { isBookedStatus, ReservationStatusEnum } from "../enum";
import {
  MdOutlineArrowBackIos,
  MdOutlineCelebration,
  MdOutlinePostAdd,
  MdOutlineRestaurant,
} from "react-icons/md";
import { IReservationDetailsItemProps } from "../interface";
import { useEffect, useId, useState } from "react";
import Input from "../../../components/Input";
import {
  cancelReservation,
  changeAvailability,
  createReservation,
  deleteSchedule,
  fixSchedule,
  getScheduleById,
  unfixSchedule,
  updateObservationByPublicId,
  updatePhoneContact,
} from "../../../api/schedules";
import { userFacingErrorMessage } from "../../../api/axios";
import {
  formatPhoneMask,
  onlyPhoneDigits,
  PHONE_MASK_PLACEHOLDER,
} from "../../../utils/formatPhone";
import {
  PERSON_NAME_MAX_LENGTH,
  personNameInsertHasDisallowedChars,
  sanitizePersonName,
  sanitizePersonNameInput,
} from "../../../utils/sanitizePersonName";
import {
  OBSERVATION_MAX_LENGTH,
  REMINDER_MESSAGE_MAX_LENGTH,
  noteTextInsertHasDisallowedChars,
  sanitizeNoteText,
  sanitizeNoteTextInput,
} from "../../../utils/sanitizeNoteText";
import { getMeanByStatus, renderButtonByStatus, formatSchedulePageTitle } from "./utils";
import {
  isInternalSchedule,
  willFixAsInternal,
} from "../scheduleVisibility";
import { getAccessTokenPayload } from "../../../utils/authCookie";
import {
  invalidateSchedulesDayCache,
  patchSchedulesDayCacheSlot,
  removeSchedulesDayCacheSlot,
} from "../../../utils/schedulesDayCache";
import type { IReservationItemProps } from "../interface";
import Textarea from "../../../components/Textarea";
import Select from "../../../components/Select";
import { useLoading } from "../../../hooks/useLoading";
import NewReminderModal from "../../../components/NewNote";
import ConfirmSheet, {
  ConfirmTone,
} from "../../../components/ConfirmSheet";
import { useNotification } from "../../../contexts/NotificationContext";
import { useErrors } from "../../../contexts/ErrorsContext";
import { useCompanyCapabilities } from "../../../contexts/CompanyBrandingContext";
import { createNote } from "../../../api/notes";
import { StatusIcons } from "../statusIcons";
import { buttonClassName } from "../../../components/Button";
import EmptyState from "../../../components/EmptyState";
import { PageTitle } from "../../../components/PageTitle";
import OptionToggle from "../../../components/OptionToggle";
import OptionChip from "../../../components/OptionChip";
import VoleyNetIcon from "../../../components/Icons/VoleyNetIcon";
import { format } from "date-fns";

type ConfirmAction = {
  title: string;
  description: string;
  confirmLabel: string;
  tone: ConfirmTone;
  run: () => Promise<void>;
};

type ActionAlert = {
  title: string;
  description: string;
};

function ReservationDetails() {
  const { loading, withLoading } = useLoading();
  const { notifyError } = useErrors();
  const { refreshUnreadCount } = useNotification();
  const caps = useCompanyCapabilities();
  const canMutate = caps.canMutate;
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const listNavState = (location.state as {
    date?: string;
    status?: string | null;
    court?: string;
    customerQuery?: string;
  } | null) ?? null;
  const dateFrom = listNavState?.date;

  const buildListReturnState = () => ({
    date: dateFrom,
    status: listNavState?.status ?? null,
    court: listNavState?.court ?? "all",
    customerQuery: listNavState?.customerQuery ?? "",
  });

  const [showInfoCustomer, setShowInfoCustomer] = useState<boolean>(false);
  const contactTitleId = useId();
  const [showNewReminderModal, setShowNewReminderModal] =
    useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null
  );
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [actionAlert, setActionAlert] = useState<ActionAlert | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingObservation, setSavingObservation] = useState(false);
  const [creatingNote, setCreatingNote] = useState(false);

  const [customerReservationName, setCustomerReservationName] = useState<
    string | null
  >(null);
  const [customerReservationPhone, setCustomerReservationPhone] = useState<
    string | null
  >(null);
  const [nameError, setNameError] = useState<string>("");
  const [observation, setObservation] = useState<string>("");
  const [isBarbecueIncluded, setIsBarbecueIncluded] = useState<boolean>(false);
  const [isEvent, setIsEvent] = useState<boolean>(false);
  const [court, setCourt] = useState<IReservationDetailsItemProps | null>(null);

  const isPastSchedule = (() => {
    if (!court?.date || !court?.time) return false;
    const [day, month, year] = court.date.split("/");
    if (!day || !month || !year) return false;
    return (
      new Date(`${year}-${month}-${day}T${court.time}`) <
      new Date(new Date().setSeconds(0, 0))
    );
  })();
  const [sportSelected, setSportSelected] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [courtSports, setCourtSports] = useState<
    { id: number; name: string }[]
  >([]);

  const fetchData = async (scheduleId: string) => {
    await withLoading(async () => {
      const response = await getScheduleById(scheduleId);
      setCourt(response);
      setIsBarbecueIncluded(response?.reservation?.isBarbecueIncluded || false);
      setIsEvent(response?.reservation?.isEvent || false);
      setObservation(response?.reservation?.observation || "");
      setCourtSports(response?.sports || []);
      setSportSelected(response.sports[0]);
    });
  };

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evita loop com withLoading instável
  }, [id]);

  useEffect(() => {
    if (!showInfoCustomer) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowInfoCustomer(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showInfoCustomer]);

  const handleSubmit = async (): Promise<void> => {
    if (isPastSchedule) {
      notifyError({
        message: "Este horário já passou e não pode ser reservado.",
        type: "error",
      });
      return;
    }
    const contactName = sanitizePersonName(customerReservationName ?? "");
    if (!contactName) {
      setNameError("Informe o nome do cliente (sem emojis)");
      window.requestAnimationFrame(() => {
        document.getElementById("name")?.focus();
      });
      return;
    }
    setCustomerReservationName(contactName);
    setNameError("");
    if (!court?.scheduleId) {
      notifyError({
        message: "Horário da reserva não informado",
        type: "error",
      });
      return;
    }
    if (isSubmitting) return;

    const safeObservation = sanitizeNoteText(
      observation,
      OBSERVATION_MAX_LENGTH,
    );
    setObservation(safeObservation);

    setIsSubmitting(true);
    try {
      const response = await createReservation(
        {
          contactName,
          contactPhone:
            customerReservationPhone && customerReservationPhone.trim().length > 0
              ? customerReservationPhone
              : null,          courtSchedulePublicId: court?.scheduleId,
          observation: safeObservation || undefined,
          isBarbecueIncluded,
          isEvent,
          sportId: sportSelected?.id || courtSports[0]?.id,
        },
        { silentError: true },
      );
      if (response) {
        returnToListAfterMutation({
          patch: {
            status: ReservationStatusEnum.RESERVED,
            customerName: contactName,
            isBarbecueIncluded,
            isEvent,
          },
        });
      }
    } catch (error) {
      console.error(error);
      setActionAlert({
        title: "Não foi possível reservar",
        description: userFacingErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePhoneContact = async () => {
    const contactName = sanitizePersonName(
      customerReservationName ?? court?.reservation?.contactName ?? "",
    );
    const contactPhone =
      customerReservationPhone ?? court?.reservation?.contactPhone ?? null;

    if (!contactName || !court?.scheduleId || !id) {
      if (!contactName) {
        notifyError({
          message: "Informe o nome do cliente (sem emojis)",
          type: "error",
        });
      }
      return;
    }
    await withLoading(async () => {
      await updatePhoneContact({
        contactName,
        contactPhone,
        courtSchedulePublicId: court.scheduleId,
      });
      setCourt((prev) =>
        prev?.reservation
          ? {
              ...prev,
              reservation: {
                ...prev.reservation,
                contactName,
                contactPhone,
              },
            }
          : prev
      );
      setCustomerReservationName(contactName);
      setCustomerReservationPhone(contactPhone);
      setShowInfoCustomer(false);
      const companyPublicId =
        getAccessTokenPayload<{ companyPublicId?: string }>()?.companyPublicId;
      if (companyPublicId && dateFrom && court?.scheduleId) {
        patchSchedulesDayCacheSlot(
          companyPublicId,
          String(dateFrom),
          court.scheduleId,
          { customerName: contactName },
        );
      }
    });
  };

  const openEditContact = () => {
    setCustomerReservationName(court?.reservation?.contactName || "");
    setCustomerReservationPhone(court?.reservation?.contactPhone || null);
    setShowInfoCustomer(true);
  };

  const updateObservationByReservation = async ({
    observation,
    isBarbecueIncluded,
    isEvent,
  }: {
    observation?: string;
    isBarbecueIncluded?: boolean;
    isEvent?: boolean;
  }): Promise<void> => {
    if (!court?.reservation?.publicId) {
      notifyError({
        message: "Reserva não encontrada",
        type: "error",
      });
      return;
    }
    const safeObservation =
      observation !== undefined
        ? sanitizeNoteText(observation, OBSERVATION_MAX_LENGTH)
        : undefined;
    if (safeObservation !== undefined) {
      setObservation(safeObservation);
    }
    await updateObservationByPublicId(court.reservation.publicId, {
      ...(safeObservation !== undefined && { observation: safeObservation }),
      ...(isBarbecueIncluded !== undefined && { isBarbecueIncluded }),
      ...(isEvent !== undefined && { isEvent }),
    });
  };

  const handleCreateNote = async (event?: React.FormEvent): Promise<void> => {
    event?.preventDefault?.();
    if (creatingNote) return;
    if (!message.trim()) {
      notifyError({
        message: "Uma mensagem é necessária para criar um lembrete.",
        type: "error",
      });
      return;
    }

    let formattedDate = "";
    if (court?.date) {
      const [day, month, year] = court.date.split("/");
      formattedDate = `${year}-${month}-${day}`;
    } else {
      formattedDate = format(new Date(), "yyyy-MM-dd");
    }

    const fallbackMessage = [
      court?.date && `Reserva para o dia ${court.date}`,
      court?.time,
      court?.reservation?.contactName,
    ]
      .filter(Boolean)
      .join(" - ");
    const safeMessage = sanitizeNoteText(
      message || fallbackMessage,
      REMINDER_MESSAGE_MAX_LENGTH,
    );
    if (!safeMessage) {
      notifyError({
        message: "Uma mensagem é necessária para criar um lembrete.",
        type: "error",
      });
      return;
    }
    setMessage(safeMessage);

    setCreatingNote(true);
    try {
      await createNote({
        companyPublicId: court?.companyPublicId || "",
        date: formattedDate,
        message: safeMessage,
      });
      setShowNewReminderModal(false);
      setMessage("");
      await refreshUnreadCount();
    } finally {
      setCreatingNote(false);
    }
  };

  const invalidateAgendaCache = () => {
    const companyPublicId =
      getAccessTokenPayload<{ companyPublicId?: string }>()?.companyPublicId;
    if (companyPublicId && dateFrom) {
      invalidateSchedulesDayCache(companyPublicId, String(dateFrom));
    } else {
      invalidateSchedulesDayCache();
    }
  };

  /** Volta à lista sem skeleton: patch local do slot (+ limpa outros dias se fix/unfix). */
  const returnToListAfterMutation = (opts: {
    patch: Partial<IReservationItemProps>;
    clearOtherDays?: boolean;
  }) => {
    const companyPublicId =
      getAccessTokenPayload<{ companyPublicId?: string }>()?.companyPublicId;
    const scheduleId = court?.scheduleId;
    if (companyPublicId && dateFrom && scheduleId) {
      const patched = patchSchedulesDayCacheSlot(
        companyPublicId,
        String(dateFrom),
        scheduleId,
        opts.patch,
        { clearOtherDays: opts.clearOtherDays },
      );
      if (!patched && !opts.clearOtherDays) {
        invalidateAgendaCache();
      }
    } else {
      invalidateAgendaCache();
    }
    navigate("/reservas", {
      state: buildListReturnState(),
    });
  };

  const goBackToList = (opts?: { stale?: boolean }) => {
    if (opts?.stale !== false) {
      invalidateAgendaCache();
    }
    navigate("/reservas", {
      state: buildListReturnState(),
    });
  };

  const statusActionHandlers = {
    onLiberarFixo: () => {
      const internal = isInternalSchedule(court?.isPublic);
      setConfirmAction({
        title: internal
          ? "Liberar horário fixo interno?"
          : "Liberar horário fixo?",
        description: internal
          ? "Remove a série interna da agenda (todos os dias deste horário). Não volta a nascer e não aparece no site."
          : "Isso cancela todas as reservas futuras deste horário e cliente.",
        confirmLabel: "Liberar fixo",
        tone: "success",
        run: async () => {
          const result = await unfixSchedule(
            { court_schedule_public_id: court?.scheduleId || "" },
            { silentError: true },
          );
          if (internal || result?.removed) {
            const companyPublicId =
              getAccessTokenPayload<{ companyPublicId?: string }>()
                ?.companyPublicId;
            const scheduleId = court?.scheduleId;
            if (companyPublicId && dateFrom && scheduleId) {
              removeSchedulesDayCacheSlot(
                companyPublicId,
                String(dateFrom),
                scheduleId,
                { clearOtherDays: true },
              );
            } else {
              invalidateAgendaCache();
            }
            navigate("/reservas", {
              state: buildListReturnState(),
            });
            return;
          }
          returnToListAfterMutation({
            patch: {
              status: ReservationStatusEnum.AVAILABLE,
              customerName: null,
              isBarbecueIncluded: false,
              isEvent: false,
              isPublic: court?.isPublic,
            },
            clearOtherDays: true,
          });
        },
      });
    },
    onAtivar: () => {
      const internal = isInternalSchedule(court?.isPublic);
      setConfirmAction({
        title: "Ativar horário?",
        description: internal
          ? "Volta a aparecer na agenda do manager. Continua fora do site."
          : "O horário volta a aparecer como disponível para reserva.",
        confirmLabel: "Ativar horário",
        tone: "success",
        run: async () => {
          await changeAvailability(court?.scheduleId || "", true, {
            silentError: true,
          });
          returnToListAfterMutation({
            patch: { status: ReservationStatusEnum.AVAILABLE },
          });
        },
      });
    },
    onFixar: () => {
      const barbecueNote = isBarbecueIncluded
        ? " A churrasqueira não será agendada nas reservas futuras."
        : "";
      const asInternal = willFixAsInternal(court?.isPublic);
      setConfirmAction({
        title: asInternal ? "Fixar horário interno?" : "Fixar horário?",
        description: asInternal
          ? `O cliente fica com este horário de forma recorrente na agenda. Horário interno — não aparece no site.${barbecueNote}`
          : `O cliente fica com este horário de forma recorrente.${barbecueNote}`,
        confirmLabel: "Fixar horário",
        tone: "neutral",
        run: async () => {
          await fixSchedule(
            { court_schedule_public_id: court?.scheduleId || "" },
            { silentError: true },
          );
          returnToListAfterMutation({
            patch: {
              status: ReservationStatusEnum.FIXED,
              customerName:
                sanitizePersonName(
                  customerReservationName ??
                    court?.reservation?.contactName ??
                    "",
                ) || court?.reservation?.contactName || null,
              isPublic: asInternal ? false : court?.isPublic ?? true,
            },
            clearOtherDays: true,
          });
        },
      });
    },
    onInativar: () => {
      setConfirmAction({
        title: "Inativar horário?",
        description:
          "O horário deixa de aparecer como disponível na agenda do dia.",
        confirmLabel: "Inativar",
        tone: "danger",
        run: async () => {
          await changeAvailability(court?.scheduleId || "", false, {
            silentError: true,
          });
          returnToListAfterMutation({
            patch: { status: ReservationStatusEnum.INACTIVE },
          });
        },
      });
    },
    onExcluir: () => {
      const orphan = court?.isPublic == null;
      setConfirmAction({
        title: orphan ? "Excluir horário?" : "Excluir horário interno?",
        description: orphan
          ? "Remove este horário pontual da agenda. Não faz parte da grade semanal."
          : "Remove este horário da agenda. Se for série interna, também some das próximas semanas (só se estiverem livres). Funciona com horário disponível ou inativo.",
        confirmLabel: "Excluir horário",
        tone: "danger",
        run: async () => {
          await deleteSchedule(court?.scheduleId || "", {
            silentError: true,
          });
          const companyPublicId =
            getAccessTokenPayload<{ companyPublicId?: string }>()
              ?.companyPublicId;
          const scheduleId = court?.scheduleId;
          if (companyPublicId && dateFrom && scheduleId) {
            removeSchedulesDayCacheSlot(
              companyPublicId,
              String(dateFrom),
              scheduleId,
              { clearOtherDays: true },
            );
          } else {
            invalidateAgendaCache();
          }
          navigate("/reservas", {
            state: buildListReturnState(),
          });
        },
      });
    },
  };

  const askCancelReservation = () => {
    const dayLabel = court?.date?.trim();
    const isFixed = court?.status === ReservationStatusEnum.FIXED;
    const internal = isInternalSchedule(court?.isPublic);

    setConfirmAction({
      title: isFixed ? "Cancelar reserva deste dia?" : "Cancelar reserva?",
      description: isFixed
        ? internal
          ? `A reserva do dia ${dayLabel || "selecionado"} será cancelada e o horário fica inativo só nesse dia (não aparece no site). O fixo interno continua nas outras semanas.`
          : `A reserva do dia ${dayLabel || "selecionado"} será cancelada e o horário fica disponível só nesse dia. O fixo continua nas outras semanas.`
        : "A reserva deste horário será cancelada. Essa ação não pode ser desfeita.",
      confirmLabel: "Cancelar reserva",
      tone: "danger",
      run: async () => {
        await cancelReservation(String(court?.reservation?.publicId), {
          silentError: true,
        });
        returnToListAfterMutation({
          patch: {
            status: internal
              ? ReservationStatusEnum.INACTIVE
              : ReservationStatusEnum.AVAILABLE,
            customerName: null,
            isBarbecueIncluded: false,
            isEvent: false,
          },
        });
      },
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || confirmLoading) return;
    setConfirmLoading(true);
    try {
      await withLoading(async () => {
        await confirmAction.run();
      });
      setConfirmAction(null);
    } catch (error: unknown) {
      setConfirmAction(null);
      setActionAlert({
        title: "Não foi possível concluir",
        description: userFacingErrorMessage(error),
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  const pageTitle = court
    ? formatSchedulePageTitle(court.date, court.weekday, court.time)
    : "Carregando…";

  const isInitialLoading = loading && !court;
  const secondaryBtnClass = buttonClassName({ variant: "secondary" });
  const primaryBtnClass = buttonClassName({ variant: "primary", size: "md" });

  const booked = isBookedStatus(court?.status);
  const isPastConsultation = Boolean(isPastSchedule && booked);
  const consultationOnly = isPastConsultation || !canMutate;
  // Passado abre em leitura; cancelamento só com escrita liberada.
  const showCancelSticky = Boolean(booked && canMutate);
  const showCreateSticky = Boolean(
    canMutate &&
      court?.status === ReservationStatusEnum.AVAILABLE &&
      !isPastSchedule,
  );
  const showStickyFooter = showCancelSticky || showCreateSticky;

  return (
    <div className="flex h-full min-h-0 max-h-dvh flex-1 flex-col bg-master text-text-light">
      <header className="sticky top-0 z-20 shrink-0 bg-master px-4 py-3 lg:px-6">
        <div className="relative mx-auto flex w-full max-w-lg items-center justify-center lg:max-w-3xl">
          <button
            type="button"
            onClick={() => goBackToList({ stale: false })}
            aria-label="Voltar para lista de reservas"
            className="mpn-tap absolute left-0 flex size-11 items-center justify-center rounded-xl text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
          >
            <MdOutlineArrowBackIos size={20} aria-hidden />
          </button>
          <PageTitle align="center" className="max-w-[min(70%,18rem)] text-lg sm:max-w-[75%] sm:text-xl">
            {isInitialLoading ? "Carregando…" : pageTitle}
          </PageTitle>
        </div>
      </header>

      <section
        className={`mx-auto min-h-0 w-full max-w-lg flex-1 overflow-y-auto px-4 pt-5 transition-opacity lg:max-w-3xl lg:px-6 ${
          showStickyFooter ? "pb-28" : "pb-8"
        } ${loading && court ? "opacity-80" : ""}`}
        aria-busy={loading}
      >
        {isInitialLoading ? (
          <div className="animate-pulse space-y-4" aria-label="Carregando formulário">
            <div className="h-24 rounded-2xl bg-master-light/70" />
            <div className="h-28 rounded-2xl bg-master-light/70" />
            <div className="h-40 rounded-2xl bg-master-light/70" />
            <div className="h-52 rounded-2xl bg-master-light/70" />
          </div>
        ) : court ? (
          <>
            {isPastConsultation && (
              <p className="mb-4 text-base font-medium text-text-light/65">
                {canMutate
                  ? "Horário passado — somente consulta (cancelar ainda disponível)"
                  : "Horário passado — somente consulta"}
              </p>
            )}
            {!canMutate && caps.ready && !isPastConsultation && (
              <p className="mb-4 text-base font-medium text-text-light/65">
                Conta em somente leitura — não é possível reservar, cancelar
                nem criar lembretes.
              </p>
            )}

            {getMeanByStatus(
              consultationOnly ? undefined : openEditContact,
              court?.status,
              {
                sportName: court?.reservation?.sportName,
                contactName: court?.reservation?.contactName,
                contactPhone: court?.reservation?.contactPhone ?? undefined,
                courtName: court?.court,
                price: court?.price,
                isPublic: court?.isPublic,
              }
            )}

            {canMutate &&
              !isPastSchedule &&
              court.status === ReservationStatusEnum.AVAILABLE &&
              renderButtonByStatus(court.status, statusActionHandlers, {
                isPublic: court.isPublic,
              })}

            {canMutate &&
              court.status === ReservationStatusEnum.INACTIVE &&
              renderButtonByStatus(court?.status, statusActionHandlers, {
                isPublic: court.isPublic,
                canActivate: !isPastSchedule,
              })}

            {canMutate &&
              !consultationOnly &&
              (court.status === ReservationStatusEnum.FIXED ||
                court.status === ReservationStatusEnum.RESERVED) && (
                <div className="mb-5 grid grid-cols-2 gap-2">
                  {renderButtonByStatus(
                    court.status,
                    statusActionHandlers,
                    { isPublic: court.isPublic },
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNewReminderModal(true)}
                    className={buttonClassName({
                      variant: "ghost",
                      size: "md",
                      className:
                        "border border-text-light/15 text-text-light/75 hover:bg-text-light/8 hover:text-text-light focus-visible:outline-accent-blue",
                    })}
                  >
                    <MdOutlinePostAdd
                      size={20}
                      className="shrink-0"
                      aria-hidden
                    />
                    Criar lembrete
                  </button>
                </div>
              )}

            {court.status !== ReservationStatusEnum.INACTIVE &&
              court.status !== ReservationStatusEnum.AVAILABLE &&
              court.reservation?.publicId &&
              (consultationOnly ? (
                <div className="mb-5 rounded-2xl bg-master-light p-4 sm:p-5">
                  <p className="mb-4 text-lg font-semibold text-text-light">
                    Informações adicionais
                  </p>

                  {(isBarbecueIncluded ||
                    isEvent ||
                    court.reservation?.isNeedsNetting) && (
                    <div
                      className="mb-5 flex flex-wrap gap-2"
                      role="group"
                      aria-label="Opções da reserva"
                    >
                      {court.reservation?.isNeedsNetting && (
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
                  )}

                  <div>
                    <p className="text-base font-semibold text-text-light">
                      Observação
                    </p>
                    <p
                      className={`mt-2 break-words text-base leading-6 whitespace-pre-wrap [overflow-wrap:anywhere] ${
                        observation?.trim()
                          ? "text-text-light/85"
                          : "text-text-light/45"
                      }`}
                    >
                      {observation?.trim()
                        ? observation
                        : "Nenhuma observação registrada"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-5 rounded-2xl bg-master-light p-4 sm:p-5">
                  <fieldset
                    className="mb-4 space-y-2"
                    disabled={savingObservation}
                  >
                    <legend className="mb-1 text-base font-semibold text-text-light">
                      Opções da reserva
                    </legend>
                    {court.reservation?.isNeedsNetting && (
                      <div className="flex min-h-12 items-center gap-2.5 rounded-xl bg-master/50 px-3.5 py-2.5">
                        <VoleyNetIcon className="size-5 shrink-0 text-text-light/75" />
                        <p className="text-base font-medium text-text-light">
                          Precisa de rede
                        </p>
                      </div>
                    )}
                    <OptionToggle
                      label="Com churrasqueira"
                      checked={isBarbecueIncluded}
                      onChange={setIsBarbecueIncluded}
                      disabled={savingObservation}
                      icon={<MdOutlineRestaurant size={20} />}
                    />
                    <OptionToggle
                      label="É um evento"
                      checked={isEvent}
                      onChange={setIsEvent}
                      disabled={savingObservation}
                      icon={<MdOutlineCelebration size={20} />}
                    />
                  </fieldset>

                  <Textarea
                    title="Observação"
                    placeholder="Jogo contra, 10 pessoas, churrasqueira por 2h"
                    name="observation-edit"
                    value={observation}
                    onChange={(e) => {
                      setObservation(
                        sanitizeNoteTextInput(
                          e.target.value,
                          OBSERVATION_MAX_LENGTH,
                        ),
                      );
                    }}
                    onBeforeInput={(e) => {
                      const native = e.nativeEvent as InputEvent;
                      if (native.isComposing || native.data == null) return;
                      if (noteTextInsertHasDisallowedChars(native.data)) {
                        e.preventDefault();
                      }
                    }}
                    disabled={savingObservation}
                    mode="dark"
                    maxLength={OBSERVATION_MAX_LENGTH}
                    rows={3}
                  />
                  <button
                    type="button"
                    disabled={savingObservation}
                    onClick={async () => {
                      if (savingObservation) return;
                      setSavingObservation(true);
                      try {
                        await updateObservationByReservation({
                          observation,
                          isBarbecueIncluded,
                          isEvent,
                        });
                      } finally {
                        setSavingObservation(false);
                      }
                    }}
                    className={secondaryBtnClass}
                  >
                    {savingObservation
                      ? "Salvando…"
                      : "Salvar alterações"}
                  </button>
                </div>
              ))}

            {court?.status === ReservationStatusEnum.AVAILABLE &&
              isPastSchedule && (
                <div className="rounded-2xl bg-master-light p-4 sm:p-5">
                  <p className="text-lg font-semibold text-text-light">
                    Horário encerrado
                  </p>
                  <p className="mt-2 text-base leading-6 text-text-light/75">
                    Este horário já passou e não pode ser reservado.
                  </p>
                </div>
              )}

            {court?.status === ReservationStatusEnum.AVAILABLE &&
              !isPastSchedule &&
              !canMutate && (
                <div className="rounded-2xl bg-master-light p-4 sm:p-5">
                  <p className="text-lg font-semibold text-text-light">
                    Reserva indisponível
                  </p>
                  <p className="mt-2 text-base leading-6 text-text-light/75">
                    Sua conta está em somente leitura. Regularize a pendência
                    para voltar a reservar horários.
                  </p>
                </div>
              )}

            {court?.status === ReservationStatusEnum.AVAILABLE &&
              !isPastSchedule &&
              canMutate && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                noValidate
                aria-label="Formulário de nova reserva"
                aria-busy={isSubmitting || undefined}
              >
                <div className="mb-5 rounded-2xl bg-master-light p-4 sm:p-5">
                  <Input
                    name="name"
                    title="Nome"
                    placeholder="João Silva"
                    type="text"
                    value={customerReservationName ?? ""}
                    onChange={(e) => {
                      setCustomerReservationName(
                        sanitizePersonNameInput(e.target.value),
                      );
                      if (nameError) setNameError("");
                    }}
                    onBeforeInput={(e) => {
                      const native = e.nativeEvent as InputEvent;
                      if (native.isComposing || native.data == null) return;
                      if (personNameInsertHasDisallowedChars(native.data)) {
                        e.preventDefault();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        document.getElementById("phone")?.focus();
                      }
                    }}
                    required
                    disabled={isSubmitting}
                    mode="dark"
                    autoComplete="name"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    maxLength={PERSON_NAME_MAX_LENGTH}
                    showCount
                    error={nameError || undefined}
                  />
                  <Input
                    name="phone"
                    title="Telefone com DDD (opcional)"
                    placeholder={PHONE_MASK_PLACEHOLDER}
                    type="tel"
                    inputMode="tel"
                    value={
                      customerReservationPhone
                        ? formatPhoneMask(customerReservationPhone)
                        : ""
                    }
                    onChange={(e) => {
                      setCustomerReservationPhone(
                        onlyPhoneDigits(e.target.value) || null
                      );
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      if (courtSports.length > 1) {
                        document.getElementById("court-sport")?.focus();
                        return;
                      }
                      (e.target as HTMLInputElement).blur();
                    }}
                    disabled={isSubmitting}
                    mode="dark"
                    autoComplete="tel"
                    enterKeyHint={courtSports.length > 1 ? "next" : "done"}
                  />
                  {courtSports.length > 1 && (
                    <Select
                      name="court-sport"
                      title="Esporte"
                      required
                      value={sportSelected?.id}
                      options={courtSports}
                      mode="dark"
                      disabled={isSubmitting}
                      onChange={(e) => {
                        const selectedId = Number(e.target.value);
                        const selectedSport = courtSports.find(
                          (sport) => sport.id === selectedId
                        );
                        setSportSelected(selectedSport || null);
                      }}
                    />
                  )}

                  <fieldset
                    className="mt-3 border-t border-text-light/10 pt-5"
                    disabled={isSubmitting}
                  >
                    <legend className="mb-3 text-base font-semibold text-text-light">
                      Opções da reserva
                    </legend>
                    <div className="mb-3 space-y-2">
                      {court.reservation?.isNeedsNetting && (
                        <div className="flex min-h-12 items-center gap-2.5 rounded-xl bg-master/50 px-3.5 py-2.5">
                          <VoleyNetIcon className="size-5 shrink-0 text-text-light/75" />
                          <p className="text-base font-medium text-text-light">
                            Precisa de rede
                          </p>
                        </div>
                      )}
                      <OptionToggle
                        id="barbecue-included"
                        name="barbecue-included"
                        label="Com churrasqueira"
                        checked={isBarbecueIncluded}
                        onChange={setIsBarbecueIncluded}
                        disabled={isSubmitting}
                        icon={<MdOutlineRestaurant size={20} />}
                      />
                      <OptionToggle
                        id="is-event"
                        name="is-event"
                        label="É um evento"
                        checked={isEvent}
                        onChange={setIsEvent}
                        disabled={isSubmitting}
                        icon={<MdOutlineCelebration size={20} />}
                      />
                    </div>
                  </fieldset>
                  <Textarea
                    name="observation"
                    title="Observação"
                    placeholder="Jogo contra, 10 pessoas, churrasqueira por 2h"
                    value={observation}
                    onChange={(e) =>
                      setObservation(
                        sanitizeNoteTextInput(
                          e.target.value,
                          OBSERVATION_MAX_LENGTH,
                        ),
                      )
                    }
                    onBeforeInput={(e) => {
                      const native = e.nativeEvent as InputEvent;
                      if (native.isComposing || native.data == null) return;
                      if (noteTextInsertHasDisallowedChars(native.data)) {
                        e.preventDefault();
                      }
                    }}
                    disabled={isSubmitting}
                    mode="dark"
                    maxLength={OBSERVATION_MAX_LENGTH}
                    rows={3}
                    className="mb-0"
                  />
                </div>

                <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-text-light/10 bg-master/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
                  <div className="mx-auto w-full max-w-lg lg:max-w-3xl">
                    <button
                      type="submit"
                      disabled={isSubmitting || !customerReservationName?.trim()}
                      className={buttonClassName({
                        variant: "primary",
                        className: "justify-center",
                      })}
                    >
                      <StatusIcons.reserved size={20} className="shrink-0" aria-hidden />
                      {isSubmitting ? "Reservando…" : "Reservar horário"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </>
        ) : (
          <EmptyState
            title="Não foi possível carregar este horário."
            description="Volte para a lista e tente novamente."
            className="min-h-64 py-10"
          />
        )}
      </section>

      {showCancelSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-text-light/10 bg-master/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-lg lg:max-w-3xl">
            <button
              type="button"
              disabled={loading || confirmLoading}
              onClick={askCancelReservation}
              className={buttonClassName({
                variant: "danger",
                className: "justify-center",
              })}
            >
              Cancelar reserva
            </button>
          </div>
        </div>
      )}

      {showInfoCustomer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/75"
            disabled={loading}
            onClick={() => {
              if (!loading) setShowInfoCustomer(false);
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={contactTitleId}
            aria-busy={loading || undefined}
            className="relative z-10 w-full max-w-md rounded-t-3xl bg-master-light p-5 shadow-2xl sm:rounded-3xl sm:p-6"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-text-light/20 sm:hidden" />
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3
                  id={contactTitleId}
                  className="text-xl font-semibold text-text-light"
                >
                  Editar contato
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoCustomer(false)}
                aria-label="Fechar"
                disabled={loading}
                className="mpn-tap-solid flex size-11 shrink-0 items-center justify-center rounded-full bg-master text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue disabled:opacity-50"
              >
                <BsX size={24} aria-hidden />
              </button>
            </div>
            <Input
              name="contact-name"
              title="Nome"
              placeholder="João Silva"
              type="text"
              value={
                customerReservationName ?? court?.reservation?.contactName ?? ""
              }
              onChange={(e) =>
                setCustomerReservationName(
                  sanitizePersonNameInput(e.target.value),
                )
              }
              onBeforeInput={(e) => {
                const native = e.nativeEvent as InputEvent;
                if (native.isComposing || native.data == null) return;
                if (personNameInsertHasDisallowedChars(native.data)) {
                  e.preventDefault();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  document.getElementById("contact-phone")?.focus();
                }
              }}
              required
              disabled={loading}
              mode="dark"
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
              maxLength={PERSON_NAME_MAX_LENGTH}
              showCount
            />
            <Input
              name="contact-phone"
              title="Telefone com DDD (opcional)"
              placeholder={PHONE_MASK_PLACEHOLDER}
              type="tel"
              inputMode="tel"
              value={formatPhoneMask(
                customerReservationPhone ??
                  court?.reservation?.contactPhone ??
                  ""
              )}
              onChange={(e) => {
                setCustomerReservationPhone(
                  onlyPhoneDigits(e.target.value) || null
                );
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                  void handleUpdatePhoneContact();
                }
              }}
              disabled={loading}
              mode="dark"
              enterKeyHint="done"
              autoComplete="tel"
            />
            <button
              type="button"
              className={`${primaryBtnClass} mt-2 justify-center`}
              onClick={() => {
                void handleUpdatePhoneContact();
              }}
              disabled={
                loading ||
                !(
                  customerReservationName?.trim() ||
                  court?.reservation?.contactName
                )
              }
            >
              {loading ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      )}

      <ConfirmSheet
        isOpen={!!confirmAction}
        title={confirmAction?.title || ""}
        description={confirmAction?.description || ""}
        confirmLabel={confirmAction?.confirmLabel || "Confirmar"}
        tone={confirmAction?.tone || "primary"}
        loading={confirmLoading}
        onClose={() => {
          if (!confirmLoading) setConfirmAction(null);
        }}
        onConfirm={handleConfirmAction}
      />

      <ConfirmSheet
        isOpen={!!actionAlert}
        title={actionAlert?.title || ""}
        description={actionAlert?.description || ""}
        confirmLabel="Entendi"
        tone="danger"
        alertOnly
        onClose={() => setActionAlert(null)}
        onConfirm={() => setActionAlert(null)}
      />

      <NewReminderModal
        isOpen={showNewReminderModal}
        onClose={() => {
          if (!creatingNote) setShowNewReminderModal(false);
        }}
        handleSubmit={handleCreateNote}
        isSubmitting={creatingNote}
        date={court?.date || ""}
        message={message}
        setMessage={setMessage}
        defaultMessage={[
          court?.date && `Reserva para o dia ${court.date}`,
          court?.time,
          court?.reservation?.contactName,
        ]
          .filter(Boolean)
          .join(" - ")}
      />
    </div>
  );
}

export default ReservationDetails;
