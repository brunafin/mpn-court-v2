import { formatCurrencyBRL } from "./formatCurrency";

/**
 * PIX dinâmico (Mercado Pago) no manager.
 * Default: desligado — só chave PIX manual + comprovante no WhatsApp.
 * Para ligar: VITE_MERCADO_PAGO_PIX_UI_ENABLED=true no build.
 */
export function isMercadoPagoPixUiEnabled(): boolean {
  const raw = (import.meta.env.VITE_MERCADO_PAGO_PIX_UI_ENABLED || "")
    .trim()
    .toLowerCase();
  return raw === "true" || raw === "1";
}

/** Chave PIX estática da plataforma (além do PIX dinâmico do Mercado Pago). */
export function getManualPixKey(): string {
  return (import.meta.env.VITE_MANUAL_PIX_KEY || "").trim();
}

export function getManualPixBeneficiary(): string {
  return (
    (import.meta.env.VITE_MANUAL_PIX_BENEFICIARY || "").trim() ||
    "Marca Pra Nós"
  );
}

export function isManualPixConfigured(): boolean {
  return getManualPixKey().length > 0;
}

const DEFAULT_WHATSAPP_RECEIPT =
  "https://wa.me/5551989589197?text=" +
  encodeURIComponent(
    "Olá! Paguei a mensalidade da Marca Pra Nós via PIX. Segue o comprovante.",
  );

function whatsappReceiptBaseUrl(): string {
  return (
    (import.meta.env.VITE_WHATSAPP_RECEIPT_URL || "").trim() ||
    (import.meta.env.VITE_WHATSAPP_CONTRACT_URL || "").trim() ||
    DEFAULT_WHATSAPP_RECEIPT
  );
}

/** Monta link do WhatsApp pedindo envio do comprovante (anexo no app). */
export function buildReceiptWhatsAppUrl(params?: {
  amount?: number | null;
  companyName?: string | null;
  dueLabel?: string | null;
}): string {
  const base = whatsappReceiptBaseUrl();
  const lines = [
    "Olá! Paguei a mensalidade da Marca Pra Nós via chave PIX.",
    params?.companyName ? `Arena: ${params.companyName}` : null,
    params?.amount != null
      ? `Valor: ${formatCurrencyBRL(params.amount)}`
      : null,
    params?.dueLabel ? `Referência: ${params.dueLabel}` : null,
    "",
    "Vou enviar o comprovante nesta conversa.",
  ].filter((line): line is string => line != null);

  const text = lines.join("\n");

  try {
    const url = new URL(base);
    url.searchParams.set("text", text);
    return url.toString();
  } catch {
    return `https://wa.me/5551989589197?text=${encodeURIComponent(text)}`;
  }
}

export function openReceiptWhatsApp(params?: {
  amount?: number | null;
  companyName?: string | null;
  dueLabel?: string | null;
}) {
  window.open(
    buildReceiptWhatsAppUrl(params),
    "_blank",
    "noopener,noreferrer",
  );
}
