import api from "./axios";

export interface Sport {
  id: number;
  name: string;
  needsNet: boolean;
}

export interface TypeOfCourt {
  id: number;
  name: string;
  description?: string;
}

export interface OnboardingDay {
  day_of_week_ref: number; // 0=Domingo ... 6=Sábado (getDay)
  hours: string[];
}

export interface OnboardingCourt {
  name: string;
  type_of_court_id: number;
  sport_ids: number[];
  floor?: string;
  is_covered?: boolean;
  is_can_have_net?: boolean;
  price: number;
}

export interface CompleteOnboardingInput {
  companyName: string;
  companyPhone?: string;
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

export async function getSports(): Promise<Sport[]> {
  const response = await api.get<Sport[]>("/sports");
  return response.data;
}

export async function getTypeOfCourts(): Promise<TypeOfCourt[]> {
  const response = await api.get<TypeOfCourt[]>("/type-of-court");
  return response.data;
}

export async function completeOnboarding(
  input: CompleteOnboardingInput
): Promise<CompleteOnboardingResponse> {
  const response = await api.post<CompleteOnboardingResponse>(
    "/onboarding",
    input
  );
  return response.data;
}
