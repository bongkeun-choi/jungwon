"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClosingStore } from '@/hooks/use-closing';
import { useAdminStore } from '@/hooks/use-admin';
import { formatCurrency, parseNumber } from '@/lib/utils';
import { Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export function VatCalculator() {
  const { vatList, fetchVatList } = useClosingStore();
  const { isAdmin, openDialog } = useAdminStore();
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
    if (!isAdmin) {
      openDialog();
      toast.warning('부가세 데이터 저장은 관리자 로그인이 필요합니다.');
      return;
    }

    try {
      const vatData = {
        id: `${String(year).slice(-2)}-${quarter}`,
        year,
        quarter,
        title: `${String(year).slice(-2)}년 ${quarter}분기(${quarterMonths[0]}~${quarterMonths[2]}월) 부가세 신고`,
        salesData: salesRows,
        purchaseData: purchaseRows,
        salesTaxTotal: salesTaxSum,
        salesCardTotal: salesCardSum,
        salesTotal: salesTotal,
        purchaseTotal: purchaseTotal,
        difference: difference,
      };

      const { saveVatToTurso } = await import('@/lib/db/client-db');
      await saveVatToTurso(vatData);
      
      // 로컬 스토어 업데이트
      const existIdx = vatList.findIndex((v) => v.id === vatData.id);
      let nextVat = [];
      if (existIdx >= 0) {
        nextVat = [...vatList];
        nextVat[existIdx] = vatData;
      } else {
        nextVat = [vatData, ...vatList];
      }
      useClosingStore.getState().setVatList(nextVat);

      toast.success(`${year}년 ${quarter}분기 부가세 내역이 Turso DB에 저장되었습니다.`);
    } catch (e: any) {
      console.error(e);
      toast.error('저장 중 오류가 발생했습니다.');
    }
  };

  const maxCompare = Math.max(salesTotal, purchaseTotal, 1);
  const salesBarWidth = `${(salesTotal / maxCompare) * 100}%`;
  const purchaseBarWidth = `${(purchaseTotal / maxCompare) * 100}%`;

  const inputClass = !isAdmin
    ? "text-right font-mono text-xs font-medium h-9 rounded-xl border-slate-200 bg-slate-100/60 cursor-pointer text-slate-700"
    : "text-right font-mono text-xs font-medium h-9 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-blue-500";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 좌측 입력 영역 (6컬럼) */}
      <div className="lg:col-span-6 space-y-6">
        <Card className="shadow-sm border-slate-200 bg-white rounded-2xl p-6">
          {/* 헤더 & 드롭다운 */}
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">분기 부가세 입력</h2>
              {isAdmin ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-medium flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> 수정 가능
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  onClick={openDialog}
                  className="text-slate-500 bg-slate-50 hover:bg-slate-100 cursor-pointer text-[11px] font-medium flex items-center gap-1"
                >
                  <Lock className="h-3 w-3 text-slate-400" /> 조회 모드
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger className="h-9 w-28 rounded-xl bg-slate-50 border-slate-200 text-xs">
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

              <Select value={String(quarter)} onValueChange={handleQuarterChange}>
                <SelectTrigger className="h-9 w-28 rounded-xl bg-slate-50 border-slate-200 text-xs">
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
                    readOnly={!isAdmin}
                    onClick={() => !isAdmin && openDialog()}
                    value={row.tax ? formatCurrency(row.tax) : ''}
                    onChange={(e) => updateSales(idx, 'tax', parseNumber(e.target.value))}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div className="col-span-5">
                  <Input
                    readOnly={!isAdmin}
                    onClick={() => !isAdmin && openDialog()}
                    value={row.card ? formatCurrency(row.card) : ''}
                    onChange={(e) => updateSales(idx, 'card', parseNumber(e.target.value))}
                    placeholder="0"
                    className={inputClass}
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
                    readOnly={!isAdmin}
                    onClick={() => !isAdmin && openDialog()}
                    value={row.tax ? formatCurrency(row.tax) : ''}
                    onChange={(e) => updatePurchase(idx, 'tax', parseNumber(e.target.value))}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div className="col-span-5">
                  <Input
                    readOnly={!isAdmin}
                    onClick={() => !isAdmin && openDialog()}
                    value={row.card ? formatCurrency(row.card) : '0'}
                    onChange={(e) => updatePurchase(idx, 'card', parseNumber(e.target.value))}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 분기 저장 버튼 */}
          <Button
            onClick={handleSave}
            className={`w-full h-11 text-white font-semibold rounded-xl shadow-md ${
              isAdmin ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-slate-700 hover:bg-slate-800'
            }`}
          >
            {isAdmin ? '분기 저장' : '🔒 로그인 후 저장'}
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
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
              <span className="text-[11px] text-blue-700 block font-medium">매출 신용카드</span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-900 mt-1 block">
                {formatCurrency(salesCardSum)}
              </span>
            </div>

            {/* 총 매출 */}
            <div className="p-3.5 bg-blue-600 text-white rounded-xl shadow-sm">
              <span className="text-[11px] text-blue-100 block font-medium">총 매출</span>
              <span className="text-sm sm:text-base font-bold font-mono mt-1 block">
                {formatCurrency(salesTotal)}
              </span>
            </div>

            {/* 매입 세금계산서 합 */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[11px] text-slate-600 block font-medium">매입 세금계산서</span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-900 mt-1 block">
                {formatCurrency(purchaseTaxSum)}
              </span>
            </div>

            {/* 매입 카드 합 */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[11px] text-slate-600 block font-medium">매입 신용카드</span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-900 mt-1 block">
                {formatCurrency(purchaseCardSum)}
              </span>
            </div>

            {/* 총 매입 */}
            <div className="p-3.5 bg-slate-900 text-white rounded-xl shadow-sm">
              <span className="text-[11px] text-slate-300 block font-medium">총 매입</span>
              <span className="text-sm sm:text-base font-bold font-mono mt-1 block">
                {formatCurrency(purchaseTotal)}
              </span>
            </div>
          </div>

          {/* 하단 차액 카드 */}
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-700 block">
                매출 - 매입 차액 (부가세 과세표준 기준)
              </span>
              <span className="text-[11px] text-muted-foreground font-mono mt-0.5 block">
                {formatCurrency(salesTotal)} - {formatCurrency(purchaseTotal)}
              </span>
            </div>
            <div className="text-right">
              <span
                className={`text-lg font-black font-mono ${
                  difference >= 0 ? 'text-blue-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(difference)} 원
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                {difference >= 0 ? '매출 초과' : '매입 초과'}
              </span>
            </div>
          </div>
        </Card>

        {/* 매출 vs 매입 비율 비교 바 차트 */}
        <Card className="shadow-sm border-slate-200 bg-white rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-4">매출 vs 매입 비교</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-blue-600">총 매출</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(salesTotal)} 원</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: salesBarWidth }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-800">총 매입</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(purchaseTotal)} 원</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-slate-900 h-3 rounded-full transition-all duration-500" style={{ width: purchaseBarWidth }} />
              </div>
            </div>
          </div>
        </Card>

        {/* 저장된 분기 목록 */}
        <Card className="shadow-sm border-slate-200 bg-white rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">저장된 분기 목록</h2>
            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
              {vatList.length}건
            </Badge>
          </div>
          <div className="space-y-2">
            {vatList.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">저장된 분기 데이터가 없습니다.</p>
            ) : (
              vatList.map((v) => (
                <div
                  key={v.id}
                  onClick={() => {
                    setYear(v.year);
                    setQuarter(v.quarter);
                  }}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    v.year === year && v.quarter === quarter
                      ? 'border-blue-500 bg-blue-50/50 font-semibold text-blue-900'
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{v.title || `${v.year}년 ${v.quarter}분기`}</span>
                  <span className="font-mono">{formatCurrency(v.salesTotal || 0)} 원</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
