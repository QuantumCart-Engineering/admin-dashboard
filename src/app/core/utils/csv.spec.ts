import { toCsv, CsvColumn } from './csv';

interface Row {
  name: string;
  units: number;
  note?: string | null;
}

const columns: CsvColumn<Row>[] = [
  { header: 'Name', value: (row) => row.name },
  { header: 'Units', value: (row) => row.units },
  { header: 'Note', value: (row) => row.note },
];

describe('toCsv', () => {
  it('emits a header row even when there are no records', () => {
    expect(toCsv([], columns)).toBe('Name,Units,Note');
  });

  it('serialises rows with CRLF line endings', () => {
    const csv = toCsv([{ name: 'Widget', units: 3, note: 'ok' }], columns);
    expect(csv).toBe('Name,Units,Note\r\nWidget,3,ok');
  });

  it('escapes commas and quotes in values', () => {
    const csv = toCsv([{ name: 'A, "quoted" name', units: 1, note: null }], columns);
    expect(csv).toBe('Name,Units,Note\r\n"A, ""quoted"" name",1,');
  });

  it('renders null and undefined as empty fields', () => {
    const csv = toCsv([{ name: 'X', units: 0, note: undefined }], columns);
    expect(csv).toBe('Name,Units,Note\r\nX,0,');
  });
});
