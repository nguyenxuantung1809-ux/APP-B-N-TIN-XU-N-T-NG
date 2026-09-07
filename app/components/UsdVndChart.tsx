'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { pointsInLatestChartYear } from '../lib/chartWindow';
import {
  formatPercentChange,
  formatSignedChange,
  getLatestSeriesChange,
  movementSymbol,
  type LatestSeriesChange,
} from '../lib/chartSeriesStats';
import type { BulletinLocale, UsdVndChartData, UsdVndChartPoint, UsdVndChartSeries } from '../types/bulletin';

const DEFAULT_SERIES: UsdVndChartSeries[] = [
  { key: 'sbvCentral', label: 'SBV Central Rate', labelVi: 'Tỷ giá trung tâm NHNN', color: '#ffd04a' },
  { key: 'blackMarket', label: 'Black Market', labelVi: 'Thị trường tự do', color: '#55df91' },
  { key: 'interbank', label: 'Interbank', labelVi: 'Liên ngân hàng', color: '#3dbaf7' },
];

type DisplaySeries = { key: string; label: string; color: string };

const seriesFor = (data: UsdVndChartData, locale: BulletinLocale): DisplaySeries[] => (data.series?.length ? data.series : DEFAULT_SERIES)
  .filter((series) => series.key && series.key !== 'date')
  .map((series) => ({ key: series.key, label: locale === 'vi' && series.labelVi ? series.labelVi : series.label, color: series.color }));

const exchangeRateFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

function formatOptionalRate(value: number | null) {
  return value === null ? '—' : exchangeRateFormatter.format(value);
}

function formatChartDate(value: string, includeYear = true) {
  const [year, month, day] = value.split('-');
  return includeYear ? `${day}/${month}/${year}` : `${day}/${month}/${year.slice(-2)}`;
}

function yDomain(points: UsdVndChartPoint[], seriesItems: DisplaySeries[]): [number, number] {
  const values = points.flatMap((point) => seriesItems.map((series) => point[series.key]).filter((value): value is number => typeof value === 'number' && Number.isFinite(value)));
  if (!values.length) return [0, 1];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const spread = Math.max(maximum - minimum, 100);
  const padding = Math.max(25, spread * 0.08);
  return [Math.floor((minimum - padding) / 10) * 10, Math.ceil((maximum + padding) / 10) * 10];
}

function ChartTooltip({ active, payload, label, seriesItems }: { active?: boolean; payload?: ReadonlyArray<{ payload?: UsdVndChartPoint }>; label?: string | number; seriesItems: DisplaySeries[] }) {
  if (!active || !payload?.length || typeof label !== 'string') return null;
  const point = payload.find((entry) => entry.payload)?.payload;
  if (!point) return null;
  return <div className="usd-vnd-tooltip">
    <strong>{formatChartDate(label)}</strong>
    {seriesItems.map((series) => <span key={series.key}><i style={{ backgroundColor: series.color }} />{series.label}<b>{formatOptionalRate(typeof point[series.key] === 'number' ? point[series.key] : null)}</b></span>)}
  </div>;
}

interface ChartXAxisTickProps {
  x?: number;
  y?: number;
  payload?: { value?: string | number };
  firstDate: string;
  lastDate: string;
  fontSize: number;
}

function ChartXAxisTick({ x = 0, y = 0, payload, firstDate, lastDate, fontSize }: ChartXAxisTickProps) {
  const value = typeof payload?.value === 'string' ? payload.value : String(payload?.value ?? '');
  if (!value) return null;
  const textAnchor = value === firstDate ? 'start' : value === lastDate ? 'end' : 'middle';
  return <text x={x} y={y} dy="0.71em" fill="#78a9bf" fontSize={fontSize} textAnchor={textAnchor}>{formatChartDate(value, false)}</text>;
}

function movementDescription(series: DisplaySeries, stats: LatestSeriesChange, locale: BulletinLocale) {
  if (stats.currentValue === null) return locale === 'vi' ? `${series.label}: không có dữ liệu.` : `${series.label}: data unavailable.`;
  if (stats.previousValue === null || stats.absoluteChange === null) return locale === 'vi'
    ? `${series.label}: giá hiện tại ${formatOptionalRate(stats.currentValue)}; chưa có phiên trước để so sánh.`
    : `${series.label}: current value ${formatOptionalRate(stats.currentValue)}; no previous session is available.`;
  const direction = stats.movement === 'positive' ? (locale === 'vi' ? 'tăng' : 'increased') : stats.movement === 'negative' ? (locale === 'vi' ? 'giảm' : 'decreased') : (locale === 'vi' ? 'không đổi' : 'was unchanged');
  const percent = formatPercentChange(stats.percentageChange).replace('%', '');
  return locale === 'vi'
    ? `${series.label} ${direction} ${formatSignedChange(stats.absoluteChange, exchangeRateFormatter)}, tương đương ${percent === '--' ? 'không xác định' : `${percent} phần trăm`}, so với phiên trước.`
    : `${series.label} ${direction} ${formatSignedChange(stats.absoluteChange, exchangeRateFormatter)}, or ${percent === '--' ? 'an unavailable percentage' : `${percent} percent`}, from the previous session.`;
}

function statTooltip(stats: LatestSeriesChange, locale: BulletinLocale) {
  const previousLabel = locale === 'vi' ? 'Phiên trước' : 'Previous session';
  const currentLabel = locale === 'vi' ? 'Hiện tại' : 'Current';
  const changeLabel = locale === 'vi' ? 'Thay đổi' : 'Change';
  return [
    `${previousLabel}: ${formatOptionalRate(stats.previousValue)}`,
    `${currentLabel}: ${formatOptionalRate(stats.currentValue)}`,
    `${changeLabel}: ${formatSignedChange(stats.absoluteChange, exchangeRateFormatter)}`,
    `${changeLabel}: ${formatPercentChange(stats.percentageChange)}`,
  ].join('\n');
}

export function UsdVndChart({ data, locale, tableDataFontSize }: { data: UsdVndChartData; locale: BulletinLocale; tableDataFontSize: number }) {
  const chartPoints = pointsInLatestChartYear(data.points);
  if (!chartPoints.length) return <div className="usd-vnd-chart-empty"><span>{locale === 'vi' ? 'Không có dữ liệu biểu đồ USD/VND' : 'No USD/VND chart data'}</span></div>;
  const seriesItems = seriesFor(data, locale);
  const domain = yDomain(chartPoints, seriesItems);
  const latest = chartPoints.at(-1)!;
  // The plot keeps its one-year window, while "previous session" is resolved
  // from the full dataset so a valid point just outside that window is not lost.
  const seriesStats = seriesItems.map((series) => ({ series, stats: getLatestSeriesChange(data.points, series.key) }));
  const latestSummary = seriesStats.map(({ series, stats }) => `${series.label} ${stats.currentValue === null ? (locale === 'vi' ? 'không có' : 'not available') : formatOptionalRate(stats.currentValue)}`).join(', ');

  return <div className="usd-vnd-chart" role="group" aria-label={`USD/VND line chart with ${chartPoints.length} dates. Latest chart date ${formatChartDate(latest.date)}. ${latestSummary}.`}>
    <div className="usd-vnd-chart-stats" role="list" aria-label={locale === 'vi' ? 'Thống kê thị trường mới nhất' : 'Latest market statistics'}>{seriesStats.map(({ series, stats }) => <div key={series.key} className="usd-vnd-chart-stat" role="listitem" aria-label={movementDescription(series, stats, locale)} title={statTooltip(stats, locale)}>
      <div className="usd-vnd-chart-stat-name"><i style={{ backgroundColor: series.color }} /><span>{series.label}</span></div>
      <div className="usd-vnd-chart-stat-reading"><strong>{formatOptionalRate(stats.currentValue)}</strong><span className={`usd-vnd-chart-stat-change ${stats.movement === 'unavailable' ? 'neutral' : stats.movement}`}><b aria-hidden="true">{movementSymbol(stats.movement)}</b><span>{formatSignedChange(stats.absoluteChange, exchangeRateFormatter)}</span><em>/</em><span>{formatPercentChange(stats.percentageChange)}</span></span></div>
    </div>)}</div>
    <div className="usd-vnd-chart-canvas" style={{ fontSize: `${tableDataFontSize}px` }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={90} debounce={60}>
        <LineChart data={chartPoints} margin={{ top: 7, right: 11, bottom: 2, left: 3 }} accessibilityLayer>
          <CartesianGrid stroke="rgba(93, 192, 238, .13)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="date" interval="preserveStartEnd" minTickGap={64} fontSize={tableDataFontSize} tick={(props) => <ChartXAxisTick {...props} firstDate={chartPoints[0].date} lastDate={latest.date} fontSize={tableDataFontSize} />} tickLine={false} axisLine={{ stroke: 'rgba(79, 181, 228, .24)' }} />
          <YAxis domain={domain} tickFormatter={(value: number) => exchangeRateFormatter.format(value)} width="auto" fontSize={tableDataFontSize} tick={{ fill: '#78a9bf', fontSize: tableDataFontSize }} tickLine={false} axisLine={false} tickCount={5} />
          <Tooltip content={<ChartTooltip seriesItems={seriesItems} />} cursor={{ stroke: 'rgba(153, 226, 255, .45)', strokeWidth: 1 }} isAnimationActive={false} />
          {seriesItems.map((series) => <Line key={series.key} type="monotone" dataKey={series.key} name={series.label} stroke={series.color} strokeWidth={1.8} dot={false} activeDot={{ r: 3, strokeWidth: 1 }} connectNulls={false} isAnimationActive={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>;
}
