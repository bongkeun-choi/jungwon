"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClosingStore } from '@/hooks/use-closing';
import { formatCurrency, parseNumber } from '@/lib/utils';
import { toast } from 'sonner';

export function VatCalculator() {
  const { vatList, fetchVatList } = useClosingStore();
  const [year, setYear] = useState<number>(2026);
  const [quarter, setQuarter] = useState<number>(2);

  const quarterMonths = [quarter * 3 - 2, quarter * 3 - 1, quarter * 3];

  const [salesRows, setSalesRows] = useState<Array<{ m: number; tax: number; card: number }>>([
    { m: 4, tax: 49810140, card: 35334010 },
    { m: 5, tax: 60811185, card: 32215540 },
    { m: 6, tax: 68410700, card: 36327760 },
  ]);

  const [purchaseRows, setPurchaseRows] = useState<Array<{ m: number; tax: number; card?: number }>>([
    { m: 4, tax: 93583435, card: 0 },
    { m: 5, tax: 98731380, card: 0 },
    { m: 6, tax: 98794662, card: 0 },
  ]);

  useEffect(() => {
    const found = vatList.find((v) => v.year === year && v.quarter === quarter);
    const months = [quarter * 3 - 2, quarter * 3 - 1, quarter * 3];
    if (found && found.salesData?.length > 0) {
      setSalesRows(found.salesData);
      setPurchaseRows(
        found.purchaseData?.length > 0
          ? found.purchaseData
          : months.map((m) => ({ m, tax: 0, card: 0 }))
      );
    }
  }, [year, quarter, vatList]);

  const handleQuarterChange = (qVal: string) => {
    const q = parseInt(qVal);
    setQuarter(q);
    const months = [q * 3 - 2, q * 3 - 1, q * 3];
    const found = vatList.find((v) => v.year === year && v.quarter === q);
    if (found && found.salesData?.length > 0) {
      setSalesRows(found.salesData);
      setPurchaseRows(
        found.purchaseData?.length > 0
          ? found.purchaseData
          : months.map((m) => ({ m, tax: 0, card: 0 }))
      );
    } else {
      setSalesRows(months.map((m) => ({ m, tax: 0, card: 0 })));
      setPurchaseRows(months.map((m) => ({ m, tax: 0, card: 0 })));
    }
  };

  const updateSales = (index: number, field: 'tax' | 'card', value: number) => {
    const next = [...salesRows];
    next[index][field] = value;
    setSalesRows(next);
  };

  const updatePurchase = (index: number, field: 'tax' | 'card', value: number) => {
    const next = [...purchaseRows];
    next[index][field] = value;
    setPurchaseRows(next);
  };

  // 계산
  const salesTaxSum = salesRows.reduce((s, r) => s + (r.tax || 0), 0);
  const salesCardSum = salesRows.reduce((s, r) => s + (r.card || 0), 0);
  const salesTotal = salesTaxSum + salesCardSum;

  const purchaseTaxSum = purchaseRows.reduce((s, r) => s + (r.tax || 0), 0);
  const purchaseCardSum = purchaseRows.reduce((s, r) => s + (r.card || 0), 0);
  const purchaseTotal = purchaseTaxSum + purchaseCardSum;

  const difference = salesTotal - purchaseTotal;

  const handleSave = async () => {
    try {
      const res = await fetch('/api/vat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          quarter,
          title: `${String(year).slice(-2)}년 ${quarter}분기(${quarterMonths[0]}~${quarterMonths[2]}월) 부가세 신고`,
          salesData: salesRows,
          purchaseData: purchaseRows,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${year}년 ${quarter}분기 부가세 내역이 저장되었습니다.`);
        await fetchVatList();
      } else {
        toast.error('저장에 실패했습니다.');
      }
    } catch {
      toast.error('저장 중 네트워크 오류가 발생했습니다.');
    }
  };

  const maxCompare = Math.max(salesTotal, purchaseTotal, 1);
  const salesBarWidth = `${(salesTotal / maxCompare) * 100}%`;
  const purchaseBarWidth = `${(purchaseTotal / maxCompare) * 100}%`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 좌측 입력 영역 (6컬럼) */}
      <div className="lg:col-span-6 space-y-6">
        <Card className="shadow-sm border-slate-200 bg-white rounded-2xl p-6">
          {/* 헤더 & 드롭다운 */}
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-base font-bold text-slate-900">분기 부가세 입력</h2>
            <div className="flex items-center gap-2">
              <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger className="h-9 w-28 rounded-xl bg-slate-50 border-slate-200 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}년
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(quarter)} onValueChange={handleQuarterChange}>
                <SelectTrigger className="h-9 w-36 rounded-xl bg-slate-50 border-slate-200 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1분기(1~3월)</SelectItem>
                  <SelectItem value="2">2분기(4~6월)</SelectItem>
                  <SelectItem value="3">3분기(7~9월)</SelectItem>
                  <SelectItem value="4">4분기(10~12월)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 안내 박스 */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs space-y-0.5 mb-6">
            <span className="font-bold text-slate-800 block">
              {String(year).slice(-2)}년 {quarter}분기 ({quarterMonths[0]}~{quarterMonths[2]}월)
            </span>
            <p className="text-slate-500">세금계산서 및 카드 매출/매입 내역을 입력하세요.</p>
          </div>

          {/* 1. 매출 섹션 */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-600" />
              <span className="text-xs font-bold text-slate-900">매출 내역</span>
            </div>

            <div className="grid grid-cols-12 gap-2 text-[11px] font-medium text-slate-500 px-1">
              <div className="col-span-2">월</div>
              <div className="col-span-5">세금계산서</div>
              <div className="col-span-5">신용카드/현금영수증</div>
            </div>

            {salesRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-2">
                  <div className="bg-slate-900 text-white text-xs font-bold py-1.5 px-3 rounded-full text-center">
                    {row.m}월
                  </div>
                </div>
                <div className="col-span-5">
                  <Input
                    value={row.tax ? formatCurrency(row.tax) : ''}
                    onChange={(e) => updateSales(idx, 'tax', parseNumber(e.target.value))}
                    placeholder="0"
                    className="text-right font-mono text-xs font-medium h-9 rounded-xl bg-white"
                  />
                </div>
                <div className="col-span-5">
                  <Input
                    value={row.card ? formatCurrency(row.card) : ''}
                    onChange={(e) => updateSales(idx, 'card', parseNumber(e.target.value))}
                    placeholder="0"
                    className="text-right font-mono text-xs font-medium h-9 rounded-xl bg-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 2. 매입 섹션 */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-slate-900" />
              <span className="text-xs font-bold text-slate-900">매입 내역</span>
            </div>

            <div className="grid grid-cols-12 gap-2 text-[11px] font-medium text-slate-500 px-1">
              <div className="col-span-2">월</div>
              <div className="col-span-5">세금계산서</div>
              <div className="col-span-5">신용카드(선택)</div>
            </div>

            {purchaseRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-2">
                  <div className="border border-slate-300 text-slate-800 text-xs font-bold py-1.5 px-3 rounded-full text-center bg-white">
                    {row.m}월
                  </div>
                </div>
                <div className="col-span-5">
                  <Input
                    value={row.tax ? formatCurrency(row.tax) : ''}
                    onChange={(e) => updatePurchase(idx, 'tax', parseNumber(e.target.value))}
                    placeholder="0"
                    className="text-right font-mono text-xs font-medium h-9 rounded-xl bg-white"
                  />
                </div>
                <div className="col-span-5">
                  <Input
                    value={row.card ? formatCurrency(row.card) : '0'}
                    onChange={(e) => updatePurchase(idx, 'card', parseNumber(e.target.value))}
                    placeholder="0"
                    className="text-right font-mono text-xs font-medium h-9 rounded-xl bg-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 분기 저장 버튼 */}
          <Button
            onClick={handleSave}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20"
          >
            분기 저장
          </Button>
        </Card>
      </div>

      {/* 우측 집계 및 통계 영역 (6컬럼) */}
      <div className="lg:col-span-6 space-y-6">
        
        {/* 상단 집계 카드 */}
        <Card className="shadow-sm border-slate-200 bg-white rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-4">
            분기 정산 집계 • {String(year).slice(-2)}년 {quarter}분기({quarterMonths[0]}~{quarterMonths[2]}월)
          </h2>

          {/* 6개 KPI 카드 그리드 */}
          <div className="grid grid-cols-3 gap-3">
            {/* 매출 세금계산서 합 */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
              <span className="text-[11px] text-blue-700 block font-medium">매출 세금계산서</span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-900 mt-1 block">
                {formatCurrency(salesTaxSum)}
              </span>
            </div>

            {/* 매출 카드 합 */}
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
              <span className="text-[11px] text-indigo-700 block font-medium">매출 신용카드</span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-900 mt-1 block">
                {formatCurrency(salesCardSum)}
              </span>
            </div>

            {/* 총 매출합계 (검정 박스) */}
            <div className="p-3.5 bg-slate-950 text-white rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">총 매출합계</span>
              <span className="text-sm sm:text-base font-bold font-mono text-white mt-1 block">
                {formatCurrency(salesTotal)}
              </span>
            </div>

            {/* 매입 세금계산서 합 */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[11px] text-slate-500 block font-medium">매입 세금계산서</span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-900 mt-1 block">
                {formatCurrency(purchaseTaxSum)}
              </span>
            </div>

            {/* 매입 카드 합 */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[11px] text-slate-500 block font-medium">매입 신용카드</span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-900 mt-1 block">
                {formatCurrency(purchaseCardSum)}
              </span>
            </div>

            {/* 매출/매입 차액 */}
            <div className="p-3.5 bg-rose-50/80 border border-rose-100 rounded-xl">
              <span className="text-[11px] text-rose-600 block font-medium">매출 - 매입 차액</span>
              <span className={`text-sm sm:text-base font-bold font-mono mt-1 block ${difference < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {difference > 0 ? `+${formatCurrency(difference)}` : formatCurrency(difference)}
              </span>
            </div>
          </div>

          {/* 매출 vs 매입 비교 바 차트 */}
          <div className="mt-6 space-y-3 pt-4 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-900 block">매출 vs 매입 규모 비교</span>

            {/* 매출 바 */}
            <div className="flex items-center gap-3 text-xs">
              <span className="w-8 text-slate-500">매출</span>
              <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden flex items-center">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all flex items-center justify-end pr-3"
                  style={{ width: salesBarWidth }}
                >
                  <span className="text-[10px] text-white font-mono font-bold">
                    {formatCurrency(salesTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* 매입 바 */}
            <div className="flex items-center gap-3 text-xs">
              <span className="w-8 text-slate-500">매입</span>
              <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden flex items-center">
                <div
                  className="bg-slate-900 h-full rounded-full transition-all flex items-center justify-end pr-3"
                  style={{ width: purchaseBarWidth }}
                >
                  <span className="text-[10px] text-white font-mono font-bold">
                    {formatCurrency(purchaseTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 하단 저장된 분기 리스트 카드 */}
        <Card className="shadow-sm border-slate-200 bg-white rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-3">저장된 분기 내역</h2>
          <div className="space-y-3">
            {[
              { label: '26년 2분기(4~6월)', sales: 282909335, purchase: 291109477, diff: -8200142 },
              { label: '26년 1분기(1~3월)', sales: 236935200, purchase: 232392339, diff: 4542861 },
              { label: '25년 4분기(10~12월)', sales: 283225105, purchase: 254033283, diff: 29191822 },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{item.label}</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    매출 {formatCurrency(item.sales)} / 매입 {formatCurrency(item.purchase)}
                  </span>
                </div>
                <span
                  className={`text-sm font-mono font-bold ${
                    item.diff < 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {item.diff > 0 ? `+${formatCurrency(item.diff)}` : formatCurrency(item.diff)}
                </span>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}
