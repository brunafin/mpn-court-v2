import { useCallback, useEffect, useState } from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import ReservationItem from "./ReservationItem";
import { ReservationStatusEnum } from "./enum";
import LegendAndFilters from "./Legend";
import { IReservationItemProps } from "./interface";
import CustomDatepicker from "../../components/Datepicker";
import { HiX } from "react-icons/hi";
import { getSchedulesByCompanyPublicIdAndDate } from "../../api/schedules";
import Header from "../../components/Header";
import Cookies from "js-cookie";
import { useLocation, useNavigate } from "react-router-dom";
import Loader from "../../components/Loader";
import { useLoading } from "../../hooks/useLoading";
import { formatDate, isToday } from "date-fns";

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
  const navigate = useNavigate();
  const location = useLocation();
  const dateFrom = location.state?.date;

  const [date, setDate] = useState<Date | null>(
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
        withLoading(async () => {
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

  function handleSubtractOneDay(date: Date | null): void {
    setIsOpenFilters(false);
    if (!date) return;
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 1);
    setDate(newDate);
    fetchData(newDate.toISOString().split("T")[0]);
  }

  function handleAddOneDay(date: Date | null): void {
    setIsOpenFilters(false);
    if (!date) return;
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    setDate(newDate);
    fetchData(newDate.toISOString().split("T")[0]);
  }

  const getResultHeaderTitleList = (): string => {
    if (!date) return "sem data";
    const dateFormatted = formatDate(date, "dd/MM/yyyy");
    const isTodayComparing = isToday(new Date(date));
    switch (statusSelected) {
      case ReservationStatusEnum.AVAILABLE:
        return `Exibindos somente os horários disponíveis do dia ${
          isTodayComparing ? "hoje" : dateFormatted
        }.`;
      case ReservationStatusEnum.RESERVED:
        return `Exibindos somente os horários reservados do dia ${
          isTodayComparing ? "hoje" : dateFormatted
        }.`;
      case ReservationStatusEnum.FIXED:
        return `Exibindos somente os horários fixos do dia ${
          isTodayComparing ? "hoje" : dateFormatted
        }.`;
      case ReservationStatusEnum.INACTIVE:
        return `Exibindos somente os horários inativos do dia ${
          isTodayComparing ? "hoje" : dateFormatted
        }.`;
      default:
        return `Exibindo todos os horários do dia ${
          isTodayComparing ? "hoje" : dateFormatted
        }.`;
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <Header />
      <section className="bg-neutral-800 h-[calc(100vh-64px)] w-full flex flex-col">
        <div className="bg-neutral-800 flex items-center justify-around md:justify-center py-2 mb-4 mt-2 mx-2 rounded-sm">
          <div className="flex items-center gap-1 justify-center px-2">
            <button onClick={() => handleSubtractOneDay(date)}>
              <BsChevronLeft size={24} cursor="pointer" />
            </button>
            <CustomDatepicker
              dateSelected={date}
              onChange={(event) => {
                setDate(event);
                fetchData(event?.toISOString().split("T")[0] || "");
              }}
              onFocus={() => setIsOpenFilters(false)}
            />
            <button onClick={() => handleAddOneDay(date)}>
              <BsChevronRight size={24} cursor="pointer" />
            </button>
          </div>
          {/* <button
            onClick={() => fetchData(date?.toISOString().split("T")[0] || "")}
          >
            <BsArrowRepeat size={24} />
          </button> */}
          <button
            className={`text-neutral-200 underline py-2 px-2 flex justify-center items-center rounded-sm  mx-2 z-11 ${getBorderColorByStatusSelected(
              statusSelected
            )} ${
              isOpenFilters ? "bg-neutral-900 border-1 border-neutral-900" : ""
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
            <h3 className="bg-neutral-900 py-4 text-center">
              {getResultHeaderTitleList()}
            </h3>
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
                    isNeedsNetting={item.isNeedsNetting}
                    key={item.scheduleId}
                  />
                ))}
            </ul>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center m-16">
            <p>
              Nenhum horário encontrado{""}
              {statusSelected && "para o filtro selecionado"}.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
export default Reservation;
