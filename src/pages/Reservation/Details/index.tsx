import { BsArrowCounterclockwise, BsPersonCheck } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router";
import { ReservationStatusEnum } from "../enum";
import { MdOutlineArrowBackIos } from "react-icons/md";
import { FaRegCalendarCheck } from "react-icons/fa";
import { IReservationDetailsItemProps } from "../interface";
import { useEffect, useState } from "react";
import Input from "../../../components/Input";
import {
  cancelReservation,
  createReservation,
  getScheduleById,
} from "../../../api/schedules";
import { formatCurrencyBRL } from "../../../utils/formatCurrency";
import Header from "../../../components/Header";
import { getMeanByStatus, renderButtonByStatus } from "./utils";

function ReservationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customerReservationName, setCustomerReservationName] = useState<
    string | null
  >(null);
  const [customerReservationPhone, setCustomerReservationPhone] = useState<
    string | null
  >(null);
  const [court, setCourt] = useState<IReservationDetailsItemProps | null>(null);

  const fetchData = async (id: string) => {
    const response = await getScheduleById(id);
    setCourt(response);
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
    });
    if (response) {
      navigate("/reservas");
    }
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
                <button onClick={() => navigate(-1)}>
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
                <div className="flex justify-start md:justify-center">
                  {renderButtonByStatus(
                    court.scheduleId,
                    court?.status,
                    navigate
                  )}
                </div>
              )}
            </header>
            <h2 className="flex justify-center text-lg md:text-xl py-4">
              {court?.court} -{" "}
              {court?.price && formatCurrencyBRL(parseFloat(court?.price))}
            </h2>
            {court?.status === ReservationStatusEnum.PREPAID && (
              <div className="bg-warning-500 text-neutral-700 mx-4 rounded-md p-2 flex flex-col justify-center items-center md:w-1/2 md:mx-auto">
                <BsPersonCheck size={24} />
                <p className="text-center my-2">
                  Pagou {formatCurrencyBRL(parseFloat(court.price) / 2)} do
                  valor via pix no dia {court?.reservation?.createdAt}
                </p>
                <p>Valor restante a pagar:</p>
                <p className="text-lg md:text-xl font-bold">
                  {formatCurrencyBRL(parseFloat(court.price) / 2)}
                </p>
              </div>
            )}
            {(court?.status === ReservationStatusEnum.RESERVED ||
              court?.status === ReservationStatusEnum.FIXED) && (
              <div className="mx-4 p-2 flex flex-col justify-center items-center">
                <p>Valor total a pagar:</p>
                <p>{formatCurrencyBRL(parseFloat(court.price))}</p>
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
                  navigate("/reservas");
                }}
                className="flex items-start justify-center w-fit rounded-sm bg-danger-400 text-neutral-100 gap-1 py-2 px-4 mx-auto mt-4"
              >
                <BsArrowCounterclockwise size={20} />
                Cancelar reserva
              </button>
            )}
            {court?.status === ReservationStatusEnum.AVAILABLE && (
              <form
                className="bg-neutral-800 px-4 py-8 rounded-md mx-4 mb-4 md:w-1/2 md:mx-auto"
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
                  type="text"
                  value={customerReservationPhone ?? ""}
                  onChange={(e) => setCustomerReservationPhone(e.target.value)}
                  required
                  mode="dark"
                />
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
