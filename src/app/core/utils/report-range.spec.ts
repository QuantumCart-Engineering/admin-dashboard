import {
  addDays,
  formatPeriodLabel,
  isValidIsoDate,
  presetRange,
  toIsoDate,
} from './report-range';

describe('report range utilities', () => {
  it('formats and validates ISO dates in UTC', () => {
    expect(toIsoDate(new Date(Date.UTC(2026, 2, 5)))).toBe('2026-03-05');
    expect(isValidIsoDate('2026-03-05')).toBe(true);
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('05-03-2026')).toBe(false);
  });

  it('adds days across month boundaries', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('computes the last 7 days ending today', () => {
    expect(presetRange('7d', new Date(Date.UTC(2026, 5, 10)))).toEqual({
      from: '2026-06-04',
      to: '2026-06-10',
    });
  });

  it('computes month-to-date', () => {
    expect(presetRange('mtd', new Date(Date.UTC(2026, 5, 10)))).toEqual({
      from: '2026-06-01',
      to: '2026-06-10',
    });
  });

  it('formats day and month period labels', () => {
    expect(formatPeriodLabel('2026-06')).toContain('Jun');
    expect(formatPeriodLabel('2025-06')).not.toBe(formatPeriodLabel('2026-06'));
    expect(formatPeriodLabel('2026-06-10')).toMatch(/Jun/);
    expect(formatPeriodLabel('nonsense')).toBe('nonsense');
  });
});
