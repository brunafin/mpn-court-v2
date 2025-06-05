import api from './axios';

export async function login(username: string, password: string) {
  const response = await api.post(
    '/auth/login',
    { username, password },
  );
  return response.data;
}

export async function changePassword(companyPublicId: string, newPassword: string) {

  const response = await api.post('/auth/change-password', { companyPublicId, newPassword });
  return response.data;
}