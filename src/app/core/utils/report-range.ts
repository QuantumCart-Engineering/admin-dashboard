export type RangePreset = '7d' | '30d' | '90d' | 'mtd' | 'custom';

export interface DateRangeValue {
  from: string;
  to: string;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

export const isValidIsoDate = (value: string): boolean => {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const addDays = (value: string, days: number): string => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
};

export const presetRange = (preset: RangePreset, today = new Date()): DateRangeValue => {
  const to = toIsoDate(today);

  switch (preset) {
    case '7d':
      return { from: addDays(to, -6), to };
    case '30d':
      return { from: addDays(to, -29), to };
    case '90d':
      return { from: addDays(to, -89), to };
    case 'mtd':
      return { from: `${to.slice(0, 7)}-01`, to };
    default:
      return { from: addDays(to, -29), to };
  }
};

export const formatIsoDate = (value: string): string => {
  if (!isValidIsoDate(value)) {
    return value;
  }
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
};

export const formatPeriodLabel = (period: string): string => {
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split('-').map(Number);
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      year: '2-digit',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  }

  if (isValidIsoDate(period)) {
    const [year, month, day] = period.split('-').map(Number);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  return period;
};
