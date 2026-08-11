import { ReservationStatusEnum } from "./enum";

export interface IReservationItemProps {
  scheduleId: string;
  status: ReservationStatusEnum;
  date: string;
  court: string;
  time: string;
  customerName: string | null;
  isBarbecueIncluded?: boolean;
  isEvent?: boolean;
  isNeedsNetting?: boolean;
  isHiddenInactiveHours?: boolean;
  /** true = público; false = interno; null = sem OS (órfão). */
  isPublic?: boolean | null;
}

export interface IReservationDetailsItemProps {
  scheduleId: string;
  status: ReservationStatusEnum;
  date: string;
  reservation: {
    publicId: string;
    createdAt: string;
    customerId?: number;
    contactName: string;
    contactPhone: string | null;
    observation: string;
    isBarbecueIncluded: boolean;
    isEvent: boolean;
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
  companyPublicId: string;
  /** true = público; false = interno; null = sem OS (órfão). */
  isPublic?: boolean | null;
}