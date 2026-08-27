import * as XLSX from 'xlsx';
import type { UsdVndChartData, UsdVndChartPoint } from '../types/bulletin';

type CellValue = string | number | boolean | Date | null | undefined;
type Matrix = CellValue[][];

interface ParsedDateValue {
  key: string;
  timestamp: number;
}

interface SeriesColumns {
  headerRow: number;
  dateCol: number;
  valueCols: number[];
}

interface DatedRate {
  timestamp: number;
  rate: number;
}

const FALLBACK_COLUMNS = {
  blackMarket: { headerRow: 3, dateCol: 1, valueCols: [2, 3] },
  interbank: { headerRow: 3, dateCol: 7, valueCols: [8] },
  sbvCentral: { headerRow: 3, dateCol: 12, valueCols: [13] },
} satisfies Record<string, SeriesColumns>;

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function dateKey(year: number, month: number, day: number) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function validCalendarDate(year: number, month: number, day: number) {
  if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const value = new Date(Date.UTC(year, month - 1, day));
  return value.getUTCFullYear() === year && value.getUTCMonth() === month - 1 && value.getUTCDate() === day;
}

function parsedDate(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): ParsedDateValue | null {
  if (!validCalendarDate(year, month, day)) return null;
  return {
    key: dateKey(year, month, day),
    timestamp: Date.UTC(year, month - 1, day, hour, minute, second),
  };
}

function parseExcelDate(value: unknown): ParsedDateValue | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return parsedDate(
      value.getFullYear(),
      value.getMonth() + 1,
      value.getDate(),
      value.getHours(),
      value.getMinutes(),
      value.getSeconds(),
    );
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const decoded = XLSX.SSF.parse_date_code(value);
    if (!decoded) return null;
    return parsedDate(decoded.y, decoded.m, decoded.d, decoded.H, decoded.M, Math.floor(decoded.S));
  }

  if (typeof value !== 'string') return null;
  const candidate = value.trim();
  if (!candidate || /historicalpricing|rdp\.|timestamp|formula/i.test(candidate)) return null;
  if (/^\d+(?:\.\d+)?$/.test(candidate)) return parseExcelDate(Number(candidate));

  const iso = candidate.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (iso) return parsedDate(Number(iso[1]), Number(iso[2]), Number(iso[3]), Number(iso[4] ?? 0), Number(iso[5] ?? 0), Number(iso[6] ?? 0));

  const dayFirst = candidate.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (dayFirst) return parsedDate(Number(dayFirst[3]), Number(dayFirst[2]), Number(dayFirst[1]), Number(dayFirst[4] ?? 0), Number(dayFirst[5] ?? 0), Number(dayFirst[6] ?? 0));
  return null;
}

function rateNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value !== 'string' || /historicalpricing|rdp\.|formula/i.test(value)) return null;
  const parsed = Number(value.replace(/,/g, '').replace(/\s/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function nearestTimestampColumn(row: CellValue[], valueCol: number) {
  const candidates = row
    .map((value, col) => ({ col, label: normalize(value) }))
    .filter(({ label }) => label === 'timestamp' || label === 'date' || label === 'datetime');
  return candidates
    .filter(({ col }) => col < valueCol)
    .sort((a, b) => b.col - a.col)[0]?.col
    ?? candidates.sort((a, b) => Math.abs(valueCol - a.col) - Math.abs(valueCol - b.col))[0]?.col
    ?? -1;
}

function findBlackMarketColumns(matrix: Matrix): SeriesColumns | null {
  for (let rowIndex = 0; rowIndex < Math.min(matrix.length, 80); rowIndex += 1) {
    const row = matrix[rowIndex] ?? [];
    const bidCol = row.findIndex((value) => normalize(value) === 'bid');
    const askCol = row.findIndex((value) => normalize(value) === 'ask');
    if (bidCol < 0 || askCol < 0) continue;
    const dateCol = nearestTimestampColumn(row, Math.min(bidCol, askCol));
    if (dateCol >= 0) return { headerRow: rowIndex, dateCol, valueCols: [bidCol, askCol] };
  }
  return null;
}

function findSingleValueColumns(matrix: Matrix, aliases: string[]): SeriesColumns | null {
  const targets = aliases.map(normalize);
  for (let rowIndex = 0; rowIndex < Math.min(matrix.length, 80); rowIndex += 1) {
    const row = matrix[rowIndex] ?? [];
    const valueCol = row.findIndex((value) => targets.includes(normalize(value)));
    if (valueCol < 0) continue;
    const dateCol = nearestTimestampColumn(row, valueCol);
    if (dateCol >= 0) return { headerRow: rowIndex, dateCol, valueCols: [valueCol] };
  }
  return null;
}

function parseSeries(matrix: Matrix, columns: SeriesColumns, averageValues = false) {
  const values = new Map<string, DatedRate>();
  for (let rowIndex = columns.headerRow + 1; rowIndex < matrix.length; rowIndex += 1) {
    const row = matrix[rowIndex] ?? [];
    const date = parseExcelDate(row[columns.dateCol]);
    const rates = columns.valueCols.map((col) => rateNumber(row[col]));
    if (!date || rates.some((rate) => rate === null)) continue;
    const rate = averageValues
      ? rates.reduce<number>((sum, value) => sum + (value ?? 0), 0) / rates.length
      : rates[0]!;
    const current = values.get(date.key);
    if (!current || date.timestamp >= current.timestamp) values.set(date.key, { timestamp: date.timestamp, rate });
  }
  return values;
}

function findUsdVndSheet(workbook: XLSX.WorkBook) {
  const exact = workbook.SheetNames.find((name) => normalize(name) === 'ty gia usdvnd');
  return exact ?? workbook.SheetNames.find((name) => {
    const normalized = normalize(name).replace(/\s/g, '');
    return normalized.includes('usdvnd') && (normalized.includes('tygia') || normalized.includes('rate'));
  });
}

export function parseUsdVndSheet(workbook: XLSX.WorkBook): UsdVndChartData {
  const sheetName = findUsdVndSheet(workbook);
  if (!sheetName) return { sourceSheet: null, points: [] };

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<CellValue[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
  }) as Matrix;

  const blackColumns = findBlackMarketColumns(matrix) ?? FALLBACK_COLUMNS.blackMarket;
  const interbankColumns = findSingleValueColumns(matrix, ['TRDPRC_1', 'TRDPRC 1']) ?? FALLBACK_COLUMNS.interbank;
  const sbvColumns = findSingleValueColumns(matrix, ['CLOSE']) ?? FALLBACK_COLUMNS.sbvCentral;
  const blackMarket = parseSeries(matrix, blackColumns, true);
  const interbank = parseSeries(matrix, interbankColumns);
  const sbvCentral = parseSeries(matrix, sbvColumns);

  const dates = new Set([...blackMarket.keys(), ...interbank.keys(), ...sbvCentral.keys()]);
  const points: UsdVndChartPoint[] = [...dates]
    .sort((a, b) => a.localeCompare(b))
    .map((date) => ({
      date,
      sbvCentral: sbvCentral.get(date)?.rate ?? null,
      blackMarket: blackMarket.get(date)?.rate ?? null,
      interbank: interbank.get(date)?.rate ?? null,
    }));

  return { sourceSheet: sheetName, points };
}
