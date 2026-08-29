import { create } from 'zustand';
import { AccountItem, VatSalesItem, VatPurchaseItem } from '@/lib/db/schema';

export interface MonthlyState {
  year: number;
  month: number;
  purchaseAmount: number;
  serviceAs: number;
  point: number;
  incentive: number;
  headquartersDeposit: number;
  accounts: AccountItem[];
}

interface StoreState {
  currentMonthly: MonthlyState;
  monthlyList: any[];
  vatList: any[];
  isLoading: boolean;
  
  setCurrentMonthly: (data: Partial<MonthlyState>) => void;
  addAccount: (account: AccountItem) => void;
  removeAccount: (index: number) => void;
  updateAccount: (index: number, account: Partial<AccountItem>) => void;
  fetchMonthlyList: () => Promise<void>;
  fetchVatList: () => Promise<void>;
  saveCurrentMonthly: () => Promise<boolean>;
  deleteMonthly: (id: string) => Promise<boolean>;
}

export const useClosingStore = create<StoreState>((set, get) => ({
  currentMonthly: {
    year: 2026,
    month: 8,
    purchaseAmount: 0,
    serviceAs: 0,
    point: 0,
    incentive: 0,
    headquartersDeposit: 0,
    accounts: [
      { name: '농협', amount: 0 },
      { name: '기업은행', amount: 0 },
    ],
  },
  monthlyList: [],
  vatList: [],
  isLoading: false,

  setCurrentMonthly: (data) =>
    set((state) => ({
      currentMonthly: { ...state.currentMonthly, ...data },
    })),

  addAccount: (account) =>
    set((state) => ({
      currentMonthly: {
        ...state.currentMonthly,
        accounts: [...state.currentMonthly.accounts, account],
      },
    })),

  removeAccount: (index) =>
    set((state) => ({
      currentMonthly: {
        ...state.currentMonthly,
        accounts: state.currentMonthly.accounts.filter((_, i) => i !== index),
      },
    })),

  updateAccount: (index, updated) =>
    set((state) => {
      const next = [...state.currentMonthly.accounts];
      next[index] = { ...next[index], ...updated };
      return {
        currentMonthly: {
          ...state.currentMonthly,
          accounts: next,
        },
      };
    }),

  fetchMonthlyList: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/closing');
      const data = await res.json();
      if (data.success) {
        set({ monthlyList: data.data });
        if (data.data.length > 0) {
          const latest = data.data[0];
          set({
            currentMonthly: {
              year: latest.year,
              month: latest.month,
              purchaseAmount: latest.purchaseAmount,
              serviceAs: latest.serviceAs,
              point: latest.point,
              incentive: latest.incentive,
              headquartersDeposit: latest.headquartersDeposit,
              accounts: latest.accounts || [],
            },
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchVatList: async () => {
    try {
      const res = await fetch('/api/vat');
      const data = await res.json();
      if (data.success) {
        set({ vatList: data.data });
      }
    } catch (e) {
      console.error(e);
    }
  },

  saveCurrentMonthly: async () => {
    const { currentMonthly } = get();
    try {
      const res = await fetch('/api/closing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentMonthly),
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchMonthlyList();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  deleteMonthly: async (id: string) => {
    try {
      const res = await fetch(`/api/closing?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await get().fetchMonthlyList();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
}));
