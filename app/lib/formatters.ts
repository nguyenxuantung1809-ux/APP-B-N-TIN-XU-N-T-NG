import * as XLSX from 'xlsx';
import type { BulletinLocale } from '../types/bulletin';

function serialToDate(value: number): Date | null {
  const parsed = XLSX.SSF.parse_date_code(value);
  if (!parsed) return null;
  return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, 12));
}

export function coerceDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'number') return serialToDate(value);
  if (typeof value !== 'string' || !value.trim()) return null;

  const text = value.trim();
  const slash = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (slash) {
    const [, first, second, year] = slash;
    const day = Number(first);
    const month = Number(second);
    const date = new Date(Date.UTC(Number(year), month - 1, day, 12));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatLongDate(value: unknown, locale: BulletinLocale = 'en'): string {
  const date = coerceDate(value);
  if (!date) return locale === 'vi' ? 'Không có ngày' : 'Date not available';
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatShortDate(value: unknown, locale: BulletinLocale = 'en'): string {
  const date = coerceDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatMarketNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  const absolute = Math.abs(value);
  const maximumFractionDigits = absolute < 10 ? 4 : absolute < 100 ? 3 : 2;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatExchangeRate(value: number | string | null): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
  }
  return value === null || value === '' ? '—' : String(value);
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  const scaled = value * 100;
  if (Math.abs(scaled) < 0.005) return '0.00%';
  return `${scaled > 0 ? '+' : ''}${scaled.toFixed(2)}%`;
}

export function changeTone(value: number | null): 'positive' | 'negative' | 'neutral' {
  if (value === null || Math.abs(value) < Number.EPSILON) return 'neutral';
  return value > 0 ? 'positive' : 'negative';
}
