"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClosingStore } from '@/hooks/use-closing';
import { formatCurrency } from '@/lib/utils';
import { Calendar } from 'lucide-react';

export function MonthlyViewer() {
  const { currentMonthly, setCurrentMonthly, monthlyList } = useClosingStore();
  
  // 현재 실제 날짜 기준 (예: 2026년 9월 1일이면 2026년, 9월)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<number>(currentMonthly.year || currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthly.month || currentMonth);

  // 마운트 시 현재 날짜 기준으로 초기화
  React.useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    setSelectedYear(y);
    setSelectedMonth(m);
    const found = monthlyList.find((item) => item.year === y && item.month === m);
    if (found) {
      setCurrentMonthly(found);
    }
  }, [monthlyList, setCurrentMonthly]);

  // 선택된 연/월에 해당하는 데이터 찾기
  const activeData = monthlyList.find(
    (m) => m.year === selectedYear && m.month === selectedMonth
  ) || currentMonthly;

  const purchase = activeData.purchaseAmount || 0;
  const service = activeData.serviceAs || 0;
  const point = activeData.point || 0;
  const incentive = activeData.incentive || 0;
  const headquarters = activeData.headquartersDeposit || 0;
  const closingAmount = purchase - service - point - incentive - headquarters;

  const accounts = activeData.accounts || [];
  const bankTotal = accounts.reduce((s: number, a: any) => s + (Number(a.amount) || 0), 0);
  const difference = closingAmount - bankTotal;

  const handleYearChange = (val: string) => {
    const y = parseInt(val);
    setSelectedYear(y);
    const found = monthlyList.find((m) => m.year === y && m.month === selectedMonth);
    if (found) setCurrentMonthly(found);
  };

  const handleMonthChange = (val: string) => {
    const m = parseInt(val);
    setSelectedMonth(m);
    const found = monthlyList.find((m) => m.year === selectedYear && m.month === m);
    if (found) setCurrentMonthly(found);
  };

  const maxBarVal = Math.max(purchase, 1);
  const getBarWidth = (val: number) => {
    const pct = Math.min(100, Math.max(4, (Math.abs(val) / maxBarVal) * 100));
    return `${pct}%`;
  };

  return (
    <div className="space-y-2.5 max-w-xl mx-auto">
      {/* 1. 상단 날짜 검색기 (여백 최소화 & 글씨 확대) */}
      <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-slate-900 font-black text-base sm:text-lg">
          <Calendar className="h-5 w-5 text-blue-600" />
          <span>마감 정산일 조회</span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(selectedYear)} onValueChange={handleYearChange}>
            <SelectTrigger className="h-9 w-32 rounded-xl bg-slate-50 border-slate-200 text-sm sm:text-base font-black text-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {String(y).slice(-2)}년 ({y})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(selectedMonth)} onValueChange={handleMonthChange}>
            <SelectTrigger className="h-9 w-24 rounded-xl bg-slate-50 border-slate-200 text-sm sm:text-base font-black text-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {m}월
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 2. 블루 그라데이션 정산 마감금액 카드 (초슬림 & 글씨 큼직) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/15 relative overflow-hidden">
        <div className="flex items-center justify-between text-blue-100">
          <span className="font-bold text-sm sm:text-base">정산 마감금액</span>
          <span className="bg-white/20 text-white text-xs sm:text-sm font-mono font-bold px-2.5 py-0.5 rounded-full">
            {String(selectedYear).slice(-2)}년 {String(selectedMonth).padStart(2, '0')}월
          </span>
        </div>

        <div className="mt-0.5">
          <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight">
            {formatCurrency(closingAmount)}
          </span>
          <span className="text-xl font-bold ml-1">원</span>
        </div>

        {/* 수식 시각화 */}
        <div className="mt-2 pt-1.5 border-t border-white/20 text-xs font-mono text-blue-100 space-y-0.5 break-all">
          <p className="font-bold text-white/95 tracking-wide text-xs sm:text-sm">
            {formatCurrency(purchase)} - {formatCurrency(service)} - {formatCurrency(point)} - {formatCurrency(incentive)} - {formatCurrency(headquarters)}
          </p>
          <p className="text-[11px] text-blue-200 font-sans">
            매입금액 - 서비스 - 포인트 - 인센티브 - 본사입금
          </p>
        </div>
      </div>

      {/* 3. 통장 총액 & 정산 차액 2열 카드 그리드 (여백 축소 & 글씨 확대) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* 통장 총액 카드 */}
        <Card className="shadow-sm border-slate-200 bg-white rounded-2xl p-3.5">
          <div className="flex items-center gap-1.5 text-sm text-slate-700 font-bold">
            <span>통장 총액</span>
            <Badge variant="secondary" className="text-xs py-0 px-1.5 bg-slate-100 font-black">
              {accounts.length}개
            </Badge>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-0.5">
            {formatCurrency(bankTotal)} <span className="text-sm font-normal">원</span>
          </p>
          <div className="mt-1.5 text-sm text-slate-700 space-y-0.5 border-t pt-1.5 border-slate-100">
            {accounts.map((a: any, i: number) => (
              <div key={i} className="flex justify-between items-center">
                <span className="font-bold text-slate-800">{a.name}</span>
                <span className="font-mono font-black text-slate-950">{formatCurrency(a.amount)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 정산 차액 카드 */}
        <div
          className={`rounded-2xl p-3.5 border transition-all ${
            difference === 0
              ? 'border-emerald-200 bg-emerald-50/40'
              : 'border-rose-200 bg-rose-50/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-rose-600 font-extrabold">정산 차액</span>
            {difference === 0 ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                일치
              </span>
            ) : (
              <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                불일치
              </span>
            )}
          </div>
          <p
            className={`text-2xl sm:text-3xl font-black font-mono mt-0.5 ${
              difference === 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatCurrency(difference)} <span className="text-sm font-normal">원</span>
          </p>
          <p className="text-xs text-slate-600 font-mono mt-1.5 border-t pt-1 border-slate-100 break-all font-semibold">
            {formatCurrency(closingAmount)} - {formatCurrency(bankTotal)} = {formatCurrency(difference)}
          </p>
        </div>
      </div>

      {/* 4. 정산 구성 현황 및 프로그레스 바 차트 카드 (여백 축소 & 글씨 시원하게 확대) */}
      <Card className="shadow-sm border-slate-200 bg-white rounded-2xl p-3.5 sm:p-4">
        <h3 className="text-base sm:text-lg font-black text-slate-900 mb-2.5">정산 구성 현황</h3>
        <div className="space-y-2.5 text-sm sm:text-base">
          {/* 매입금액 */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-slate-800">
              <span className="font-extrabold">매입금액</span>
              <span className="font-mono font-black text-slate-950 text-base">{formatCurrency(purchase)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-slate-950 h-2 rounded-full" style={{ width: getBarWidth(purchase) }} />
            </div>
          </div>

          {/* 서비스 A/S */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-slate-700">
              <span className="font-bold">서비스 A/S</span>
              <span className="font-mono font-extrabold text-slate-800">-{formatCurrency(service)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: getBarWidth(service) }} />
            </div>
          </div>

          {/* 포인트 */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-slate-700">
              <span className="font-bold">포인트</span>
              <span className="font-mono font-extrabold text-slate-800">-{formatCurrency(point)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: getBarWidth(point) }} />
            </div>
          </div>

          {/* 인센티브 */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-slate-700">
              <span className="font-bold">인센티브</span>
              <span className="font-mono font-extrabold text-slate-800">-{formatCurrency(incentive)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: getBarWidth(incentive) }} />
            </div>
          </div>

          {/* 본사입금 */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-slate-700">
              <span className="font-bold">본사입금</span>
              <span className="font-mono font-extrabold text-slate-800">-{formatCurrency(headquarters)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: getBarWidth(headquarters) }} />
            </div>
          </div>

          {/* 최종 마감금액 */}
          <div className="pt-1.5 border-t border-slate-100 space-y-0.5">
            <div className="flex justify-between text-blue-600">
              <span className="font-black text-base">최종 마감금액</span>
              <span className="font-mono font-black text-lg">{formatCurrency(closingAmount)}</span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: getBarWidth(closingAmount) }} />
            </div>
          </div>

          {/* 통장별 입금액 */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <span className="text-sm font-black text-slate-800 block">통장별 입금액</span>
            {accounts.map((acc: any, i: number) => (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between text-slate-700">
                  <span className="font-bold text-sm sm:text-base">{acc.name}</span>
                  <span className="font-mono font-black text-slate-900 text-sm sm:text-base">{formatCurrency(acc.amount)}</span>
                </div>
                <div className="w-full bg-emerald-50 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full"
                    style={{ width: getBarWidth(acc.amount) }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 하단 국민은행 계좌 안내 */}
          <div className="mt-2.5 p-2.5 bg-slate-950 text-white rounded-xl flex items-center justify-between text-sm font-mono shadow-sm">
            <span className="text-slate-400 font-sans font-bold text-sm">국민은행</span>
            <span className="font-black text-amber-400 text-base sm:text-lg tracking-wide">
              3001-9029-00536-1
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
