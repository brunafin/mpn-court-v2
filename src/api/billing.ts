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
  trialEndsAt: string;
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
  body?: { cpf?: string; email?: string },
) {
  const response = await api.post<BillingPixPayload>(
    `/companies/${companyPublicId}/billing/${paymentId}/pix`,
    body ?? {},
  );
  return response.data;
}

/** Contrata o plano Promocional: cria parcela + PIX (1ª vinculação). */
export async function startBillingContract(
  companyPublicId: string,
  body?: { cpf?: string; email?: string },
) {
  const response = await api.post<BillingPixPayload>(
    `/companies/${companyPublicId}/billing/contract`,
    body ?? {},
  );
  return response.data;
}

type BillingErrorBody = {
  code?: string;
  missing?: string[];
  message?: string | { code?: string; message?: string; missing?: string[] };
};

function readBillingError(error: unknown): BillingErrorBody | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  return error.response?.data as BillingErrorBody | undefined;
}

function readErrorCode(data: BillingErrorBody | undefined): string | undefined {
  if (!data) return undefined;
  if (typeof data.code === "string") return data.code;
  if (typeof data.message === "object" && data.message?.code) {
    return data.message.code;
  }
  return undefined;
}

function readMissingFields(
  data: BillingErrorBody | undefined,
): Array<"email" | "cpf"> {
  const raw =
    data?.missing ??
    (typeof data?.message === "object" ? data.message?.missing : undefined) ??
    [];
  const out: Array<"email" | "cpf"> = [];
  for (const item of raw) {
    if (item === "email" || item === "cpf") out.push(item);
  }
  return out;
}

export type PayerDataNeeded = {
  email: boolean;
  cpf: boolean;
};

/** Dados do pagador faltando (e-mail e/ou CPF) — UI coleta em formulário, sem toast. */
export function getPayerDataNeeded(error: unknown): PayerDataNeeded | null {
  if (!axios.isAxiosError(error)) return null;
  const data = readBillingError(error);
  const code = readErrorCode(data);
  const missing = readMissingFields(data);
  const msg =
    typeof data?.message === "string"
      ? data.message
      : String(
          typeof data?.message === "object"
            ? (data.message?.message ?? "")
            : "",
        );

  let email = missing.includes("email") || code === "EMAIL_REQUIRED";
  let cpf =
    missing.includes("cpf") ||
    code === "CPF_REQUIRED" ||
    (error.response?.status === 422 && /CPF/i.test(msg) && !email);

  if (code === "PAYER_DATA_REQUIRED") {
    email = missing.includes("email") || missing.length === 0 || email;
    cpf = missing.includes("cpf") || missing.length === 0 || cpf;
    if (missing.length === 0) {
      email = true;
      cpf = true;
    }
  }

  // Fallback legado: string solta de e-mail sem code
  if (
    !email &&
    error.response?.status === 422 &&
    /e-?mail/i.test(msg) &&
    /PIX|gerar/i.test(msg)
  ) {
    email = true;
  }

  if (!email && !cpf) return null;
  return { email, cpf };
}

export function isCpfRequiredError(error: unknown): boolean {
  return Boolean(getPayerDataNeeded(error)?.cpf);
}

export function isEmailRequiredError(error: unknown): boolean {
  return Boolean(getPayerDataNeeded(error)?.email);
}

export function isPixUnavailableError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const data = readBillingError(error);
  const code = readErrorCode(data);
  return code === "PIX_UNAVAILABLE";
}
