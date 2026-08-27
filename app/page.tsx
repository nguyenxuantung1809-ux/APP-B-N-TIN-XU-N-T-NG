'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BulletinPreview } from './components/BulletinPreview';
import { ExcelUploader } from './components/ExcelUploader';
import { ExportToolbar, type TypographyEditorStyle } from './components/ExportToolbar';
import { useEditorSelection } from './hooks/useEditorSelection';
import { parseBulletinExcel } from './lib/excelParser';
import { loadStoredLayoutLibrary, saveStoredLayoutLibrary } from './lib/layoutStorage';
import type { BulletinData, BulletinLocale, ParseState } from './types/bulletin';
import {
  BULLETIN_LAYOUT_LIBRARY_KEY,
  DEFAULT_LAYOUT_ID,
  LEGACY_LAYOUT_STORAGE_KEY,
  OLDER_LAYOUT_LIBRARY_KEY,
  PREVIOUS_LAYOUT_LIBRARY_KEY,
  cloneLayoutSnapshot,
  migrateLegacyLayout,
  parseLayoutLibrary,
  typographyDefaultsFor,
  type BlockTypographyStyle,
  type BulletinLayoutSnapshot,
  type LayoutProfile,
  type TypographyTargetId,
} from './types/bulletinLayout';

type DialogMode = 'save' | 'rename' | 'delete' | null;

function createProfile(name: string, snapshot: BulletinLayoutSnapshot): LayoutProfile {
  const now = new Date().toISOString();
  return { id: `layout-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, snapshot: cloneLayoutSnapshot(snapshot), createdAt: now, updatedAt: now };
}

function uniqueLayoutName(requested: string, profiles: LayoutProfile[]) {
  const base = requested.trim() || 'Untitled Layout';
  if (!profiles.some((profile) => profile.name.toLowerCase() === base.toLowerCase())) return base;
  let suffix = 2;
  while (profiles.some((profile) => profile.name.toLowerCase() === `${base} (${suffix})`.toLowerCase())) suffix += 1;
  return `${base} (${suffix})`;
}

const TYPOGRAPHY_FIELDS = [
  'fontFamily',
  'titleSize',
  'subtitleSize',
  'bodySize',
  'tableHeaderSize',
  'tableDataSize',
  'fontWeight',
  'textColor',
  'lineHeight',
  'textAlign',
  'imageFit',
] as const satisfies ReadonlyArray<keyof Required<BlockTypographyStyle>>;

function resolveTypographyEditorStyle(ids: TypographyTargetId[], layout: BulletinLayoutSnapshot): TypographyEditorStyle {
  const targetIds = ids.length > 0 ? ids : ['headerTitle' as TypographyTargetId];
  const resolved = targetIds.map((id) => ({ ...typographyDefaultsFor(id), ...layout.styles[id] }));
  const result: Record<string, unknown> = {};
  for (const field of TYPOGRAPHY_FIELDS) {
    const first = resolved[0][field];
    result[field] = resolved.every((style) => Object.is(style[field], first)) ? first : 'mixed';
  }
  return result as TypographyEditorStyle;
}

export default function Home() {
  const [state, setState] = useState<ParseState>('idle');
  const [data, setData] = useState<BulletinData | null>(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState<BulletinLayoutSnapshot>(cloneLayoutSnapshot);
  const [profiles, setProfiles] = useState<LayoutProfile[]>([]);
  const [activeLayoutId, setActiveLayoutId] = useState(DEFAULT_LAYOUT_ID);
  const [history, setHistory] = useState<BulletinLayoutSnapshot[]>([]);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [layoutName, setLayoutName] = useState('');
  const [persistenceError, setPersistenceError] = useState('');
  const selection = useEditorSelection();
  const currentFile = useRef<File | null>(null);
  const layoutRef = useRef(layout);
  const profilesRef = useRef<LayoutProfile[]>([]);
  const activeLayoutIdRef = useRef(DEFAULT_LAYOUT_ID);
  const persistenceQueueRef = useRef<Promise<void>>(Promise.resolve());

  const applyLayout = useCallback((next: BulletinLayoutSnapshot) => {
    const cloned = cloneLayoutSnapshot(next);
    layoutRef.current = cloned;
    setLayout(cloned);
  }, []);

  const applyProfiles = useCallback((next: LayoutProfile[]) => {
    profilesRef.current = next;
    setProfiles(next);
  }, []);

  const applyActiveLayoutId = useCallback((next: string) => {
    activeLayoutIdRef.current = next;
    setActiveLayoutId(next);
  }, []);

  const persistLibrary = useCallback((nextProfiles: LayoutProfile[], nextActiveId: string) => {
    // Save As and Save Changes both pass through this exact serialization step.
    // Clone every snapshot—including base64 image sources—before queuing the
    // write so later UI changes cannot mutate the payload already being saved.
    const library = {
      version: 4 as const,
      activeProfileId: nextActiveId,
      profiles: nextProfiles.map((profile) => ({
        ...profile,
        snapshot: cloneLayoutSnapshot(profile.snapshot),
      })),
    };
    const task = persistenceQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        try {
          await saveStoredLayoutLibrary(library);
          window.localStorage.setItem(`${BULLETIN_LAYOUT_LIBRARY_KEY}:active`, nextActiveId);
          setPersistenceError('');
        } catch {
          setPersistenceError('The layout could not be saved in browser storage. Please free some device storage and try again.');
        }
      });
    persistenceQueueRef.current = task;
    return task;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    const initialize = async () => {
      const indexedDbLibrary = parseLayoutLibrary(JSON.stringify(await loadStoredLayoutLibrary().catch(() => null)));
      const candidates = [
        indexedDbLibrary,
        parseLayoutLibrary(window.localStorage.getItem(BULLETIN_LAYOUT_LIBRARY_KEY)),
        parseLayoutLibrary(window.localStorage.getItem(PREVIOUS_LAYOUT_LIBRARY_KEY)),
        parseLayoutLibrary(window.localStorage.getItem(OLDER_LAYOUT_LIBRARY_KEY)),
      ].filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));
      const migrated = migrateLegacyLayout(window.localStorage.getItem(LEGACY_LAYOUT_STORAGE_KEY));
      if (migrated) candidates.push({ version: 4, activeProfileId: migrated.id, profiles: [migrated] });

      // A schema mismatch in an earlier build could normalize the IndexedDB
      // record to an empty library. Prefer the richest valid recovery source
      // instead of allowing that empty record to erase older saved layouts.
      const library = candidates.reduce((best, candidate) => (
        candidate.profiles.length > best.profiles.length ? candidate : best
      ), indexedDbLibrary ?? { version: 4, activeProfileId: DEFAULT_LAYOUT_ID, profiles: [] });
      await saveStoredLayoutLibrary(library).catch(() => setPersistenceError('Browser storage is unavailable. Saved images may not survive a refresh.'));
      if (cancelled) return;
      const active = library.profiles.find((profile) => profile.id === library.activeProfileId);
      frame = requestAnimationFrame(() => {
        applyProfiles(library.profiles);
        applyActiveLayoutId(active?.id ?? DEFAULT_LAYOUT_ID);
        applyLayout(active?.snapshot ?? cloneLayoutSnapshot());
      });
    };
    void initialize();
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [applyActiveLayoutId, applyLayout, applyProfiles]);

  const parseFile = useCallback(async (file: File, preferredLocale?: BulletinLocale) => {
    currentFile.current = file;
    setState('parsing');
    setError('');
    try {
      const parsed = await parseBulletinExcel(file, preferredLocale);
      setData(parsed);
      setState('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (caught) {
      setData(null);
      setState('error');
      setError(caught instanceof Error ? caught.message : 'The workbook could not be parsed.');
    }
  }, []);

  const uploadNew = () => {
    currentFile.current = null;
    setData(null);
    setError('');
    setState('idle');
    setIsEditing(false);
    selection.clear();
  };

  const beginLayoutChange = () => {
    const current = cloneLayoutSnapshot(layoutRef.current);
    setHistory((previous) => [...previous.slice(-29), current]);
  };

  const changeLayout = (next: BulletinLayoutSnapshot) => applyLayout(next);

  const changeTypography = (patch: Partial<BlockTypographyStyle>) => {
    if (selection.selectedTypographyIds.length === 0) return;
    const current = layoutRef.current;
    const styles = { ...current.styles };
    for (const id of selection.selectedTypographyIds) styles[id] = { ...styles[id], ...patch };
    applyLayout({
      ...current,
      styles,
    });
  };

  const selectLayout = (id: string) => {
    const currentProfiles = profilesRef.current;
    const profile = currentProfiles.find((item) => item.id === id);
    applyLayout(profile?.snapshot ?? cloneLayoutSnapshot());
    applyActiveLayoutId(profile?.id ?? DEFAULT_LAYOUT_ID);
    setHistory([]);
    selection.clear();
    void persistLibrary(currentProfiles, profile?.id ?? DEFAULT_LAYOUT_ID);
  };

  const undo = () => {
    setHistory((previous) => {
      const last = previous.at(-1);
      if (!last) return previous;
      applyLayout(last);
      return previous.slice(0, -1);
    });
  };

  const resetLayout = () => {
    beginLayoutChange();
    applyLayout(cloneLayoutSnapshot());
    applyActiveLayoutId(DEFAULT_LAYOUT_ID);
    selection.clear();
    void persistLibrary(profilesRef.current, DEFAULT_LAYOUT_ID);
  };

  const openSaveDialog = () => {
    setLayoutName(`Layout ${profilesRef.current.length + 1}`);
    setDialogMode('save');
  };

  const saveAs = () => {
    const currentProfiles = profilesRef.current;
    const profile = createProfile(uniqueLayoutName(layoutName, currentProfiles), layoutRef.current);
    const next = [...currentProfiles, profile];
    applyProfiles(next);
    applyActiveLayoutId(profile.id);
    void persistLibrary(next, profile.id);
    setDialogMode(null);
  };

  const saveChanges = () => {
    const currentActiveId = activeLayoutIdRef.current;
    if (currentActiveId === DEFAULT_LAYOUT_ID) return openSaveDialog();
    const currentProfiles = profilesRef.current;
    const now = new Date().toISOString();
    const currentSnapshot = cloneLayoutSnapshot(layoutRef.current);
    const next = currentProfiles.map((profile) => profile.id === currentActiveId
      ? { ...profile, snapshot: currentSnapshot, updatedAt: now }
      : profile);
    applyProfiles(next);
    void persistLibrary(next, currentActiveId);
  };

  const openRenameDialog = () => {
    const active = profiles.find((profile) => profile.id === activeLayoutId);
    if (!active) return;
    setLayoutName(active.name);
    setDialogMode('rename');
  };

  const renameLayout = () => {
    const requested = layoutName.trim();
    if (!requested) return;
    const currentProfiles = profilesRef.current;
    const currentActiveId = activeLayoutIdRef.current;
    const others = currentProfiles.filter((profile) => profile.id !== currentActiveId);
    const name = uniqueLayoutName(requested, others);
    const next = currentProfiles.map((profile) => profile.id === currentActiveId ? { ...profile, name, updatedAt: new Date().toISOString() } : profile);
    applyProfiles(next);
    void persistLibrary(next, currentActiveId);
    setDialogMode(null);
  };

  const duplicateLayout = () => {
    const currentProfiles = profilesRef.current;
    const activeName = currentProfiles.find((profile) => profile.id === activeLayoutIdRef.current)?.name ?? 'Default Layout';
    const profile = createProfile(uniqueLayoutName(`Copy of ${activeName}`, currentProfiles), layoutRef.current);
    const next = [...currentProfiles, profile];
    applyProfiles(next);
    applyActiveLayoutId(profile.id);
    void persistLibrary(next, profile.id);
  };

  const deleteLayout = () => {
    const currentActiveId = activeLayoutIdRef.current;
    if (currentActiveId === DEFAULT_LAYOUT_ID) return;
    const next = profilesRef.current.filter((profile) => profile.id !== currentActiveId);
    applyProfiles(next);
    applyActiveLayoutId(DEFAULT_LAYOUT_ID);
    setHistory([]);
    applyLayout(cloneLayoutSnapshot());
    void persistLibrary(next, DEFAULT_LAYOUT_ID);
    setDialogMode(null);
  };

  const activeProfileName = profiles.find((profile) => profile.id === activeLayoutId)?.name ?? 'Default Layout';
  const selectedTargetLabel = selection.selectedTypography.length === 0
    ? 'No text block selected'
    : selection.selectedTypography.length === 1
      ? selection.selectedTypography[0].label
      : `${selection.selectedTypography.length} blocks selected`;
  const selectedStyle = useMemo(
    () => resolveTypographyEditorStyle(selection.selectedTypographyIds, layout),
    [layout, selection.selectedTypographyIds],
  );

  useEffect(() => {
    if (!isEditing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') selection.clear();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditing, selection]);

  if (!data || state === 'idle' || state === 'error') {
    return <ExcelUploader busy={state === 'parsing'} error={error} onFile={parseFile} />;
  }

  return (
    <main className={`preview-shell${isEditing ? ' is-editing-layout' : ''}`}>
      <ExportToolbar
        data={data}
        isEditing={isEditing}
        layouts={profiles.map(({ id, name }) => ({ id, name }))}
        activeLayoutId={activeLayoutId}
        canUndo={history.length > 0}
        selectedTargetLabel={selectedTargetLabel}
        selectedTargetCount={selection.selectedTypographyIds.length}
        selectedStyle={selectedStyle}
        onSelectLayout={selectLayout}
        onUploadNew={uploadNew}
        onStartEditing={() => setIsEditing(true)}
        onSaveAs={openSaveDialog}
        onSaveChanges={saveChanges}
        onRename={openRenameDialog}
        onDuplicate={duplicateLayout}
        onDelete={() => setDialogMode('delete')}
        onUndo={undo}
        onResetLayout={resetLayout}
        onDoneEditing={() => { setIsEditing(false); selection.clear(); }}
        onBeginTypographyChange={beginLayoutChange}
        onTypographyChange={changeTypography}
      />
      {persistenceError && <div className="layout-storage-error no-print" role="alert">{persistenceError}</div>}
      <BulletinPreview
        data={data}
        isEditing={isEditing}
        layout={layout}
        selectedTargetIds={selection.selectedTypographyIds}
        selectedImageId={selection.selectedImageId}
        onSelectTarget={selection.selectTypography}
        onSelectImage={selection.selectImage}
        onClearSelection={selection.clear}
        onLayoutChange={changeLayout}
        onBeginChange={beginLayoutChange}
      />

      {dialogMode && <div className="layout-dialog-backdrop no-print" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogMode(null); }}>
        <section className="layout-dialog" role="dialog" aria-modal="true" aria-labelledby="layout-dialog-title">
          <button type="button" className="layout-dialog-close" aria-label="Close" onClick={() => setDialogMode(null)}><X size={18} /></button>
          {dialogMode === 'delete' ? <>
            <div className="dialog-warning-icon"><AlertTriangle size={24} /></div>
            <span className="toolbar-kicker">Delete saved layout</span>
            <h2 id="layout-dialog-title">Delete “{activeProfileName}”?</h2>
            <p>This removes the saved positions and sizes from this browser. Bulletin data is not affected.</p>
            <div className="layout-dialog-actions"><button type="button" onClick={() => setDialogMode(null)}>Cancel</button><button type="button" className="danger-action" onClick={deleteLayout}>Confirm Delete Layout</button></div>
          </> : <>
            <span className="toolbar-kicker">{dialogMode === 'save' ? 'Save a reusable layout' : 'Rename saved layout'}</span>
            <h2 id="layout-dialog-title">{dialogMode === 'save' ? 'Save Layout As' : 'Rename Layout'}</h2>
            <label htmlFor="layout-name">Layout name</label>
            <input id="layout-name" autoFocus value={layoutName} onChange={(event) => setLayoutName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && layoutName.trim()) { if (dialogMode === 'save') saveAs(); else renameLayout(); } }} />
            <div className="layout-dialog-actions"><button type="button" onClick={() => setDialogMode(null)}>Cancel</button><button type="button" className="primary-action" disabled={!layoutName.trim()} onClick={dialogMode === 'save' ? saveAs : renameLayout}>{dialogMode === 'save' ? 'Confirm Save Layout' : 'Confirm Rename Layout'}</button></div>
          </>}
        </section>
      </div>}
    </main>
  );
}
