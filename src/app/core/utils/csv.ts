export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

const escapeValue = (value: string | number | null | undefined): string => {
  const text = value === null || value === undefined ? '' : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

/**
 * Serialise rows to RFC 4180 compliant CSV. The header row is always emitted,
 * even when there are no data rows.
 */
export const toCsv = <T>(rows: T[], columns: CsvColumn<T>[]): string => {
  const header = columns.map((column) => escapeValue(column.header)).join(',');
  const body = rows.map((row) =>
    columns.map((column) => escapeValue(column.value(row))).join(','),
  );
  return [header, ...body].join('\r\n');
};

export const downloadCsv = (filename: string, csv: string): void => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
