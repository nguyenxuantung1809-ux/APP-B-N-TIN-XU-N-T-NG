'use client';

import { ImagePlus, RotateCcw, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { EditableImageState, ImageFitMode, ImagePositionMode } from '../types/bulletinLayout';

const ACCEPTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);

type ImageVariables = CSSProperties & Record<`--editable-image-${string}`, string>;
export type ImageLayerMode = 'editable' | 'content' | 'decorative';

function fileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)), { once: true });
    reader.addEventListener('error', () => reject(reader.error), { once: true });
    reader.readAsDataURL(file);
  });
}

function isAcceptedImage(file: File) {
  const lowerName = file.name.toLowerCase();
  return ACCEPTED_TYPES.has(file.type) || ACCEPTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

export interface EditableImageOptions {
  layer?: ImageLayerMode;
  defaultSrc?: string;
  defaultNode?: ReactNode;
  defaultFit?: ImageFitMode;
  defaultPosition?: ImagePositionMode;
  defaultOpacity?: number;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  menuAlign?: 'left' | 'right';
  emptyHint?: ReactNode;
}

export type EditableImageRenderer = (assetId: string, label: string, options?: EditableImageOptions) => ReactNode;

interface EditableImageProps extends EditableImageOptions {
  assetId: string;
  label: string;
  state?: EditableImageState;
  isEditing: boolean;
  selected: boolean;
  onSelect: (assetId: string) => void;
  onBeginChange: () => void;
  onChange: (assetId: string, state?: EditableImageState) => void;
}

export function EditableImage({
  assetId,
  label,
  state,
  isEditing,
  selected,
  onSelect,
  onBeginChange,
  onChange,
  defaultSrc,
  defaultNode,
  defaultFit = 'contain',
  defaultPosition = 'center',
  defaultOpacity = 1,
  alt = '',
  sizes = '128px',
  priority = false,
  className = '',
  menuAlign = 'left',
  emptyHint,
  layer = 'content',
}: EditableImageProps) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileError, setFileError] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const fit = state?.fit ?? defaultFit;
  const position = state?.position ?? defaultPosition;
  const opacity = state?.opacity ?? defaultOpacity;
  const customSource = state?.source;
  const source = state?.hidden ? undefined : customSource ?? defaultSrc;
  const showDefaultNode = !state?.hidden && !customSource && defaultNode;
  const interactive = layer === 'editable';
  const variables: ImageVariables = {
    '--editable-image-fit': fit,
    '--editable-image-position': position,
    '--editable-image-opacity': String(opacity),
  };

  const positionMenu = useCallback(() => {
    const anchor = anchorRef.current;
    const menu = menuRef.current;
    if (!anchor || !menu) return;
    const margin = 8;
    const gap = 7;
    const anchorRect = anchor.getBoundingClientRect();
    const menuWidth = menu.offsetWidth || 238;
    const menuHeight = menu.offsetHeight || 310;
    const preferredLeft = menuAlign === 'right' ? anchorRect.right - menuWidth : anchorRect.left;
    const left = Math.min(Math.max(margin, preferredLeft), Math.max(margin, window.innerWidth - menuWidth - margin));
    const roomBelow = window.innerHeight - anchorRect.bottom;
    const preferredTop = roomBelow >= menuHeight + gap + margin
      ? anchorRect.bottom + gap
      : anchorRect.top - menuHeight - gap;
    const top = Math.min(Math.max(margin, preferredTop), Math.max(margin, window.innerHeight - menuHeight - margin));
    setMenuPosition({ left, top });
  }, [menuAlign]);

  useLayoutEffect(() => {
    if (!interactive || !isEditing || !selected) return;
    const frame = requestAnimationFrame(positionMenu);
    const observer = new ResizeObserver(positionMenu);
    if (anchorRef.current) observer.observe(anchorRef.current);
    if (menuRef.current) observer.observe(menuRef.current);
    window.addEventListener('resize', positionMenu);
    window.addEventListener('scroll', positionMenu, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', positionMenu);
      window.removeEventListener('scroll', positionMenu, true);
    };
  }, [interactive, isEditing, positionMenu, selected]);

  const update = (patch: Partial<EditableImageState>) => {
    onBeginChange();
    onChange(assetId, { ...state, ...patch });
  };

  const replaceImage = async (file?: File) => {
    if (!file) return;
    if (!isAcceptedImage(file)) {
      setFileError('Use PNG, JPG, JPEG, WEBP or SVG.');
      return;
    }
    try {
      const nextSource = await fileAsDataUrl(file);
      setFileError('');
      onBeginChange();
      onChange(assetId, {
        ...state,
        source: nextSource,
        fit: state?.fit ?? defaultFit,
        position: state?.position ?? defaultPosition,
        opacity: state?.opacity ?? defaultOpacity,
        hidden: false,
      });
    } catch {
      setFileError('This image could not be read.');
    }
  };

  return (
    <div
      ref={anchorRef}
      data-editor-element-id={interactive ? `image:${assetId}` : undefined}
      data-editable-image-id={interactive ? assetId : undefined}
      data-image-asset-id={assetId}
      data-image-layer={layer}
      data-has-custom-source={customSource ? 'true' : undefined}
      data-image-selected={interactive && selected ? 'true' : undefined}
      className={`editable-image-object image-layer-${layer} ${className}${interactive && selected ? ' is-image-selected' : ''}${state?.hidden ? ' is-image-deleted' : ''}`}
      style={variables}
      role={interactive && isEditing ? 'button' : undefined}
      tabIndex={interactive && isEditing ? 0 : undefined}
      aria-label={interactive && isEditing ? `Edit image: ${label}` : alt || undefined}
      aria-hidden={layer === 'decorative' ? true : undefined}
      onMouseDown={(event) => {
        if (!interactive || !isEditing) return;
        event.stopPropagation();
        onSelect(assetId);
      }}
      onClick={(event) => {
        if (!interactive || !isEditing) return;
        event.stopPropagation();
        onSelect(assetId);
      }}
      onKeyDown={(event) => {
        if (interactive && isEditing && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onSelect(assetId);
        }
      }}
    >
      <div className="editable-image-content">
        {source && <Image src={source} alt={alt} fill unoptimized priority={priority} sizes={sizes} />}
        {showDefaultNode && <span className="editable-image-default-node">{defaultNode}</span>}
        {!source && !showDefaultNode && isEditing && (interactive || Boolean(emptyHint)) && <div className="editable-image-empty no-print">{emptyHint ?? <><ImagePlus size={18} /><span>Image deleted</span></>}</div>}
      </div>

      {interactive && isEditing && selected && typeof document !== 'undefined' && createPortal(<div
        ref={menuRef}
        className={`editable-image-menu editable-image-menu-portal no-print menu-${menuAlign}`}
        role="dialog"
        aria-label={`Image settings for ${label}`}
        style={{ left: menuPosition?.left ?? -9999, top: menuPosition?.top ?? -9999, visibility: menuPosition ? 'visible' : 'hidden' }}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <strong>{label}</strong>
        <button type="button" className="image-replace-action" onClick={() => inputRef.current?.click()}><ImagePlus size={15} /> Replace Image</button>
        <label><span>Image Fit</span><select aria-label={`Image Fit for ${label}`} value={fit} onChange={(event) => update({ fit: event.target.value as ImageFitMode })}><option value="contain">Contain</option><option value="cover">Cover</option><option value="fill">Fill</option></select></label>
        <label><span>Position</span><select aria-label={`Image Position for ${label}`} value={position} onChange={(event) => update({ position: event.target.value as ImagePositionMode })}><option value="center">Center</option><option value="top">Top</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="right">Right</option></select></label>
        <label className="image-opacity-control"><span>Opacity</span><input aria-label={`Image Opacity for ${label}`} type="range" min="0" max="100" step="1" value={Math.round(opacity * 100)} onPointerDown={onBeginChange} onChange={(event) => onChange(assetId, { ...state, opacity: Number(event.target.value) / 100 })} /><output>{Math.round(opacity * 100)}%</output></label>
        <div className="editable-image-menu-actions">
          <button type="button" onClick={() => { onBeginChange(); onChange(assetId, undefined); }}><RotateCcw size={14} /> Reset Image</button>
          <button type="button" className="image-delete-action" onClick={() => update({ hidden: true })}><Trash2 size={14} /> Delete Image</button>
        </div>
        {fileError && <span className="editable-image-error" role="alert">{fileError}</span>}
        <input ref={inputRef} className="visually-hidden" type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => { void replaceImage(event.target.files?.[0]); event.currentTarget.value = ''; }} />
      </div>, document.body)}
    </div>
  );
}
