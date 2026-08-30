import { create } from 'zustand';

interface AdminState {
  isAdmin: boolean;
  isDialogOpen: boolean;
  isControlModalOpen: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  changePassword: (oldPin: string, newPin: string) => { success: boolean; message: string };
  openDialog: () => void;
  closeDialog: () => void;
  openControlModal: () => void;
  closeControlModal: () => void;
}

const ADMIN_STORAGE_KEY = 'BONSA_ADMIN_AUTH';
const ADMIN_PIN_CUSTOM_KEY = 'BONSA_ADMIN_PIN_CUSTOM';
const DEFAULT_ADMIN_PIN = '1234';

function getStoredPin(): string {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PIN;
  try {
    return localStorage.getItem(ADMIN_PIN_CUSTOM_KEY) || DEFAULT_ADMIN_PIN;
  } catch {
    return DEFAULT_ADMIN_PIN;
  }
}

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
    const currentPin = getStoredPin();
    if (password === currentPin) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(ADMIN_STORAGE_KEY, 'true');
      }
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

  changePassword: (oldPin: string, newPin: string) => {
    const currentPin = getStoredPin();
    if (oldPin !== currentPin) {
      return { success: false, message: '현재 비밀번호가 일치하지 않습니다.' };
    }
    if (!newPin || newPin.length < 4) {
      return { success: false, message: '새 비밀번호는 4자리 이상으로 설정해 주세요.' };
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_PIN_CUSTOM_KEY, newPin);
    }
    return { success: true, message: '관리자 비밀번호가 성공적으로 변경되었습니다.' };
  },

  openDialog: () => set({ isDialogOpen: true }),
  closeDialog: () => set({ isDialogOpen: false }),
  openControlModal: () => set({ isControlModalOpen: true }),
  closeControlModal: () => set({ isControlModalOpen: false }),
}));
