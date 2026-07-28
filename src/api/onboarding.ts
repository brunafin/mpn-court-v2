import api from "./axios";

export interface OnboardingDay {
  day_of_week_ref: number; // 0=Domingo ... 6=Sábado (getDay)
  hours: string[];
}

export interface OnboardingPriceSlot {
  day_of_week_ref: number;
  hour: string;
  price: number;
}

export interface OnboardingCourt {
  name: string;
  /** Nomes dos esportes aceitos (mapeados para o catálogo no backend). */
  sports: string[];
  /** Tipo de piso (obrigatório). */
  floor: string;
  is_covered?: boolean;
  is_can_have_net?: boolean;
  price: number;
  /** Preços personalizados por dia/hora; ausente = usa price em todos. */
  priceSlots?: OnboardingPriceSlot[];
}

export interface CompleteOnboardingInput {
  companyName: string;
  companyPhone?: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  uf: string;
  weekTemplate: OnboardingDay[];
  courts: OnboardingCourt[];
}

export interface CompleteOnboardingResponse {
  companyPublicId: string;
  companyName: string;
  courts: { publicId: string; name: string }[];
  schedulesPopulated: boolean;
  access_token: string;
}

export async function completeOnboarding(
  input: CompleteOnboardingInput
): Promise<CompleteOnboardingResponse> {
  const response = await api.post<CompleteOnboardingResponse>(
    "/onboarding",
    input,
    {
      // Criação + commit; populate roda em background no server.
      timeout: 60000,
    }
  );
  return response.data;
}
