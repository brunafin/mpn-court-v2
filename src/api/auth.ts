import api from './axios';

export async function login(username: string, password: string) {
  const response = await api.post('/auth/login', { username, password });
  return response.data as {
    access_token: string;
    needsProfileCompletion?: boolean;
  };
}

export async function googleAuth(input: {
  idToken: string;
  password?: string;
}) {
  const response = await api.post('/auth/google', input);
  return response.data as {
    access_token: string;
    needsProfileCompletion: boolean;
  };
}

export async function completeProfile(input: {
  phone?: string;
  cpf: string;
  acceptedTerms: true;
}) {
  const response = await api.post('/auth/complete-profile', input);
  return response.data as {
    access_token: string;
    needsProfileCompletion: boolean;
  };
}

export async function changePassword(
  newPassword: string,
  currentPassword?: string,
) {
  const response = await api.post('/auth/change-password', {
    newPassword,
    ...(currentPassword ? { currentPassword } : {}),
  });
  return response.data as {
    access_token: string;
    needsProfileCompletion?: boolean;
  };
}

export async function signup(input: {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  password: string;
  acceptedTerms: true;
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

export async function forgotPassword(email: string) {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data as { message: string };
}

export async function resetPassword(input: {
  email: string;
  code: string;
  newPassword: string;
}) {
  const response = await api.post('/auth/reset-password', input);
  return response.data as { message: string };
}
