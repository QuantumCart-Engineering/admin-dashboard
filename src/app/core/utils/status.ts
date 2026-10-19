import type { ProductStatus } from '../models/catalog';

export type Tone = 'success' | 'warning' | 'error' | 'primary' | 'neutral';

const PRODUCT_LABELS: Record<ProductStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  OUT_OF_STOCK: 'Out of stock',
  ARCHIVED: 'Archived',
};

const PRODUCT_TONES: Record<ProductStatus, Tone> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  OUT_OF_STOCK: 'warning',
  ARCHIVED: 'neutral',
};

export const productStatusLabel = (status: ProductStatus | string): string =>
  PRODUCT_LABELS[status as ProductStatus] ?? String(status);

export const productStatusTone = (status: ProductStatus | string): Tone =>
  PRODUCT_TONES[status as ProductStatus] ?? 'neutral';

export const categoryStatusLabel = (status: string): string =>
  status === 'ACTIVE' ? 'Active' : 'Inactive';

export const categoryStatusTone = (status: string): Tone =>
  status === 'ACTIVE' ? 'success' : 'neutral';

export const toneClass = (tone: Tone): string =>
  tone === 'neutral' ? 'badge' : `badge badge-${tone}`;
