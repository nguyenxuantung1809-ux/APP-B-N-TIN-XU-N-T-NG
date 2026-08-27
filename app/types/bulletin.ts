export interface MarketRow {
  instrument: string;
  open: number | null;
  close: number | null;
  high: number | null;
  low: number | null;
  change: number | null;
}

export interface MarketSection {
  asOf: Date | string | number | null;
  rows: MarketRow[];
}

export interface DataPoint {
  label: string;
  value: number | string | null;
}

export interface DomesticMarketRow {
  market: string;
  bid: number | null;
  ask: number | null;
  change: number | null;
  bidPriceT2: number | null;
}

export interface Recommendation {
  product: string;
  benefit: string;
}

export interface UsdVndChartPoint {
  date: string;
  sbvCentral: number | null;
  blackMarket: number | null;
  interbank: number | null;
}

export interface UsdVndChartData {
  sourceSheet: string | null;
  points: UsdVndChartPoint[];
}

export type BulletinLocale = 'en' | 'vi';

export interface BulletinLabels {
  headerOverline: string;
  highlightedNews: string;
  eventCalendar: string;
  marketHighlights: string;
  quickAssessment: string;
  currencies: string;
  commodities: string;
  chart: string;
  domesticMarket: string;
  detailedAnalysis: string;
  domesticAnalysis: string;
  domesticKicker: string;
  internationalAnalysis: string;
  internationalKicker: string;
  recommendations: string;
  recommendationKicker: string;
  recommendationFallback: string;
  benefitFallback: string;
  disclaimer: string;
  table: {
    instrument: string;
    open: string;
    close: string;
    high: string;
    low: string;
    change: string;
    fxMarket: string;
    bid: string;
    ask: string;
    bidPriceT2: string;
  };
}

export interface BulletinData {
  sourceFile: string;
  locale: BulletinLocale;
  labels: BulletinLabels;
  title: string;
  department: string;
  bulletinDate: Date | string | number | null;
  highlightedNews: {
    eventCalendar: string;
    marketHighlights: string;
    quickAssessment: string;
  };
  currencies: MarketSection;
  commodities: MarketSection;
  domesticMarket: {
    referenceRates: DataPoint[];
    marketRows: DomesticMarketRow[];
  };
  usdVndChart: UsdVndChartData;
  analysis: {
    domestic: string;
    international: string;
  };
  recommendations: Recommendation[];
  disclaimer: string;
  footerLines: string[];
  warnings: string[];
}

export type ParseState = 'idle' | 'parsing' | 'success' | 'error';
