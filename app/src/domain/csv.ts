/**
 * Minimal RFC 4180 CSV parsing and serialising. Handles quoted fields, escaped
 * quotes, embedded newlines, CRLF/LF line endings, a UTF-8 BOM, and ragged rows.
 */

export interface ParsedCsv {
  headers: string[];
  /** Row values aligned to headers; short rows are padded with "". */
  rows: string[][];
  /** 1-based line numbers of each row in the source file (header is line 1). */
  lineNumbers: number[];
}

export class CsvParseError extends Error {}

export function parseCsv(text: string): ParsedCsv {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const records: string[][] = [];
  const recordLines: number[] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;
  let line = 1;
  let recordStartLine = 1;

  const endField = () => {
    record.push(field);
    field = "";
  };
  const endRecord = () => {
    endField();
    const isBlankLine = record.length === 1 && record[0] === "";
    if (!isBlankLine) {
      records.push(record);
      recordLines.push(recordStartLine);
    }
    record = [];
    recordStartLine = line;
  };

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        if (ch === "\n") line++;
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      endField();
    } else if (ch === "\r") {
      if (source[i + 1] === "\n") i++;
      line++;
      endRecord();
    } else if (ch === "\n") {
      line++;
      endRecord();
    } else {
      field += ch;
    }
  }
  if (inQuotes) throw new CsvParseError(`Unterminated quoted field starting near line ${recordStartLine}.`);
  if (field.length > 0 || record.length > 0) endRecord();

  const [headerRow, ...dataRows] = records;
  if (!headerRow) return { headers: [], rows: [], lineNumbers: [] };
  const headers = headerRow.map((h) => h.trim());
  const width = headers.length;
  const rows = dataRows.map((row) => {
    const padded = row.slice(0, width);
    while (padded.length < width) padded.push("");
    return padded.map((v) => v.trim());
  });
  return { headers, rows, lineNumbers: recordLines.slice(1) };
}

export function toCsv(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const escape = (value: string) =>
    /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) lines.push(row.map(escape).join(","));
  return `${lines.join("\r\n")}\r\n`;
}
