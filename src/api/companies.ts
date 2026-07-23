import api from './axios';

export interface IInfoCourt {
  publicId: string;
  name: string;
  floor: string | null;
  show: boolean;
  sports: string[];
  price: number | null;
}

export interface IInfoOwner {
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface IInfoPhoto {
  id: number;
  url: string;
}

export interface IInfo {
  link: string;
  slug?: string;
  /** Publicado no portal (ao menos uma quadra no site). */
  isActive?: boolean;
  companyName: string;
  companyPhone?: string | null;
  logoUrl?: string | null;
  photos?: IInfoPhoto[];
  owner?: IInfoOwner | null;
  courts: IInfoCourt[];
  preferences: {
    isHiddenInactiveHours: boolean;
  };
  plan: {
    name: string;
    price: number;
    day_due: number | null;
    history: {
      date: string;
      value: number;
      form_of_payment: string;
      paied: boolean;
    }[];
  };
}

export const infosByCompanyPublicId = async (
  publicId: string,
) => {
  try {
    const response = await api.get<IInfo>(`/companies/${publicId}/infos`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar informações sobre a empresa:', error);
    throw error;
  }
};

export const uploadCompanyLogo = async (
  publicId: string,
  file: File,
): Promise<{ logoUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<{ logoUrl: string }>(
    `/companies/${publicId}/logo`,
    formData,
    {
      // Deixa o browser definir o boundary do multipart.
      headers: { 'Content-Type': undefined as unknown as string },
      timeout: 30000,
    },
  );
  return response.data;
};

export const uploadCompanyPhoto = async (
  publicId: string,
  file: File,
): Promise<IInfoPhoto> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<IInfoPhoto>(
    `/companies/${publicId}/photos`,
    formData,
    {
      headers: { 'Content-Type': undefined as unknown as string },
      timeout: 30000,
    },
  );
  return response.data;
};

export const deleteCompanyPhoto = async (
  publicId: string,
  imageId: number,
): Promise<void> => {
  await api.delete(`/companies/${publicId}/photos/${imageId}`);
};

export const updateCourtVisibility = async (
  courtPublicId: string,
  show: boolean,
): Promise<{ publicId: string; show: boolean; companyActive: boolean }> => {
  const response = await api.patch<{
    publicId: string;
    show: boolean;
    companyActive: boolean;
  }>(`/courts/${courtPublicId}/visibility`, { show });
  return response.data;
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