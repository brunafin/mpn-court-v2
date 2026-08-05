import { IReservationDetailsItemProps, IReservationItemProps } from '../pages/Reservation/interface';
import {
  normalizeReservationStatus,
  ReservationStatusEnum,
} from '../pages/Reservation/enum';
import api from './axios';

export interface IScheduleApi {
  companyPublicId: string;
  date: string;
}

function normalizeScheduleItem(
  item: IReservationItemProps,
): IReservationItemProps {
  const status =
    normalizeReservationStatus(item.status) ?? ReservationStatusEnum.AVAILABLE;
  return { ...item, status };
}

function normalizeScheduleDetails(
  item: IReservationDetailsItemProps,
): IReservationDetailsItemProps {
  const status =
    normalizeReservationStatus(item.status) ?? ReservationStatusEnum.AVAILABLE;
  return { ...item, status };
}

export const getSchedulesByCompanyPublicIdAndDate = async ({ companyPublicId, date }: IScheduleApi) => {
  const response = await api.get<IReservationItemProps[]>(`/companies/${companyPublicId}/schedules/${date}`);
  return response.data.map(normalizeScheduleItem);
}

export const getAllSchedulesByCompanyPublicIdAndDate = async ({ companyPublicId, date }: IScheduleApi) => {
  const response = await api.get<{
    schedules: IReservationItemProps[];
    isDayClosed: boolean;
  }>(`/companies/${companyPublicId}/all-schedules/${date}`);
  return {
    ...response.data,
    schedules: response.data.schedules.map(normalizeScheduleItem),
  };
};

export const getScheduleById = async (id: string) => {
  try {
    const response = await api.get<IReservationDetailsItemProps>(`/court-schedules/${id}`);
    return normalizeScheduleDetails(response.data);
  } catch (error) {
    console.error('Erro ao buscar horário:', error);
    throw error;
  }
}

interface ICreateReservation {
  contactName: string;
  contactPhone?: string | null;
  courtSchedulePublicId: string;
  observation?: string;
  isBarbecueIncluded?: boolean;
  isEvent?: boolean;
  sportId: number;
}

export const createReservation = async (
  data: ICreateReservation,
  options?: { silentError?: boolean },
) => {
  try {
    const response = await api.post<IReservationDetailsItemProps>(
      '/reservation',
      data,
      { silentError: options?.silentError },
    );
    return response.data;
  } catch (error) {
    console.error('Erro ao reservar:', error);
    throw error;
  }
}

export const updateObservationByPublicId = async (
  publicId: string,
  data: { observation?: string; isBarbecueIncluded?: boolean, isEvent?: boolean }
) => {
  try {
    const response = await api.patch<IReservationDetailsItemProps>(`/reservation/${publicId}/extra`, {
      observation: data.observation,
      is_barbecue_included: data.isBarbecueIncluded,
      is_event: data.isEvent
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar observação:', error);
    throw error;
  }
}

export const updatePhoneContact = async (
  data: {
    contactName: string;
    contactPhone?: string | null;
    courtSchedulePublicId: string;
  }
) => {
  try {
    const response = await api.patch<IReservationDetailsItemProps>(`/reservation/${data.courtSchedulePublicId}/contact`, {
      contactName: data.contactName,
      contactPhone: data.contactPhone ?? null
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar informações de contato:', error);
    throw error;
  }
}

export const cancelReservation = async (
  publicId: string,
  options?: { silentError?: boolean },
): Promise<void> => {
  try {
    await api.delete(`/reservation/${publicId}`, {
      silentError: options?.silentError,
    });
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    throw error;
  }
}

export const changeAvailability = async (
  courtScheduleId: string,
  available: boolean,
  options?: { silentError?: boolean },
): Promise<void> => {
  try {
    await api.patch(
      `court-schedules/${courtScheduleId}/availability`,
      { available },
      { silentError: options?.silentError },
    );
  } catch (error) {
    console.error('Erro ao alterar a disponibilidade do horário:', error);
    throw error;
  }
}

export type DayAvailabilityResult = {
  updated: number;
  date: string;
  available: boolean;
  isDayClosed: boolean;
};

/** Fecha (available=false) ou reabre (available=true) horários livres do dia. */
export const setDayAvailability = async (
  companyPublicId: string,
  date: string,
  available: boolean,
): Promise<DayAvailabilityResult> => {
  const response = await api.patch<DayAvailabilityResult>(
    '/court-schedules/day-availability',
    {
      company_public_id: companyPublicId,
      date,
      available,
    },
  );
  return response.data;
};


interface IFixOrUnfixSchedule {
  court_schedule_public_id: string;
}

export const fixSchedule = async (
  data: IFixOrUnfixSchedule,
  options?: { silentError?: boolean },
): Promise<void> => {
  await api.post('/court-schedules/fix', data, {
    timeout: 30000,
    silentError: options?.silentError,
  });
};

export const unfixSchedule = async (
  data: IFixOrUnfixSchedule,
  options?: { silentError?: boolean },
): Promise<void> => {
  try {
    await api.post('/court-schedules/unfix', data, {
      timeout: 30000,
      silentError: options?.silentError,
    });
  } catch (error) {
    console.error('Erro ao desfixar horário:', error);
    throw error;
  }
};