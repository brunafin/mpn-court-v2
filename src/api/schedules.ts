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