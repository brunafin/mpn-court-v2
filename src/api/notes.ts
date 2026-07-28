import api from './axios';

export interface ICreateNote {
  companyPublicId: string;
  date: string;
  message: string;
}

export interface INote {
  id: number;
  from: string;
  message: string;
}

export const createNote = async (data: ICreateNote) => {
  try {
    const response = await api.post<Promise<void>>('/notes', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar lembrete:', error);
    throw error;
  }
};

export const notesByDate = async (
  companyPublicId: string,
  date: string,
): Promise<INote[]> => {
  try {
    const response = await api.get<INote[]>(`/notes`, {
      params: { companyPublicId, date },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar lembretes da empresa:', error);
    throw error;
  }
};

export const counterNotes = async (
  companyPublicId: string,
): Promise<number> => {
  try {
    const response = await api.get<number>(`/notes/counter`, {
      params: { companyPublicId },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar notificações da empresa:', error);
    throw error;
  }
};

export const checkIsRead = async (
  id: string,
) => {
  try {
    const response = await api.patch<Promise<void>>(`/notes/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao marcar lembrete como lido:', error);
    throw error;
  }
};