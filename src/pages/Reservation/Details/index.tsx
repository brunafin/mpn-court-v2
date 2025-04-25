import {
  BsArrowCounterclockwise,
  BsList,
  BsPersonCheck,
  BsPersonX,
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
import { useState } from "react";
import Input from "../../../components/Input";

function getReservationIcon(status?: ReservationStatusEnum | null) {
  if (!status) return <BsQuestionCircle size={18} />;
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return <MdOutlineLockClock size={18} />;
    case ReservationStatusEnum.INACTIVE:
      return <MdNotInterested size={18} />;
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return <FaRegCalendarCheck size={18} />;
    case ReservationStatusEnum.AVAILABLE:
      return <MdOutlineAccessTime size={18} />;
    default:
      return <BsQuestionCircle size={18} />;
  }
}

function getColorByStatus(status?: ReservationStatusEnum | null) {
  if (!status) return "bg-gray-400";
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return "bg-neutral-700";
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
        <div className="w-full flex justify-end">
          <button className="flex items-center justify-center w-fit rounded-sm bg-tertiary-700 text-neutral-100 gap-2 text-sm py-1 px-2">
            <MdOutlineLockOpen size={18} />
            Liberar horário
          </button>
        </div>
      );
    case ReservationStatusEnum.RESERVED:
    case ReservationStatusEnum.PREPAID:
      return (
        <div className="w-full flex justify-end">
          <button className="flex items-center justify-center w-fit rounded-sm bg-neutral-700 text-neutral-100 gap-2 text-sm py-1 px-2">
            <MdOutlineLockClock size={18} />
            Fixar horário
          </button>
        </div>
      );
    case ReservationStatusEnum.AVAILABLE:
      return (
        <div className="w-full flex justify-end items-start">
          <button className="flex items-center justify-center w-fit rounded-sm bg-danger-400 text-neutral-100 gap-2 text-xs py-1 px-2">
            <MdNotInterested size={18} />
            Inativar horário
          </button>
        </div>
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
  const [court] = useState<IReservationDetailsItemProps | null>({
    id: 1,
    status: ReservationStatusEnum.AVAILABLE,
    date: "2025-04-21",
    reservationDate: "2025-04-20",
    court: "A",
    time: "21:00",
    price: 120,
    customer: {
      name: "Bruna",
      email: "bruna.nunes@example.com",
      phone: "51999365380",
    },
  });
  return (
    <>
      <header className="bg-neutral-200 h-16 flex items-center justify-between px-4 sticky top-0 z-10">
        <a href="/">
          <img
            src={import.meta.env.VITE_LOGO_URL_HEADER}
            title="logo"
            alt="logo"
            className="h-16 py-2"
          />
        </a>
        <h1 className="font-bold text-center text-base text-neutral-800">
          NENA Sports {id}
        </h1>
        <BsList className="text-neutral-800 cursor-pointer" size={24} />
      </header>
      <section>
        <header
          className={`flex w-full px-2 py-4 h-16 items-center justify-between md:justify-center md:gap-8 md:text-lg ${getColorByStatus(
            court?.status
          )}`}
        >
          <button
            onClick={() => navigate(-1)}
            className="w-1/4 flex items-center justify-center shadow-none text-neutral-100"
          >
            <MdOutlineArrowBackIos size={24} />
          </button>
          <div className="w-3/4 flex items-center md:items-center gap-2">
            {getReservationIcon(court?.status)}
            <p className="text-neutral-100 font-bold">12/12/2023 - 18:00</p>
          </div>
        </header>
      </section>
      <section className="bg-neutral-800 min-h-[calc(100vh-200px)] md:h-[calc(100vh-64px)] w-full flex flex-col items-center">
        <div className="w-full flex justify-between p-2 px-4">
          <a
            href={`${import.meta.env.VITE_WHATSAPP_URL_BASE}${
              court?.customer.phone
            }`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start md:items-center gap-2 text-neutral-100"
          >
            {court?.customer.name}
            <BsWhatsapp size={20} />
          </a>
          {renderButtonByStatus(court?.status)}
        </div>
        <section className="flex justify-center items-center">
          <h2 className="text-xl mt-4">
            Quadra {court?.court} -{" "}
            {court?.price.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </h2>
        </section>
        {court?.status === ReservationStatusEnum.PREPAID && (
          <section className="w-full flex flex-col justify-center items-center mt-4">
            <div className="flex justify-center gap-2 bg-warning-500 text-neutral-800 p-4 w-full shadow-md">
              <p className="flex w-full justify-center items-start text-center gap-2">
                <BsPersonCheck size={20} />
                Pagou{" "}
                {court?.price &&
                  (court.price / 2).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}{" "}
                do valor via pix no dia{" "}
                {court?.reservationDate
                  ? new Date(
                      court.reservationDate + "T00:00:00"
                    ).toLocaleDateString("pt-BR")
                  : "N/A"}
              </p>
            </div>
            <div className="mt-8">
              <p className="text-xl">Valor restante a pagar:</p>
              <p className="text-xl text-center">
                {court?.price &&
                  (court.price / 2).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}{" "}
              </p>
            </div>
          </section>
        )}
        {(court?.status === ReservationStatusEnum.RESERVED ||
          court?.status === ReservationStatusEnum.FIXED) && (
          <section className="flex flex-col justify-center items-center mt-4">
            <div className="flex items-center justify-center gap-2 text-neutral-100 p-4 w-full">
              <BsPersonX size={20} />
              <p className="text-center font-medium">
                Nenhum valor foi pago com antecedência.
              </p>
            </div>
            <div className="mt-8">
              <p className="text-xl">Valor total a pagar:</p>
              <p className="text-xl text-center">
                {court?.price &&
                  court.price.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}{" "}
              </p>
            </div>
          </section>
        )}
        {[
          ReservationStatusEnum.FIXED,
          ReservationStatusEnum.RESERVED,
          ReservationStatusEnum.PREPAID,
        ].includes(court?.status as ReservationStatusEnum) && (
          <div className="flex justify-center mt-4">
            <button className="flex items-center justify-center w-fit m-4 rounded-sm bg-danger-600 text-neutral-100 gap-2 py-1 px-2">
              <BsArrowCounterclockwise size={20} />
              Cancelar reserva
            </button>
          </div>
        )}
        {court?.status === ReservationStatusEnum.AVAILABLE && (
          <form className="flex flex-col justify-center items-center px-4 mt-4 w-full md:w-1/4">
            <Input
              name="name"
              title="Nome:"
              placeholder="Nome do cliente"
              type="text"
              value={customerReservationName ?? ""}
              onChange={(e) => setCustomerReservationName(e.target.value)}
              required
              mode="dark"
              className="w-full"
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
              className="w-full"
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
              className="w-full"
            />
            <div className="flex flex-col items-start w-full mt-4">
              <label className="flex items-center gap-2" htmlFor="prepaid">
                <input
                  id="prepaid"
                  type="checkbox"
                  className="form-checkbox"
                  checked={isReservationPrepaid}
                  onChange={(e) => setIsReservationPrepaid(e.target.checked)}
                />
                Pagamento 50% antecipado
              </label>
              <label className="flex items-center gap-2 mt-4" htmlFor="fixed">
                <input
                  id="fixed"
                  type="checkbox"
                  className="form-checkbox"
                  checked={isResrvationFixed}
                  onChange={(e) => setIsReservationFixed(e.target.checked)}
                />
                Horário fixo
              </label>
            </div>
            <button className="flex items-start justify-center w-full m-4 mt-8 rounded-sm bg-secondary-600 text-neutral-100 gap-2 py-3 px-2">
              <FaRegCalendarCheck size={20} />
              Reservar
            </button>
          </form>
        )}
      </section>
    </>
  );
}
export default ReservationDetails;
