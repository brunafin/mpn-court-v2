import {
  BsArrowCounterclockwise,
  BsPersonCheck,
  BsQuestionCircle,
  BsWhatsapp,
} from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router";
import { ReservationStatusEnum } from "../enum";
import {
  MdNotInterested,
  MdOutlineAccessTime,
  MdOutlineArrowBackIos,
  MdOutlineLockClock,
  MdOutlineLockOpen,
} from "react-icons/md";
import { FaRegCalendarCheck } from "react-icons/fa";
import { IReservationDetailsItemProps } from "../interface";
import { useEffect, useState } from "react";
import Input from "../../../components/Input";
import { getScheduleById } from "../../../api/schedules";
import { formatCurrencyBRL } from "../../../utils/formatCurrency";
import Header from "../../../components/Header";

function getReservationIcon(status?: ReservationStatusEnum | null) {
  if (!status) return <BsQuestionCircle size={18} />;
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return <MdOutlineLockClock className="mt-1" size={18} />;
    case ReservationStatusEnum.INACTIVE:
      return <MdNotInterested className="mt-1" size={18} />;
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return <FaRegCalendarCheck className="mt-1" size={18} />;
    case ReservationStatusEnum.AVAILABLE:
      return <MdOutlineAccessTime className="mt-1" size={18} />;
    default:
      return <BsQuestionCircle className="mt-1" size={18} />;
  }
}

function getColorByStatus(status?: ReservationStatusEnum | null) {
  if (!status) return "bg-gray-400";
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return "bg-neutral-600";
    case ReservationStatusEnum.INACTIVE:
      return "bg-danger-400";
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return "bg-secondary-600";
    case ReservationStatusEnum.AVAILABLE:
      return "bg-tertiary-700";
    default:
      return "bg-gray-400";
  }
}

const renderButtonByStatus = (status?: ReservationStatusEnum | null) => {
  if (!status) return null;
  switch (status) {
    case ReservationStatusEnum.FIXED:
    case ReservationStatusEnum.INACTIVE:
      return (
        <button className="flex items-center justify-center w-fit rounded-sm bg-tertiary-700 text-neutral-100 gap-1 text-sm py-1 px-2">
          <MdOutlineLockOpen size={18} />
          Liberar horário
        </button>
      );
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return (
        <button className="flex items-start justify-center w-fit rounded-sm bg-neutral-700 text-neutral-100 gap-1 text-sm py-1 px-2">
          <MdOutlineLockClock size={18} />
          Fixar horário
        </button>
      );
    case ReservationStatusEnum.AVAILABLE:
      return (
        <button className="flex items-center justify-center w-fit rounded-sm bg-danger-400 text-neutral-100 gap-1 text-xs py-1 px-2">
          <MdNotInterested size={18} />
          Inativar horário
        </button>
      );
    default:
      return null;
  }
};

function ReservationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customerReservationName, setCustomerReservationName] = useState<
    string | null
  >(null);
  const [customerReservationEmail, setCustomerReservationEmail] = useState<
    string | null
  >(null);
  const [customerReservationPhone, setCustomerReservationPhone] = useState<
    string | null
  >(null);
  const [isResrvationFixed, setIsReservationFixed] = useState(false);
  const [isReservationPrepaid, setIsReservationPrepaid] = useState(false);
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

  return (
    <div className="h-screen">
      <Header />
      <section
        className="bg-neutral-700"
        style={{ height: "calc(100vh - 4rem)" }}
      >
        <header className="flex flex-col">
          <div
            className={`flex w-full justify-around md:justify-between ${getColorByStatus(
              court?.status
            )} py-4`}
          >
            <button onClick={() => navigate(-1)}>
              <MdOutlineArrowBackIos size={24} />
            </button>
            <div className="flex align-center md:w-3/5 gap-2">
              {getReservationIcon(court?.status)}
              <p className="mt-1">
                {court?.date} - {court?.time}
              </p>
              {renderButtonByStatus(court?.status)}
            </div>
          </div>
          {court?.reservation?.contactPhone && (
            <div className="bg-neutral-800">
              <a
                href={`${import.meta.env.VITE_WHATSAPP_URL_BASE}${
                  court?.reservation.contactPhone
                }`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-2 p-2 justify-center"
              >
                {court?.reservation.contactName}
                <BsWhatsapp size={20} />
              </a>
            </div>
          )}
        </header>
        <h2 className="flex justify-center text-lg md:text-xl py-4">
          {court?.court} -{" "}
          {court?.price && formatCurrencyBRL(parseFloat(court?.price))}
        </h2>
        {court?.status === ReservationStatusEnum.PREPAID && (
          <div className="bg-warning-500 text-neutral-700 mx-4 rounded-md p-2 flex flex-col justify-center items-center">
            <BsPersonCheck size={24} />
            <p className="text-center my-2">
              Pagou {formatCurrencyBRL(parseFloat(court.price) / 2)} do valor
              via pix no dia {court?.reservation?.createdAt}
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
          <button className="flex items-start justify-center w-fit rounded-sm bg-danger-400 text-neutral-100 gap-1 py-2 px-4 mx-auto mt-4">
            <BsArrowCounterclockwise size={20} />
            Cancelar reserva
          </button>
        )}
        {court?.status === ReservationStatusEnum.AVAILABLE && (
          <form className="bg-neutral-800 px-4 py-8 rounded-md mx-4 md:w-1/2 md:mx-auto">
            <Input
              name="name"
              title="Nome:"
              placeholder="Nome do cliente"
              type="text"
              value={customerReservationName ?? ""}
              onChange={(e) => setCustomerReservationName(e.target.value)}
              required
              mode="dark"
            />
            <Input
              name="email"
              title="Email:"
              placeholder="Email do cliente"
              type="email"
              value={customerReservationEmail ?? ""}
              onChange={(e) => setCustomerReservationEmail(e.target.value)}
              required
              mode="dark"
            />
            <Input
              name="phone"
              title="Telefone:"
              placeholder="Telefone do cliente"
              type="text"
              value={customerReservationPhone ?? ""}
              onChange={(e) => setCustomerReservationPhone(e.target.value)}
              required
              mode="dark"
            />
            <div className="flex flex-col gap-4 mt-4">
              <label className="flex gap-1" htmlFor="prepaid">
                <input
                  id="prepaid"
                  type="checkbox"
                  checked={isReservationPrepaid}
                  onChange={(e) => setIsReservationPrepaid(e.target.checked)}
                />
                Pagamento 50% antecipado
              </label>
              <label className="flex gap-1" htmlFor="fixed">
                <input
                  id="fixed"
                  type="checkbox"
                  checked={isResrvationFixed}
                  onChange={(e) => setIsReservationFixed(e.target.checked)}
                />
                Horário fixo
              </label>
            </div>
            <button className="flex items-start justify-center w-fit rounded-sm bg-secondary-600 text-neutral-100 gap-1 py-2 px-4 mx-auto mt-4">
              <FaRegCalendarCheck size={20} />
              Reservar
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
export default ReservationDetails;
