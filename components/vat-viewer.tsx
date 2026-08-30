"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClosingStore } from '@/hooks/use-closing';
import { formatCurrency } from '@/lib/utils';
import { Calendar } from 'lucide-react';

export function VatViewer() {
  const { vatList } = useClosingStore();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(2);

  const quarterMonths = [selectedQuarter * 3 - 2, selectedQuarter * 3 - 1, selectedQuarter * 3];

  // 선택된 분기 데이터 찾기
  const found = vatList.find((v) => v.year === selectedYear && v.quarter === selectedQuarter);

  const salesTaxTotal = found?.salesTaxTotal || (found?.salesData?.reduce((s: number, r: any) => s + (r.tax || 0), 0) ?? 179032025);
  const salesCardTotal = found?.salesCardTotal || (found?.salesData?.reduce((s: number, r: any) => s + (r.card || 0), 0) ?? 103877310);
  const salesTotal = salesTaxTotal + salesCardTotal;

  const purchaseTaxTotal = found?.purchaseTaxTotal || (found?.purchaseData?.reduce((s: number, r: any) => s + (r.tax || 0), 0) ?? 291109477);
  const purchaseCardTotal = found?.purchaseCardTotal || (found?.purchaseData?.reduce((s: number, r: any) => s + (r.card || 0), 0) ?? 0);
  const purchaseTotal = purchaseTaxTotal + purchaseCardTotal;

  const difference = salesTotal - purchaseTotal;

  const maxCompare = Math.max(salesTotal, purchaseTotal, 1);
  const salesBarWidth = `${(salesTotal / maxCompare) * 100}%`;
  const purchaseBarWidth = `${(purchaseTotal / maxCompare) * 100}%`;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 1. 상단 날짜 검색기 */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <Calendar className="h-5 w-5 text-blue-600" />
          <span>분기 부가세 조회</span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="h-10 w-32 rounded-2xl bg-slate-50 border-slate-200 text-sm font-bold">
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

          <Select value={String(selectedQuarter)} onValueChange={(v) => setSelectedQuarter(parseInt(v))}>
            <SelectTrigger className="h-10 w-28 rounded-2xl bg-slate-50 border-slate-200 text-sm font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((q) => (
                <SelectItem key={q} value={String(q)}>
                  {q}분기
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 2. 상단 분기 정산 집계 카드 (글씨 크기 확대) */}
      <Card className="shadow-sm border-slate-200 bg-white rounded-3xl p-6 sm:p-7 space-y-6">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          분기 정산 집계 &bull; {String(selectedYear).slice(-2)}년 {selectedQuarter}분기({quarterMonths[0]}~{quarterMonths[2]}월)
        </h2>

        {/* 6개 KPI 카드 그리드 */}
        <div className="grid grid-cols-3 gap-3.5">
          {/* 매출 세금계산서 */}
          <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl">
            <span className="text-xs text-blue-700 block font-semibold">매출 세금계산서</span>
            <span className="text-sm sm:text-lg font-bold font-mono text-slate-900 mt-1 block">
              {formatCurrency(salesTaxTotal)}
            </span>
          </div>

          {/* 매출 신용카드 */}
          <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl">
            <span className="text-xs text-blue-700 block font-semibold">매출 신용카드</span>
            <span className="text-sm sm:text-lg font-bold font-mono text-slate-900 mt-1 block">
              {formatCurrency(salesCardTotal)}
            </span>
          </div>

          {/* 총 매출 (파란 강조) */}
          <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
            <span className="text-xs text-blue-100 block font-semibold">총 매출</span>
            <span className="text-sm sm:text-lg font-black font-mono mt-1 block">
              {formatCurrency(salesTotal)}
            </span>
          </div>

          {/* 매입 세금계산서 */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <span className="text-xs text-slate-600 block font-semibold">매입 세금계산서</span>
            <span className="text-sm sm:text-lg font-bold font-mono text-slate-900 mt-1 block">
              {formatCurrency(purchaseTaxTotal)}
            </span>
          </div>

          {/* 매입 신용카드 */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <span className="text-xs text-slate-600 block font-semibold">매입 신용카드</span>
            <span className="text-sm sm:text-lg font-bold font-mono text-slate-900 mt-1 block">
              {formatCurrency(purchaseCardTotal)}
            </span>
          </div>

          {/* 총 매입 (다크 강조) */}
          <div className="p-4 bg-slate-950 text-white rounded-2xl shadow-md">
            <span className="text-xs text-slate-300 block font-semibold">총 매입</span>
            <span className="text-sm sm:text-lg font-black font-mono mt-1 block">
              {formatCurrency(purchaseTotal)}
            </span>
          </div>
        </div>

        {/* 매출 - 매입 차액 카드 */}
        <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 block">
              매출 - 매입 차액 (부가세 과세표준 기준)
            </span>
            <span className="text-xs text-muted-foreground font-mono mt-1 block">
              {formatCurrency(salesTotal)} - {formatCurrency(purchaseTotal)}
            </span>
          </div>
          <div className="text-right">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono ${
                difference >= 0 ? 'text-blue-600' : 'text-rose-600'
              }`}
            >
              {formatCurrency(difference)} 원
            </span>
            <span className="text-xs text-slate-500 block font-semibold mt-0.5">
              {difference >= 0 ? '매출 초과' : '매입 초과'}
            </span>
          </div>
        </div>
      </Card>

      {/* 3. 매출 vs 매입 비교 바 차트 카드 */}
      <Card className="shadow-sm border-slate-200 bg-white rounded-3xl p-6 sm:p-7 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">매출 vs 매입 비교</h2>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm sm:text-base">
              <span className="font-bold text-blue-600">총 매출</span>
              <span className="font-mono font-extrabold text-slate-900">{formatCurrency(salesTotal)} 원</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3.5">
              <div className="bg-blue-600 h-3.5 rounded-full transition-all duration-500" style={{ width: salesBarWidth }} />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm sm:text-base">
              <span className="font-bold text-slate-800">총 매입</span>
              <span className="font-mono font-extrabold text-slate-900">{formatCurrency(purchaseTotal)} 원</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3.5">
              <div className="bg-slate-950 h-3.5 rounded-full transition-all duration-500" style={{ width: purchaseBarWidth }} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
