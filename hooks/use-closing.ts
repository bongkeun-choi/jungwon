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
  setMonthlyList: (list: any[]) => void;
  setVatList: (list: any[]) => void;
  addAccount: (account: AccountItem) => void;
  removeAccount: (index: number) => void;
  updateAccount: (index: number, account: Partial<AccountItem>) => void;
  fetchMonthlyList: () => Promise<void>;
  fetchVatList: () => Promise<void>;
  saveCurrentMonthly: () => Promise<boolean>;
  deleteMonthly: (id: string) => Promise<boolean>;
}

// LocalStorage 헬퍼
const LOCAL_KEY_MONTHLY = 'BONSA_MAGAM_MONTHLY_LIST';
const LOCAL_KEY_VAT = 'BONSA_MAGAM_VAT_LIST';

function loadLocal(key: string, defaultVal: any) {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function saveLocal(key: string, val: any) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(e);
  }
}

export const useClosingStore = create<StoreState>((set, get) => ({
  currentMonthly: {
    year: 2026,
    month: 8,
    purchaseAmount: 104611397,
    serviceAs: 21615687,
    point: 8518600,
    incentive: 778182,
    headquartersDeposit: 25000000,
    accounts: [
      { name: '농협', amount: 18652077 },
      { name: '기업은행', amount: 19573305 },
    ],
  },
  monthlyList: loadLocal(LOCAL_KEY_MONTHLY, [
    {
      id: '26-08',
      year: 2026,
      month: 8,
      purchaseAmount: 104611397,
      serviceAs: 21615687,
      point: 8518600,
      incentive: 778182,
      headquartersDeposit: 25000000,
      closingAmount: 48698928,
      accounts: [
        { name: '농협', amount: 18652077 },
        { name: '기업은행', amount: 19573305 },
      ],
      bankTotal: 38225382,
      difference: 10473546,
      rawExcelSheetName: '  26년 08월',
    },
  ]),
  vatList: loadLocal(LOCAL_KEY_VAT, [
    {
      id: '26-2',
      year: 2026,
      quarter: 2,
      title: '26년 2분기(4~6월) 부가세 신고',
      salesData: [
        { m: 4, tax: 49810140, card: 35334010 },
        { m: 5, tax: 60811185, card: 32215540 },
        { m: 6, tax: 68410700, card: 36327760 },
      ],
      purchaseData: [
        { m: 4, tax: 93583435 },
        { m: 5, tax: 98731380 },
        { m: 6, tax: 98794662 },
      ],
      salesTaxTotal: 179032025,
      salesCardTotal: 103877310,
      salesTotal: 282909335,
      purchaseTotal: 291109477,
      difference: -8200142,
      rawSheetName: '26년 2분기 부가세',
    },
  ]),
  isLoading: false,

  setMonthlyList: (list) => {
    saveLocal(LOCAL_KEY_MONTHLY, list);
    set({ monthlyList: list });
  },

  setVatList: (list) => {
    saveLocal(LOCAL_KEY_VAT, list);
    set({ vatList: list });
  },

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
    // 로컬 스토리지에 데이터가 있으면 먼저 로드
    const local = loadLocal(LOCAL_KEY_MONTHLY, null);
    if (local && local.length > 0) {
      set({ monthlyList: local });
      return;
    }

    try {
      const res = await fetch('/api/closing');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          set({ monthlyList: data.data });
          saveLocal(LOCAL_KEY_MONTHLY, data.data);
        }
      }
    } catch {
      // 정적 환경에서는 로컬 데이터 유지
    }
  },

  fetchVatList: async () => {
    const local = loadLocal(LOCAL_KEY_VAT, null);
    if (local && local.length > 0) {
      set({ vatList: local });
      return;
    }

    try {
      const res = await fetch('/api/vat');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          set({ vatList: data.data });
          saveLocal(LOCAL_KEY_VAT, data.data);
        }
      }
    } catch {
      // 정적 환경
    }
  },

  saveCurrentMonthly: async () => {
    const { currentMonthly, monthlyList } = get();
    const id = `${String(currentMonthly.year).slice(-2)}-${String(currentMonthly.month).padStart(2, '0')}`;
    const purchase = currentMonthly.purchaseAmount || 0;
    const service = currentMonthly.serviceAs || 0;
    const point = currentMonthly.point || 0;
    const incentive = currentMonthly.incentive || 0;
    const headquarters = currentMonthly.headquartersDeposit || 0;
    const closingAmount = purchase - service - point - incentive - headquarters;
    const bankTotal = currentMonthly.accounts.reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const difference = closingAmount - bankTotal;

    const newItem = {
      id,
      year: currentMonthly.year,
      month: currentMonthly.month,
      purchaseAmount: purchase,
      serviceAs: service,
      point,
      incentive,
      headquartersDeposit: headquarters,
      closingAmount,
      accounts: currentMonthly.accounts,
      bankTotal,
      difference,
      rawExcelSheetName: `  ${String(currentMonthly.year).slice(-2)}년 ${String(currentMonthly.month).padStart(2, '0')}월`,
    };

    const existIdx = monthlyList.findIndex((m) => m.id === id);
    let nextList = [];
    if (existIdx >= 0) {
      nextList = [...monthlyList];
      nextList[existIdx] = newItem;
    } else {
      nextList = [newItem, ...monthlyList];
    }

    get().setMonthlyList(nextList);

    try {
      await fetch('/api/closing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentMonthly),
      });
    } catch {
      // 정적 환경
    }

    return true;
  },

  deleteMonthly: async (id: string) => {
    const { monthlyList } = get();
    const nextList = monthlyList.filter((m) => m.id !== id);
    get().setMonthlyList(nextList);

    try {
      await fetch(`/api/closing?id=${id}`, { method: 'DELETE' });
    } catch {
      // 정적 환경
    }
    return true;
  },
}));
