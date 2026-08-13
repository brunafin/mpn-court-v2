import api from './axios';

export interface IInfoCourt {
  publicId: string;
  name: string;
  floor: string | null;
  show: boolean;
  isCovered?: boolean;
  isCanHaveNet?: boolean;
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

export interface IInfoAddress {
  cep: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  uf: string | null;
}

export interface IInfo {
  link: string;
  slug?: string;
  /** Publicado no portal (ao menos uma quadra no site). */
  isActive?: boolean;
  companyName: string;
  companyPhone?: string | null;
  instagramUrl?: string | null;
  characteristics?: string[];
  address?: IInfoAddress | null;
  logoUrl?: string | null;
  photos?: IInfoPhoto[];
  owner?: IInfoOwner | null;
  courts: IInfoCourt[];
  preferences: {
    isHiddenInactiveHours: boolean;
  };
  capabilities?: {
    entitlement: 'trial' | 'paid' | 'none';
    accessMode: 'full' | 'read_only';
    accessReason: string | null;
    canViewAgenda: boolean;
    canMutate: boolean;
    canPayBilling: boolean;
    portalEligible: boolean;
  };
  plan: {
    name: string;
    price: number;
    day_due: number | null;
    isTrial?: boolean;
    trialEndsAt?: string | null;
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

export type PatchCompanyInput = {
  name?: string;
  phone?: string;
  instagram_url?: string | null;
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  uf?: string;
  characteristics?: string[];
};

export const patchCompany = async (
  publicId: string,
  data: PatchCompanyInput,
): Promise<void> => {
  await api.patch(`/companies/${publicId}`, data);
};

export type PatchCourtInput = {
  name?: string;
  floor?: string | null;
  is_covered?: boolean;
  is_can_have_net?: boolean;
  sports?: { name: string; needsNet?: boolean }[];
};

export const patchCourt = async (
  courtPublicId: string,
  data: PatchCourtInput,
): Promise<void> => {
  await api.patch(`/courts/${courtPublicId}`, data);
};

export type CreateOwnedCourtInput = {
  name: string;
  sports: { name: string; needsNet?: boolean }[];
  floor: string;
  price: number;
  is_covered?: boolean;
  is_can_have_net?: boolean;
  copyFromCourtPublicId?: string;
};

export const createOwnedCourt = async (
  companyPublicId: string,
  data: CreateOwnedCourtInput,
): Promise<{ publicId: string; name: string; schedulesReady: boolean }> => {
  const response = await api.post<{
    publicId: string;
    name: string;
    schedulesReady: boolean;
  }>(`/companies/${companyPublicId}/courts`, data);
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

export const createNewCourtSchedule = async (data: {
  start_hour: string;
  date: string;
  court_id: number;
  price?: number;
}): Promise<any> => {
  try {
    const response = await api.post('/court-schedules/quick-create', data)
    return response;
  } catch (error) {
    console.error('Erro ao criar horário para a quadra:', error);
    throw error;
  }
}