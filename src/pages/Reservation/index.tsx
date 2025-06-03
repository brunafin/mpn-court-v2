import { useCallback, useEffect, useState } from "react";
import { BsArrowRepeat, BsChevronLeft, BsChevronRight } from "react-icons/bs";
import ReservationItem from "./ReservationItem";
import { ReservationStatusEnum } from "./enum";
import LegendAndFilters from "./Legend";
import { IReservationItemProps } from "./interface";
import CustomDatepicker from "../../components/Datepicker";
import { HiX } from "react-icons/hi";
import { getSchedulesByCompanyPublicIdAndDate } from "../../api/schedules";
import Header from "../../components/Header";
import { MdOutlineFilterList } from "react-icons/md";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

const getBorderColorByStatusSelected = (
  status: ReservationStatusEnum | null
): string => {
  if (!status) return "border-2 border-neutral-900";
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return "border-2 border-danger-800";
    case ReservationStatusEnum.INACTIVE:
      return "border-2 border-danger-400";
    case ReservationStatusEnum.RESERVED:
      return "border-2 border-secondary-600";
    case ReservationStatusEnum.PREPAID:
      return "border-2 border-warning-500";
    case ReservationStatusEnum.AVAILABLE:
      return "border-2 border-tertiary-700";
    default:
      return "border-2 border-gray-400";
  }
};

function Reservation() {
  const navigate = useNavigate();

  const [date, setDate] = useState<Date | null>(
    new Date(new Date().setHours(0, 0, 0, 0))
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
    fetchData(date.toISOString().split("T")[0]);
  }, [companyPublicId, date]);

  const fetchData = useCallback(
    async (dateInput: string) => {
      if (!companyPublicId) {
        return;
      }
      const response = await getSchedulesByCompanyPublicIdAndDate({
        companyPublicId,
        date: dateInput,
      });
      setList(response);
      const uniqueCourts = [...new Set(response.map((item) => item.court))];
      setCourtsNameList(uniqueCourts);
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
  return (
    <>
      <Header />
      <section className="bg-neutral-800 h-[calc(100vh-64px)] w-full flex flex-col">
        <div className="flex items-center justify-center my-2 py-2">
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
          <button
            onClick={() => fetchData(date?.toISOString().split("T")[0] || "")}
          >
            <BsArrowRepeat size={24} />
          </button>
          <button
            className={`text-neutral-200 hover:text-neutral-100 bg-neutral-900 shadow-lg py-2 px-2 flex justify-center items-center gap-1 rounded-sm ms-4 w-28 md:w-24 me-2 ${getBorderColorByStatusSelected(
              statusSelected
            )}`}
            onClick={() => setIsOpenFilters(!isOpenFilters)}
          >
            {isOpenFilters ? (
              <>
                <HiX /> Fechar
              </>
            ) : (
              <>
                <MdOutlineFilterList /> Filtrar
              </>
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
        />
        {list.length > 0 ? (
          <ul className="flex flex-col gap-4 overflow-y-auto bg-neutral-800 pb-4 md:w-3/4 md:mx-auto md:bg-neutral-700 md:py-4 md:px-8 md:rounded-lg">
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
                  key={item.scheduleId}
                />
              ))}
          </ul>
        ) : (
          <div className="flex justify-center m-16">
            <p>Nenhum horário encontrado.</p>
          </div>
        )}
      </section>
    </>
  );
}
export default Reservation;
