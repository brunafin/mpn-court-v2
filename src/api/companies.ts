import api from './axios';

export interface IInfo {
  link: string;
  companyName: string;
  preferences:{
    isHiddenInactiveHours: boolean;
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