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

export async function signup(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}) {
  const response = await api.post('/auth/signup', input);
  return response.data as { message: string; email: string };
}

export async function verifyEmail(email: string, code: string) {
  const response = await api.post('/auth/verify-email', { email, code });
  return response.data as { message: string };
}

export async function resendCode(email: string) {
  const response = await api.post('/auth/resend-code', { email });
  return response.data as { message: string };
}