'use client';

import {
  BanknoteArrowDown,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  Globe2,
  GripVertical,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import GridLayout, { type Layout } from 'react-grid-layout';
import { changeTone, formatExchangeRate, formatLongDate } from '../lib/formatters';
import type { BulletinData } from '../types/bulletin';
import { typographyDefaultsFor } from '../types/bulletinLayout';
import type {
  BulletinBlockId,
  BulletinLayoutSnapshot,
  BlockTypographyStyle,
  EditableImageState,
  NestedBlockId,
  NestedLayoutItem,
  NestedParentId,
  RecommendationActionMode,
  TypographyTargetId,
} from '../types/bulletinLayout';
import { AssessmentIcon, CommodityGroupIcon, GlobalMarketsGlobeIcon, RecommendationIdeaIcon, VietnamFlagIcon, WorldMarketIcon } from './BulletinIcons';
import { EditableImage, type EditableImageRenderer } from './EditableImage';
import { MarketTable } from './MarketTable';
import { UsdVndChart } from './UsdVndChart';

const ROOT_ROW_HEIGHT = 6;
const ROOT_GAP = 8;
const NESTED_ROW_HEIGHT = 8;
const NESTED_GAP = 6;
const RESIZE_HANDLES = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const;
const EDITOR_LABELS: Record<BulletinBlockId | NestedBlockId, string> = {
  header: 'Header',
  highlightedNews: 'Highlighted News of the Day',
  currencies: 'Currencies',
  commodities: 'Commodities',
  marketLegend: 'Chart',
  recommendations: 'Recommendations',
  domesticMarket: 'Domestic USD / VND',
  detailedAnalysis: 'Detailed Analysis',
  footer: 'Footer',
  headerVisual: 'Header Visual',
  headerTitle: 'FOREIGN EXCHANGE MARKET BULLETIN',
  headerMeta: 'Department and Date',
  headerLogo: 'VietinBank Logo',
  eventCalendar: 'Today’s Event Calendar',
  quickAssessment: 'Quick Assessment',
  marketHighlights: 'Market Highlights',
  domesticAnalysis: 'Domestic Analysis',
  internationalAnalysis: 'International Analysis',
  disclaimer: 'Recommended Use of Information',
  contact: 'Contact Information',
  footerVisual: 'Footer Image',
};

type TypographyVariables = CSSProperties & Record<`--block-${string}`, string>;

function typographyVariables(style?: BlockTypographyStyle): TypographyVariables | undefined {
  if (!style) return undefined;
  const variables: TypographyVariables = {};
  if (style.fontFamily) variables['--block-font-family'] = style.fontFamily;
  if (style.titleSize) variables['--block-title-size'] = `${style.titleSize}px`;
  if (style.subtitleSize) variables['--block-subtitle-size'] = `${style.subtitleSize}px`;
  if (style.bodySize) variables['--block-body-size'] = `${style.bodySize}px`;
  if (style.tableHeaderSize) variables['--block-table-header-size'] = `${style.tableHeaderSize}px`;
  if (style.tableDataSize) variables['--block-table-data-size'] = `${style.tableDataSize}px`;
  if (style.fontWeight) variables['--block-font-weight'] = String(style.fontWeight);
  if (style.textColor) variables['--block-text-color'] = style.textColor;
  if (style.lineHeight) variables['--block-line-height'] = String(style.lineHeight);
  if (style.textAlign) variables['--block-text-align'] = style.textAlign;
  if (style.imageFit) variables['--block-image-fit'] = style.imageFit;
  return variables;
}

function Paragraphs({ value }: { value: string }) {
  if (!value) return <p className="empty-copy">Content not available in this workbook.</p>;
  return <>{value.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={`${paragraph.slice(0, 24)}-${index}`}>{paragraph}</p>)}</>;
}

function useMeasuredWidth<T extends HTMLElement>(minimum = 240) {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(1280);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setWidth(Math.max(minimum, element.clientWidth));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [minimum]);
  return { ref, width };
}

function stripLayout<T extends string>(next: Layout[]) {
  return next.map(({ i, x, y, w, h }) => ({ i: i as T, x, y, w, h }));
}

function layoutsEqual<T extends string>(a: Array<{ i: T; x: number; y: number; w: number; h: number }>, b: Array<{ i: T; x: number; y: number; w: number; h: number }>) {
  return a.length === b.length && a.every((item) => {
    const other = b.find((candidate) => candidate.i === item.i);
    return other && item.x === other.x && item.y === other.y && item.w === other.w && item.h === other.h;
  });
}

interface ChildFrameProps {
  id: NestedBlockId;
  label: string;
  isEditing: boolean;
  selected: boolean;
  onSelect: (additive: boolean) => void;
  style?: BlockTypographyStyle;
  className?: string;
  children: React.ReactNode;
}

function ChildFrame({ id, label, isEditing, selected, onSelect, style, className = '', children }: ChildFrameProps) {
  return (
    <article
      data-editor-element-id={`typography:${id}`}
      data-child-block-id={id}
      data-editor-selected={isEditing && selected ? 'true' : undefined}
      className={`nested-child-block typography-scope ${className}${selected ? ' is-selected' : ''}`}
      style={typographyVariables(style)}
      onMouseDown={(event) => {
        if (!isEditing) return;
        if ((event.target as Element).closest('[data-editable-image-id]')) return;
        if ((event.target as Element).closest('.child-drag-handle')) return;
        event.stopPropagation();
        onSelect(event.shiftKey);
      }}
    >
      {isEditing && <button type="button" className="child-drag-handle no-print" aria-label={`Drag ${label}`} title={`Drag ${label}`} onClick={() => onSelect(false)}><GripVertical size={14} /><span>{label}</span></button>}
      <div className="nested-child-content">{children}</div>
    </article>
  );
}

interface NestedEditorProps {
  parentId: NestedParentId;
  layout: NestedLayoutItem[];
  isEditing: boolean;
  selectedIds: TypographyTargetId[];
  childrenById: Partial<Record<NestedBlockId, React.ReactNode>>;
  onSelectItem: (id: NestedBlockId) => void;
  onChange: (parentId: NestedParentId, layout: NestedLayoutItem[]) => void;
  onBeginChange: () => void;
}

function NestedEditor({ parentId, layout, isEditing, selectedIds, childrenById, onSelectItem, onChange, onBeginChange }: NestedEditorProps) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>(120);
  const commitChange = (next: Layout[]) => {
    const clean = stripLayout<NestedBlockId>(next);
    if (!layoutsEqual(layout, clean)) onChange(parentId, clean);
  };
  const withMinimums = layout.map((item) => ({ ...item, minW: 2, minH: 2 }));

  return (
    <div ref={ref} className={`nested-grid-host nested-grid-${parentId}`} onMouseDown={(event) => event.stopPropagation()}>
      <GridLayout
        className="nested-editable-grid"
        layout={withMinimums}
        width={width}
        cols={24}
        rowHeight={NESTED_ROW_HEIGHT}
        margin={[NESTED_GAP, NESTED_GAP]}
        containerPadding={[0, 0]}
        compactType={null}
        preventCollision
        allowOverlap
        isDraggable={isEditing}
        isResizable={isEditing}
        draggableHandle=".child-drag-handle"
        resizeHandles={[...RESIZE_HANDLES]}
        onDragStart={(_next, _oldItem, item) => { onSelectItem(item.i as NestedBlockId); onBeginChange(); }}
        onResizeStart={(_next, _oldItem, item) => { onSelectItem(item.i as NestedBlockId); onBeginChange(); }}
        onDragStop={commitChange}
        onResizeStop={commitChange}
        useCSSTransforms={isEditing}
      >{layout.map((item) => <div key={item.i} className={selectedIds.includes(item.i) ? 'is-layer-selected' : ''}>{childrenById[item.i]}</div>)}</GridLayout>
      {isEditing && <span className="nested-hierarchy-label no-print">{parentId} / children</span>}
    </div>
  );
}

interface RootFrameProps {
  id: BulletinBlockId;
  label: string;
  icon?: React.ReactNode;
  isEditing: boolean;
  selected: boolean;
  onSelect: (additive: boolean) => void;
  style?: BlockTypographyStyle;
  className?: string;
  showHeading?: boolean;
  children: React.ReactNode;
}

function RootFrame({ id, label, icon, isEditing, selected, onSelect, style, className = '', showHeading = true, children }: RootFrameProps) {
  return (
    <section
      data-editor-element-id={`typography:${id}`}
      data-block-id={id}
      data-editor-selected={isEditing && selected ? 'true' : undefined}
      className={`bulletin-layout-block typography-scope ${className}${selected ? ' is-selected' : ''}`}
      style={typographyVariables(style)}
      onMouseDown={(event) => {
        if (!isEditing) return;
        if ((event.target as Element).closest('[data-editable-image-id]')) return;
        if ((event.target as Element).closest('.root-drag-handle')) return;
        event.stopPropagation();
        onSelect(event.shiftKey);
      }}
    >
      {isEditing && <button type="button" className="root-drag-handle no-print" aria-label={`Drag ${label}`} title={`Drag ${label}`} onClick={() => onSelect(false)}><GripVertical size={17} /><span>{label}</span></button>}
      <div className="bulletin-block-surface">
        {showHeading && <div className="block-heading"><span className="section-icon">{icon}</span><div><h2>{label}</h2></div></div>}
        {children}
      </div>
    </section>
  );
}

function DomesticMarket({ data, labels }: { data: BulletinData['domesticMarket']; labels: BulletinData['labels']['table'] }) {
  return <><div className="rate-grid">{data.referenceRates.map((point) => <div className="rate-tile" key={point.label}><span className="rate-table-head">{point.label}</span><strong className="rate-table-data">{formatExchangeRate(point.value)}</strong></div>)}</div><div className="domestic-table-wrap"><table className="market-table domestic-table"><thead><tr><th>{labels.fxMarket}</th><th>{labels.bid}</th><th>{labels.ask}</th><th>{labels.change}</th><th>{labels.bidPriceT2}</th></tr></thead><tbody>{data.marketRows.map((row) => {
    const tone = changeTone(row.change);
    return <tr key={row.market}><td data-label={labels.fxMarket}><strong>{row.market}</strong></td><td data-label={labels.bid}>{formatExchangeRate(row.bid)}</td><td data-label={labels.ask}>{formatExchangeRate(row.ask)}</td><td data-label={labels.change}><span className={`numeric-change ${tone}`}>{row.change !== null && row.change > 0 ? '+' : ''}{formatExchangeRate(row.change)}</span></td><td data-label={labels.bidPriceT2}>{formatExchangeRate(row.bidPriceT2)}</td></tr>;
  })}</tbody></table></div></>;
}

function Recommendations({ data, labels, isEditing, selectedTargetIds, styles, actions, onSelect, onActionChange, renderEditableImage }: { data: BulletinData['recommendations']; labels: BulletinData['labels']; isEditing: boolean; selectedTargetIds: TypographyTargetId[]; styles: BulletinLayoutSnapshot['styles']; actions: Record<string, RecommendationActionMode>; onSelect: (id: TypographyTargetId, label: string, additive: boolean) => void; onActionChange: (index: number, action: RecommendationActionMode) => void; renderEditableImage: EditableImageRenderer }) {
  return <div className="compact-recommendations">{data.map((item, index) => {
    const id = `recommendationCard:${index}` as TypographyTargetId;
    const defaultIcon = index % 3 === 0 ? <TrendingUp size={19} /> : index % 3 === 1 ? <BanknoteArrowDown size={19} /> : <PackageCheck size={19} />;
    const selected = isEditing && selectedTargetIds.includes(id);
    const action = actions[String(index)] ?? (index % 2 === 0 ? 'buy' : 'sell');
    return <article key={`${item.product}-${index}`} data-editor-element-id={`typography:${id}`} data-editor-selected={selected ? 'true' : undefined} className={`typography-scope editable-recommendation-card${selected ? ' is-selected' : ''}`} style={typographyVariables(styles[id])} onMouseDown={(event) => { if (isEditing && !(event.target as Element).closest('[data-editable-image-id], .recommendation-action-editor')) { event.stopPropagation(); onSelect(id, `Recommendation Card ${index + 1}`, event.shiftKey); } }}>{renderEditableImage(`recommendationIcon:${index}`, `Recommendation ${index + 1} icon`, { defaultNode: defaultIcon, className: `recommendation-signal signal-${index % 3}`, sizes: '60px' })}<div><small>0{index + 1} · {labels.recommendationKicker}</small><h3>{item.product || labels.recommendationFallback}</h3><p>{item.benefit || labels.benefitFallback}</p></div>{isEditing && <label className="recommendation-action-editor no-print" onMouseDown={(event) => event.stopPropagation()}><span>Action</span><select aria-label={`Recommendation ${index + 1} action`} value={action} onChange={(event) => onActionChange(index, event.target.value as RecommendationActionMode)}><option value="buy">BUY</option><option value="sell">SELL</option><option value="blank">Blank</option></select></label>}<span className={`recommendation-action action-${action}`}>{action === 'blank' ? '' : action.toUpperCase()}</span></article>;
  })}</div>;
}

interface BulletinPreviewProps {
  data: BulletinData;
  editorMode: 'view' | 'layout' | 'background';
  layout: BulletinLayoutSnapshot;
  selectedTargetIds: TypographyTargetId[];
  selectedImageId: string;
  onSelectTarget: (id: TypographyTargetId, label: string, additive: boolean) => void;
  onSelectImage: (id: string) => void;
  onClearSelection: () => void;
  onLayoutChange: (layout: BulletinLayoutSnapshot) => void;
  onBeginChange: () => void;
}

export function BulletinPreview({ data, editorMode, layout, selectedTargetIds, selectedImageId, onSelectTarget, onSelectImage, onClearSelection, onLayoutChange, onBeginChange }: BulletinPreviewProps) {
  const isEditing = editorMode === 'layout';
  const isBackgroundEditing = editorMode === 'background';
  const { ref: gridRef, width: gridWidth } = useMeasuredWidth<HTMLDivElement>(320);
  const chartTableDataFontSize = layout.styles.marketLegend?.tableDataSize ?? typographyDefaultsFor('marketLegend').tableDataSize;
  const selectRoot = (id: BulletinBlockId, label: string, additive: boolean) => onSelectTarget(id, label, additive);
  const selectChild = (id: NestedBlockId, label: string, additive: boolean) => onSelectTarget(id, label, additive);
  const isRootSelected = (id: BulletinBlockId) => isEditing && selectedTargetIds.includes(id);
  const isChildSelected = (id: NestedBlockId) => isEditing && selectedTargetIds.includes(id);

  const updateNested = (parentId: NestedParentId, next: NestedLayoutItem[]) => {
    onLayoutChange({ ...layout, nested: { ...layout.nested, [parentId]: next } });
  };

  const updateImageAsset = (assetId: string, next?: EditableImageState) => {
    const images = { ...(layout.assets.images ?? {}) };
    if (next) images[assetId] = next;
    else delete images[assetId];
    onLayoutChange({ ...layout, assets: { ...layout.assets, images } });
  };

  const updateRecommendationAction = (index: number, action: RecommendationActionMode) => {
    onBeginChange();
    onLayoutChange({
      ...layout,
      assets: {
        ...layout.assets,
        recommendationActions: {
          ...(layout.assets.recommendationActions ?? {}),
          [String(index)]: action,
        },
      },
    });
  };

  const renderEditableImage: EditableImageRenderer = (assetId, label, options = {}) => {
    const legacyFitTarget: Partial<Record<string, TypographyTargetId>> = { headerVisual: 'headerVisual', headerLogo: 'headerLogo', footerVisual: 'footerVisual', chartImage: 'marketLegend' };
    const inheritedFit = legacyFitTarget[assetId] ? layout.styles[legacyFitTarget[assetId]!]?.imageFit : undefined;
    // Every icon rendered from a default node behaves like an uploaded image.
    // Decorative body artwork remains passive because it explicitly opts into
    // the decorative layer at each call site.
    const imageLayer = options.layer ?? (options.defaultNode ? 'editable' : 'content');
    const storedState = layout.assets.images?.[assetId];
    const visibleState = imageLayer === 'editable' || !storedState ? storedState : { ...storedState, hidden: false };
    return <EditableImage
      assetId={assetId}
      label={label}
      state={visibleState}
      isEditing={isEditing}
      selected={imageLayer === 'editable' && isEditing && selectedImageId === assetId}
      onSelect={onSelectImage}
      onBeginChange={onBeginChange}
      onChange={updateImageAsset}
      defaultFit={inheritedFit ?? 'contain'}
      {...options}
      layer={imageLayer}
    />;
  };

  const headerChildren: Partial<Record<NestedBlockId, React.ReactNode>> = {
    headerVisual: <ChildFrame id="headerVisual" label="Header Visual" isEditing={isEditing} selected={isChildSelected('headerVisual')} onSelect={(additive) => selectChild('headerVisual', 'Header Visual', additive)} style={layout.styles.headerVisual} className="header-visual-child">{renderEditableImage('headerVisual', 'Header Globe / Banner', { layer: 'editable', defaultSrc: '/market-globe.png', alt: 'Market globe banner', className: 'header-visual-image', sizes: '430px', priority: true })}</ChildFrame>,
    headerTitle: <ChildFrame id="headerTitle" label="Bulletin Title" isEditing={isEditing} selected={isChildSelected('headerTitle')} onSelect={(additive) => selectChild('headerTitle', data.title, additive)} style={layout.styles.headerTitle} className="header-title-child"><span className="header-overline">{data.labels.headerOverline}</span><h1>{data.title}</h1></ChildFrame>,
    headerMeta: <ChildFrame id="headerMeta" label="Department and Date" isEditing={isEditing} selected={isChildSelected('headerMeta')} onSelect={(additive) => selectChild('headerMeta', 'Department and Date', additive)} style={layout.styles.headerMeta} className="header-meta-child"><span>{data.department}</span><i /><strong>{formatLongDate(data.bulletinDate, data.locale)}</strong></ChildFrame>,
    headerLogo: <ChildFrame id="headerLogo" label="VietinBank Logo" isEditing={isEditing} selected={isChildSelected('headerLogo')} onSelect={(additive) => selectChild('headerLogo', 'VietinBank Logo', additive)} style={layout.styles.headerLogo} className="header-logo-child">{renderEditableImage('headerLogo', 'VietinBank Logo', { layer: 'editable', defaultSrc: '/vietinbank-logo.png', alt: 'VietinBank', className: 'header-logo-image', sizes: '252px', priority: true, menuAlign: 'right' })}</ChildFrame>,
  };

  const newsChildren: Partial<Record<NestedBlockId, React.ReactNode>> = {
    eventCalendar: <ChildFrame id="eventCalendar" label={data.labels.eventCalendar} isEditing={isEditing} selected={isChildSelected('eventCalendar')} onSelect={(additive) => selectChild('eventCalendar', data.labels.eventCalendar, additive)} style={layout.styles.eventCalendar} className="news-child event-calendar-child"><div className="child-story-heading">{renderEditableImage('eventCalendarIcon', 'Event Calendar Icon', { defaultNode: <CalendarDays size={18} />, className: 'story-heading-icon', sizes: '62px' })}<h3>{data.labels.eventCalendar}</h3></div><div className="rich-copy"><Paragraphs value={data.highlightedNews.eventCalendar} /></div></ChildFrame>,
    quickAssessment: <ChildFrame id="quickAssessment" label={data.labels.quickAssessment} isEditing={isEditing} selected={isChildSelected('quickAssessment')} onSelect={(additive) => selectChild('quickAssessment', data.labels.quickAssessment, additive)} style={layout.styles.quickAssessment} className="news-child quick-assessment-child"><div className="child-story-heading">{renderEditableImage('quickAssessmentIcon', 'Quick Assessment Icon', { defaultNode: <AssessmentIcon />, className: 'story-heading-icon assessment-heading-icon', sizes: '62px' })}<h3>{data.labels.quickAssessment}</h3></div><div className="rich-copy"><Paragraphs value={data.highlightedNews.quickAssessment} /></div></ChildFrame>,
    marketHighlights: <ChildFrame id="marketHighlights" label={data.labels.marketHighlights} isEditing={isEditing} selected={isChildSelected('marketHighlights')} onSelect={(additive) => selectChild('marketHighlights', data.labels.marketHighlights, additive)} style={layout.styles.marketHighlights} className="news-child market-highlights-child">{renderEditableImage('marketHighlightsBackground', 'Market Highlights Background', { layer: 'decorative', defaultSrc: '/market-globe.png', className: 'market-highlights-decoration', alt: '', sizes: '520px', defaultPosition: 'right', defaultOpacity: .1, menuAlign: 'right' })}<div className="child-story-heading market-highlights-heading">{renderEditableImage('marketHighlightsIcon', 'Market Highlights Icon', { defaultNode: <WorldMarketIcon />, className: 'story-heading-icon market-highlights-title-icon', sizes: '62px' })}<h3>{data.labels.marketHighlights}</h3></div><div className="rich-copy"><Paragraphs value={data.highlightedNews.marketHighlights} /></div></ChildFrame>,
  };

  const analysisChildren: Partial<Record<NestedBlockId, React.ReactNode>> = {
    domesticAnalysis: <ChildFrame id="domesticAnalysis" label={data.labels.domesticAnalysis} isEditing={isEditing} selected={isChildSelected('domesticAnalysis')} onSelect={(additive) => selectChild('domesticAnalysis', data.labels.domesticAnalysis, additive)} style={layout.styles.domesticAnalysis} className="analysis-child"><div className="analysis-heading">{renderEditableImage('domesticAnalysisIcon', 'Domestic Analysis Icon', { defaultNode: <VietnamFlagIcon />, className: 'analysis-heading-image flag-vn', sizes: '84px' })}<div><small>{data.labels.domesticKicker}</small><h3>{data.labels.domesticAnalysis}</h3></div></div><div className="rich-copy"><Paragraphs value={data.analysis.domestic} /></div></ChildFrame>,
    internationalAnalysis: <ChildFrame id="internationalAnalysis" label={data.labels.internationalAnalysis} isEditing={isEditing} selected={isChildSelected('internationalAnalysis')} onSelect={(additive) => selectChild('internationalAnalysis', data.labels.internationalAnalysis, additive)} style={layout.styles.internationalAnalysis} className="analysis-child"><div className="analysis-heading">{renderEditableImage('internationalAnalysisIcon', 'International Analysis Icon', { defaultNode: <GlobalMarketsGlobeIcon />, className: 'analysis-heading-image world-icon global-markets-globe', sizes: '84px' })}<div><small>{data.labels.internationalKicker}</small><h3>{data.labels.internationalAnalysis}</h3></div></div><div className="rich-copy"><Paragraphs value={data.analysis.international} /></div></ChildFrame>,
  };

  const footerChildren: Partial<Record<NestedBlockId, React.ReactNode>> = {
    disclaimer: <ChildFrame id="disclaimer" label={data.labels.disclaimer} isEditing={isEditing} selected={isChildSelected('disclaimer')} onSelect={(additive) => selectChild('disclaimer', data.labels.disclaimer, additive)} style={layout.styles.disclaimer} className="footer-disclaimer-child">{renderEditableImage('disclaimerIcon', 'Disclaimer Icon', { defaultNode: <ShieldCheck size={28} />, className: 'footer-shield-image', sizes: '64px' })}<div><span className="card-kicker">{data.labels.disclaimer}</span><div className="rich-copy"><Paragraphs value={data.disclaimer} /></div></div></ChildFrame>,
    contact: <ChildFrame id="contact" label="Contact" isEditing={isEditing} selected={isChildSelected('contact')} onSelect={(additive) => selectChild('contact', 'Contact Information', additive)} style={layout.styles.contact} className="footer-contact-child"><div className="footer-lines">{data.footerLines.slice(0, 2).map((line) => <strong key={line}>{line}</strong>)}{data.footerLines.slice(2).map((line, index) => <span key={line}>{renderEditableImage(index === 0 ? 'contactLocationIcon' : `contactPhoneIcon:${index}`, index === 0 ? 'Contact Location Icon' : 'Contact Phone Icon', { defaultNode: index === 0 ? <MapPin size={14} /> : <Phone size={14} />, className: 'contact-line-icon', sizes: '28px' })}{line}</span>)}</div></ChildFrame>,
    footerVisual: <ChildFrame id="footerVisual" label="Footer Visual" isEditing={isEditing} selected={isChildSelected('footerVisual')} onSelect={(additive) => selectChild('footerVisual', 'Footer Image', additive)} style={layout.styles.footerVisual} className="footer-visual-child">{renderEditableImage('footerVisual', 'Footer Growth Image', { layer: 'editable', defaultSrc: '/market-growth.png', alt: 'Market growth illustration', className: 'footer-visual-image', sizes: '420px', menuAlign: 'right' })}</ChildFrame>,
  };

  const nestedEditor = (parentId: NestedParentId, childrenById: Partial<Record<NestedBlockId, React.ReactNode>>) => <NestedEditor parentId={parentId} layout={layout.nested[parentId]} isEditing={isEditing} selectedIds={selectedTargetIds} childrenById={childrenById} onSelectItem={(id) => selectChild(id, EDITOR_LABELS[id], false)} onChange={updateNested} onBeginChange={onBeginChange} />;

  const blocks: Record<BulletinBlockId, React.ReactNode> = {
    header: <RootFrame id="header" label="Header" isEditing={isEditing} selected={isRootSelected('header')} onSelect={(additive) => selectRoot('header', 'Header', additive)} style={layout.styles.header} className="editable-header-block" showHeading={false}>{nestedEditor('header', headerChildren)}</RootFrame>,
    highlightedNews: <RootFrame id="highlightedNews" label={data.labels.highlightedNews} icon={renderEditableImage('sectionIcon:highlightedNews', 'Highlighted News Section Icon', { defaultNode: <Zap size={21} />, className: 'root-section-icon', sizes: '62px' })} isEditing={isEditing} selected={isRootSelected('highlightedNews')} onSelect={(additive) => selectRoot('highlightedNews', data.labels.highlightedNews, additive)} style={layout.styles.highlightedNews} className="news-board-block">{nestedEditor('highlightedNews', newsChildren)}</RootFrame>,
    currencies: <RootFrame id="currencies" label={data.labels.currencies} icon={renderEditableImage('sectionIcon:currencies', 'Currencies Section Icon', { defaultNode: <CircleDollarSign size={21} />, className: 'root-section-icon', sizes: '62px' })} isEditing={isEditing} selected={isRootSelected('currencies')} onSelect={(additive) => selectRoot('currencies', data.labels.currencies, additive)} style={layout.styles.currencies}><MarketTable kind="currencies" title={data.labels.currencies} section={data.currencies} icon={<CircleDollarSign size={21} />} labels={data.labels.table} locale={data.locale} renderEditableImage={renderEditableImage} /></RootFrame>,
    commodities: <RootFrame id="commodities" label={data.labels.commodities} icon={renderEditableImage('sectionIcon:commodities', 'Commodities Section Icon', { defaultNode: <CommodityGroupIcon />, className: 'root-section-icon commodities-section-icon', sizes: '62px' })} isEditing={isEditing} selected={isRootSelected('commodities')} onSelect={(additive) => selectRoot('commodities', data.labels.commodities, additive)} style={layout.styles.commodities}><MarketTable kind="commodities" title={data.labels.commodities} section={data.commodities} icon={<CommodityGroupIcon />} labels={data.labels.table} locale={data.locale} renderEditableImage={renderEditableImage} /></RootFrame>,
    marketLegend: <RootFrame id="marketLegend" label={data.labels.chart} icon={renderEditableImage('sectionIcon:chart', 'Chart Section Icon', { defaultNode: <ChartNoAxesCombined size={21} />, className: 'root-section-icon', sizes: '62px' })} isEditing={isEditing} selected={isRootSelected('marketLegend')} onSelect={(additive) => selectRoot('marketLegend', data.labels.chart, additive)} style={layout.styles.marketLegend} className="market-chart-block"><UsdVndChart data={data.usdVndChart} locale={data.locale} tableDataFontSize={chartTableDataFontSize} /></RootFrame>,
    recommendations: <RootFrame id="recommendations" label={data.labels.recommendations} icon={renderEditableImage('sectionIcon:recommendations', 'Recommendations Section Icon', { defaultNode: <RecommendationIdeaIcon />, className: 'root-section-icon recommendation-section-icon', sizes: '62px' })} isEditing={isEditing} selected={isRootSelected('recommendations')} onSelect={(additive) => selectRoot('recommendations', data.labels.recommendations, additive)} style={layout.styles.recommendations} className="compact-recommendations-block"><Recommendations data={data.recommendations} labels={data.labels} isEditing={isEditing} selectedTargetIds={selectedTargetIds} styles={layout.styles} actions={layout.assets.recommendationActions ?? {}} onSelect={onSelectTarget} onActionChange={updateRecommendationAction} renderEditableImage={renderEditableImage} /></RootFrame>,
    domesticMarket: <RootFrame id="domesticMarket" label={data.labels.domesticMarket} icon={renderEditableImage('sectionIcon:domesticMarket', 'Domestic USD/VND Section Icon', { defaultNode: <VietnamFlagIcon />, className: 'root-section-icon domestic-vietnam-icon', sizes: '62px' })} isEditing={isEditing} selected={isRootSelected('domesticMarket')} onSelect={(additive) => selectRoot('domesticMarket', data.labels.domesticMarket, additive)} style={layout.styles.domesticMarket} className="domestic-block"><DomesticMarket data={data.domesticMarket} labels={data.labels.table} /></RootFrame>,
    detailedAnalysis: <RootFrame id="detailedAnalysis" label={data.labels.detailedAnalysis} icon={renderEditableImage('sectionIcon:detailedAnalysis', 'Detailed Analysis Section Icon', { defaultNode: <Globe2 size={21} />, className: 'root-section-icon', sizes: '62px' })} isEditing={isEditing} selected={isRootSelected('detailedAnalysis')} onSelect={(additive) => selectRoot('detailedAnalysis', data.labels.detailedAnalysis, additive)} style={layout.styles.detailedAnalysis} className="detailed-analysis-block">{renderEditableImage('detailedAnalysisBackground', 'Detailed Analysis Background', { layer: 'decorative', defaultSrc: '/market-globe.png', className: 'detailed-analysis-decoration', alt: '', sizes: '900px', defaultPosition: 'right', defaultOpacity: .06, menuAlign: 'right' })}{nestedEditor('detailedAnalysis', analysisChildren)}</RootFrame>,
    footer: <RootFrame id="footer" label="Footer" isEditing={isEditing} selected={isRootSelected('footer')} onSelect={(additive) => selectRoot('footer', 'Footer', additive)} style={layout.styles.footer} className="editable-footer-block" showHeading={false}>{nestedEditor('footer', footerChildren)}</RootFrame>,
  };

  const commitRootLayout = (next: Layout[]) => {
    const clean = stripLayout<BulletinBlockId>(next);
    if (!layoutsEqual(layout.root, clean)) onLayoutChange({ ...layout, root: clean });
  };
  const rootWithMinimums = layout.root.map((item) => ({ ...item, minW: ['header', 'highlightedNews', 'footer'].includes(item.i) ? 8 : 4, minH: item.i === 'header' ? 7 : 4 }));

  return (
    <article
      id="bulletin-container"
      className={`bulletin-container nested-layout-canvas${isEditing ? ' editing-layout' : ''}${isBackgroundEditing ? ' background-edit-mode' : ''}`}
      onMouseDownCapture={(event) => {
        if (!isEditing) return;
        const image = (event.target as Element).closest<HTMLElement>('[data-editable-image-id]');
        const imageId = image?.dataset.editableImageId;
        if (imageId) {
          event.stopPropagation();
          onSelectImage(imageId);
        }
      }}
      onMouseDown={(event) => {
        if (isEditing && !(event.target as Element).closest('[data-editor-element-id]')) onClearSelection();
      }}
    >
      <div className="bulletin-background-layer" data-background-layer="true" aria-hidden="true" style={{ backgroundColor: layout.background.color }}>
        {layout.background.source && <div className="bulletin-background-image" style={{
          backgroundImage: `url("${layout.background.source}")`,
          backgroundPosition: layout.background.position === 'top' ? 'center top' : layout.background.position === 'bottom' ? 'center bottom' : layout.background.position === 'left' ? 'left center' : layout.background.position === 'right' ? 'right center' : 'center center',
          backgroundSize: layout.background.fit === 'stretch' ? '100% 100%' : layout.background.fit === 'original' ? 'auto' : layout.background.fit,
          opacity: layout.background.opacity,
        }} />}
      </div>
      <div ref={gridRef} className="bulletin-root-grid-host">
        <GridLayout
          className="bulletin-editable-grid bulletin-root-grid"
          layout={rootWithMinimums}
          width={gridWidth}
          cols={24}
          rowHeight={ROOT_ROW_HEIGHT}
          margin={[ROOT_GAP, ROOT_GAP]}
          containerPadding={[0, 0]}
          compactType={null}
          preventCollision
          allowOverlap
          isDraggable={isEditing}
          isResizable={isEditing}
          draggableHandle=".root-drag-handle"
          resizeHandles={[...RESIZE_HANDLES]}
          onDragStart={(_next, _oldItem, item) => { selectRoot(item.i as BulletinBlockId, EDITOR_LABELS[item.i as BulletinBlockId], false); onBeginChange(); }}
          onResizeStart={(_next, _oldItem, item) => { selectRoot(item.i as BulletinBlockId, EDITOR_LABELS[item.i as BulletinBlockId], false); onBeginChange(); }}
          onDragStop={commitRootLayout}
          onResizeStop={commitRootLayout}
          useCSSTransforms={isEditing}
        >{layout.root.map((item) => <div key={item.i} className={isRootSelected(item.i) ? 'is-layer-selected' : ''}>{blocks[item.i]}</div>)}</GridLayout>
      </div>
      {data.warnings.length > 0 && <aside className="parse-warnings no-print"><strong>Workbook notes</strong><ul>{data.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
    </article>
  );
}
