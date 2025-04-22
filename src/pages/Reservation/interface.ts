import { ReservationStatusEnum } from "./enum";

export interface IReservationItemProps {
  id: number;
  status: ReservationStatusEnum;
  date: string;
  reservationDate?: string;
  court: string;
  time: string;
  price: number;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface IReservationDetailsItemProps {
  id: number;
  status: ReservationStatusEnum;
  date: string;
  reservationDate: string;
  court: string;
  time: string;
  price: number;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
}