import { IReservationDetailsItemProps, IReservationItemProps } from '../pages/Reservation/interface';
import api from './axios';

export interface IScheduleApi {
  companyPublicId: string;
  date: string;
}

export const getSchedulesByCompanyPublicIdAndDate = async ({ companyPublicId, date }: IScheduleApi) => {
  const response = await api.get<IReservationItemProps[]>(`/companies/${companyPublicId}/schedules/${date}`);
  return response.data;
}

export const getScheduleById = async (id: string) => {
  try {
    const response = await api.get<IReservationDetailsItemProps>(`/court-schedules/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar horário:', error);
    throw error;
  }
}

interface ICreateReservation {
  contactName: string;
  contactPhone: string;
  courtSchedulePublicId: string;
  observation?: string;
  isBarbecueIncluded?: boolean;
  isEvent?: boolean;
  sportId: number;
}

export const createReservation = async (data: ICreateReservation) => {
  try {
    const response = await api.post<IReservationDetailsItemProps>('/reservation', data);
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
  data: { contactName: string; contactPhone: string, courtSchedulePublicId: string }
) => {
  try {
    const response = await api.patch<IReservationDetailsItemProps>(`/reservation/${data.courtSchedulePublicId}/contact`, {
      contactName: data.contactName,
      contactPhone: data.contactPhone
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar informações de contato:', error);
    throw error;
  }
}

export const cancelReservation = async (token: string): Promise<void> => {
  try {
    await api.post<IReservationDetailsItemProps>('/reservation/cancel', { token });
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    throw error;
  }
}

export const changeAvailability = async (courtScheduleId: string, available: boolean): Promise<void> => {
  try {
    await api.patch(`court-schedules/${courtScheduleId}/availability`, { available })
  } catch (error) {
    console.error('Erro ao alterar a disponibilidade do horário:', error);
    throw error;
  }
}


interface IFixOrUnfixSchedule {
  court_schedule_public_id: string;
}

export const fixSchedule = async (data: IFixOrUnfixSchedule): Promise<void> => {
  await api.post('/court-schedules/fix', data);
};

export const unfixSchedule = async (data: IFixOrUnfixSchedule): Promise<void> => {
  try {
    await api.post('/court-schedules/unfix', data);
  } catch (error) {
    console.error('Erro ao desfixar horário:', error);
    throw error;
  }
};