import { BsArrowCounterclockwise, BsX } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { useLocation, useParams } from "react-router";
import { ReservationStatusEnum } from "../enum";
import { MdOutlineArrowBackIos, MdOutlineRestaurant } from "react-icons/md";
import { FaRegCalendarCheck } from "react-icons/fa";
import { IReservationDetailsItemProps } from "../interface";
import { useEffect, useState } from "react";
import Input from "../../../components/Input";
import {
  cancelReservation,
  createReservation,
  getScheduleById,
  updateObservationByPublicId,
  updatePhoneContact,
} from "../../../api/schedules";
import { formatCurrencyBRL } from "../../../utils/formatCurrency";
import Header from "../../../components/Header";
import { getMeanByStatus, renderButtonByStatus } from "./utils";
import Textarea from "../../../components/Textarea";
import Select from "../../../components/Select";
import VoleyNetIcon from "../../../components/Icons/VoleyNetIcon";
import { useLoading } from "../../../hooks/useLoading";
import Loader from "../../../components/Loader";
import { GiPartyPopper } from "react-icons/gi";

function ReservationDetails() {
  const { loading, withLoading } = useLoading();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dateFrom = location.state?.date;

  const [showInfoCustomer, setShowInfoCustomer] = useState<boolean>(false);

  const [customerReservationName, setCustomerReservationName] = useState<
    string | null
  >(null);
  const [customerReservationPhone, setCustomerReservationPhone] = useState<
    string | null
  >(null);
  const [observation, setObservation] = useState<string>("");
  const [isBarbecueIncluded, setIsBarbecueIncluded] = useState<boolean>(false);
  const [isEvent, setIsEvent] = useState<boolean>(false);
  const [court, setCourt] = useState<IReservationDetailsItemProps | null>(null);
  const [sportSelected, setSportSelected] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [courtSports, setCourtSports] = useState<
    { id: number; name: string }[]
  >([]);

  const fetchData = async (id: string) => {
    await withLoading(async () => {
      const response = await getScheduleById(id);
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
  }, [id]);

  const handleSubmit = async (): Promise<void> => {
    if (!customerReservationName) {
      return alert("Nome do cliente é obrigatório");
    }
    if (!court?.scheduleId) {
      return alert("Horário da reserva não informado");
    }
    await withLoading(async () => {
      const response = await createReservation({
        contactName: customerReservationName,
        contactPhone: customerReservationPhone && customerReservationPhone.trim().length > 0 ? customerReservationPhone : '',
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
    });
  };

  const handleUpdatePhoneContact = async () => {
    if (!customerReservationPhone || !court?.reservation?.contactName || !court?.scheduleId) {
      return;
    }
    await withLoading(async () => {
      await updatePhoneContact({
        contactName: String(court.reservation?.contactName),
        contactPhone: customerReservationPhone,
        courtSchedulePublicId: court?.scheduleId,
      });
      setShowInfoCustomer(false);
      navigate("/reservas", {
        state: {
          date: dateFrom,
        },
      });
    });
  }

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
      return alert("Reserva não encontrada");
    }
    await withLoading(async () => {
      if (court.reservation?.publicId) {
        await updateObservationByPublicId(court?.reservation?.publicId, {
          ...(observation !== undefined && { observation }),
          ...(isBarbecueIncluded !== undefined && { isBarbecueIncluded }),
          ...(isEvent !== undefined && { isEvent }),
        });
      }
    });
  };

  if (loading) return <Loader />;

  return (
    <div className="h-screen">
      <Header />
      <section className="bg-neutral-800 h-full overflow-y-auto">
        {court ? (
          <>
            <header className="border-2flex flex-col sticky top-0 z-10">
              <div className="flex w-full justify-around md:justify-between py-2 bg-neutral-700">
                <button
                  onClick={() =>
                    navigate(`/reservas`, { state: { date: dateFrom } })
                  }
                >
                  <MdOutlineArrowBackIos size={22} />
                </button>
                <div className="flex align-center w-full justify-center gap-2 bg-neutral-700">
                  <p className="mt-1">
                    {court?.date} ({court?.weekday}) - {court?.time}
                  </p>
                </div>
              </div>
              {getMeanByStatus(
                setShowInfoCustomer,
                court?.status,
                court?.reservation?.sportName,
                court?.reservation?.contactName,
                court?.reservation?.contactPhone
              )}
            </header>
            <section className="bg-neutral-100 h-full md:mx-auto">
              {court && (
                <div
                  className={`flex justify-between md:justify-center items-baseline`}
                >
                  {renderButtonByStatus(
                    court.scheduleId,
                    court.reservation?.isBarbecueIncluded ?? false,
                    court?.status,
                    dateFrom,
                    navigate,
                    withLoading
                  )}
                </div>
              )}
              <h2 className="flex justify-center text-lg md:text-xl text-neutral-600 mt-4 mb-2 font-bold">
                Quadra {court?.court} -{" "}
                {court?.price && formatCurrencyBRL(parseFloat(court?.price))}
              </h2>
              {court.status !== ReservationStatusEnum.INACTIVE &&
                court.status !== ReservationStatusEnum.AVAILABLE && (
                  <div className="flex flex-col items-start mx-auto w-fit">
                    <div className="flex items-center justify-center gap-1 mx-4 mb-2">
                      <input
                        type="checkbox"
                        id="barbecue-included"
                        checked={isBarbecueIncluded}
                        onChange={(e) => {
                          setIsBarbecueIncluded(e.target.checked);
                          if (court?.reservation?.publicId) {
                            updateObservationByReservation({
                              isBarbecueIncluded: e.target.checked,
                            });
                          }
                        }}
                      />
                      <label
                        htmlFor="barbecue-included"
                        className="text-neutral-600 pt-1 ms-1"
                      >
                        Com Churrasqueira
                      </label>
                    </div>
                    <div className="flex items-center justify-center gap-1 mx-4 mb-2">
                      <input
                        type="checkbox"
                        id="is-event"
                        checked={isEvent}
                        onChange={(e) => {
                          setIsEvent(e.target.checked);
                          if (court?.reservation?.publicId) {
                            updateObservationByReservation({
                              isEvent: e.target.checked,
                            });
                          }
                        }}
                      />
                      <label
                        htmlFor="is-event"
                        className="text-neutral-600 pt-1 ms-1"
                      >
                        É um evento
                      </label>
                    </div>
                  </div>
                )}
              <div className="bg-neutral-100 py-2 px-4 md:w-1/3 md:mx-auto">
                {court.reservation?.isNeedsNetting && (
                  <div className="border-l-secondary-400 border-l-8 flex justify-start items-center bg-blue-50 w-full rounded-l-sm p-1 mb-1">
                    <VoleyNetIcon className="mx-2 text-neutral-800" />
                    <p className="text-neutral-700 pt-1">Precisa de rede</p>
                  </div>
                )}
                {court.status !== ReservationStatusEnum.AVAILABLE &&
                  isBarbecueIncluded && (
                    <div className="flex items-center justify-start border-l-primary-700 border-l-8 bg-orange-50 w-full rounded-l-sm p-1">
                      <MdOutlineRestaurant
                        size={24}
                        className="mx-2 text-neutral-600"
                      />
                      <p className="text-neutral-700 pt-1">
                        Churrasqueira inclusa na reserva
                      </p>
                    </div>
                  )}
                {court.status !== ReservationStatusEnum.AVAILABLE && isEvent && (
                  <div className="flex items-center justify-start border-pink-700 border-l-8 bg-pink-50 w-full rounded-l-sm p-1">
                    <GiPartyPopper
                      size={24}
                      className="mx-2 text-neutral-600"
                    />
                    <p className="text-neutral-700 pt-1">
                      É um evento
                    </p>
                  </div>
                )}
              </div>
              {court.reservation?.publicId && (
                <div className="mx-4 mt-8 border-t-1 border-neutral-400 md:w-1/3 md:mx-auto">
                  <Textarea
                    title="Observação:"
                    placeholder="Churrasco para 10 pessoas"
                    name="observation-edit"
                    value={observation}
                    onChange={async (e) => {
                      const newObservation = e.target.value;
                      setObservation(newObservation);
                    }}
                    mode="light"
                    maxLength={150}
                    className="w-full pt-4"
                    rows={4}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={async () => {
                        await updateObservationByReservation({
                          observation,
                        });
                      }}
                      className="border-neutral-600 border-1 py-2 px-4 rounded-sm shadow-md text-sm mb-16 text-neutral-600"
                    >
                      Salvar Observação
                    </button>
                  </div>
                </div>
              )}
              {[
                ReservationStatusEnum.FIXED,
                ReservationStatusEnum.RESERVED,
                ReservationStatusEnum.PREPAID,
              ].includes(court?.status as ReservationStatusEnum) && (
                  <button
                    onClick={async () => {
                      await withLoading(async () => {
                        await cancelReservation(
                          String(court?.reservation?.tokenToCancel)
                        );
                        navigate("/reservas", {
                          state: { date: dateFrom },
                        });
                      });
                    }}
                    className="w-full fixed bottom-0 flex items-start justify-center rounded-t-md bg-danger-400 text-neutral-100 gap-1 p-4 mx-auto mt-4 font-bold"
                  >
                    <BsArrowCounterclockwise size={20} />
                    Cancelar reserva
                  </button>
                )}
              {court?.status === ReservationStatusEnum.AVAILABLE && (
                <>
                  <p className="text-neutral-800 text-center text-sm">
                    * Campos obrigatórios.
                  </p>
                  <form
                    className="bg-neutral-100"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmit();
                    }}
                  >
                    <div className="mx-4 pb-16 md:w-1/3 md:mx-auto">
                      <Select
                        name="court-sport"
                        title="*Esporte:"
                        required
                        value={sportSelected?.id}
                        options={courtSports}
                        mode="light"
                        onChange={(e) => {
                          const selectedId = Number(e.target.value);
                          const selectedSport = courtSports.find(
                            (sport) => sport.id === selectedId
                          );
                          setSportSelected(selectedSport || null);
                        }}
                        disabled={courtSports.length <= 1}
                      />
                      <Input
                        name="name"
                        title="*Nome:"
                        placeholder="Ex.: João Silva"
                        type="text"
                        value={customerReservationName ?? ""}
                        onChange={(e) =>
                          setCustomerReservationName(e.target.value)
                        }
                        required
                        mode="light"
                      />
                      <Input
                        name="phone"
                        title="Telefone com DDD:"
                        placeholder="Ex.: 51912345678"
                        type="tel"
                        value={customerReservationPhone ?? ""}
                        onChange={(e) => {
                          let phone = e.target.value.replace(/\D/g, "");
                          if (phone.length > 11) {
                            phone = phone.slice(0, 11);
                          }
                          if (phone.length >= 2) {
                            const ddd = phone.slice(0, 2);
                            let number = phone.slice(2);
                            phone = ddd + number;
                          }
                          setCustomerReservationPhone(phone);
                        }}
                        mode="light"
                      />
                      <div className="flex items-center gap-1 mt-1 ms-1 mb-4">
                        <input
                          type="checkbox"
                          id="barbecue-included"
                          checked={isBarbecueIncluded}
                          onChange={(e) => {
                            setIsBarbecueIncluded(e.target.checked);
                            if (court?.reservation?.publicId) {
                              updateObservationByReservation({
                                isBarbecueIncluded: e.target.checked,
                              });
                            }
                          }}
                        />
                        <label
                          htmlFor="barbecue-included"
                          className="text-neutral-600 pt-1 ms-1"
                        >
                          Com Churrasqueira
                        </label>
                      </div>
                      <div className="flex items-center gap-1 mt-1 ms-1 mb-4">
                        <input
                          type="checkbox"
                          id="is-event"
                          checked={isEvent}
                          onChange={(e) => {
                            setIsEvent(e.target.checked);
                            if (court?.reservation?.publicId) {
                              updateObservationByReservation({
                                isEvent: e.target.checked,
                              });
                            }
                          }}
                        />
                        <label
                          htmlFor="is-event"
                          className="text-neutral-600 pt-1 ms-1"
                        >
                          É um evento
                        </label>
                      </div>
                      <Textarea
                        name="observation"
                        title="Observação:"
                        placeholder="Ex: jogo contra, jogo arreganho, 10 pessoas, churrasqueira por 2h"
                        value={observation}
                        onChange={(e) => setObservation(e.target.value)}
                        mode="light"
                        maxLength={150}
                        rows={4}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full fixed bottom-0 flex items-start justify-center rounded-t-md bg-secondary-500 text-neutral-100 gap-1 p-4 mx-auto mt-4 font-bold"
                    >
                      <FaRegCalendarCheck size={20} />
                      Reservar
                    </button>
                  </form>
                </>
              )}
            </section>
          </>
        ) : (
          <div className="h-1/2 flex items-center justify-center">
            <p>carregando...</p>
          </div>
        )}
      </section>
      {showInfoCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 md:w-1/2 w-full flex flex-col items-center">
            <button type="button" onClick={() => setShowInfoCustomer(false)} className="relative left-1/2 bottom-4 text-neutral-800 cursor-pointer" >
              <BsX size={24} />
            </button>
            <h3 className="text-lg font-semibold mb-4 text-neutral-800">Informações do contato</h3>
            <p className="text-neutral-600 mb-6 text-center">Você pode alterar o número de telefone.<br />Não esqueça de colocar o 9 na frente.</p>
            <div className="w-full mb-4">
              <Input
                name="name"
                title="Nome:"
                placeholder="Ex.: João Silva"
                type="text"
                value={court?.reservation?.contactName ?? ""}
                onChange={(e) =>
                  setCustomerReservationName(e.target.value)
                }
                required
                readOnly
                mode="light"
              />
              <Input
                name="phone"
                title="Telefone com DDD*:"
                placeholder="Ex.: 51912345678"
                type="tel"
                value={customerReservationPhone ?? court?.reservation?.contactPhone}
                onChange={(e) => {
                  let phone = e.target.value.replace(/\D/g, "");
                  if (phone.length > 11) {
                    phone = phone.slice(0, 11);
                  }
                  if (phone.length >= 2) {
                    const ddd = phone.slice(0, 2);
                    let number = phone.slice(2);
                    phone = ddd + number;
                  }
                  setCustomerReservationPhone(phone);
                }}
                mode="light"
              />
            </div>
            <button
              className="px-4 py-2 bg-secondary-500 text-white rounded hover:bg-secondary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                handleUpdatePhoneContact()
              }}
              disabled={!customerReservationPhone}
            >
              Salvar informações
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default ReservationDetails;
