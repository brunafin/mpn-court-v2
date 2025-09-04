import api from './axios';

export interface IInfo {
  link: string;
  companyName: string;
  preferences: {
    isHiddenInactiveHours: boolean;
  }
  plan:{
    name: string;
    price: number;
    day_due: number | null;
    history: {
      date: string;
      value: number;
      form_of_payment: string;
      paied: boolean;
    }[]
  }
}

export const infosByCompanyPublicId = async (
  publicId: string,
) => {
  try {
    const response = await api.get<Promise<IInfo>>(`/companies/${publicId}/infos`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar informações sobre a empresa:', error);
    throw error;
  }
};

export const updatePreferencesByCompanyPublicId = async (
  publicId: string,
  data: { isHiddenInactiveHours: boolean; }
) => {
  try {
    const response = await api.patch<Promise<void>>(`/companies/preferences-hidden-inactive-hours/${publicId}`, {
      isHiddenInactiveHours: data.isHiddenInactiveHours
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar preferências:', error);
    throw error;
  }
};

export const getCourtsByCompanyPublicId = async (publicId: string): Promise<{ id: number, name: string }[]> => {
  try {
    const response = await api.get(`/courts/company/${publicId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar quadras da empresa:', error);
    throw error;
  }
}

export const createNewCourtSchedule = async (data: { start_hour: string, date: string, court_id: number }): Promise<any> => {
  try {
    const response = await api.post('/court-schedules/quick-create', data)
    return response;
  } catch (error) {
    console.error('Erro ao criar horário para a quadra:', error);
    throw error;
  }
}