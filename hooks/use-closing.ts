import { create } from 'zustand';
import { AccountItem, VatSalesItem, VatPurchaseItem } from '@/lib/db/schema';
import {
  getMonthlyFromTurso,
  saveMonthlyToTurso,
  deleteMonthlyFromTurso,
  getVatFromTurso,
  saveVatToTurso,
} from '@/lib/db/client-db';

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
    set({ isLoading: true });
    try {
      const tursoData = await getMonthlyFromTurso();
      if (tursoData && tursoData.length > 0) {
        set({ monthlyList: tursoData });
        saveLocal(LOCAL_KEY_MONTHLY, tursoData);

        const now = new Date();
        const curY = now.getFullYear();
        const curM = now.getMonth() + 1;

        // 현재 날짜(연/월)와 일치하는 데이터가 있으면 우선 설정, 없으면 목록의 첫 번째(최신) 데이터 설정
        const match = tursoData.find((d: any) => d.year === curY && d.month === curM) || tursoData[0];

        set({
          currentMonthly: {
            year: match.year,
            month: match.month,
            purchaseAmount: match.purchaseAmount,
            serviceAs: match.serviceAs,
            point: match.point,
            incentive: match.incentive,
            headquartersDeposit: match.headquartersDeposit,
            accounts: match.accounts || [],
          },
        });
        return;
      }
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }

    // 2. Turso 조회 실패 시 로컬 스토리지 확인
    const local = loadLocal(LOCAL_KEY_MONTHLY, null);
    if (local && local.length > 0) {
      set({ monthlyList: local });
    }
  },

  fetchVatList: async () => {
    try {
      const tursoVat = await getVatFromTurso();
      if (tursoVat && tursoVat.length > 0) {
        set({ vatList: tursoVat });
        saveLocal(LOCAL_KEY_VAT, tursoVat);
        return;
      }
    } catch (e) {
      console.error(e);
    }

    const local = loadLocal(LOCAL_KEY_VAT, null);
    if (local && local.length > 0) {
      set({ vatList: local });
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

    // 1. Turso DB에 직접 저장
    const tursoSuccess = await saveMonthlyToTurso(newItem);

    // 2. 로컬 상태 및 스토리지 업데이트
    const existIdx = monthlyList.findIndex((m) => m.id === id);
    let nextList = [];
    if (existIdx >= 0) {
      nextList = [...monthlyList];
      nextList[existIdx] = newItem;
    } else {
      nextList = [newItem, ...monthlyList];
    }

    get().setMonthlyList(nextList);

    return tursoSuccess || true;
  },

  deleteMonthly: async (id: string) => {
    await deleteMonthlyFromTurso(id);
    const { monthlyList } = get();
    const nextList = monthlyList.filter((m) => m.id !== id);
    get().setMonthlyList(nextList);
    return true;
  },
}));
