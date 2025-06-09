import { ReservationStatusEnum } from "./enum";

export interface IReservationItemProps {
  scheduleId: string;
  status: ReservationStatusEnum;
  date: string;
  court: string;
  time: string;
  customerName: string | null;
  isBarbecueIncluded?: boolean;
  isNeedsNetting?: boolean;
}

export interface IReservationDetailsItemProps {
  scheduleId: string;
  status: ReservationStatusEnum;
  date: string;
  reservation: {
    publicId: string;
    createdAt: string;
    isPrepaid: boolean;
    contactName: string;
    contactPhone: string;
    tokenToCancel: string;
    observation: string;
    isBarbecueIncluded: boolean;
    isNeedsNetting: boolean;
    sportName: string;
  } | null;
  court: string;
  sports: {
    id: number;
    name: string;
  }[];
  time: string;
  price: string;
  weekday: string;
}