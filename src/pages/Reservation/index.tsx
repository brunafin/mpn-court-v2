import { useCallback, useEffect, useState } from "react";
import ReservationItem from "./ReservationItem";
import { ReservationStatusEnum } from "./enum";
import LegendAndFilters from "./Legend";
import { IReservationItemProps } from "./interface";
import { HiOutlineCog, HiX } from "react-icons/hi";
import { getSchedulesByCompanyPublicIdAndDate } from "../../api/schedules";
import Header from "../../components/Header";
import Cookies from "js-cookie";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Loader from "../../components/Loader";
import { useLoading } from "../../hooks/useLoading";
import { formatDate, isToday } from "date-fns";
import Daypicker from "../../components/Daypicker";
import { MdOutlinePostAdd } from "react-icons/md";
import NewReminderModal from "../../components/NewNote";
import { useNotification } from "../../contexts/NotificationContext";
import { createNote } from "../../api/notes";

const getBorderColorByStatusSelected = (
  status: ReservationStatusEnum | null
): string => {
  if (!status) return "border-1 border-neutral-800";
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return "border-2 bg-neutral-900 border-purple-800";
    case ReservationStatusEnum.INACTIVE:
      return "border-2 bg-neutral-900 border-danger-400";
    case ReservationStatusEnum.RESERVED:
      return "border-2 bg-neutral-900 border-secondary-600";
    case ReservationStatusEnum.PREPAID:
      return "border-2 bg-neutral-900 border-warning-500";
    case ReservationStatusEnum.AVAILABLE:
      return "border-2 bg-neutral-900 border-tertiary-700";
    default:
      return "border-2 bg-neutral-900 border-gray-400";
  }
};

function Reservation() {
  const { loading, withLoading } = useLoading();
  const { unreadCount, setUnreadCount } = useNotification();

  const [showNewReminderModal, setShowNewReminderModal] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [is24before, setIs24before] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dateFrom = location.state?.date;

  const [date, setDate] = useState<Date>(
    dateFrom
      ? new Date(
        Number.isNaN(Date.parse(dateFrom))
          ? new Date().setHours(0, 0, 0, 0)
          : new Date(dateFrom + "T00:00:00").setHours(0, 0, 0, 0)
      )
      : new Date(new Date().setHours(0, 0, 0, 0))
  );
  const [statusSelected, setStatusSelected] =
    useState<ReservationStatusEnum | null>(null);
  const [courtSelected, setCourtSelected] = useState<string>("all");
  const [isOpenFilters, setIsOpenFilters] = useState(false);
  const [list, setList] = useState<IReservationItemProps[]>([]);
  const [courtsNameList, setCourtsNameList] = useState<string[]>([]);
  const [companyPublicId, setCompanyPublicId] = useState<string>("");

  useEffect(() => {
    const token = Cookies.get("access_token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const getCompanyPublicIdFromToken = () => {
      const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
      if (!match) return "";
      try {
        const token = match[1];
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.companyPublicId || "";
      } catch {
        return "";
      }
    };
    const id = getCompanyPublicIdFromToken();
    setCompanyPublicId(id);
  }, []);

  useEffect(() => {
    if (!companyPublicId || !date) return;
    fetchData(date?.toISOString().split("T")[0]);
  }, [companyPublicId, date]);

  const fetchData = useCallback(
    async (dateInput: string) => {
      if (!companyPublicId) {
        return;
      }
      try {
        await withLoading(async () => {
          const response = await getSchedulesByCompanyPublicIdAndDate({
            companyPublicId,
            date: dateInput,
          });
          setList(response);
          const uniqueCourts = [...new Set(response.map((item) => item.court))];
          setCourtsNameList(uniqueCourts);
        });
      } catch (error: any) {
        if (error?.response?.status === 401) {
          alert("Sessão expirada. Faça login novamente.");
          Cookies.remove("access_token");
          navigate("/");
        } else {
          console.error(error);
        }
      }
    },
    [date, companyPublicId]
  );

  const handleCreateNote = async (event?: React.FormEvent): Promise<void> => {
    event?.preventDefault?.();
    await withLoading(async () => {
      await createNote({
        companyPublicId: companyPublicId || '',
        date: date.toISOString().split('T')[0],
        message,
        is24HoursBefore: is24before,
      });
      setShowNewReminderModal(false);
      setMessage('');
      setIs24before(false);
      if (date.toDateString() === new Date().toDateString()) {
        setUnreadCount(unreadCount + 1);
      }
    });
  };

  const getResultHeaderTitleList = (): string => {
    if (!date) return "sem data";
    const dateFormatted = formatDate(date, "dd/MM/yyyy");
    const isTodayComparing = isToday(new Date(date));

    switch (statusSelected) {
      case ReservationStatusEnum.AVAILABLE:
        return `Exibindos somente os horários disponíveis do dia ${isTodayComparing ? "hoje" : dateFormatted
          }.`;
      case ReservationStatusEnum.RESERVED:
        return `Exibindos somente os horários reservados do dia ${isTodayComparing ? "hoje" : dateFormatted
          }.`;
      case ReservationStatusEnum.FIXED:
        return `Exibindos somente os horários fixos do dia ${isTodayComparing ? "hoje" : dateFormatted
          }.`;
      case ReservationStatusEnum.INACTIVE:
        return `Exibindos somente os horários inativos do dia ${isTodayComparing ? "hoje" : dateFormatted
          }.`;
      default:
        return `Exibindo todos os horários do dia ${isTodayComparing ? "hoje" : dateFormatted
          }.`;
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <Header />
      <section className="bg-neutral-800 h-[calc(100vh-64px)] w-full flex flex-col">
        <div className="bg-neutral-800 flex items-center justify-around md:justify-center py-2 mb-4 mt-2 mx-2 rounded-sm">
          <Daypicker
            selectedDate={date}
            setSelectedDate={setDate}
          />
          <button
            className={`text-neutral-200 underline py-2 px-2 flex justify-center items-center rounded-sm  mx-2 z-11 ${getBorderColorByStatusSelected(
              statusSelected
            )} ${isOpenFilters ? "bg-neutral-900 border-1 border-neutral-900" : ""
              }`}
            onClick={() => setIsOpenFilters(!isOpenFilters)}
          >
            {isOpenFilters ? (
              <>
                <HiX /> Fechar
              </>
            ) : (
              <>Filtrar</>
            )}
          </button>
        </div>
        <LegendAndFilters
          statusSelected={statusSelected}
          setStatusSelected={setStatusSelected}
          courtSelected={courtSelected}
          setCourtSelected={setCourtSelected}
          courts={courtsNameList}
          isOpen={isOpenFilters}
          setIsOpenFilters={setIsOpenFilters}
        />
        {list
          .filter((elementDate) => {
            if (!date) return elementDate;
            const formattedDate = new Date(
              date.getTime() + date.getTimezoneOffset() * 60000
            )
              .toISOString()
              .split("T")[0];
            return elementDate.date === formattedDate;
          })
          .filter((elementStatus) => {
            if (!statusSelected) return elementStatus;
            if (statusSelected === ReservationStatusEnum.RESERVED) {
              return (
                elementStatus.status === ReservationStatusEnum.RESERVED ||
                elementStatus.status === ReservationStatusEnum.PREPAID
              );
            } else {
              return elementStatus.status === statusSelected;
            }
          })
          .filter((elementCourt) => {
            if (!courtSelected) return elementCourt;
            if (courtSelected === "all") {
              return elementCourt;
            } else {
              return elementCourt.court === courtSelected;
            }
          }).length > 0 ? (
          <>
            <div className="bg-neutral-900 py-4 px-2 flex items-start gap-4 justify-center">
              <h3 className="text-center">
                {getResultHeaderTitleList()}
              </h3>
              <div className="flex gap-2 items-center">
                <Link
                  to={`/configuracoes-horarios`}
                  state={{ date: date }}
                >
                  <HiOutlineCog
                    size={24}
                    className="text-neutral-200 cursor-pointer"
                  />
                </Link>
                <button
                  onClick={() => setShowNewReminderModal(true)}
                  className="text-neutral-200 cursor-pointer"
                >
                  <MdOutlinePostAdd
                    size={24}
                    className="text-neutral-200 cursor-pointer"
                  />
                </button>
              </div>
            </div>
            <ul className="flex flex-col gap-3 overflow-y-auto bg-neutral-900 py-4 w-full md:mx-auto md:bg-neutral-900 md:py-4 md:px-8 md:rounded-lg h-full">
              {list
                .filter((elementDate) => {
                  if (!date) return elementDate;
                  const formattedDate = new Date(
                    date.getTime() + date.getTimezoneOffset() * 60000
                  )
                    .toISOString()
                    .split("T")[0];
                  return elementDate.date === formattedDate;
                })
                .filter((elementStatus) => {
                  if (!statusSelected) return elementStatus;
                  if (statusSelected === ReservationStatusEnum.RESERVED) {
                    return (
                      elementStatus.status === ReservationStatusEnum.RESERVED ||
                      elementStatus.status === ReservationStatusEnum.PREPAID
                    );
                  } else {
                    return elementStatus.status === statusSelected;
                  }
                })
                .filter((elementCourt) => {
                  if (!courtSelected) return elementCourt;
                  if (courtSelected === "all") {
                    return elementCourt;
                  } else {
                    return elementCourt.court === courtSelected;
                  }
                })
                .map((item) => (
                  <ReservationItem
                    scheduleId={item.scheduleId}
                    court={item.court}
                    customerName={item.customerName}
                    date={item.date}
                    status={item.status}
                    time={item.time}
                    isBarbecueIncluded={item.isBarbecueIncluded}
                    isEvent={item.isEvent}
                    isNeedsNetting={item.isNeedsNetting}
                    key={item.scheduleId}
                  />
                ))}
            </ul>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center m-16">
            <p className="text-center mb-4">
              Nenhum horário encontrado
              {statusSelected && " para o filtro selecionado"}.
            </p>
            <Link
              to={`/configuracoes-horarios`}
              state={{ date: date }}
              className="flex items-end underline gap-2"
            >
              <HiOutlineCog size={24} />
              Detalhes do dia
            </Link>
          </div>
        )}
        <NewReminderModal
          isOpen={showNewReminderModal}
          onClose={() => setShowNewReminderModal(false)}
          handleSubmit={handleCreateNote}
          date={date.toLocaleString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
          message={message}
          setMessage={setMessage}
          is24HoursBefore={is24before}
          setIs24HoursBefore={setIs24before}
        />
      </section>
    </>
  );
}
export default Reservation;
