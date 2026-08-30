import { create } from 'zustand';

interface AdminState {
  isAdmin: boolean;
  isDialogOpen: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  openDialog: () => void;
  closeDialog: () => void;
}

const ADMIN_STORAGE_KEY = 'BONSA_ADMIN_AUTH';
const DEFAULT_ADMIN_PIN = '1234'; // 기본 관리자 비밀번호

function getInitialAdminState(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export const useAdminStore = create<AdminState>((set) => ({
  isAdmin: getInitialAdminState(),
  isDialogOpen: false,

  login: (password: string) => {
    // 비밀번호 검증 (기본값: 1234)
    if (password === DEFAULT_ADMIN_PIN) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(ADMIN_STORAGE_KEY, 'true');
      }
      set({ isAdmin: true, isDialogOpen: false });
      return true;
    }
    return false;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    }
    set({ isAdmin: false });
  },

  openDialog: () => set({ isDialogOpen: true }),
  closeDialog: () => set({ isDialogOpen: false }),
}));
