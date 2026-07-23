/**
 * Arquivo de logo escolhido no onboarding (não cabe no localStorage).
 * O upload só ocorre depois de criar a company (chave R2 usa publicId).
 */
let pendingLogoFile: File | null = null;
let pendingLogoPreviewUrl: string | null = null;

export function getPendingLogoFile(): File | null {
  return pendingLogoFile;
}

export function getPendingLogoPreviewUrl(): string | null {
  return pendingLogoPreviewUrl;
}

export function setPendingLogo(file: File | null): string | null {
  if (pendingLogoPreviewUrl) {
    URL.revokeObjectURL(pendingLogoPreviewUrl);
    pendingLogoPreviewUrl = null;
  }
  pendingLogoFile = file;
  if (file) {
    pendingLogoPreviewUrl = URL.createObjectURL(file);
  }
  return pendingLogoPreviewUrl;
}

export function clearPendingLogo(): void {
  setPendingLogo(null);
}
