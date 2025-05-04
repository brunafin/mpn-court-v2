import { ReservationStatusEnum } from "./enum";

export interface IReservationItemProps {
  scheduleId: string;
  status: ReservationStatusEnum;
  date: string;
  court: string;
  time: string;
  customerName: string | null;
}

export interface IReservationDetailsItemProps {
  scheduleId: string;
  status: ReservationStatusEnum;
  date: string;
  reservation: {
    createdAt: string;
    isPrepaid: boolean;
    contactName: string;
    contactPhone: string;
    tokenToCancel: string;
  } | null;
  court: string;
  time: string;
  price: string;
}