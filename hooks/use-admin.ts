import { create } from 'zustand';

interface AdminState {
  isAdmin: boolean;
  isDialogOpen: boolean;
  isControlModalOpen: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  openDialog: () => void;
  closeDialog: () => void;
  openControlModal: () => void;
  closeControlModal: () => void;
}

const ADMIN_STORAGE_KEY = 'BONSA_ADMIN_AUTH';
const DEFAULT_ADMIN_PIN = '1234';

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
  isControlModalOpen: false,

  login: (password: string) => {
    if (password === DEFAULT_ADMIN_PIN) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(ADMIN_STORAGE_KEY, 'true');
      }
      // 로그인 성공 시 로그인 다이얼로그 닫고 관리자 제어 센터 팝업 즉시 오픈
      set({ isAdmin: true, isDialogOpen: false, isControlModalOpen: true });
      return true;
    }
    return false;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    }
    set({ isAdmin: false, isControlModalOpen: false });
  },

  openDialog: () => set({ isDialogOpen: true }),
  closeDialog: () => set({ isDialogOpen: false }),
  openControlModal: () => set({ isControlModalOpen: true }),
  closeControlModal: () => set({ isControlModalOpen: false }),
}));
