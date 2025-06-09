import { BsArrowCounterclockwise, BsPersonCheck } from "react-icons/bs";
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

function ReservationDetails() {
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

  const fetchData = async (id: string) => {
    const response = await getScheduleById(id);
    setCourt(response);
    setIsBarbecueIncluded(response?.reservation?.isBarbecueIncluded || false);
    setObservation(response?.reservation?.observation || "");
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
    const response = await createReservation({
      contactName: customerReservationName,
      contactPhone: customerReservationPhone,
      courtSchedulePublicId: court?.scheduleId,
      observation,
      isBarbecueIncluded,
    });
    if (response) {
      navigate("/reservas", {
        state: {
          date: dateFrom,
        },
      });
    }
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
    await updateObservationByPublicId(court?.reservation?.publicId, {
      ...(observation !== undefined && { observation }),
      ...(isBarbecueIncluded !== undefined && { isBarbecueIncluded }),
    });
  };

  return (
    <div className="h-screen">
      <Header />
      <section
        className="bg-neutral-700 overflow-y-auto"
        style={{ height: "calc(100vh - 4rem)" }}
      >
        {court ? (
          <>
            <header className="flex flex-col sticky top-0 z-10">
              <div className="flex w-full justify-around md:justify-between py-4 bg-danger-800">
                <button
                  onClick={() =>
                    navigate(`/reservas`, { state: { date: dateFrom } })
                  }
                >
                  <MdOutlineArrowBackIos size={24} />
                </button>
                <div className="flex align-center w-full justify-center gap-2">
                  <p className="mt-1 text-lg">
                    {court?.date} ({court?.weekday}) - {court?.time}
                  </p>
                </div>
              </div>
              {getMeanByStatus(
                court?.status,
                court?.reservation?.contactName,
                court?.reservation?.contactPhone
              )}

              {court && (
                <div
                  className={`flex justify-between md:justify-center items-baseline px-2`}
                >
                  {renderButtonByStatus(
                    court.scheduleId,
                    court?.status,
                    dateFrom,
                    navigate
                  )}
                  {court.reservation?.publicId && (
                    <div className="flex items-center gap-1 ml-4">
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
                        className="text-neutral-100 pt-1"
                      >
                        Com Churrasqueira
                      </label>
                    </div>
                  )}
                </div>
              )}
            </header>
            <h2 className="flex justify-center text-lg md:text-xl py-4">
              {court?.court} -{" "}
              {court?.price && formatCurrencyBRL(parseFloat(court?.price))}
            </h2>
            {isBarbecueIncluded && (
              <div className="bg-primary-300 p-2 mx-4 mb-4 rounded-md md:w-fit md:mx-auto">
                <p className="text-neutral-800 flex items-center justify-center">
                  <MdOutlineRestaurant size={20} className="inline mr-1" />
                  Churrasqueira inclusa na reserva
                </p>
              </div>
            )}
            {court.reservation?.publicId && (
              <div className="mx-4 mb-4 md:w-1/3 md:mx-auto">
                <label
                  htmlFor="observation-edit"
                  className="text-neutral-100 ml-2 mb-1"
                >
                  Observação:
                </label>
                <Textarea
                  name="observation-edit"
                  value={observation}
                  onChange={async (e) => {
                    const newObservation = e.target.value;
                    setObservation(newObservation);
                  }}
                  onBlur={async (e) => {
                    const newObservation = e.target.value;
                    setObservation(newObservation);
                    if (court?.reservation?.publicId) {
                      await updateObservationByReservation({
                        observation: newObservation,
                      });
                    }
                  }}
                  mode="dark"
                  maxLength={150}
                  className="w-full"
                />
              </div>
            )}
            {[
              ReservationStatusEnum.FIXED,
              ReservationStatusEnum.RESERVED,
              ReservationStatusEnum.PREPAID,
            ].includes(court?.status as ReservationStatusEnum) && (
              <button
                onClick={async () => {
                  await cancelReservation(
                    String(court?.reservation?.tokenToCancel)
                  );
                  navigate("/reservas", {
                    state: { date: dateFrom },
                  });
                }}
                className="flex items-start justify-center w-fit rounded-sm bg-danger-400 text-neutral-100 gap-1 py-2 px-4 mx-auto mt-4"
              >
                <BsArrowCounterclockwise size={20} />
                Cancelar reserva
              </button>
            )}
            {court?.status === ReservationStatusEnum.AVAILABLE && (
              <form
                className="bg-neutral-800 px-4 py-4 rounded-md mx-4 mb-4 md:w-1/2 md:mx-auto"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
              >
                <Input
                  name="name"
                  title="Nome:"
                  placeholder="João Silva"
                  type="text"
                  value={customerReservationName ?? ""}
                  onChange={(e) => setCustomerReservationName(e.target.value)}
                  required
                  mode="dark"
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
                  mode="dark"
                />
                <Textarea
                  name="observation"
                  title="Observação:"
                  placeholder="Ex: Preciso de churrasqueira"
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  mode="dark"
                  maxLength={150}
                />
                <div className="flex items-center gap-2 my-2">
                  <input
                    type="checkbox"
                    id="barbecue"
                    checked={isBarbecueIncluded}
                    onChange={(e) => setIsBarbecueIncluded(e.target.checked)}
                  />
                  <label htmlFor="barbecue">Incluir churrasqueira</label>
                </div>
                <button
                  type="submit"
                  className="flex items-start justify-center w-fit rounded-sm bg-secondary-600 text-neutral-100 gap-1 py-2 px-4 mx-auto mt-4"
                >
                  <FaRegCalendarCheck size={20} />
                  Reservar
                </button>
              </form>
            )}
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
