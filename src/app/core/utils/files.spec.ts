import { MAX_IMAGE_BYTES, formatBytes, validateImageFile } from './files';

const file = (type: string, size: number, name = 'img.png') => {
  const blob = new Blob([new Uint8Array(Math.min(size, 8))], { type });
  Object.defineProperty(blob, 'size', { value: size });
  Object.defineProperty(blob, 'name', { value: name });
  return blob as File;
};

describe('image file utils', () => {
  it('accepts a PNG under the size limit', () => {
    expect(validateImageFile(file('image/png', 1024)).valid).toBe(true);
  });

  it('accepts JPEG and WebP', () => {
    expect(validateImageFile(file('image/jpeg', 2048)).valid).toBe(true);
    expect(validateImageFile(file('image/webp', 2048)).valid).toBe(true);
  });

  it('rejects unsupported types', () => {
    const result = validateImageFile(file('image/gif', 1024));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('PNG, JPEG and WebP');
  });

  it('rejects files over the size limit', () => {
    const result = validateImageFile(file('image/png', MAX_IMAGE_BYTES + 1));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('5 MB');
  });

  it('formats byte sizes for display', () => {
    expect(formatBytes(0)).toBe('0 KB');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(MAX_IMAGE_BYTES)).toBe('5 MB');
  });
});
