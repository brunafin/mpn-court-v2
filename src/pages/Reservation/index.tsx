import { useState } from "react";
import {
  BsArrowRepeat,
  BsChevronLeft,
  BsChevronRight,
  BsList,
} from "react-icons/bs";
import ReservationItem from "./ReservationItem";
import { ReservationStatusEnum } from "./enum";
import Legend from "./Legend";
import { IReservationItemProps } from "./interface";
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";

const mock: IReservationItemProps[] = [
  {
    id: 1,
    status: ReservationStatusEnum.FIXED,
    date: "2025-04-21",
    court: "A",
    time: "21:00",
    price: 120,
    customer: {
      name: "Bruna Nunes",
      email: "bruna.nunes@example.com",
      phone: "123-456-7890",
    },
  },
  {
    id: 2,
    status: ReservationStatusEnum.INACTIVE,
    date: "2025-04-22",
    court: "B",
    time: "20:00",
    price: 50,
    customer: {
      name: "",
      email: "",
      phone: "",
    },
  },
  {
    id: 3,
    status: ReservationStatusEnum.RESERVED,
    date: "2025-04-21",
    court: "A",
    time: "19:00",
    price: 100,
    customer: {
      name: "Carlos Silva",
      email: "carlos.silva@example.com",
      phone: "987-654-3210",
    },
  },
  {
    id: 4,
    status: ReservationStatusEnum.PREPAID,
    date: "2025-04-21",
    court: "B",
    time: "18:00",
    price: 80,
    customer: {
      name: "Ana Souza",
      email: "ana.souza@example.com",
      phone: "456-789-1234",
    },
  },
  {
    id: 5,
    status: ReservationStatusEnum.AVAILABLE,
    date: "2025-04-21",
    court: "A",
    time: "17:00",
    price: 60,
    customer: {
      name: "",
      email: "",
      phone: "",
    },
  },
  {
    id: 6,
    status: ReservationStatusEnum.FIXED,
    date: "2025-04-20",
    court: "A",
    time: "18:00",
    price: 120,
    customer: {
      name: "Bruna Nunes",
      email: "bruna.nunes@example.com",
      phone: "123-456-7890",
    },
  },
  {
    id: 7,
    status: ReservationStatusEnum.INACTIVE,
    date: "2025-04-21",
    court: "B",
    time: "08:00",
    price: 50,
    customer: {
      name: "",
      email: "",
      phone: "",
    },
  },
  {
    id: 8,
    status: ReservationStatusEnum.RESERVED,
    date: "2025-04-21",
    court: "A",
    time: "10:00",
    price: 100,
    customer: {
      name: "Carlos Silva",
      email: "carlos.silva@example.com",
      phone: "987-654-3210",
    },
  },
  {
    id: 9,
    status: ReservationStatusEnum.PREPAID,
    date: "2025-04-21",
    court: "B",
    time: "12:00",
    price: 80,
    customer: {
      name: "Ana Souza",
      email: "ana.souza@example.com",
      phone: "456-789-1234",
    },
  },
  {
    id: 10,
    status: ReservationStatusEnum.AVAILABLE,
    date: "2025-04-21",
    court: "A",
    time: "16:00",
    price: 60,
    customer: {
      name: "",
      email: "",
      phone: "",
    },
  },
  {
    id: 11,
    status: ReservationStatusEnum.AVAILABLE,
    date: "2025-04-22",
    court: "A",
    time: "09:00",
    price: 60,
    customer: {
      name: "",
      email: "",
      phone: "",
    },
  },
  {
    id: 12,
    status: ReservationStatusEnum.RESERVED,
    date: "2025-04-22",
    court: "B",
    time: "10:00",
    price: 100,
    customer: {
      name: "João Pereira",
      email: "joao.pereira@example.com",
      phone: "321-654-9870",
    },
  },
  {
    id: 13,
    status: ReservationStatusEnum.PREPAID,
    date: "2025-04-22",
    court: "A",
    time: "11:00",
    price: 80,
    customer: {
      name: "Mariana Lima",
      email: "mariana.lima@example.com",
      phone: "654-321-0987",
    },
  },
  {
    id: 14,
    status: ReservationStatusEnum.FIXED,
    date: "2025-04-22",
    court: "B",
    time: "12:00",
    price: 120,
    customer: {
      name: "Pedro Alves",
      email: "pedro.alves@example.com",
      phone: "789-012-3456",
    },
  },
  {
    id: 15,
    status: ReservationStatusEnum.INACTIVE,
    date: "2025-04-22",
    court: "A",
    time: "13:00",
    price: 50,
    customer: {
      name: "",
      email: "",
      phone: "",
    },
  },
  {
    id: 16,
    status: ReservationStatusEnum.AVAILABLE,
    date: "2025-04-22",
    court: "B",
    time: "14:00",
    price: 60,
    customer: {
      name: "",
      email: "",
      phone: "",
    },
  },
  {
    id: 17,
    status: ReservationStatusEnum.RESERVED,
    date: "2025-04-22",
    court: "A",
    time: "15:00",
    price: 100,
    customer: {
      name: "Lucas Mendes",
      email: "lucas.mendes@example.com",
      phone: "123-789-4560",
    },
  },
  {
    id: 18,
    status: ReservationStatusEnum.PREPAID,
    date: "2025-04-22",
    court: "B",
    time: "16:00",
    price: 80,
    customer: {
      name: "Fernanda Costa",
      email: "fernanda.costa@example.com",
      phone: "987-123-6540",
    },
  },
  {
    id: 19,
    status: ReservationStatusEnum.FIXED,
    date: "2025-04-22",
    court: "A",
    time: "17:00",
    price: 120,
    customer: {
      name: "Rafael Oliveira",
      email: "rafael.oliveira@example.com",
      phone: "456-789-0123",
    },
  },
  {
    id: 20,
    status: ReservationStatusEnum.INACTIVE,
    date: "2025-04-22",
    court: "B",
    time: "18:00",
    price: 50,
    customer: {
      name: "",
      email: "",
      phone: "",
    },
  },
];

function Reservation() {
  const [date, setDate] = useState<Date>(new Date());
  const [statusSelected, setStatusSelected] =
    useState<ReservationStatusEnum | null>(null);
  const [courtSelected, setCourtSelected] = useState<string | null>("all");
  const [isOpenFilters, setIsOpenFilters] = useState(false);

  function handleSubtractOneDay(date: Date): void {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 1);
    setDate(newDate);
  }

  function handleAddOneDay(date: Date): void {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    setDate(newDate);
  }
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
          NENA Sports
        </h1>
        <BsList className="text-neutral-800 cursor-pointer" size={24} />
      </header>
      <section className="bg-neutral-800 h-[calc(100vh-136px)] md:h-[calc(100vh-64px)] w-full flex flex-col">
        <div className="flex items-center justify-center h-16">
          <div className="flex items-center gap-2 justify-center p-4">
            <button onClick={() => handleSubtractOneDay(date)}>
              <BsChevronLeft size={24} cursor="pointer" />
            </button>
            <p>{date.toLocaleDateString("pt-BR")}</p>
            <button onClick={() => handleAddOneDay(date)}>
              <BsChevronRight size={24} cursor="pointer" />
            </button>
          </div>
          <button
            className="hidden md:flex"
            onClick={() => alert("atualizar a lista")}
          >
            <BsArrowRepeat size={24} />
          </button>
          <button
            className="md:hidden text-neutral-200 hover:text-neutral-100 bg-neutral-900 flex justify-end items-center underline gap-2"
            onClick={() => setIsOpenFilters(!isOpenFilters)}
          >
            <HiOutlineAdjustmentsHorizontal />
            Filtrar
          </button>
        </div>
        <Legend
          statusSelected={statusSelected}
          setStatusSelected={setStatusSelected}
          isOpen={isOpenFilters}
        />
        <div
          className={`flex flex-col md:items-center gap-4 py-4 px-2 bg-neutral-900 ${
            isOpenFilters ? "flex" : "hidden md:flex"
          }`}
        >
          <p>Selecione a quadra para filtrar:</p>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-neutral-100">
              <input
                type="radio"
                name="court"
                value="all"
                className="accent-primary-500"
                onChange={() => setCourtSelected("all")}
                checked={courtSelected === "all"}
              />
              Todas
            </label>
            <label className="flex items-center gap-2 text-neutral-100">
              <input
                type="radio"
                name="court"
                value="A"
                className="accent-primary-500"
                onChange={() => setCourtSelected("A")}
                checked={courtSelected === "A"}
              />
              Quadra A
            </label>
            <label className="flex items-center gap-2 text-neutral-100">
              <input
                type="radio"
                name="court"
                value="B"
                className="accent-primary-500"
                onChange={() => setCourtSelected("B")}
                checked={courtSelected === "B"}
              />
              Quadra B
            </label>
          </div>
        </div>
        <ul className="flex flex-col gap-4 overflow-y-auto bg-neutral-800">
          {mock
            .filter((elementDate) => {
              if (!date) return elementDate;
              const formattedDate = date.toISOString().split("T")[0];
              return elementDate.date === formattedDate;
            })
            .filter((elementStatus) => {
              if (!statusSelected) return elementStatus;
              if (statusSelected === ReservationStatusEnum.RESERVED) {
                return (
                  elementStatus.status === ReservationStatusEnum.RESERVED ||
                  elementStatus.status === ReservationStatusEnum.PREPAID
                );
              }
              return elementStatus.status === statusSelected;
            })
            .filter((elementCourt) => {
              if (!courtSelected) return elementCourt;
              if (courtSelected === "all") return elementCourt;
              return elementCourt.court === courtSelected;
            })
            .map((item) => (
              <ReservationItem
                id={item.id}
                court={item.court}
                customer={item.customer}
                price={item.price}
                date={item.date}
                status={item.status}
                time={item.time}
                key={`${item.date}-${item.court}-${item.time}`}
              />
            ))}
        </ul>
      </section>
    </>
  );
}
export default Reservation;
