import { BsArrowCounterclockwise } from "react-icons/bs";
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
} from "../../../api/schedules";
import { formatCurrencyBRL } from "../../../utils/formatCurrency";
import Header from "../../../components/Header";
import { getMeanByStatus, renderButtonByStatus } from "./utils";
import Textarea from "../../../components/Textarea";
import Select from "../../../components/Select";
import VoleyNetIcon from "../../../components/Icons/VoleyNetIcon";
import { useLoading } from "../../../hooks/useLoading";
import Loader from "../../../components/Loader";

function ReservationDetails() {
  const { loading, withLoading } = useLoading();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dateFrom = location.state?.date;

  const [customerReservationName, setCustomerReservationName] = useState<
    string | null
  >(null);
  const [customerReservationPhone, setCustomerReservationPhone] = useState<
    string | null
  >(null);
  const [observation, setObservation] = useState<string>("");
  const [isBarbecueIncluded, setIsBarbecueIncluded] = useState<boolean>(false);
  const [court, setCourt] = useState<IReservationDetailsItemProps | null>(null);
  const [sportSelected, setSportSelected] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [courtSports, setCourtSports] = useState<
    { id: number; name: string }[]
  >([]);

  const fetchData = async (id: string) => {
    withLoading(async () => {
      const response = await getScheduleById(id);
      setCourt(response);
      setIsBarbecueIncluded(response?.reservation?.isBarbecueIncluded || false);
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
    if (!customerReservationPhone) {
      return alert("Telefone do cliente é obrigatório");
    }
    if (!court?.scheduleId) {
      return alert("Horário da reserva não informado");
    }
    withLoading(async () => {
      const response = await createReservation({
        contactName: customerReservationName,
        contactPhone: customerReservationPhone,
        courtSchedulePublicId: court?.scheduleId,
        observation,
        isBarbecueIncluded,
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

  const updateObservationByReservation = async ({
    observation,
    isBarbecueIncluded,
  }: {
    observation?: string;
    isBarbecueIncluded?: boolean;
  }): Promise<void> => {
    if (!court?.reservation?.publicId) {
      return alert("Reserva não encontrada");
    }
    withLoading(async () => {
      if (court.reservation?.publicId) {
        await updateObservationByPublicId(court?.reservation?.publicId, {
          ...(observation !== undefined && { observation }),
          ...(isBarbecueIncluded !== undefined && { isBarbecueIncluded }),
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
                    court?.status,
                    dateFrom,
                    navigate
                  )}
                </div>
              )}
              <h2 className="flex justify-center text-lg md:text-xl text-neutral-600 mt-4 mb-2 font-bold">
                Quadra {court?.court} -{" "}
                {court?.price && formatCurrencyBRL(parseFloat(court?.price))}
              </h2>
              {court.status !== ReservationStatusEnum.INACTIVE && (
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
              )}
              <div className="bg-neutral-100 py-2 px-4 md:w-1/3 md:mx-auto">
                {court.reservation?.isNeedsNetting && (
                  <div className="border-l-secondary-400 border-l-8 flex justify-start items-center bg-blue-50 w-full rounded-l-sm p-1 mb-1">
                    <VoleyNetIcon className="mx-2 text-neutral-800" />
                    <p className="text-neutral-800 pt-1">Precisa de rede</p>
                  </div>
                )}
                {isBarbecueIncluded && (
                  <div className="flex items-center justify-start border-l-primary-700 border-l-8 bg-orange-50 w-full rounded-l-sm p-1">
                    <MdOutlineRestaurant
                      size={24}
                      className="mx-2 text-neutral-700"
                    />
                    <p className="text-neutral-800 pt-1">
                      Churrasqueira inclusa na reserva
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
                    withLoading(async () => {
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
                <form
                  className="bg-neutral-100"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                >
                  <div className="mx-4 mb-16 md:w-1/3 md:mx-auto">
                    <Select
                      name="court-sport"
                      title="Esporte:"
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
                      title="Nome:"
                      placeholder="João Silva"
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
                      title="Telefone:"
                      placeholder="51989589197"
                      type="tel"
                      value={customerReservationPhone ?? ""}
                      onChange={(e) => {
                        const phone = e.target.value.replace(/\D/g, "");
                        setCustomerReservationPhone(phone);
                      }}
                      required
                      mode="light"
                    />
                    <Textarea
                      name="observation"
                      title="Observação:"
                      placeholder="Ex: Preciso de churrasqueira"
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      mode="light"
                      maxLength={150}
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
              )}
            </section>
          </>
        ) : (
          <div className="h-1/2 flex items-center justify-center">
            <p>carregando...</p>
          </div>
        )}
      </section>
    </div>
  );
}
export default ReservationDetails;
