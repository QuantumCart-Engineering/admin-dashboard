import { categoryStatusTone, productStatusLabel, productStatusTone, toneClass } from './status';

describe('status helpers', () => {
  it('labels and tones product statuses', () => {
    expect(productStatusLabel('ACTIVE')).toBe('Active');
    expect(productStatusTone('ACTIVE')).toBe('success');
    expect(productStatusLabel('INACTIVE')).toBe('Inactive');
  });

  it('falls back to the raw value for unknown statuses', () => {
    expect(productStatusLabel('MYSTERY')).toBe('MYSTERY');
    expect(productStatusTone('MYSTERY')).toBe('neutral');
  });

  it('tones category statuses', () => {
    expect(categoryStatusTone('ACTIVE')).toBe('success');
    expect(categoryStatusTone('INACTIVE')).toBe('neutral');
  });

  it('maps tones to badge classes', () => {
    expect(toneClass('success')).toBe('badge badge-success');
    expect(toneClass('neutral')).toBe('badge');
  });
});
