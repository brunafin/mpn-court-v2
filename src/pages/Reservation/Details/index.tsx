import { BsX } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { useLocation, useParams } from "react-router";
import { ReservationStatusEnum } from "../enum";
import {
  MdOutlineArrowBackIos,
  MdOutlineRestaurant,
} from "react-icons/md";
import { IReservationDetailsItemProps } from "../interface";
import { useEffect, useId, useState } from "react";
import Input from "../../../components/Input";
import {
  cancelReservation,
  changeAvailability,
  createReservation,
  fixSchedule,
  getScheduleById,
  unfixSchedule,
  updateObservationByPublicId,
  updatePhoneContact,
} from "../../../api/schedules";
import {
  formatPhoneMask,
  onlyPhoneDigits,
  PHONE_MASK_PLACEHOLDER,
} from "../../../utils/formatPhone";
import { getMeanByStatus, renderButtonByStatus, formatSchedulePageTitle } from "./utils";
import Textarea from "../../../components/Textarea";
import Select from "../../../components/Select";
import { useLoading } from "../../../hooks/useLoading";
import NewReminderModal from "../../../components/NewNote";
import ConfirmSheet, {
  ConfirmTone,
} from "../../../components/ConfirmSheet";
import { useNotification } from "../../../contexts/NotificationContext";
import { useErrors } from "../../../contexts/ErrorsContext";
import { createNote } from "../../../api/notes";
import { LuPartyPopper } from "react-icons/lu";
import { StatusIcons } from "../statusIcons";
import { buttonClassName } from "../../../components/Button";
import EmptyState from "../../../components/EmptyState";
import { PageTitle } from "../../../components/PageTitle";

type ConfirmAction = {
  title: string;
  description: string;
  confirmLabel: string;
  tone: ConfirmTone;
  run: () => Promise<void>;
};

function ReservationDetails() {
  const { loading, withLoading } = useLoading();
  const { refreshUnreadCount } = useNotification();
  const { notifyError } = useErrors();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dateFrom = location.state?.date;

  const [showInfoCustomer, setShowInfoCustomer] = useState<boolean>(false);
  const contactTitleId = useId();
  const [showNewReminderModal, setShowNewReminderModal] =
    useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [is24before, setIs24before] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null
  );
  const [confirmLoading, setConfirmLoading] = useState(false);

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
    if (!customerReservationName?.trim()) {
      setNameError("Informe o nome do cliente");
      window.requestAnimationFrame(() => {
        document.getElementById("name")?.focus();
      });
      return;
    }
    setNameError("");
    if (!court?.scheduleId) {
      notifyError({
        message: "Horário da reserva não informado",
        type: "error",
      });
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await createReservation({
        contactName: customerReservationName,
        contactPhone:
          customerReservationPhone && customerReservationPhone.trim().length > 0
            ? customerReservationPhone
            : "",
        courtSchedulePublicId: court?.scheduleId,
        observation,
        isBarbecueIncluded,
        isEvent,
        sportId: sportSelected?.id || courtSports[0]?.id,
      });
      if (response) {
        navigate("/reservas", {
          state: {
            date: dateFrom,
          },
        });
      }
    } catch (error) {
      console.error(error);
      notifyError({
        message: "Não foi possível reservar o horário. Tente novamente.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePhoneContact = async () => {
    const contactName =
      customerReservationName?.trim() ||
      court?.reservation?.contactName ||
      "";
    const contactPhone =
      customerReservationPhone || court?.reservation?.contactPhone || "";

    if (!contactName || !contactPhone || !court?.scheduleId || !id) {
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
    await updateObservationByPublicId(court.reservation.publicId, {
      ...(observation !== undefined && { observation }),
      ...(isBarbecueIncluded !== undefined && { isBarbecueIncluded }),
      ...(isEvent !== undefined && { isEvent }),
    });
  };

  const handleCreateNote = async (event?: React.FormEvent): Promise<void> => {
    event?.preventDefault?.();
    if (creatingNote) return;
    let formattedDate = "";
    if (court?.date) {
      const [day, month, year] = court.date.split("/");
      formattedDate = `${year}-${month}-${day}`;
    } else {
      const now = new Date();
      formattedDate = now.toISOString().slice(0, 10);
    }
    setCreatingNote(true);
    try {
      await createNote({
        companyPublicId: court?.companyPublicId || "",
        date: formattedDate,
        message:
          message ||
          [
            court?.date && `Reserva para o dia ${court.date}`,
            court?.time,
            court?.reservation?.contactName,
          ]
            .filter(Boolean)
            .join(" - "),
        is24HoursBefore: is24before,
      });
      setShowNewReminderModal(false);
      setMessage("");
      setIs24before(false);
      await refreshUnreadCount();
    } finally {
      setCreatingNote(false);
    }
  };

  const goBackToList = () => {
    navigate("/reservas", { state: { date: dateFrom } });
  };

  const statusActionHandlers = {
    onLiberarFixo: () => {
      setConfirmAction({
        title: "Liberar horário fixo?",
        description:
          "Isso cancela todas as reservas futuras deste horário e cliente.",
        confirmLabel: "Liberar fixo",
        tone: "success",
        run: async () => {
          await unfixSchedule({
            court_schedule_public_id: court?.scheduleId || "",
          });
          goBackToList();
        },
      });
    },
    onReativar: () => {
      setConfirmAction({
        title: "Reativar horário?",
        description: "O horário volta a aparecer como disponível para reserva.",
        confirmLabel: "Reativar",
        tone: "success",
        run: async () => {
          await changeAvailability(court?.scheduleId || "", true);
          goBackToList();
        },
      });
    },
    onFixar: () => {
      const barbecueNote = isBarbecueIncluded
        ? " A churrasqueira não será agendada nas reservas futuras."
        : "";
      setConfirmAction({
        title: "Fixar horário?",
        description: `O cliente fica com este horário de forma recorrente.${barbecueNote}`,
        confirmLabel: "Fixar horário",
        tone: "neutral",
        run: async () => {
          await fixSchedule({
            court_schedule_public_id: court?.scheduleId || "",
          });
          goBackToList();
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
          await changeAvailability(court?.scheduleId || "", false);
          goBackToList();
        },
      });
    },
  };

  const askCancelReservation = () => {
    setConfirmAction({
      title: "Cancelar reserva?",
      description:
        "A reserva deste horário será cancelada. Essa ação não pode ser desfeita.",
      confirmLabel: "Cancelar reserva",
      tone: "danger",
      run: async () => {
        await cancelReservation(String(court?.reservation?.tokenToCancel));
        goBackToList();
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
    } catch (error: any) {
      notifyError({
        message:
          error?.response?.data?.message ||
          "Não foi possível concluir a ação. Tente novamente.",
        type: "error",
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

  const isBookedStatus =
    court?.status === ReservationStatusEnum.FIXED ||
    court?.status === ReservationStatusEnum.RESERVED ||
    court?.status === ReservationStatusEnum.PREPAID;
  const isPastConsultation = Boolean(isPastSchedule && isBookedStatus);
  const showCancelSticky = Boolean(isBookedStatus && !isPastSchedule);
  const showCreateSticky = Boolean(
    court?.status === ReservationStatusEnum.AVAILABLE && !isPastSchedule
  );
  const showStickyFooter = showCancelSticky || showCreateSticky;

  return (
    <div className="min-h-screen bg-master text-text-light">
      <header className="sticky top-0 z-20 bg-master px-4 py-3">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={() =>
              navigate(`/reservas`, { state: { date: dateFrom } })
            }
            aria-label="Voltar para lista de reservas"
            className="absolute left-0 flex size-11 items-center justify-center rounded-xl text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue active:bg-master-light"
          >
            <MdOutlineArrowBackIos size={20} aria-hidden />
          </button>
          <PageTitle align="center" className="max-w-[min(70%,18rem)] text-lg sm:max-w-[75%] sm:text-xl">
            {isInitialLoading ? "Carregando…" : pageTitle}
          </PageTitle>
        </div>
      </header>

      <section
        className={`mx-auto w-full max-w-lg px-4 pt-5 transition-opacity ${
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
                Somente consulta
              </p>
            )}

            {getMeanByStatus(
              isPastConsultation ? undefined : openEditContact,
              court?.status,
              {
              sportName: court?.reservation?.sportName,
              contactName: court?.reservation?.contactName,
              contactPhone: court?.reservation?.contactPhone,
              courtName: court?.court,
              price: court?.price,
              isNeedsNetting: court?.reservation?.isNeedsNetting,
              onCreateReminder:
                !isPastConsultation &&
                court.reservation?.publicId &&
                (court.status === ReservationStatusEnum.FIXED ||
                  court.status === ReservationStatusEnum.RESERVED ||
                  court.status === ReservationStatusEnum.PREPAID)
                  ? () => setShowNewReminderModal(true)
                  : undefined,
            })}

            {(court.status === ReservationStatusEnum.INACTIVE ||
              (court.status === ReservationStatusEnum.AVAILABLE &&
                !isPastSchedule)) &&
              renderButtonByStatus(court?.status, statusActionHandlers)}

            {court.status !== ReservationStatusEnum.INACTIVE &&
              court.status !== ReservationStatusEnum.AVAILABLE &&
              court.reservation?.publicId &&
              (isPastConsultation ? (
                <div className="mb-5 rounded-2xl bg-master-light p-4 sm:p-5">
                  <p className="mb-4 text-lg font-semibold text-text-light">
                    Informações adicionais
                  </p>

                  <div
                    className="space-y-2"
                    role="group"
                    aria-label="Opções da reserva"
                  >
                    <div
                      className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 ${
                        isBarbecueIncluded
                          ? "bg-accent-blue/10"
                          : "bg-master/50"
                      }`}
                    >
                      <MdOutlineRestaurant
                        size={20}
                        className={`shrink-0 ${
                          isBarbecueIncluded
                            ? "text-text-light"
                            : "text-text-light/40"
                        }`}
                        aria-hidden
                      />
                      <span
                        className={`text-base font-medium ${
                          isBarbecueIncluded
                            ? "text-text-light"
                            : "text-text-light/45"
                        }`}
                      >
                        {isBarbecueIncluded
                          ? "Com churrasqueira"
                          : "Sem churrasqueira"}
                      </span>
                    </div>
                    <div
                      className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 ${
                        isEvent ? "bg-accent-blue/10" : "bg-master/50"
                      }`}
                    >
                      <LuPartyPopper
                        size={20}
                        className={`shrink-0 ${
                          isEvent ? "text-text-light" : "text-text-light/40"
                        }`}
                        aria-hidden
                      />
                      <span
                        className={`text-base font-medium ${
                          isEvent ? "text-text-light" : "text-text-light/45"
                        }`}
                      >
                        {isEvent ? "É um evento" : "Não é um evento"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-base font-semibold text-text-light">
                      Observação
                    </p>
                    <p
                      className={`mt-2 text-base leading-6 whitespace-pre-wrap ${
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
                <>
                  <div className="mb-5 rounded-2xl bg-master-light p-4 sm:p-5">
                    <div
                      className="mb-4 space-y-1"
                      role="group"
                      aria-label="Opções da reserva"
                    >
                      <label
                        className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-3 transition focus-within:ring-2 focus-within:ring-accent-blue/60 ${
                          isBarbecueIncluded
                            ? "bg-accent-blue/10"
                            : "hover:bg-master/80"
                        }`}
                      >
                        <span className="flex items-center gap-3 text-base font-medium text-text-light">
                          <MdOutlineRestaurant
                            size={20}
                            className="shrink-0 text-text-light/70"
                            aria-hidden
                          />
                          Com churrasqueira
                        </span>
                        <input
                          type="checkbox"
                          checked={isBarbecueIncluded}
                          onChange={(e) => {
                            setIsBarbecueIncluded(e.target.checked);
                          }}
                          className="size-6 shrink-0 rounded accent-accent-blue"
                        />
                      </label>
                      <label
                        className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-3 transition focus-within:ring-2 focus-within:ring-accent-blue/60 ${
                          isEvent
                            ? "bg-accent-blue/10"
                            : "hover:bg-master/80"
                        }`}
                      >
                        <span className="flex items-center gap-3 text-base font-medium text-text-light">
                          <LuPartyPopper
                            size={20}
                            className="shrink-0 text-text-light/70"
                            aria-hidden
                          />
                          É um evento
                        </span>
                        <input
                          type="checkbox"
                          checked={isEvent}
                          onChange={(e) => {
                            setIsEvent(e.target.checked);
                          }}
                          className="size-6 shrink-0 rounded accent-accent-blue"
                        />
                      </label>
                    </div>

                    <Textarea
                      title="Observação"
                      placeholder="Jogo contra, 10 pessoas, churrasqueira por 2h"
                      name="observation-edit"
                      value={observation}
                      onChange={async (e) => {
                        const newObservation = e.target.value;
                        setObservation(newObservation);
                      }}
                      mode="dark"
                      maxLength={150}
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

                  {(court.status === ReservationStatusEnum.FIXED ||
                    court.status === ReservationStatusEnum.RESERVED ||
                    court.status === ReservationStatusEnum.PREPAID) &&
                    renderButtonByStatus(court.status, statusActionHandlers)}
                </>
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
              !isPastSchedule && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                noValidate
                aria-label="Formulário de nova reserva"
                className="space-y-4"
              >
                <div className="rounded-2xl bg-master-light p-4 sm:p-5">
                  <Input
                    name="name"
                    title="Nome"
                    placeholder="João Silva"
                    type="text"
                    value={customerReservationName ?? ""}
                    onChange={(e) => {
                      setCustomerReservationName(e.target.value);
                      if (nameError) setNameError("");
                    }}
                    required
                    mode="dark"
                    autoComplete="name"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    error={nameError || undefined}
                  />
                  <Input
                    name="phone"
                    title="Telefone com DDD"
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
                      onChange={(e) => {
                        const selectedId = Number(e.target.value);
                        const selectedSport = courtSports.find(
                          (sport) => sport.id === selectedId
                        );
                        setSportSelected(selectedSport || null);
                      }}
                    />
                  )}
                </div>

                <div className="rounded-2xl bg-master-light p-4 sm:p-5">
                  <fieldset aria-label="Opções adicionais">
                    <div className="mb-3 space-y-2">
                      <label
                        htmlFor="barbecue-included"
                        className={`flex min-h-16 cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3.5 transition focus-within:ring-2 focus-within:ring-accent-blue/80 ${
                          isBarbecueIncluded
                            ? "bg-accent-blue/15 ring-2 ring-accent-blue/70"
                            : "bg-master"
                        }`}
                      >
                        <span className="flex items-center gap-3 text-lg font-medium text-text-light">
                          <MdOutlineRestaurant
                            size={22}
                            className="shrink-0 text-text-light"
                            aria-hidden
                          />
                          Com churrasqueira
                        </span>
                        <input
                          type="checkbox"
                          id="barbecue-included"
                          checked={isBarbecueIncluded}
                          onChange={(e) =>
                            setIsBarbecueIncluded(e.target.checked)
                          }
                          className="size-7 shrink-0 rounded accent-accent-blue"
                        />
                      </label>
                      <label
                        htmlFor="is-event"
                        className={`flex min-h-16 cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3.5 transition focus-within:ring-2 focus-within:ring-accent-blue/80 ${
                          isEvent
                            ? "bg-accent-blue/15 ring-2 ring-accent-blue/70"
                            : "bg-master"
                        }`}
                      >
                        <span className="flex items-center gap-3 text-lg font-medium text-text-light">
                          <LuPartyPopper
                            size={22}
                            className="shrink-0 text-text-light"
                            aria-hidden
                          />
                          É um evento
                        </span>
                        <input
                          type="checkbox"
                          id="is-event"
                          checked={isEvent}
                          onChange={(e) => setIsEvent(e.target.checked)}
                          className="size-7 shrink-0 rounded accent-accent-blue"
                        />
                      </label>
                    </div>
                  </fieldset>
                  <Textarea
                    name="observation"
                    title="Observação"
                    placeholder="Jogo contra, 10 pessoas, churrasqueira por 2h"
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    mode="dark"
                    maxLength={150}
                    rows={3}
                    className="mb-0"
                  />
                </div>

                <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-text-light/10 bg-master/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
                  <button
                    type="submit"
                    disabled={isSubmitting || !customerReservationName?.trim()}
                    className={buttonClassName({
                      variant: "primary",
                      className: "mx-auto max-w-lg justify-center",
                    })}
                  >
                    <StatusIcons.reserved size={20} className="shrink-0" aria-hidden />
                    {isSubmitting ? "Reservando…" : "Reservar horário"}
                  </button>
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
          <button
            type="button"
            disabled={loading || confirmLoading}
            onClick={askCancelReservation}
            className={buttonClassName({
              variant: "danger",
              className: "mx-auto max-w-lg justify-center",
            })}
          >
            Cancelar reserva
          </button>
        </div>
      )}

      {showInfoCustomer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/75"
            onClick={() => setShowInfoCustomer(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={contactTitleId}
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
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-master text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
              >
                <BsX size={24} aria-hidden />
              </button>
            </div>
            <Input
              name="name"
              title="Nome"
              placeholder="João Silva"
              type="text"
              value={
                customerReservationName ?? court?.reservation?.contactName ?? ""
              }
              onChange={(e) => setCustomerReservationName(e.target.value)}
              required
              mode="dark"
              autoComplete="name"
              autoCapitalize="words"
            />
            <Input
              name="phone"
              title="Telefone com DDD"
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
              mode="dark"
              required
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
                ) ||
                !(
                  customerReservationPhone || court?.reservation?.contactPhone
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
        is24HoursBefore={is24before}
        setIs24HoursBefore={setIs24before}
        showRemind24HoursBefore={true}
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
