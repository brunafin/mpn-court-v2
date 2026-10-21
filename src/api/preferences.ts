import api from "./axios";
import type { ColorMode } from "../theme/colorMode";

export async function getColorModePreference(): Promise<ColorMode> {
  const response = await api.get<{ colorMode: ColorMode | null }>(
    "/people/preferences",
    { silentError: true },
  );
  return response.data.colorMode === "dark" ? "dark" : "light";
}

export async function updateColorModePreference(colorMode: ColorMode): Promise<void> {
  await api.patch("/people/preferences", { colorMode });
}
