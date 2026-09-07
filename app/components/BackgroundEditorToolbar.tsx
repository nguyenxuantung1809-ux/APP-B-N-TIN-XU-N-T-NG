'use client';

import { Check, ImagePlus, RefreshCcw, RotateCcw, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import {
  DEFAULT_BULLETIN_BACKGROUND,
  type BackgroundFitMode,
  type BulletinBackgroundState,
  type ImagePositionMode,
} from '../types/bulletinLayout';

interface BackgroundEditorToolbarProps {
  activeLayoutName: string;
  background: BulletinBackgroundState;
  onChange: (background: BulletinBackgroundState) => void;
  onReset: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function BackgroundEditorToolbar({ activeLayoutName, background, onChange, onReset, onSave, onCancel }: BackgroundEditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [colorDraft, setColorDraft] = useState(background.color);
  const [uploadError, setUploadError] = useState('');

  const patchBackground = (patch: Partial<BulletinBackgroundState>) => onChange({ ...background, ...patch });
  const chooseFile = () => fileInputRef.current?.click();
  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setUploadError('Use a PNG, JPG/JPEG, WEBP or SVG image.');
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      setUploadError('Background image must be 16 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result !== 'string' || !reader.result.startsWith('data:image/')) {
        setUploadError('The selected image could not be read.');
        return;
      }
      patchBackground({ source: reader.result });
      setUploadError('');
    }, { once: true });
    reader.addEventListener('error', () => setUploadError('The selected image could not be read.'), { once: true });
    reader.readAsDataURL(file);
  };
  const commitColor = () => {
    if (HEX_COLOR_PATTERN.test(colorDraft)) {
      patchBackground({ color: colorDraft.toLowerCase() });
      setUploadError('');
    } else {
      setColorDraft(background.color);
      setUploadError('Background color must use 6-digit HEX format, for example #001f3f.');
    }
  };

  return (
    <div className="export-toolbar background-editor-toolbar no-print" role="toolbar" aria-label="Background editor">
      <div className="toolbar-context">
        <span className="toolbar-kicker">Background edit mode</span>
        <strong>{activeLayoutName} · content is temporarily hidden</strong>
      </div>
      <div className="toolbar-actions background-toolbar-controls">
        <input ref={fileInputRef} className="visually-hidden" type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleFile} />
        <button type="button" onClick={chooseFile}><ImagePlus size={16} /><span>Add Background Image</span></button>
        <button type="button" onClick={chooseFile} disabled={!background.source}><Upload size={16} /><span>Replace Background Image</span></button>
        <button type="button" className="danger-action" onClick={() => patchBackground({ source: undefined })} disabled={!background.source}><Trash2 size={16} /><span>Remove Image</span></button>
        <label className="background-color-control"><span>Background color</span><input aria-label="Background color picker" type="color" value={background.color} onChange={(event) => { setColorDraft(event.target.value); patchBackground({ color: event.target.value }); }} /><input aria-label="Background color HEX" value={colorDraft} maxLength={7} onChange={(event) => setColorDraft(event.target.value)} onBlur={commitColor} onKeyDown={(event) => { if (event.key === 'Enter') commitColor(); }} /></label>
        <label><span>Image fit</span><select aria-label="Background image fit" value={background.fit} onChange={(event) => patchBackground({ fit: event.target.value as BackgroundFitMode })}><option value="cover">Cover</option><option value="contain">Contain</option><option value="stretch">Stretch</option><option value="original">Original Size</option></select></label>
        <label><span>Position</span><select aria-label="Background image position" value={background.position} onChange={(event) => patchBackground({ position: event.target.value as ImagePositionMode })}><option value="center">Center</option><option value="top">Top</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="right">Right</option></select></label>
        <label className="background-opacity-control"><span>Opacity</span><input aria-label="Background image opacity" type="range" min="0" max="1" step="0.05" value={background.opacity} disabled={!background.source} onChange={(event) => patchBackground({ opacity: Number(event.target.value) })} /><input aria-label="Background opacity percent" className="background-opacity-number" type="number" min="0" max="100" step="1" value={Math.round(background.opacity * 100)} disabled={!background.source} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) patchBackground({ opacity: Math.max(0, Math.min(100, value)) / 100 }); }} /></label>
        <button type="button" onClick={() => { onReset(); setColorDraft(DEFAULT_BULLETIN_BACKGROUND.color); setUploadError(''); }}><RotateCcw size={16} /><span>Reset Background</span></button>
        <button type="button" className="primary-action" onClick={onSave}><Check size={16} /><span>Save Background</span></button>
        <button type="button" onClick={onCancel}><X size={16} /><span>Cancel</span></button>
        {uploadError && <span className="background-editor-error" role="alert"><RefreshCcw size={13} />{uploadError}</span>}
      </div>
    </div>
  );
}
