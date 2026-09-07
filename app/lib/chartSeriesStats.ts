import type { UsdVndChartPoint } from '../types/bulletin';

export type SeriesMovement = 'positive' | 'negative' | 'neutral' | 'unavailable';

export interface LatestSeriesChange {
  currentValue: number | null;
  previousValue: number | null;
  currentDate: string | null;
  previousDate: string | null;
  absoluteChange: number | null;
  percentageChange: number | null;
  movement: SeriesMovement;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Finds the last two valid observations for one series independently. */
export function getLatestSeriesChange(points: UsdVndChartPoint[], seriesKey: string): LatestSeriesChange {
  let currentValue: number | null = null;
  let previousValue: number | null = null;
  let currentDate: string | null = null;
  let previousDate: string | null = null;

  const chronologicalPoints = [...points].sort((left, right) => left.date.localeCompare(right.date));

  for (let index = chronologicalPoints.length - 1; index >= 0; index -= 1) {
    const point = chronologicalPoints[index];
    const value = point[seriesKey];
    if (!finiteNumber(value)) continue;
    if (currentValue === null) {
      currentValue = value;
      currentDate = point.date;
      continue;
    }
    previousValue = value;
    previousDate = point.date;
    break;
  }

  if (currentValue === null || previousValue === null) {
    return { currentValue, previousValue, currentDate, previousDate, absoluteChange: null, percentageChange: null, movement: 'unavailable' };
  }

  const absoluteChange = currentValue - previousValue;
  const percentageChange = previousValue === 0 ? null : (absoluteChange / previousValue) * 100;
  const movement = Math.abs(absoluteChange) < Number.EPSILON
    ? 'neutral'
    : absoluteChange > 0 ? 'positive' : 'negative';

  return { currentValue, previousValue, currentDate, previousDate, absoluteChange, percentageChange, movement };
}

export function movementSymbol(movement: SeriesMovement) {
  if (movement === 'positive') return '▲';
  if (movement === 'negative') return '▼';
  return '–';
}

export function formatSignedChange(value: number | null, formatter: Intl.NumberFormat) {
  if (value === null) return '--';
  if (Math.abs(value) < Number.EPSILON) return formatter.format(0);
  return `${value > 0 ? '+' : '-'}${formatter.format(Math.abs(value))}`;
}

export function formatPercentChange(value: number | null, precision = 2) {
  if (value === null) return '--';
  const rounded = Number(value.toFixed(precision));
  if (Math.abs(rounded) < Number.EPSILON) return `${(0).toFixed(precision)}%`;
  return `${rounded > 0 ? '+' : '-'}${Math.abs(rounded).toFixed(precision)}%`;
}
