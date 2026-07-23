import { onlyCepDigits } from "../utils/formatCep";

export type ViaCepAddress = {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  uf: string;
};

type ViaCepResponse = {
  erro?: boolean | string;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

/**
 * Consulta gratuita via ViaCEP (sem API key).
 * @see https://viacep.com.br/
 */
export async function lookupCep(cep: string): Promise<ViaCepAddress | null> {
  const digits = onlyCepDigits(cep);
  if (digits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) {
    throw new Error("Falha ao consultar o CEP.");
  }

  const data = (await response.json()) as ViaCepResponse;
  if (data.erro === true || data.erro === "true") {
    return null;
  }

  return {
    cep: data.cep ?? formatFromDigits(digits),
    street: (data.logradouro ?? "").trim(),
    neighborhood: (data.bairro ?? "").trim(),
    city: (data.localidade ?? "").trim(),
    uf: (data.uf ?? "").trim().toUpperCase(),
  };
}

function formatFromDigits(digits: string): string {
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
