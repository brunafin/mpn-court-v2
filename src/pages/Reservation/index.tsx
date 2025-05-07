import { useCallback, useEffect, useState } from "react";
import { BsArrowRepeat, BsChevronLeft, BsChevronRight } from "react-icons/bs";
import ReservationItem from "./ReservationItem";
import { ReservationStatusEnum } from "./enum";
import LegendAndFilters from "./Legend";
import { IReservationItemProps } from "./interface";
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import CustomDatepicker from "../../components/Datepicker";
import { HiX } from "react-icons/hi";
import { getSchedulesByCompanyPublicIdAndDate } from "../../api/schedules";
import Header from "../../components/Header";

function Reservation() {
  const [date, setDate] = useState<Date | null>(
    new Date(new Date().setHours(0, 0, 0, 0))
  );
  const [statusSelected, setStatusSelected] =
    useState<ReservationStatusEnum | null>(null);
  const [courtSelected, setCourtSelected] = useState<string>("all");
  const [isOpenFilters, setIsOpenFilters] = useState(false);
  const [list, setList] = useState<IReservationItemProps[]>([]);
  const [courtsNameList, setCourtsNameList] = useState<string[]>([]);

  const fetchData = useCallback(
    async (dateInput: string) => {
      const response = await getSchedulesByCompanyPublicIdAndDate({
        companyPublicId: "c26bb6e2-693f-4205-bc90-63f7003d895d",
        date: dateInput,
      });
      setList(response);
      const uniqueCourts = [...new Set(response.map((item) => item.court))];
      setCourtsNameList(uniqueCourts);
    },
    [date]
  );

  useEffect(() => {
    fetchData(date?.toISOString().split("T")[0] || "");
  }, []);

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
        <div className="flex items-center justify-center h-16 px-2">
          <div className="flex items-center gap-2 justify-center p-4">
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
            className="hidden md:flex"
            onClick={() => fetchData(date?.toISOString().split("T")[0] || "")}
          >
            <BsArrowRepeat size={24} />
          </button>
          <button
            className="md:hidden text-neutral-200 hover:text-neutral-100 bg-neutral-900 py-2 px-2 flex justify-end items-center gap-2 rounded-sm"
            onClick={() => setIsOpenFilters(!isOpenFilters)}
          >
            {isOpenFilters ? (
              <>
                <HiX /> Fechar
              </>
            ) : (
              <>
                <HiOutlineAdjustmentsHorizontal /> Filtrar
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
          <ul className="flex flex-col gap-4 overflow-y-auto bg-neutral-800 pb-4">
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
