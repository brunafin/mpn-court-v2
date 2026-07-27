import axios from 'axios';
import api from './axios';

export type BillingPaymentStatus =
  | 'open'
  | 'overdue'
  | 'awaiting_pix'
  | 'paid';

export type BillingPaymentItem = {
  id: number;
  dueDate: string | null;
  paidAt: string | null;
  value: number;
  paid: boolean;
  status: BillingPaymentStatus;
  formOfPayment: string | null;
  mpPaymentId: string | null;
  hasCpfOnFile: boolean;
};

export type BillingSummary = {
  openPayment: BillingPaymentItem | null;
  history: BillingPaymentItem[];
  monthlyFee: number;
  dayDue: number | null;
  isTrial: boolean;
  pixEnabled: boolean;
};

export type BillingPixPayload = {
  paymentId: number;
  value: number;
  status: BillingPaymentStatus;
  paid: boolean;
  pixCopyPaste: string | null;
  pixQrBase64: string | null;
  pixExpiresAt: string | null;
  mpPaymentId: string | null;
};

export async function getBillingSummary(companyPublicId: string) {
  const response = await api.get<BillingSummary>(
    `/companies/${companyPublicId}/billing`,
  );
  return response.data;
}

export async function getBillingPayment(
  companyPublicId: string,
  paymentId: number,
) {
  const response = await api.get<BillingPaymentItem>(
    `/companies/${companyPublicId}/billing/${paymentId}`,
    {
      // Polling: não dispara toast global em falha transitória (ex.: app em background).
      silentError: true,
    },
  );
  return response.data;
}

export async function generateBillingPix(
  companyPublicId: string,
  paymentId: number,
  body?: { cpf?: string },
) {
  const response = await api.post<BillingPixPayload>(
    `/companies/${companyPublicId}/billing/${paymentId}/pix`,
    body ?? {},
  );
  return response.data;
}

export function isCpfRequiredError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const data = error.response?.data as
    | {
        code?: string;
        message?: string | { code?: string; message?: string };
      }
    | undefined;
  if (data?.code === 'CPF_REQUIRED') return true;
  if (
    typeof data?.message === 'object' &&
    data.message?.code === 'CPF_REQUIRED'
  ) {
    return true;
  }
  const msg =
    typeof data?.message === 'string'
      ? data.message
      : String(data?.message?.message ?? '');
  return /CPF/i.test(msg) && error.response?.status === 422;
}
