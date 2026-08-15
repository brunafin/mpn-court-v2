/** Limite de upload de logo/fotos da arena (padrão alinhado a fotos de iPhone ~2026). */
export const IMAGE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const IMAGE_UPLOAD_MAX_MB = IMAGE_UPLOAD_MAX_BYTES / (1024 * 1024);
export const COMPANY_PHOTO_MAX_COUNT = 10;
export const IMAGE_UPLOAD_ACCEPT = "image/jpeg,image/png,image/webp";

export function imageUploadTooLargeMessage(): string {
  return `A imagem deve ter no máximo ${IMAGE_UPLOAD_MAX_MB} MB.`;
}

export function imageUploadHint(): string {
  return `JPG, PNG ou WebP · até ${IMAGE_UPLOAD_MAX_MB} MB`;
}

export function isAllowedImageFile(file: File): boolean {
  return /^image\/(jpeg|png|webp)$/.test(file.type);
}
