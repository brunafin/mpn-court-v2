import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { MdNotInterested, MdOutlineArrowBackIos } from "react-icons/md";
import { BsEye } from "react-icons/bs";
import { useLoading } from "../../hooks/useLoading";
import { IReservationItemProps } from "../Reservation/interface";
import { changeAvailability, getAllSchedulesByCompanyPublicIdAndDate } from "../../api/schedules";
import Loader from "../../components/Loader";
import { ReservationStatusEnum } from "../Reservation/enum";
import { format } from "date-fns";

function ConfigDay() {
  const { loading, withLoading } = useLoading();
  const location = useLocation();
  const navigate = useNavigate();
  const dateFrom = location.state?.date;
  const [companyPublicId, setCompanyPublicId] = useState<string>("");
  const [list, setList] = useState<IReservationItemProps[]>([]);
  const [date] = useState<Date>(dateFrom);

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
    if (!companyPublicId) return;
    fetchData(date?.toISOString().split("T")[0]);
  }, [companyPublicId, date]);

  const fetchData = useCallback(
    async (dateInput: string) => {
      if (!companyPublicId) {
        return;
      }
      try {
        await withLoading(async () => {
          const response = await getAllSchedulesByCompanyPublicIdAndDate({
            companyPublicId,
            date: dateInput,
          });
          setList(response);
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

  if (loading) return <Loader />;

  return (
    <>
      <Header />
      <section className="bg-neutral-800 h-[calc(100vh-64px)] w-full flex flex-col">
        <div className="flex items-center gap-8 bg-neutral-900 p-4">
          <button
            onClick={() =>
              navigate(`/reservas`, { state: { date: date.toISOString().split("T")[0] } })
            }
          >
            <MdOutlineArrowBackIos size={22} />
          </button>
          <h2 className="text-lg bg-neutral-900 text-center">Detalhes do dia {format(date, "dd/MM/yyyy")} </h2>
        </div>
        <ul className="p-3 border-b-1 border-neutral-700 flex flex-col gap-2">
          <li className="border-1 border-tertiary-600 p-1 rounded-sm text-center">
            {(() => {
              const count = list.filter((item) => item.status === ReservationStatusEnum.AVAILABLE).length;
              return `${count} Horário${count === 1 ? "" : "s"} livre${count === 1 ? "" : "s"}`;
            })()}
          </li>
          <li className="border-1 border-secondary-500 p-1 rounded-sm text-center">
            {(() => {
              const count = list.filter((item) => item.status === ReservationStatusEnum.RESERVED).length;
              return `${count} Horário${count === 1 ? "" : "s"} reservado${count === 1 ? "" : "s"}`;
            })()}
          </li>
          <li className="border-1 border-purple-600 p-1 rounded-sm text-center">
            {(() => {
              const count = list.filter((item) => item.status === ReservationStatusEnum.FIXED).length;
              return `${count} Horário${count === 1 ? "" : "s"} fixo${count === 1 ? "" : "s"}`;
            })()}
          </li>
          <li className="border-1 border-danger-500 p-1 rounded-sm text-center">
            {(() => {
              const count = list.filter((item) => item.status === ReservationStatusEnum.INACTIVE).length;
              return `${count} Horário${count === 1 ? "" : "s"} inativo${count === 1 ? "" : "s"}`;
            })()}
          </li>
        </ul>
        {list.length > 0 && list[0]?.isHiddenInactiveHours && list.some((item) => item.status === ReservationStatusEnum.INACTIVE) && (
          <>
            <div className="p-3 gap-2 flex items-center">
              <h3 className="font-bold">Horários inativos ocultos:</h3>
              {/* <BsInfoCircle className="cursor-pointer"/> */}
            </div>
            <ul className="py-3 flex flex-col gap-3">
              {list.filter((item) => item.status === ReservationStatusEnum.INACTIVE).map((inactiveHour) => (
                <li
                  className={`md:w-3/5 md:mx-auto hover:brightness-110 px-2 border-b-4 border-b-danger-400 bg-neutral-800 relative md:rounded-sm  ${new Date(`${date}T${inactiveHour.time}`) < new Date(new Date().setSeconds(0, 0)) ? "opacity-50 pointer-events-none" : ""
                    }`}
                >
                  <div className="absolute left-0 bg-danger-400 h-12 p-1 rounded-tr-sm md:rounded-t-sm ">
                    <MdNotInterested size={14} className="text-neutral-100" />
                  </div>
                  <div className="flex items-center justify-between">
                    <li className="ms-6 py-3" aria-label={`Data: ${inactiveHour.date}, Hora: ${inactiveHour.time}, Quadra: ${inactiveHour.court}`}
                    >
                      {inactiveHour.time} - Q.{inactiveHour.court}
                    </li>
                    <button
                    className="flex items-center gap-2"
                      onClick={async () => {
                        await withLoading(async () => {
                          await changeAvailability(inactiveHour.scheduleId, true);
                          fetchData(dateFrom);
                          // navigate("/reservas", {
                          //   state: { date: dateFrom },
                          // });
                        });
                      }}
                    >
                      <BsEye size={18} /> ativar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

      </section>
    </>
  );
}
export default ConfigDay;
