import { create } from 'zustand';

interface FontScaleState {
  scale: number; // 0.8 (80%) ~ 1.4 (140%)
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

const STORAGE_KEY = 'BONSA_VIEWER_FONT_SCALE';
const DEFAULT_SCALE = 1.0;

function getInitialScale(): number {
  if (typeof window === 'undefined') return DEFAULT_SCALE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const num = parseFloat(saved);
      if (!isNaN(num) && num >= 0.75 && num <= 1.45) return num;
    }
  } catch {}
  return DEFAULT_SCALE;
}

export const useFontScaleStore = create<FontScaleState>((set) => ({
  scale: getInitialScale(),

  zoomIn: () =>
    set((state) => {
      const newScale = Math.min(1.4, Math.round((state.scale + 0.08) * 100) / 100);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(newScale));
      }
      return { scale: newScale };
    }),

  zoomOut: () =>
    set((state) => {
      const newScale = Math.max(0.8, Math.round((state.scale - 0.08) * 100) / 100);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(newScale));
      }
      return { scale: newScale };
    }),

  resetZoom: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(DEFAULT_SCALE));
    }
    set({ scale: DEFAULT_SCALE });
  },
}));
