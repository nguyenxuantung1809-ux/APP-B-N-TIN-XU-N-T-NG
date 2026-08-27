export type BulletinBlockId =
  | 'header'
  | 'highlightedNews'
  | 'currencies'
  | 'commodities'
  | 'marketLegend'
  | 'recommendations'
  | 'domesticMarket'
  | 'detailedAnalysis'
  | 'footer';

export type NestedParentId = 'header' | 'highlightedNews' | 'detailedAnalysis' | 'footer';

export type NestedBlockId =
  | 'headerVisual'
  | 'headerTitle'
  | 'headerMeta'
  | 'headerLogo'
  | 'eventCalendar'
  | 'quickAssessment'
  | 'marketHighlights'
  | 'domesticAnalysis'
  | 'internationalAnalysis'
  | 'disclaimer'
  | 'contact'
  | 'footerVisual';

export type RecommendationStyleId = `recommendationCard:${number}`;
export type TypographyTargetId = BulletinBlockId | NestedBlockId | RecommendationStyleId;
export type FontFamily = 'Inter' | 'Arial' | 'Helvetica' | 'Roboto' | 'Times New Roman' | 'Georgia';
export type ImageFitMode = 'contain' | 'cover' | 'fill';
export type ImagePositionMode = 'center' | 'top' | 'bottom' | 'left' | 'right';
export type TextAlignment = 'left' | 'center' | 'right' | 'justify';
export type RecommendationActionMode = 'buy' | 'sell' | 'blank';

export interface BlockTypographyStyle {
  fontFamily?: FontFamily;
  titleSize?: number;
  subtitleSize?: number;
  bodySize?: number;
  tableHeaderSize?: number;
  tableDataSize?: number;
  fontWeight?: number;
  textColor?: string;
  lineHeight?: number;
  textAlign?: TextAlignment;
  imageFit?: ImageFitMode;
}

export interface EditableImageState {
  source?: string;
  fit?: ImageFitMode;
  position?: ImagePositionMode;
  opacity?: number;
  hidden?: boolean;
}

export interface BulletinLayoutAssets {
  images: Record<string, EditableImageState>;
  recommendationActions: Record<string, RecommendationActionMode>;
}

export interface LayoutItem<T extends string = string> {
  i: T;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type BulletinLayoutItem = LayoutItem<BulletinBlockId>;
export type NestedLayoutItem = LayoutItem<NestedBlockId>;

export interface BulletinLayoutSnapshot {
  root: BulletinLayoutItem[];
  nested: Record<NestedParentId, NestedLayoutItem[]>;
  styles: Partial<Record<TypographyTargetId, BlockTypographyStyle>>;
  assets: BulletinLayoutAssets;
}

export interface LayoutProfile {
  id: string;
  name: string;
  snapshot: BulletinLayoutSnapshot;
  createdAt: string;
  updatedAt: string;
}

export interface StoredLayoutLibrary {
  version: 4;
  activeProfileId: string;
  profiles: LayoutProfile[];
}

export const DEFAULT_LAYOUT_ID = 'default';
export const BULLETIN_LAYOUT_LIBRARY_KEY = 'vietinbank-fx-bulletin-layout-library-v4';
export const PREVIOUS_LAYOUT_LIBRARY_KEY = 'vietinbank-fx-bulletin-layout-library-v3';
export const OLDER_LAYOUT_LIBRARY_KEY = 'vietinbank-fx-bulletin-layout-library-v2';
export const LEGACY_LAYOUT_STORAGE_KEY = 'vietinbank-fx-bulletin-layout-v1';

/** Dashboard composition from the approved screenshots, used by first-load and Reset. */
export const DEFAULT_BULLETIN_LAYOUT: BulletinLayoutSnapshot = {
  root: [
    { i: 'header', x: 0, y: 0, w: 24, h: 15 },
    { i: 'highlightedNews', x: 0, y: 15, w: 24, h: 28 },
    { i: 'currencies', x: 0, y: 43, w: 8, h: 30 },
    { i: 'commodities', x: 8, y: 43, w: 8, h: 12 },
    { i: 'marketLegend', x: 16, y: 43, w: 8, h: 30 },
    { i: 'domesticMarket', x: 8, y: 55, w: 8, h: 18 },
    { i: 'detailedAnalysis', x: 0, y: 73, w: 24, h: 36 },
    { i: 'recommendations', x: 0, y: 109, w: 24, h: 19 },
    { i: 'footer', x: 0, y: 128, w: 24, h: 18 },
  ],
  nested: {
    header: [
      { i: 'headerVisual', x: 0, y: 0, w: 6, h: 13 },
      { i: 'headerTitle', x: 6, y: 0, w: 13, h: 10 },
      { i: 'headerLogo', x: 19, y: 0, w: 5, h: 5 },
      { i: 'headerMeta', x: 19, y: 5, w: 5, h: 6 },
    ],
    highlightedNews: [
      { i: 'eventCalendar', x: 0, y: 0, w: 11, h: 9 },
      { i: 'quickAssessment', x: 0, y: 9, w: 11, h: 10 },
      { i: 'marketHighlights', x: 11, y: 0, w: 13, h: 19 },
    ],
    detailedAnalysis: [
      { i: 'domesticAnalysis', x: 0, y: 0, w: 12, h: 31 },
      { i: 'internationalAnalysis', x: 12, y: 0, w: 12, h: 31 },
    ],
    footer: [
      { i: 'disclaimer', x: 0, y: 0, w: 9, h: 14 },
      { i: 'contact', x: 9, y: 0, w: 8, h: 14 },
      { i: 'footerVisual', x: 17, y: 0, w: 7, h: 14 },
    ],
  },
  styles: {
    headerVisual: { imageFit: 'contain' },
    footerVisual: { imageFit: 'contain' },
    marketLegend: { imageFit: 'contain' },
  },
  assets: { images: {}, recommendationActions: {} },
};

export const FONT_FAMILIES: FontFamily[] = ['Inter', 'Arial', 'Helvetica', 'Roboto', 'Times New Roman', 'Georgia'];

const DEFAULT_TYPOGRAPHY: Required<BlockTypographyStyle> = {
  fontFamily: 'Inter',
  titleSize: 14,
  subtitleSize: 7,
  bodySize: 9,
  tableHeaderSize: 6,
  tableDataSize: 8.5,
  fontWeight: 400,
  textColor: '#c2d9e5',
  lineHeight: 1.45,
  textAlign: 'left',
  imageFit: 'contain',
};

export function typographyDefaultsFor(id: TypographyTargetId | ''): Required<BlockTypographyStyle> {
  const defaults = { ...DEFAULT_TYPOGRAPHY };
  if (id === 'headerTitle') return { ...defaults, titleSize: 42, subtitleSize: 8 };
  if (id === 'headerMeta' || id === 'contact' || id === 'disclaimer') return { ...defaults, titleSize: 10, bodySize: 7.5 };
  if (id === 'eventCalendar' || id === 'quickAssessment') return { ...defaults, titleSize: 11, bodySize: 9 };
  if (id === 'marketHighlights') return { ...defaults, titleSize: 14, subtitleSize: 6, bodySize: 8.7, lineHeight: 1.42 };
  if (id === 'domesticMarket') return { ...defaults, tableHeaderSize: 5.8, tableDataSize: 11 };
  if (id.startsWith('recommendationCard:')) return { ...defaults, titleSize: 10, subtitleSize: 6, bodySize: 7.6 };
  return defaults;
}

const ROOT_IDS = DEFAULT_BULLETIN_LAYOUT.root.map((item) => item.i);
const NESTED_IDS = Object.fromEntries(
  Object.entries(DEFAULT_BULLETIN_LAYOUT.nested).map(([parent, items]) => [parent, items.map((item) => item.i)]),
) as Record<NestedParentId, NestedBlockId[]>;
const STATIC_STYLE_IDS = new Set<string>([...ROOT_IDS, ...Object.values(NESTED_IDS).flat()]);
const FONT_FAMILY_SET = new Set<string>(FONT_FAMILIES);
const IMAGE_FIT_SET = new Set<string>(['contain', 'cover', 'fill']);
const IMAGE_POSITION_SET = new Set<string>(['center', 'top', 'bottom', 'left', 'right']);
const TEXT_ALIGNMENT_SET = new Set<string>(['left', 'center', 'right', 'justify']);
const RECOMMENDATION_ACTION_SET = new Set<string>(['buy', 'sell', 'blank']);
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function normalizeItems<T extends string>(items: LayoutItem<T>[], requiredIds: T[], minWidth: number, minHeight: number): LayoutItem<T>[] | null {
  if (!Array.isArray(items) || items.length !== requiredIds.length) return null;
  const ids = new Set(items.map((item) => item.i));
  if (ids.size !== requiredIds.length || requiredIds.some((id) => !ids.has(id))) return null;
  if (items.some((item) => !Number.isFinite(item.x) || !Number.isFinite(item.y) || !Number.isFinite(item.w) || !Number.isFinite(item.h))) return null;
  return items.map((item) => {
    const w = Math.max(minWidth, Math.min(24, Math.round(item.w)));
    return {
      i: item.i,
      x: Math.max(0, Math.min(24 - w, Math.round(item.x))),
      y: Math.max(0, Math.round(item.y)),
      w,
      h: Math.max(minHeight, Math.round(item.h)),
    };
  });
}

function normalizeItemsWithDefaults<T extends string>(
  items: LayoutItem<T>[],
  defaults: LayoutItem<T>[],
  minWidth: number,
  minHeight: number,
): LayoutItem<T>[] | null {
  if (!Array.isArray(items)) return null;
  const requiredIds = defaults.map((item) => item.i);
  const requiredIdSet = new Set(requiredIds);
  const knownItems = items.filter((item) => requiredIdSet.has(item.i));
  const byId = new Map(knownItems.map((item) => [item.i, item]));
  const merged = defaults.map((fallback) => byId.get(fallback.i) ?? fallback);
  return normalizeItems(merged, requiredIds, minWidth, minHeight);
}

function normalizeStyles(value: unknown): BulletinLayoutSnapshot['styles'] {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value).flatMap(([id, raw]) => {
    if (!STATIC_STYLE_IDS.has(id) && !/^recommendationCard:\d+$/.test(id)) return [];
    if (!raw || typeof raw !== 'object') return [];
    const candidate = raw as BlockTypographyStyle;
    const style: BlockTypographyStyle = {};
    if (candidate.fontFamily && FONT_FAMILY_SET.has(candidate.fontFamily)) style.fontFamily = candidate.fontFamily;
    for (const field of ['titleSize', 'subtitleSize', 'bodySize', 'tableHeaderSize', 'tableDataSize'] as const) {
      const size = candidate[field];
      if (Number.isFinite(size)) style[field] = Math.max(5, Math.min(96, Number(size)));
    }
    if (Number.isFinite(candidate.fontWeight)) style.fontWeight = Math.max(100, Math.min(900, Math.round(Number(candidate.fontWeight) / 100) * 100));
    if (typeof candidate.textColor === 'string' && HEX_COLOR_PATTERN.test(candidate.textColor)) style.textColor = candidate.textColor;
    if (Number.isFinite(candidate.lineHeight)) style.lineHeight = Math.max(.8, Math.min(3, Number(candidate.lineHeight)));
    if (candidate.textAlign && TEXT_ALIGNMENT_SET.has(candidate.textAlign)) style.textAlign = candidate.textAlign;
    if (candidate.imageFit && IMAGE_FIT_SET.has(candidate.imageFit)) style.imageFit = candidate.imageFit;
    return [[id, style]];
  })) as BulletinLayoutSnapshot['styles'];
}

function normalizeAssets(value: unknown): BulletinLayoutAssets {
  if (!value || typeof value !== 'object') return { images: {}, recommendationActions: {} };
  const candidate = value as BulletinLayoutAssets & { chartImage?: string };
  const rawImages = candidate.images && typeof candidate.images === 'object' ? candidate.images : {};
  const images = Object.fromEntries(Object.entries(rawImages).flatMap(([id, raw]) => {
    if (!id || !raw || typeof raw !== 'object') return [];
    const asset = raw as EditableImageState;
    const normalized: EditableImageState = {};
    if (typeof asset.source === 'string' && asset.source.startsWith('data:image/')) normalized.source = asset.source;
    if (asset.fit && IMAGE_FIT_SET.has(asset.fit)) normalized.fit = asset.fit;
    if (asset.position && IMAGE_POSITION_SET.has(asset.position)) normalized.position = asset.position;
    if (Number.isFinite(asset.opacity)) normalized.opacity = Math.max(0, Math.min(1, Number(asset.opacity)));
    if (asset.hidden === true) normalized.hidden = true;
    return [[id, normalized]];
  }));
  if (typeof candidate.chartImage === 'string' && candidate.chartImage.startsWith('data:image/') && !images.chartImage) {
    images.chartImage = { source: candidate.chartImage, fit: 'contain', position: 'center', opacity: 1 };
  }
  const recommendationActions = Object.fromEntries(Object.entries(candidate.recommendationActions ?? {}).flatMap(([id, action]) => {
    if (!/^\d+$/.test(id) || !RECOMMENDATION_ACTION_SET.has(action)) return [];
    return [[id, action as RecommendationActionMode]];
  }));
  return { images, recommendationActions };
}

export function cloneLayoutSnapshot(snapshot: BulletinLayoutSnapshot = DEFAULT_BULLETIN_LAYOUT): BulletinLayoutSnapshot {
  return {
    root: snapshot.root.map((item) => ({ ...item })),
    nested: {
      header: snapshot.nested.header.map((item) => ({ ...item })),
      highlightedNews: snapshot.nested.highlightedNews.map((item) => ({ ...item })),
      detailedAnalysis: snapshot.nested.detailedAnalysis.map((item) => ({ ...item })),
      footer: snapshot.nested.footer.map((item) => ({ ...item })),
    },
    styles: Object.fromEntries(Object.entries(snapshot.styles ?? {}).map(([id, style]) => [id, { ...style }])),
    assets: {
      images: Object.fromEntries(Object.entries(snapshot.assets?.images ?? {}).map(([id, asset]) => [id, { ...asset }])),
      recommendationActions: { ...(snapshot.assets?.recommendationActions ?? {}) },
    },
  };
}

export function normalizeLayoutSnapshot(value: unknown): BulletinLayoutSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as BulletinLayoutSnapshot;
  const root = normalizeItems(candidate.root, ROOT_IDS, 4, 4) as BulletinLayoutItem[] | null;
  if (!root || !candidate.nested) return null;
  const header = normalizeItems(candidate.nested.header, NESTED_IDS.header, 2, 2) as NestedLayoutItem[] | null;
  const highlightedNews = normalizeItems(candidate.nested.highlightedNews, NESTED_IDS.highlightedNews, 3, 3) as NestedLayoutItem[] | null;
  const detailedAnalysis = normalizeItems(candidate.nested.detailedAnalysis, NESTED_IDS.detailedAnalysis, 4, 4) as NestedLayoutItem[] | null;
  // Footer Visual was temporarily absent in one released layout schema. Merge
  // missing footer children from the current defaults so those saved layouts
  // remain loadable instead of being discarded as invalid.
  const footer = normalizeItemsWithDefaults(
    candidate.nested.footer,
    DEFAULT_BULLETIN_LAYOUT.nested.footer,
    3,
    3,
  ) as NestedLayoutItem[] | null;
  if (!header || !highlightedNews || !detailedAnalysis || !footer) return null;
  return {
    root,
    nested: { header, highlightedNews, detailedAnalysis, footer },
    styles: normalizeStyles(candidate.styles),
    assets: normalizeAssets(candidate.assets),
  };
}

export function parseLayoutLibrary(value: string | null): StoredLayoutLibrary | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as StoredLayoutLibrary & { version: number };
    if (![2, 3, 4].includes(parsed.version) || !Array.isArray(parsed.profiles)) return null;
    const profiles = parsed.profiles.flatMap((profile) => {
      const snapshot = normalizeLayoutSnapshot(profile.snapshot);
      if (!snapshot || typeof profile.id !== 'string' || typeof profile.name !== 'string' || !profile.name.trim()) return [];
      return [{ ...profile, name: profile.name.trim(), snapshot }];
    });
    const activeProfileId = profiles.some((profile) => profile.id === parsed.activeProfileId) ? parsed.activeProfileId : DEFAULT_LAYOUT_ID;
    return { version: 4, activeProfileId, profiles };
  } catch {
    return null;
  }
}

export function migrateLegacyLayout(value: string | null): LayoutProfile | null {
  if (!value) return null;
  try {
    const legacy = JSON.parse(value) as Array<LayoutItem<BulletinBlockId>>;
    if (!Array.isArray(legacy) || legacy.length === 0) return null;
    const snapshot = cloneLayoutSnapshot();
    const migratedIds = new Set(['highlightedNews', 'currencies', 'commodities', 'marketLegend', 'recommendations', 'domesticMarket', 'detailedAnalysis']);
    snapshot.root = snapshot.root.map((item) => {
      if (!migratedIds.has(item.i)) return item;
      const old = legacy.find((legacyItem) => legacyItem.i === item.i);
      return old ? { ...item, x: old.x, y: old.y + 12, w: old.w, h: old.h } : item;
    });
    const contentBottom = Math.max(...snapshot.root.filter((item) => item.i !== 'footer').map((item) => item.y + item.h));
    snapshot.root = snapshot.root.map((item) => item.i === 'footer' ? { ...item, y: contentBottom } : item);
    const now = new Date().toISOString();
    return { id: `migrated-${Date.now()}`, name: 'Migrated Layout', snapshot, createdAt: now, updatedAt: now };
  } catch {
    return null;
  }
}
