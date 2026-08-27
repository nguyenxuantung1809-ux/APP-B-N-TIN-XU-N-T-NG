'use client';

import { useCallback, useState } from 'react';
import type { TypographyTargetId } from '../types/bulletinLayout';

export interface TypographySelectionItem {
  id: TypographyTargetId;
  label: string;
}

interface EditorSelectionState {
  typography: TypographySelectionItem[];
  imageId: string;
}

const INITIAL_SELECTION: EditorSelectionState = {
  typography: [{ id: 'headerTitle', label: 'Bulletin Title' }],
  imageId: '',
};

/** Central selection manager shared by blocks, text scopes and image objects. */
export function useEditorSelection() {
  const [selection, setSelection] = useState<EditorSelectionState>(INITIAL_SELECTION);

  const selectTypography = useCallback((id: TypographyTargetId, label: string, additive = false) => {
    setSelection((current) => {
      if (!additive) return { typography: [{ id, label }], imageId: '' };
      const alreadySelected = current.typography.some((item) => item.id === id);
      return {
        typography: alreadySelected
          ? current.typography.filter((item) => item.id !== id)
          : [...current.typography, { id, label }],
        imageId: '',
      };
    });
  }, []);

  const selectImage = useCallback((imageId: string) => {
    setSelection({ typography: [], imageId });
  }, []);

  const clear = useCallback(() => {
    setSelection({ typography: [], imageId: '' });
  }, []);

  const clearImage = useCallback(() => {
    setSelection((current) => current.imageId ? { ...current, imageId: '' } : current);
  }, []);

  return {
    selectedTypography: selection.typography,
    selectedTypographyIds: selection.typography.map((item) => item.id),
    selectedImageId: selection.imageId,
    selectTypography,
    selectImage,
    clear,
    clearImage,
  };
}
