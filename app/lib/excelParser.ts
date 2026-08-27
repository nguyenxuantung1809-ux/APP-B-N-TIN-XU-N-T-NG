import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import type {
  BulletinData,
  BulletinLabels,
  BulletinLocale,
  DataPoint,
  DomesticMarketRow,
  MarketRow,
  MarketSection,
  Recommendation,
} from '../types/bulletin';
import { coerceDate } from './formatters';
import { parseUsdVndSheet } from './usdVndChartParser';

type CellValue = string | number | boolean | Date | null | undefined;
type Matrix = CellValue[][];

interface Anchor {
  row: number;
  col: number;
}

interface ShapeText {
  row: number;
  col: number;
  text: string;
}

const LOCALE_COPY: Record<BulletinLocale, BulletinLabels> = {
  en: {
    headerOverline: 'DAILY MARKET INTELLIGENCE',
    highlightedNews: 'Highlighted News of the Day',
    eventCalendar: "Today’s Event Calendar",
    marketHighlights: 'Market Highlights',
    quickAssessment: 'Quick Assessment',
    currencies: 'Currencies',
    commodities: 'Commodities',
    chart: 'Chart',
    domesticMarket: 'Domestic USD / VND',
    detailedAnalysis: 'Detailed Analysis',
    domesticAnalysis: 'Domestic',
    domesticKicker: 'VIETNAM',
    internationalAnalysis: 'International',
    internationalKicker: 'GLOBAL MARKETS',
    recommendations: 'Recommendations',
    recommendationKicker: 'SUGGESTED SOLUTION',
    recommendationFallback: 'Recommended product',
    benefitFallback: 'No benefit information is available.',
    disclaimer: 'Recommended Use of Information',
    table: {
      instrument: 'Instrument',
      open: 'Open',
      close: 'Close',
      high: 'High',
      low: 'Low',
      change: 'Change',
      fxMarket: 'FX Market',
      bid: 'Bid',
      ask: 'Ask',
      bidPriceT2: 'Bid Price T-2',
    },
  },
  vi: {
    headerOverline: 'THÔNG TIN THỊ TRƯỜNG HÀNG NGÀY',
    highlightedNews: 'TIN NỔI BẬT TRONG NGÀY',
    eventCalendar: 'LỊCH KINH TẾ ĐÁNG CHÚ Ý',
    marketHighlights: 'THÔNG TIN TÓM TẮT TRONG NƯỚC & QUỐC TẾ',
    quickAssessment: 'NHẬN ĐỊNH NHANH',
    currencies: 'THỊ TRƯỜNG TIỀN TỆ QUỐC TẾ',
    commodities: 'HÀNG HÓA & CHỈ SỐ LIÊN QUAN',
    chart: 'BIỂU ĐỒ',
    domesticMarket: 'THỊ TRƯỜNG TRONG NƯỚC: USD/VND',
    detailedAnalysis: 'PHÂN TÍCH CHI TIẾT',
    domesticAnalysis: 'THÔNG TIN ĐÁNG CHÚ Ý TRONG NƯỚC',
    domesticKicker: 'VIỆT NAM',
    internationalAnalysis: 'THÔNG TIN ĐÁNG CHÚ Ý QUỐC TẾ',
    internationalKicker: 'THỊ TRƯỜNG QUỐC TẾ',
    recommendations: 'NHẬN ĐỊNH & KHUYẾN NGHỊ',
    recommendationKicker: 'GIẢI PHÁP ĐỀ XUẤT',
    recommendationFallback: 'Sản phẩm khuyến nghị',
    benefitFallback: 'Chưa có thông tin lợi ích.',
    disclaimer: 'KHUYẾN CÁO SỬ DỤNG THÔNG TIN',
    table: {
      instrument: 'Mã',
      open: 'Mở cửa',
      close: 'Đóng cửa',
      high: 'Cao nhất',
      low: 'Thấp nhất',
      change: 'Thay đổi',
      fxMarket: 'Kênh',
      bid: 'Tỷ giá mua',
      ask: 'Tỷ giá bán',
      bidPriceT2: 'Tỷ giá mua/bán T-2',
    },
  },
};

const ALIASES = {
  sheet: ['FX MARKET BULLETIN', 'BẢN TIN NGOẠI HỐI'],
  title: ['FOREIGN EXCHANGE MARKET BULLETIN', 'BẢN TIN NGOẠI HỐI HÀNG NGÀY'],
  department: [
    'FOREIGN EXCHANGE SALES DEPARTMENT - HO',
    'PHÒNG KINH DOANH NGOẠI TỆ',
    'BỘ PHẬN KINH DOANH NGOẠI TỆ',
  ],
  highlightedNews: ['HIGHLIGHTED NEWS OF THE DAY', 'TIN NỔI BẬT TRONG NGÀY'],
  event: ["TODAY'S EVENT CALENDAR", 'TODAY’S EVENT CALENDAR', 'LỊCH KINH TẾ ĐÁNG CHÚ Ý'],
  market: ['MARKET HIGHLIGHTS', 'THÔNG TIN TÓM TẮT TRONG NƯỚC & QUỐC TẾ'],
  quick: ['QUICK ASSESSMENT', 'NHẬN ĐỊNH NHANH'],
  currencies: ['CURRENCIES', 'THỊ TRƯỜNG TIỀN TỆ QUỐC TẾ'],
  commodities: ['COMMODITIES', 'HÀNG HÓA & CHỈ SỐ LIÊN QUAN'],
  domestic: ['DOMESTIC MARKET: USD/VND', 'DOMESTIC USD / VND', 'THỊ TRƯỜNG TRONG NƯỚC: USD/VND'],
  detailed: ['DETAILED ANALYSIS: INTERNATIONAL & DOMESTIC', 'DETAILED ANALYSIS', 'PHÂN TÍCH CHI TIẾT'],
  domesticAnalysis: ['DOMESTIC', 'THÔNG TIN ĐÁNG CHÚ Ý TRONG NƯỚC'],
  internationalAnalysis: ['INTERNATIONAL', 'THÔNG TIN ĐÁNG CHÚ Ý QUỐC TẾ'],
  recommendations: ['RECOMMENDATIONS', 'NHẬN ĐỊNH & KHUYẾN NGHỊ'],
  recommendedProducts: ['RECOMMENDED PRODUCTS', 'SẢN PHẨM ĐỀ XUẤT'],
  benefits: ['BENEFITS', 'LỢI ÍCH'],
  disclaimer: [
    'RECOMMENDED USE OF INFORMATION',
    'RECOMMENDED USE OF INFORMATION:',
    'KHUYẾN CÁO SỬ DỤNG THÔNG TIN',
  ],
  fxMarket: ['FX MARKET', 'KÊNH'],
};

const MARKET_HEADERS = {
  instrument: ['INSTRUMENT', 'MÃ', 'MÃ GIAO DỊCH'],
  open: ['OPEN', 'MỞ CỬA'],
  close: ['CLOSE', 'ĐÓNG CỬA'],
  high: ['HIGH', 'CAO', 'CAO NHẤT'],
  low: ['LOW', 'THẤP', 'THẤP NHẤT'],
  change: ['% CHANGE', 'CHANGE', 'THAY ĐỔI', '% THAY ĐỔI'],
};

function normalize(value: unknown): string {
  return String(value ?? '')
    .replace(/[Đđ]/g, 'd')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/[^a-zA-Z0-9%]+/g, ' ')
    .trim()
    .toLowerCase();
}

function text(value: unknown): string {
  return String(value ?? '').replace(/\r\n/g, '\n').trim();
}

function numeric(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Number(value.replace(/,/g, '').replace(/%$/, '').trim());
  if (!Number.isFinite(parsed)) return null;
  return value.includes('%') ? parsed / 100 : parsed;
}

function cachedCellValue(cell: XLSX.CellObject | undefined): CellValue {
  if (!cell) return null;
  const value = cell.v;
  if (value !== undefined && value !== null && cell.t !== 'e') return value as CellValue;
  if (cell.w !== undefined && cell.w !== null) return cell.w;
  return null;
}

function sheetToMatrix(sheet: XLSX.WorkSheet): Matrix {
  if (!sheet['!ref']) return [];
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const matrix: Matrix = [];
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    const values: CellValue[] = [];
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      values[col] = cachedCellValue(sheet[XLSX.utils.encode_cell({ r: row, c: col })]);
    }
    matrix[row] = values;
  }
  return matrix;
}

function findAnchor(
  matrix: Matrix,
  aliases: string[],
  options: { startRow?: number; endRow?: number; minCol?: number; exact?: boolean } = {},
): Anchor | null {
  const aliasSet = aliases.map(normalize);
  const startRow = options.startRow ?? 0;
  const endRow = Math.min(options.endRow ?? matrix.length - 1, matrix.length - 1);
  for (let row = Math.max(0, startRow); row <= endRow; row += 1) {
    const cells = matrix[row] ?? [];
    for (let col = options.minCol ?? 0; col < cells.length; col += 1) {
      const candidate = normalize(cells[col]);
      if (!candidate) continue;
      const matched = aliasSet.some((alias) =>
        options.exact === false ? candidate.includes(alias) : candidate === alias,
      );
      if (matched) return { row, col };
    }
  }
  return null;
}

function positionalAnchor(matrix: Matrix, row: number, preferredCol: number): Anchor | null {
  const values = matrix[row] ?? [];
  if (text(values[preferredCol])) return { row, col: preferredCol };
  const col = values.findIndex((value) => text(value));
  return col >= 0 ? { row, col } : null;
}

function resolveAnchor(
  matrix: Matrix,
  aliases: string[],
  fallback: { row: number; col: number },
  options: { startRow?: number; endRow?: number; minCol?: number; exact?: boolean } = {},
): Anchor | null {
  return findAnchor(matrix, aliases, options) ?? positionalAnchor(matrix, fallback.row, fallback.col);
}

function anchorText(matrix: Matrix, anchor: Anchor | null, fallback: string): string {
  return text(anchor ? matrix[anchor.row]?.[anchor.col] : '') || fallback;
}

function firstTextAfter(matrix: Matrix, anchor: Anchor | null, maxRows = 8): string {
  if (!anchor) return '';
  for (let row = anchor.row + 1; row <= Math.min(matrix.length - 1, anchor.row + maxRows); row += 1) {
    const values = (matrix[row] ?? []).slice(anchor.col).map(text).filter(Boolean);
    if (values.length) return values.join('\n');
  }
  return '';
}

function firstDateNear(matrix: Matrix, row: number, radius = 8): Date | string | number | null {
  for (let current = Math.max(0, row); current <= Math.min(matrix.length - 1, row + radius); current += 1) {
    for (const value of matrix[current] ?? []) {
      if ((value instanceof Date || typeof value === 'string' || typeof value === 'number') && coerceDate(value)) return value;
    }
  }
  return null;
}

function headerColumn(row: CellValue[], aliases: string[], fallback = -1): number {
  const targets = aliases.map(normalize);
  const found = row.findIndex((value) => targets.includes(normalize(value)));
  return found >= 0 ? found : fallback;
}

function nextNonEmptyRow(matrix: Matrix, start: number, end: number): number {
  for (let row = start; row <= Math.min(end, matrix.length - 1); row += 1) {
    if ((matrix[row] ?? []).some((value) => text(value))) return row;
  }
  return -1;
}

function validInstrument(value: string): boolean {
  const normalized = normalize(value);
  return Boolean(normalized) && ![
    ...ALIASES.commodities,
    ...ALIASES.domestic,
    ...ALIASES.detailed,
    ...ALIASES.recommendations,
  ].some((alias) => normalized === normalize(alias));
}

function parseMarketSection(
  matrix: Matrix,
  anchor: Anchor | null,
  nextSectionRow: number,
  warnings: string[],
  label: string,
): MarketSection {
  if (!anchor) {
    warnings.push(`Could not find ${label} data in the Excel file.`);
    return { asOf: null, rows: [] };
  }

  const headerRow = nextNonEmptyRow(matrix, anchor.row + 1, Math.min(anchor.row + 6, nextSectionRow - 1));
  if (headerRow < 0) {
    warnings.push(`Could not find the ${label} table header.`);
    return { asOf: null, rows: [] };
  }

  const header = matrix[headerRow] ?? [];
  const instrumentCol = headerColumn(header, MARKET_HEADERS.instrument, anchor.col);
  const openCol = headerColumn(header, MARKET_HEADERS.open, instrumentCol + 1);
  const closeCol = headerColumn(header, MARKET_HEADERS.close, instrumentCol + 2);
  const highCol = headerColumn(header, MARKET_HEADERS.high, instrumentCol + 3);
  const lowCol = headerColumn(header, MARKET_HEADERS.low, instrumentCol + 4);
  const changeCol = headerColumn(header, MARKET_HEADERS.change, instrumentCol + 5);

  const rows: MarketRow[] = [];
  for (let row = headerRow + 1; row < Math.min(nextSectionRow, matrix.length); row += 1) {
    const values = matrix[row] ?? [];
    const instrument = text(values[instrumentCol]);
    if (!instrument) continue;
    if (!validInstrument(instrument)) break;
    const parsed: MarketRow = {
      instrument,
      open: numeric(values[openCol]),
      close: numeric(values[closeCol]),
      high: numeric(values[highCol]),
      low: numeric(values[lowCol]),
      change: numeric(values[changeCol]),
    };
    if ([parsed.open, parsed.close, parsed.high, parsed.low].every((value) => value === null)) continue;
    rows.push(parsed);
  }

  if (!rows.length) warnings.push(`No valid numeric rows were found under ${label}.`);
  return { asOf: null, rows };
}

function parseReferenceRates(matrix: Matrix, domesticAnchor: Anchor | null): DataPoint[] {
  if (!domesticAnchor) return [];
  const labelRow = nextNonEmptyRow(matrix, domesticAnchor.row + 1, domesticAnchor.row + 5);
  if (labelRow < 0) return [];
  const valueRow = nextNonEmptyRow(matrix, labelRow + 1, labelRow + 3);
  if (valueRow < 0) return [];

  const points: DataPoint[] = [];
  for (let col = domesticAnchor.col; col < (matrix[labelRow] ?? []).length; col += 1) {
    const label = text(matrix[labelRow]?.[col]);
    const value = numeric(matrix[valueRow]?.[col]);
    if (label && value !== null) points.push({ label, value });
    if (points.length === 5) break;
  }
  return points;
}

function parseDomesticRows(
  matrix: Matrix,
  domesticAnchor: Anchor | null,
  endRow: number,
): DomesticMarketRow[] {
  if (!domesticAnchor) return [];
  const fxAnchor = findAnchor(matrix, ALIASES.fxMarket, {
    startRow: domesticAnchor.row + 1,
    endRow,
  }) ?? positionalAnchor(matrix, 47, 0);
  if (!fxAnchor) return [];
  const header = matrix[fxAnchor.row] ?? [];
  const bidCol = headerColumn(header, ['BID', 'TỶ GIÁ MUA'], 1);
  const askCol = headerColumn(header, ['ASK', 'TỶ GIÁ BÁN'], 2);
  const changeCol = headerColumn(header, ['CHANGE', '% CHANGE', 'THAY ĐỔI'], 4);
  const bidT2Col = headerColumn(header, ['BID PRICE T-2', 'BID PRICE T 2', 'TỶ GIÁ MUA/BÁN T-2'], 5);
  const rows: DomesticMarketRow[] = [];

  for (let row = fxAnchor.row + 1; row < Math.min(endRow, matrix.length); row += 1) {
    const values = matrix[row] ?? [];
    const market = text(values[fxAnchor.col]);
    if (!market) {
      if (rows.length) break;
      continue;
    }
    const parsed = {
      market: market.replace(/\s*\n\s*/g, ' '),
      bid: numeric(values[bidCol]),
      ask: numeric(values[askCol]),
      change: numeric(values[changeCol]),
      bidPriceT2: numeric(values[bidT2Col]),
    };
    if ([parsed.bid, parsed.ask, parsed.change, parsed.bidPriceT2].every((value) => value === null)) continue;
    rows.push(parsed);
  }
  return rows;
}

function collectCellText(matrix: Matrix, startRow: number, endRow: number, minCol: number): string {
  const paragraphs: string[] = [];
  for (let row = startRow; row < Math.min(endRow, matrix.length); row += 1) {
    const rowText = (matrix[row] ?? []).slice(minCol).map(text).filter(Boolean).join(' ');
    if (rowText) paragraphs.push(rowText);
  }
  return paragraphs.join('\n\n');
}

function xmlElementsByLocalName(root: { querySelectorAll(selectors: string): NodeListOf<Element> }, localName: string): Element[] {
  return Array.from(root.querySelectorAll('*')).filter((node) => node.localName === localName);
}

async function extractTextBoxes(buffer: ArrayBuffer): Promise<ShapeText[]> {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) return [];
  const zip = await JSZip.loadAsync(buffer);
  const drawingNames = Object.keys(zip.files).filter((name) => /^xl\/drawings\/drawing\d+\.xml$/i.test(name));
  const shapes: ShapeText[] = [];

  for (const name of drawingNames) {
    const xml = await zip.file(name)?.async('text');
    if (!xml) continue;
    const documentXml = new DOMParser().parseFromString(xml, 'application/xml');
    const anchors = [
      ...xmlElementsByLocalName(documentXml, 'twoCellAnchor'),
      ...xmlElementsByLocalName(documentXml, 'oneCellAnchor'),
    ];
    for (const anchor of anchors) {
      const shape = xmlElementsByLocalName(anchor, 'sp')[0];
      const from = xmlElementsByLocalName(anchor, 'from')[0];
      if (!shape || !from) continue;
      const row = Number(xmlElementsByLocalName(from, 'row')[0]?.textContent ?? -1);
      const col = Number(xmlElementsByLocalName(from, 'col')[0]?.textContent ?? -1);
      const paragraphs = xmlElementsByLocalName(shape, 'p')
        .map((paragraph) =>
          xmlElementsByLocalName(paragraph, 't')
            .map((run) => run.textContent ?? '')
            .join('')
            .trim(),
        )
        .filter(Boolean);
      const value = paragraphs.join('\n\n').trim();
      if (value) shapes.push({ row, col, text: value });
    }
  }
  return shapes;
}

function nearestShape(shapes: ShapeText[], anchor: Anchor | null, nextRow: number): string {
  if (!anchor) return '';
  return (
    shapes
      .filter((shape) => shape.row >= anchor.row - 1 && shape.row < nextRow && shape.col >= anchor.col)
      .sort((a, b) => Math.abs(a.row - anchor.row) - Math.abs(b.row - anchor.row))[0]?.text ?? ''
  );
}

function parseRecommendations(matrix: Matrix, anchor: Anchor | null, disclaimerRow: number): Recommendation[] {
  if (!anchor) return [];
  const headerAnchor = findAnchor(matrix, ALIASES.recommendedProducts, {
    startRow: anchor.row,
    endRow: Math.min(anchor.row + 5, disclaimerRow - 1),
    minCol: anchor.col,
  }) ?? positionalAnchor(matrix, anchor.row + 1, anchor.col);
  if (!headerAnchor) return [];
  const header = matrix[headerAnchor.row] ?? [];
  const benefitCol = header.findIndex(
    (value, index) => index > headerAnchor.col && ALIASES.benefits.map(normalize).includes(normalize(value)),
  );
  const resolvedBenefitCol = benefitCol >= 0 ? benefitCol : headerAnchor.col + 5;

  const recommendations: Recommendation[] = [];
  for (let row = headerAnchor.row + 1; row < Math.min(disclaimerRow, matrix.length); row += 1) {
    const product = text(matrix[row]?.[headerAnchor.col]);
    const benefit = text(matrix[row]?.[resolvedBenefitCol]);
    if (product || benefit) recommendations.push({ product, benefit });
  }
  return recommendations;
}

function collectFooter(matrix: Matrix, disclaimerAnchor: Anchor | null): string[] {
  if (!disclaimerAnchor) return [];
  const lines: string[] = [];
  for (let row = disclaimerAnchor.row + 1; row < matrix.length; row += 1) {
    const values = (matrix[row] ?? []).map(text).filter(Boolean);
    for (const value of values) {
      if (value && !lines.includes(value)) lines.push(value);
    }
  }
  return lines.slice(1).filter(Boolean);
}

function detectLocale(sheetName: string, matrix: Matrix, preferred?: BulletinLocale): BulletinLocale {
  if (preferred) return preferred;
  const sample = `${sheetName} ${text(matrix[0]?.[2])} ${text(matrix[6]?.[0])}`;
  if (/[À-ỹĐđ]/u.test(sample)) return 'vi';
  const normalized = normalize(sample);
  return normalized.includes('ban tin') || normalized.includes('thi truong') ? 'vi' : 'en';
}

function findBulletinSheet(workbook: XLSX.WorkBook): string | null {
  const direct = workbook.SheetNames.find((name) =>
    ALIASES.sheet.some((alias) => normalize(name).includes(normalize(alias))),
  );
  if (direct) return direct;
  return workbook.SheetNames.find((name) => {
    const matrix = sheetToMatrix(workbook.Sheets[name]);
    return ALIASES.title.some((alias) => normalize(matrix[0]?.[2]) === normalize(alias));
  }) ?? null;
}

export async function parseBulletinExcel(
  file: File,
  preferredLocale?: BulletinLocale,
): Promise<BulletinData> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !['xlsx', 'xls'].includes(extension)) {
    throw new Error('Please upload a valid .xlsx or .xls workbook.');
  }

  const buffer = await file.arrayBuffer();
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'array', cellDates: false, cellText: true });
  } catch {
    throw new Error('The Excel file could not be opened. It may be damaged or password-protected.');
  }

  const sheetName = findBulletinSheet(workbook);
  if (!sheetName) {
    throw new Error('The workbook does not contain a recognizable English or Vietnamese FX bulletin sheet.');
  }

  const matrix = sheetToMatrix(workbook.Sheets[sheetName]);
  const locale = detectLocale(sheetName, matrix, preferredLocale);
  const copy = LOCALE_COPY[locale];
  const warnings: string[] = [];

  const titleAnchor = resolveAnchor(matrix, ALIASES.title, { row: 0, col: 2 });
  const departmentAnchor = findAnchor(matrix, ALIASES.department, { startRow: 0, endRow: 7, exact: false })
    ?? positionalAnchor(matrix, 2, locale === 'vi' ? 9 : 8);
  const highlightedNewsAnchor = resolveAnchor(matrix, ALIASES.highlightedNews, { row: 6, col: 0 });
  const eventAnchor = resolveAnchor(matrix, ALIASES.event, { row: 7, col: 1 });
  const highlightsAnchor = resolveAnchor(matrix, ALIASES.market, { row: 12, col: 1 });
  const quickAnchor = resolveAnchor(matrix, ALIASES.quick, { row: 17, col: 1 });
  const currencyAnchor = resolveAnchor(matrix, ALIASES.currencies, { row: 24, col: 0 });
  const commodityAnchor = resolveAnchor(matrix, ALIASES.commodities, { row: 36, col: 0 });
  const domesticMarketAnchor = resolveAnchor(matrix, ALIASES.domestic, { row: 43, col: 0 });
  const detailedAnchor = resolveAnchor(matrix, ALIASES.detailed, { row: 24, col: 8 }, { exact: false });
  const domesticAnalysisAnchor = resolveAnchor(
    matrix,
    ALIASES.domesticAnalysis,
    { row: 26, col: 9 },
    { startRow: 24, endRow: 51, minCol: 8 },
  );
  const internationalAnalysisAnchor = resolveAnchor(
    matrix,
    ALIASES.internationalAnalysis,
    { row: 39, col: 9 },
    { startRow: 26, endRow: 52, minCol: 8 },
  );
  const recommendationAnchor = resolveAnchor(matrix, ALIASES.recommendations, { row: 52, col: 9 });
  const disclaimerAnchor = resolveAnchor(matrix, ALIASES.disclaimer, { row: 61, col: 1 });

  if (!titleAnchor) warnings.push('Could not find the bulletin title.');
  if (!eventAnchor) warnings.push('Could not find the event calendar.');
  if (!highlightsAnchor) warnings.push('Could not find the market highlights.');
  if (!quickAnchor) warnings.push('Could not find the quick assessment.');
  if (!domesticMarketAnchor) warnings.push('Could not find the domestic USD/VND market.');
  if (!recommendationAnchor) warnings.push('Could not find recommendations.');
  if (!disclaimerAnchor) warnings.push('Could not find the information disclaimer.');

  const endRow = matrix.length;
  const currencies = parseMarketSection(
    matrix,
    currencyAnchor,
    commodityAnchor?.row ?? domesticMarketAnchor?.row ?? endRow,
    warnings,
    anchorText(matrix, currencyAnchor, copy.currencies),
  );
  const commodities = parseMarketSection(
    matrix,
    commodityAnchor,
    domesticMarketAnchor?.row ?? recommendationAnchor?.row ?? endRow,
    warnings,
    anchorText(matrix, commodityAnchor, copy.commodities),
  );

  let shapes: ShapeText[] = [];
  if (extension === 'xlsx') {
    try {
      shapes = await extractTextBoxes(buffer);
    } catch {
      warnings.push('Embedded Excel text boxes could not be read; cell-based content was used instead.');
    }
  }

  const domesticEnd = internationalAnalysisAnchor?.row ?? recommendationAnchor?.row ?? endRow;
  const internationalEnd = recommendationAnchor?.row ?? disclaimerAnchor?.row ?? endRow;
  const domesticAnalysis = nearestShape(shapes, domesticAnalysisAnchor, domesticEnd)
    || (domesticAnalysisAnchor
      ? collectCellText(matrix, domesticAnalysisAnchor.row + 1, domesticEnd, domesticAnalysisAnchor.col)
      : '');
  const internationalAnalysis = nearestShape(shapes, internationalAnalysisAnchor, internationalEnd)
    || (internationalAnalysisAnchor
      ? collectCellText(matrix, internationalAnalysisAnchor.row + 1, internationalEnd, internationalAnalysisAnchor.col)
      : '');
  if (!domesticAnalysis) warnings.push('Could not read the domestic detailed analysis.');
  if (!internationalAnalysis) warnings.push('Could not read the international detailed analysis.');

  const recommendations = parseRecommendations(
    matrix,
    recommendationAnchor,
    disclaimerAnchor?.row ?? endRow,
  );
  if (!recommendations.length && recommendationAnchor) warnings.push('Recommendations contains no readable rows.');

  const referenceRates = parseReferenceRates(matrix, domesticMarketAnchor);
  const marketRows = parseDomesticRows(
    matrix,
    domesticMarketAnchor,
    recommendationAnchor?.row ?? disclaimerAnchor?.row ?? endRow,
  );
  if (domesticMarketAnchor && !referenceRates.length) warnings.push('Reference rates could not be mapped.');
  if (domesticMarketAnchor && !marketRows.length) warnings.push('Domestic FX market rows could not be mapped.');

  const bulletinDate = firstDateNear(matrix, titleAnchor?.row ?? 0, 8);
  if (!bulletinDate) warnings.push('A valid bulletin date was not found near the header.');

  return {
    sourceFile: file.name,
    locale,
    labels: {
      ...copy,
      highlightedNews: anchorText(matrix, highlightedNewsAnchor, copy.highlightedNews),
      eventCalendar: anchorText(matrix, eventAnchor, copy.eventCalendar),
      marketHighlights: anchorText(matrix, highlightsAnchor, copy.marketHighlights),
      quickAssessment: anchorText(matrix, quickAnchor, copy.quickAssessment),
      currencies: anchorText(matrix, currencyAnchor, copy.currencies),
      commodities: anchorText(matrix, commodityAnchor, copy.commodities),
      domesticMarket: anchorText(matrix, domesticMarketAnchor, copy.domesticMarket),
      detailedAnalysis: anchorText(matrix, detailedAnchor, copy.detailedAnalysis),
      domesticAnalysis: anchorText(matrix, domesticAnalysisAnchor, copy.domesticAnalysis),
      internationalAnalysis: anchorText(matrix, internationalAnalysisAnchor, copy.internationalAnalysis),
      recommendations: anchorText(matrix, recommendationAnchor, copy.recommendations),
      disclaimer: anchorText(matrix, disclaimerAnchor, copy.disclaimer),
    },
    title: anchorText(matrix, titleAnchor, locale === 'vi' ? 'BẢN TIN NGOẠI HỐI HÀNG NGÀY' : 'FOREIGN EXCHANGE MARKET BULLETIN'),
    department: anchorText(matrix, departmentAnchor, locale === 'vi' ? 'BỘ PHẬN KINH DOANH NGOẠI TỆ' : 'FOREIGN EXCHANGE SALES DEPARTMENT - HO'),
    bulletinDate,
    highlightedNews: {
      eventCalendar: firstTextAfter(matrix, eventAnchor),
      marketHighlights: firstTextAfter(matrix, highlightsAnchor),
      quickAssessment: firstTextAfter(matrix, quickAnchor),
    },
    currencies,
    commodities,
    domesticMarket: { referenceRates, marketRows },
    usdVndChart: parseUsdVndSheet(workbook),
    analysis: { domestic: domesticAnalysis, international: internationalAnalysis },
    recommendations,
    disclaimer: firstTextAfter(matrix, disclaimerAnchor),
    footerLines: collectFooter(matrix, disclaimerAnchor),
    warnings,
  };
}
