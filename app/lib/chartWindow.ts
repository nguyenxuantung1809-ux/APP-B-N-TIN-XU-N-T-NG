import type { UsdVndChartPoint } from '../types/bulletin';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function chartDateTimestamp(value: string) {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return timestamp;
}

/**
 * Returns only the calendar year ending at the newest date in the dataset.
 * The source points are never mutated or removed, and every rate series stays
 * aligned because filtering happens once at the shared chart-point level.
 */
export function pointsInLatestChartYear(points: UsdVndChartPoint[]) {
  const datedPoints = points.map((point) => ({ point, timestamp: chartDateTimestamp(point.date) }));
  const validTimestamps = datedPoints.flatMap(({ timestamp }) => timestamp === null ? [] : [timestamp]);
  if (validTimestamps.length === 0) return points;

  const latestTimestamp = Math.max(...validTimestamps);
  const latestDate = new Date(latestTimestamp);
  const cutoffTimestamp = Date.UTC(
    latestDate.getUTCFullYear() - 1,
    latestDate.getUTCMonth(),
    latestDate.getUTCDate(),
  );

  return datedPoints
    .filter(({ timestamp }) => timestamp !== null && timestamp >= cutoffTimestamp && timestamp <= latestTimestamp)
    .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
    .map(({ point }) => point);
}
