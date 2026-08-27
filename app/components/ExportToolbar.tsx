'use client';

import { Check, Copy, FileDown, FileImage, Grip, LoaderCircle, Pencil, Printer, RotateCcw, Save, Trash2, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { formatLongDate } from '../lib/formatters';
import type { BulletinData } from '../types/bulletin';
import { DEFAULT_LAYOUT_ID, FONT_FAMILIES, type BlockTypographyStyle, type FontFamily, type ImageFitMode, type TextAlignment } from '../types/bulletinLayout';

export type TypographyEditorStyle = {
  [Key in keyof Required<BlockTypographyStyle>]: Required<BlockTypographyStyle>[Key] | 'mixed';
};

interface ExportToolbarProps {
  data: BulletinData;
  isEditing: boolean;
  layouts: Array<{ id: string; name: string }>;
  activeLayoutId: string;
  canUndo: boolean;
  selectedTargetLabel: string;
  selectedTargetCount: number;
  selectedStyle: TypographyEditorStyle;
  onSelectLayout: (id: string) => void;
  onUploadNew: () => void;
  onStartEditing: () => void;
  onSaveAs: () => void;
  onSaveChanges: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onResetLayout: () => void;
  onDoneEditing: () => void;
  onBeginTypographyChange: () => void;
  onTypographyChange: (patch: Partial<BlockTypographyStyle>) => void;
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

async function waitForBulletinAssets(bulletin: HTMLElement) {
  await document.fonts?.ready;
  const images = Array.from(bulletin.querySelectorAll<HTMLImageElement>('img'));
  await Promise.all(images.map(async (image) => {
    if (!image.complete) await new Promise<void>((resolve) => {
      image.addEventListener('load', () => resolve(), { once: true });
      image.addEventListener('error', () => resolve(), { once: true });
    });
    try { await image.decode(); } catch { /* The load event is sufficient for non-decodable assets. */ }
  }));
  window.dispatchEvent(new Event('resize'));
  await nextFrame();
  await nextFrame();
}

async function waitForStableBulletin(bulletin: HTMLElement) {
  let previous = '';
  let stableFrames = 0;
  for (let attempt = 0; attempt < 12 && stableFrames < 2; attempt += 1) {
    await nextFrame();
    const rect = bulletin.getBoundingClientRect();
    const signature = `${rect.width.toFixed(2)}:${rect.height.toFixed(2)}:${bulletin.scrollWidth}:${bulletin.scrollHeight}`;
    stableFrames = signature === previous ? stableFrames + 1 : 0;
    previous = signature;
  }
}

export function ExportToolbar({ data, isEditing, layouts, activeLayoutId, canUndo, selectedTargetLabel, selectedTargetCount, selectedStyle, onSelectLayout, onUploadNew, onStartEditing, onSaveAs, onSaveChanges, onRename, onDuplicate, onDelete, onUndo, onResetLayout, onDoneEditing, onBeginTypographyChange, onTypographyChange }: ExportToolbarProps) {
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [isPreparingJpeg, setIsPreparingJpeg] = useState(false);
  const [exportError, setExportError] = useState('');

  const printDocument = async () => {
    if (isPreparingPrint) return;
    setIsPreparingPrint(true);
    const previousTitle = document.title;
    const dynamicPrintStyle = document.createElement('style');
    dynamicPrintStyle.id = 'bulletin-dynamic-print-page';
    const bulletin = document.getElementById('bulletin-container');
    try {
      if (!bulletin) throw new Error('Bulletin preview is not available.');
      document.documentElement.classList.add('bulletin-export-mode');
      document.body.classList.add('bulletin-export-mode');
      bulletin.classList.add('export-mode');
      bulletin.setAttribute('aria-busy', 'true');
      await waitForBulletinAssets(bulletin);
      await waitForStableBulletin(bulletin);
      const rect = bulletin.getBoundingClientRect();
      const width = Math.ceil(Math.max(rect.width, bulletin.offsetWidth));
      const height = Math.ceil(Math.max(rect.height, bulletin.scrollHeight));
      dynamicPrintStyle.textContent = `
        @page { size: ${width}px ${height}px; margin: 0; }
        @media print {
          html, body { width: ${width}px !important; height: ${height}px !important; min-width: ${width}px !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: #00152d !important; }
          .preview-shell { width: ${width}px !important; height: ${height}px !important; min-width: ${width}px !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
          #bulletin-container { width: ${width}px !important; max-width: none !important; height: ${height}px !important; min-height: ${height}px !important; margin: 0 !important; zoom: 1 !important; transform: none !important; }
        }
      `;
      document.head.appendChild(dynamicPrintStyle);
      document.title = `VietinBank FX Bulletin - ${formatLongDate(data.bulletinDate, data.locale)}`;
      await waitForStableBulletin(bulletin);
      bulletin.setAttribute('aria-busy', 'false');
      const readyEvent = new CustomEvent('fx-bulletin:print-ready', { cancelable: true, detail: { width, height } });
      if (document.dispatchEvent(readyEvent)) window.print();
    } finally {
      dynamicPrintStyle.remove();
      document.documentElement.classList.remove('bulletin-export-mode');
      document.body.classList.remove('bulletin-export-mode');
      bulletin?.classList.remove('export-mode');
      bulletin?.removeAttribute('aria-busy');
      document.title = previousTitle;
      setIsPreparingPrint(false);
    }
  };

  const exportJpeg = async () => {
    if (isPreparingJpeg || isPreparingPrint) return;
    const bulletin = document.getElementById('bulletin-container');
    setIsPreparingJpeg(true);
    setExportError('');
    try {
      if (!bulletin) throw new Error('Bulletin preview is not available.');
      document.documentElement.classList.add('bulletin-export-mode');
      document.body.classList.add('bulletin-export-mode');
      bulletin.classList.add('export-mode');
      bulletin.setAttribute('aria-busy', 'true');
      await waitForBulletinAssets(bulletin);
      await waitForStableBulletin(bulletin);

      const rect = bulletin.getBoundingClientRect();
      const width = Math.ceil(Math.max(rect.width, bulletin.offsetWidth));
      const height = Math.ceil(Math.max(rect.height, bulletin.scrollHeight));
      const { toJpeg } = await import('html-to-image');
      const dataUrl = await toJpeg(bulletin, {
        backgroundColor: '#00152d',
        cacheBust: true,
        height,
        pixelRatio: 2,
        quality: 0.96,
        width,
        filter: (node) => !(node instanceof HTMLElement && node.classList.contains('no-print')),
      });
      const fileBase = data.sourceFile.replace(/\.[^.]+$/, '').trim() || 'FX Market Bulletin';
      const filename = `${fileBase}.jpeg`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('JPEG export failed', error);
      setExportError(data.locale === 'vi' ? 'Không thể xuất JPEG. Vui lòng thử lại.' : 'JPEG export failed. Please try again.');
    } finally {
      document.documentElement.classList.remove('bulletin-export-mode');
      document.body.classList.remove('bulletin-export-mode');
      bulletin?.classList.remove('export-mode');
      bulletin?.removeAttribute('aria-busy');
      setIsPreparingJpeg(false);
    }
  };

  const customLayoutSelected = activeLayoutId !== DEFAULT_LAYOUT_ID;
  const typographyDisabled = selectedTargetCount === 0;
  const editorValue = <T,>(value: T | 'mixed') => value === 'mixed' ? '' : value;
  const changeSize = (field: keyof Pick<BlockTypographyStyle, 'titleSize' | 'subtitleSize' | 'bodySize' | 'tableHeaderSize' | 'tableDataSize'>, value: string) => {
    const number = Number(value);
    if (Number.isFinite(number)) onTypographyChange({ [field]: Math.max(5, Math.min(96, number)) });
  };

  return (
    <div className={`export-toolbar no-print${isEditing ? ' editing-toolbar' : ''}`}>
      <div className="toolbar-context">
        <span className="toolbar-kicker">{isEditing ? 'Mini canvas editor' : 'Bulletin preview'}</span>
        <strong>{isEditing ? 'Select a parent, child or recommendation card · drag ⠿ · resize from 8 handles' : data.sourceFile}</strong>
      </div>
      <div className="toolbar-actions">
        <label className="layout-select-wrap"><span className="visually-hidden">Layouts</span><select aria-label="Layouts" value={activeLayoutId} onChange={(event) => onSelectLayout(event.target.value)}><option value={DEFAULT_LAYOUT_ID}>Default Layout</option>{layouts.map((layout) => <option key={layout.id} value={layout.id}>{layout.name}</option>)}</select></label>
        {isEditing ? <>
          <button type="button" onClick={onUndo} disabled={!canUndo}><Undo2 size={16} /><span>Undo</span></button>
          <button type="button" className="primary-action" onClick={onSaveAs}><Save size={16} /><span>Save Layout As</span></button>
          {customLayoutSelected && <button type="button" onClick={onSaveChanges}><Save size={16} /><span>Save Changes</span></button>}
          <button type="button" onClick={onDuplicate}><Copy size={16} /><span>Duplicate</span></button>
          {customLayoutSelected && <button type="button" onClick={onRename}><Pencil size={16} /><span>Rename</span></button>}
          {customLayoutSelected && <button type="button" className="danger-action" onClick={onDelete}><Trash2 size={16} /><span>Delete Layout</span></button>}
          <button type="button" onClick={onResetLayout}><RotateCcw size={16} /><span>Reset</span></button>
          <button type="button" onClick={onDoneEditing}><Check size={16} /><span>Done</span></button>
        </> : <>
          <button type="button" onClick={onUploadNew}><RotateCcw size={16} /><span>Upload New Excel</span></button>
          <button type="button" onClick={onStartEditing}><Grip size={16} /><span>Edit Layout</span></button>
          <button type="button" onClick={() => void printDocument()} disabled={isPreparingPrint || isPreparingJpeg}>{isPreparingPrint ? <LoaderCircle className="spin" size={16} /> : <Printer size={16} />}<span>Print</span></button>
          <button type="button" onClick={() => void exportJpeg()} disabled={isPreparingPrint || isPreparingJpeg}>{isPreparingJpeg ? <LoaderCircle className="spin" size={17} /> : <FileImage size={17} />}<span>{isPreparingJpeg ? 'Preparing…' : 'Export JPEG'}</span></button>
          <button type="button" className="primary-action" onClick={() => void printDocument()} disabled={isPreparingPrint || isPreparingJpeg}>{isPreparingPrint ? <LoaderCircle className="spin" size={17} /> : <FileDown size={17} />}<span>{isPreparingPrint ? 'Preparing…' : 'Export PDF'}</span></button>
        </>}
        {exportError && <span className="export-action-error" role="alert">{exportError}</span>}
      </div>
      {isEditing && <div className="typography-editor" aria-label={`Typography for ${selectedTargetLabel}`}>
        <div className="typography-selection"><span>{selectedTargetCount === 1 ? 'Selected block' : 'Selected blocks'}</span><strong>{selectedTargetLabel}</strong></div>
        <label><span>Font</span><select disabled={typographyDisabled} value={editorValue(selectedStyle.fontFamily)} onFocus={onBeginTypographyChange} onChange={(event) => onTypographyChange({ fontFamily: event.target.value as FontFamily })}><option value="" disabled>Mixed</option>{FONT_FAMILIES.map((font) => <option key={font}>{font}</option>)}</select></label>
        <label><span>Weight</span><select disabled={typographyDisabled} value={editorValue(selectedStyle.fontWeight)} onFocus={onBeginTypographyChange} onChange={(event) => onTypographyChange({ fontWeight: Number(event.target.value) })}><option value="" disabled>Mixed</option>{[300, 400, 500, 600, 700, 800, 900].map((weight) => <option key={weight} value={weight}>{weight}</option>)}</select></label>
        <label><span>Title</span><input disabled={typographyDisabled} placeholder={selectedStyle.titleSize === 'mixed' ? 'Mixed' : undefined} aria-label="Title font size" type="number" min="5" max="96" step="0.5" value={editorValue(selectedStyle.titleSize)} onFocus={onBeginTypographyChange} onChange={(event) => changeSize('titleSize', event.target.value)} /></label>
        <label><span>Subtitle</span><input disabled={typographyDisabled} placeholder={selectedStyle.subtitleSize === 'mixed' ? 'Mixed' : undefined} aria-label="Subtitle font size" type="number" min="5" max="96" step="0.5" value={editorValue(selectedStyle.subtitleSize)} onFocus={onBeginTypographyChange} onChange={(event) => changeSize('subtitleSize', event.target.value)} /></label>
        <label><span>Body</span><input disabled={typographyDisabled} placeholder={selectedStyle.bodySize === 'mixed' ? 'Mixed' : undefined} aria-label="Body font size" type="number" min="5" max="96" step="0.5" value={editorValue(selectedStyle.bodySize)} onFocus={onBeginTypographyChange} onChange={(event) => changeSize('bodySize', event.target.value)} /></label>
        <label><span>Table head</span><input disabled={typographyDisabled} placeholder={selectedStyle.tableHeaderSize === 'mixed' ? 'Mixed' : undefined} aria-label="Table header font size" type="number" min="5" max="96" step="0.5" value={editorValue(selectedStyle.tableHeaderSize)} onFocus={onBeginTypographyChange} onChange={(event) => changeSize('tableHeaderSize', event.target.value)} /></label>
        <label><span>Table data</span><input disabled={typographyDisabled} placeholder={selectedStyle.tableDataSize === 'mixed' ? 'Mixed' : undefined} aria-label="Table data font size" type="number" min="5" max="96" step="0.5" value={editorValue(selectedStyle.tableDataSize)} onFocus={onBeginTypographyChange} onChange={(event) => changeSize('tableDataSize', event.target.value)} /></label>
        <label><span>Color</span><input disabled={typographyDisabled} className="typography-color-input" aria-label="Text color" title={selectedStyle.textColor === 'mixed' ? 'Mixed values' : selectedStyle.textColor} type="color" value={selectedStyle.textColor === 'mixed' ? '#ffffff' : selectedStyle.textColor} onFocus={onBeginTypographyChange} onChange={(event) => onTypographyChange({ textColor: event.target.value })} /></label>
        <label><span>Line height</span><input disabled={typographyDisabled} placeholder={selectedStyle.lineHeight === 'mixed' ? 'Mixed' : undefined} aria-label="Line height" type="number" min="0.8" max="3" step="0.05" value={editorValue(selectedStyle.lineHeight)} onFocus={onBeginTypographyChange} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) onTypographyChange({ lineHeight: Math.max(.8, Math.min(3, value)) }); }} /></label>
        <label><span>Alignment</span><select disabled={typographyDisabled} value={editorValue(selectedStyle.textAlign)} onFocus={onBeginTypographyChange} onChange={(event) => onTypographyChange({ textAlign: event.target.value as TextAlignment })}><option value="" disabled>Mixed</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option><option value="justify">Justify</option></select></label>
        <label><span>Image fit</span><select disabled={typographyDisabled} value={editorValue(selectedStyle.imageFit)} onFocus={onBeginTypographyChange} onChange={(event) => onTypographyChange({ imageFit: event.target.value as ImageFitMode })}><option value="" disabled>Mixed</option><option value="contain">Contain</option><option value="cover">Cover</option><option value="fill">Fill</option></select></label>
      </div>}
    </div>
  );
}
