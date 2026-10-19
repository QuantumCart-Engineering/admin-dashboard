export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_IMAGE_ACCEPT_ATTR = 'image/png,image/jpeg,image/webp';

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 KB';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  const rounded = exponent === 0 ? value : Math.round(value * 10) / 10;
  return `${rounded} ${units[exponent]}`;
};

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export const validateImageFile = (file: File): ImageValidationResult => {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { valid: false, error: 'Only PNG, JPEG and WebP images are allowed.' };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { valid: false, error: `Image must be at most ${formatBytes(MAX_IMAGE_BYTES)}.` };
  }

  return { valid: true };
};
