import { IReservationDetailsItemProps, IReservationItemProps } from '../pages/Reservation/interface';
import api from './axios';

export interface IScheduleApi {
  companyPublicId: string;
  date: string;
}

export const getSchedulesByCompanyPublicIdAndDate = async ({ companyPublicId, date }: IScheduleApi) => {
  try {
    const response = await api.get<IReservationItemProps[]>(`/companies/${companyPublicId}/schedules/${date}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar horários:', error);
    throw error;
  }
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