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
import type { BulletinLocale, UsdVndChartData, UsdVndChartPoint } from '../types/bulletin';

const seriesFor = (locale: BulletinLocale) => [
  { key: 'sbvCentral', label: locale === 'vi' ? 'Tỷ giá trung tâm NHNN' : 'SBV Central Rate', color: '#ffd04a' },
  { key: 'blackMarket', label: locale === 'vi' ? 'Thị trường tự do' : 'Black Market', color: '#55df91' },
  { key: 'interbank', label: locale === 'vi' ? 'Liên ngân hàng' : 'Interbank', color: '#3dbaf7' },
] as const;

const exchangeRateFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

function formatOptionalRate(value: number | null) {
  return value === null ? '—' : exchangeRateFormatter.format(value);
}

function formatChartDate(value: string, includeYear = true) {
  const [year, month, day] = value.split('-');
  return includeYear ? `${day}/${month}/${year}` : `${day}/${month}/${year.slice(-2)}`;
}

function yDomain(points: UsdVndChartPoint[]): [number, number] {
  const values = points.flatMap((point) => [point.sbvCentral, point.blackMarket, point.interbank].filter((value): value is number => value !== null));
  if (!values.length) return [0, 1];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const spread = Math.max(maximum - minimum, 100);
  const padding = Math.max(25, spread * 0.08);
  return [Math.floor((minimum - padding) / 10) * 10, Math.ceil((maximum + padding) / 10) * 10];
}

function ChartTooltip({ active, payload, label, locale }: { active?: boolean; payload?: ReadonlyArray<{ payload?: UsdVndChartPoint }>; label?: string | number; locale: BulletinLocale }) {
  if (!active || !payload?.length || typeof label !== 'string') return null;
  const point = payload.find((entry) => entry.payload)?.payload;
  if (!point) return null;
  return <div className="usd-vnd-tooltip">
    <strong>{formatChartDate(label)}</strong>
    {seriesFor(locale).map((series) => <span key={series.key}><i style={{ backgroundColor: series.color }} />{series.label}<b>{formatOptionalRate(point[series.key])}</b></span>)}
  </div>;
}

export function UsdVndChart({ data, locale }: { data: UsdVndChartData; locale: BulletinLocale }) {
  const chartPoints = pointsInLatestChartYear(data.points);
  if (!chartPoints.length) return <div className="usd-vnd-chart-empty"><span>{locale === 'vi' ? 'Không có dữ liệu biểu đồ USD/VND' : 'No USD/VND chart data'}</span></div>;
  const domain = yDomain(chartPoints);
  const latest = chartPoints.at(-1)!;
  const seriesItems = seriesFor(locale);
  const latestSummary = seriesItems.map((series) => `${series.label} ${latest[series.key] === null ? (locale === 'vi' ? 'không có' : 'not available') : formatOptionalRate(latest[series.key])}`).join(', ');

  return <div className="usd-vnd-chart" role="img" aria-label={`USD/VND line chart with ${chartPoints.length} dates. Latest ${formatChartDate(latest.date)}: ${latestSummary}.`}>
    <div className="usd-vnd-chart-legend" aria-hidden="true">{seriesItems.map((series) => <span key={series.key}><i style={{ backgroundColor: series.color }} />{series.label}</span>)}</div>
    <div className="usd-vnd-chart-canvas">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={90} debounce={60}>
        <LineChart data={chartPoints} margin={{ top: 7, right: 11, bottom: 2, left: 3 }} accessibilityLayer>
          <CartesianGrid stroke="rgba(93, 192, 238, .13)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="date" tickFormatter={(value: string) => formatChartDate(value, false)} interval="preserveStartEnd" minTickGap={42} tick={{ fill: '#78a9bf' }} tickLine={false} axisLine={{ stroke: 'rgba(79, 181, 228, .24)' }} />
          <YAxis domain={domain} tickFormatter={(value: number) => exchangeRateFormatter.format(value)} width={44} tick={{ fill: '#78a9bf' }} tickLine={false} axisLine={false} tickCount={5} />
          <Tooltip content={<ChartTooltip locale={locale} />} cursor={{ stroke: 'rgba(153, 226, 255, .45)', strokeWidth: 1 }} isAnimationActive={false} />
          {seriesItems.map((series) => <Line key={series.key} type="monotone" dataKey={series.key} name={series.label} stroke={series.color} strokeWidth={1.8} dot={false} activeDot={{ r: 3, strokeWidth: 1 }} connectNulls={false} isAnimationActive={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>;
}
