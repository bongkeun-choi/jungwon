"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClosingStore } from '@/hooks/use-closing';
import { useAdminStore } from '@/hooks/use-admin';
import { formatCurrency, parseNumber } from '@/lib/utils';
import { Plus, X, Lightbulb, Wrench, Star, Gift, Building, Lock, ShieldCheck, Download } from 'lucide-react';
import { toast } from 'sonner';

export function MonthlyCalculator() {
  const { currentMonthly, setCurrentMonthly, addAccount, removeAccount, updateAccount, saveCurrentMonthly, monthlyList } = useClosingStore();
  const { isAdmin, openDialog } = useAdminStore();

  const purchase = currentMonthly.purchaseAmount || 0;
  const service = currentMonthly.serviceAs || 0;
  const point = currentMonthly.point || 0;
  const incentive = currentMonthly.incentive || 0;
  const headquarters = currentMonthly.headquartersDeposit || 0;

  // 마감금액 = 매입금액 - 서비스 - 포인트 - 인센티브 - 본사입금
  const closingAmount = purchase - service - point - incentive - headquarters;

  // 통장 합계
  const bankTotal = currentMonthly.accounts.reduce((s, a) => s + (Number(a.amount) || 0), 0);

  // 차액
  const difference = closingAmount - bankTotal;

  const [newAccName, setNewAccName] = useState('');
  const [newAccAmount, setNewAccAmount] = useState('');

  const handleYearChange = (val: string) => {
    setCurrentMonthly({ year: parseInt(val) });
  };

  const handleMonthChange = (val: string) => {
    const m = parseInt(val);
    const exist = monthlyList.find((item) => item.year === currentMonthly.year && item.month === m);
    if (exist) {
      setCurrentMonthly({
        month: m,
        purchaseAmount: exist.purchaseAmount,
        serviceAs: exist.serviceAs,
        point: exist.point,
        incentive: exist.incentive,
        headquartersDeposit: exist.headquartersDeposit,
        accounts: exist.accounts || [],
      });
    } else {
      setCurrentMonthly({ month: m });
    }
  };

  const handleAddAccount = () => {
    if (!isAdmin) {
      openDialog();
      toast.warning('통장 추가는 관리자 로그인이 필요합니다.');
      return;
    }
    addAccount({
      name: newAccName.trim() || `통장 ${currentMonthly.accounts.length + 1}`,
      amount: parseNumber(newAccAmount),
    });
    setNewAccName('');
    setNewAccAmount('');
  };

  const handleReset = () => {
    if (!isAdmin) {
      openDialog();
      toast.warning('초기화는 관리자 로그인이 필요합니다.');
      return;
    }
    setCurrentMonthly({
      purchaseAmount: 0,
      serviceAs: 0,
      point: 0,
      incentive: 0,
      headquartersDeposit: 0,
      accounts: [
        { name: '농협', amount: 0 },
        { name: '기업은행', amount: 0 },
      ],
    });
    toast.info('입력값이 초기화되었습니다.');
  };

  const handleSave = async () => {
    if (!isAdmin) {
      openDialog();
      toast.warning('데이터 수정 및 저장은 관리자 로그인이 필요합니다.');
      return;
    }
    const success = await saveCurrentMonthly();
    if (success) {
      toast.success(`${currentMonthly.year}년 ${currentMonthly.month}월 마감 데이터가 Turso DB에 저장되었습니다.`);
    } else {
      toast.error('저장에 실패했습니다.');
    }
  };

  const handleExportCSV = () => {
    const headers = ['항목', '금액'];
    const rows = [
      ['매입금액', purchase],
      ['서비스A/S', service],
      ['포인트', point],
      ['인센티브', incentive],
      ['본사입금', headquarters],
      ['정산마감금액', closingAmount],
      ...currentMonthly.accounts.map((a) => [`통장_${a.name}`, a.amount]),
      ['통장합계', bankTotal],
      ['차액', difference],
    ];
    const csvContent = '\uFEFF' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `본사마감_${String(currentMonthly.year).slice(-2)}년_${currentMonthly.month}월.csv`;
    link.click();
    toast.success('CSV 파일이 다운로드되었습니다.');
  };

  const maxBarVal = Math.max(purchase, 1);
  const getBarWidth = (val: number) => {
    const pct = Math.min(100, Math.max(4, (Math.abs(val) / maxBarVal) * 100));
    return `${pct}%`;
  };

  const inputClass = !isAdmin
    ? "text-right pr-7 font-mono font-semibold text-slate-700 bg-slate-100/60 cursor-pointer h-10 rounded-xl border-slate-200"
    : "text-right pr-7 font-mono font-semibold text-slate-900 bg-white h-10 rounded-xl border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500";

  return (
    <div className="space-y-6">
      {/* 2컬럼 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 좌측 영역 (7컬럼) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 본사 정산 내역 카드 */}
          <Card className="shadow-sm border-slate-200 bg-white rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold text-slate-900">
                    본사 정산 내역
                  </CardTitle>
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
                      <Lock className="h-3 w-3 text-slate-400" /> 조회 모드 (로그인 시 수정)
                    </Badge>
                  )}
                </div>
                <Badge variant="outline" className="text-xs text-blue-600 bg-blue-50/50 border-blue-200">
                  실시간 계산
                </Badge>
              </div>

              {/* 연도 & 월 셀렉트 */}
              <div className="grid grid-cols-2 gap-4 pt-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">연도</label>
                  <Select value={String(currentMonthly.year)} onValueChange={handleYearChange}>
                    <SelectTrigger className="h-10 bg-slate-50/70 border-slate-200 rounded-xl">
                      <SelectValue placeholder="연도" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027, 2028].map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {String(y).slice(-2)}년 ({y})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">월</label>
                  <Select value={String(currentMonthly.month)} onValueChange={handleMonthChange}>
                    <SelectTrigger className="h-10 bg-slate-50/70 border-slate-200 rounded-xl">
                      <SelectValue placeholder="월" />
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
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              {/* 1. 매입금액 */}
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/50 border border-slate-100">
                <div className="flex items-center gap-2 w-32 shrink-0">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">매입금액</span>
                </div>
                <div className="relative flex-1">
                  <Input
                    readOnly={!isAdmin}
                    onClick={() => !isAdmin && openDialog()}
                    value={purchase ? formatCurrency(purchase) : ''}
                    onChange={(e) => setCurrentMonthly({ purchaseAmount: parseNumber(e.target.value) })}
                    placeholder="0"
                    className={inputClass}
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground font-medium">원</span>
                </div>
              </div>

              {/* 2. 서비스 a/s */}
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/50 border border-slate-100">
                <div className="flex items-center gap-2 w-32 shrink-0">
                  <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">서비스 A/S</span>
                </div>
                <div className="relative flex-1">
                  <Input
                    readOnly={!isAdmin}
                    onClick={() => !isAdmin && openDialog()}
                    value={service ? formatCurrency(service) : ''}
                    onChange={(e) => setCurrentMonthly({ serviceAs: parseNumber(e.target.value) })}
                    placeholder="0"
                    className={inputClass}
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground font-medium">원</span>
                </div>
              </div>

              {/* 3. 포인트 */}
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/50 border border-slate-100">
                <div className="flex items-center gap-2 w-32 shrink-0">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500">
                    <Star className="h-4 w-4 fill-amber-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">포인트</span>
                </div>
                <div className="relative flex-1">
                  <Input
                    readOnly={!isAdmin}
                    onClick={() => !isAdmin && openDialog()}
                    value={point ? formatCurrency(point) : ''}
                    onChange={(e) => setCurrentMonthly({ point: parseNumber(e.target.value) })}
                    placeholder="0"
                    className={inputClass}
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground font-medium">원</span>
                </div>
              </div>

              {/* 4. 인센티브 */}
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/50 border border-slate-100">
                <div className="flex items-center gap-2 w-32 shrink-0">
                  <div className="p-1.5 rounded-lg bg-rose-50 text-rose-500">
                    <Gift className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">인센티브</span>
                </div>
                <div className="relative flex-1">
                  <Input
                    readOnly={!isAdmin}
                    onClick={() => !isAdmin && openDialog()}
                    value={incentive ? formatCurrency(incentive) : ''}
                    onChange={(e) => setCurrentMonthly({ incentive: parseNumber(e.target.value) })}
                    placeholder="0"
                    className={inputClass}
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground font-medium">원</span>
                </div>
              </div>

              {/* 5. 본사입금 */}
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/50 border border-slate-100">
                <div className="flex items-center gap-2 w-32 shrink-0">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                    <Building className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">본사입금</span>
                </div>
                <div className="relative flex-1">
                  <Input
                    readOnly={!isAdmin}
                    onClick={() => !isAdmin && openDialog()}
                    value={headquarters ? formatCurrency(headquarters) : ''}
                    onChange={(e) => setCurrentMonthly({ headquartersDeposit: parseNumber(e.target.value) })}
                    placeholder="0"
                    className={inputClass}
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground font-medium">원</span>
                </div>
              </div>

              {/* 계산식 가이드 박스 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between mt-3">
                <span className="font-semibold text-slate-700">정산 계산식</span>
                <span className="text-slate-500 font-mono">매입금액 - 서비스A/S - 포인트 - 인센티브 - 본사입금</span>
              </div>
            </CardContent>
          </Card>

          {/* 통장 내역 관리 카드 */}
          <Card className="shadow-sm border-slate-200 bg-white rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold text-slate-900">
                    통장 입금 내역
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                    {currentMonthly.accounts.length}개
                  </Badge>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  합계: {formatCurrency(bankTotal)}원
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* 통장 목록 */}
              {currentMonthly.accounts.map((acc, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <Input
                    readOnly={!isAdmin}
                    onClick={() => !isAdmin && openDialog()}
                    value={acc.name}
                    onChange={(e) => updateAccount(idx, { name: e.target.value })}
                    placeholder="통장명"
                    className={`w-1/3 h-10 rounded-xl border-slate-200 text-sm font-medium ${
                      !isAdmin ? 'bg-slate-100/60 cursor-pointer text-slate-700' : 'bg-white'
                    }`}
                  />
                  <div className="relative flex-1">
                    <Input
                      readOnly={!isAdmin}
                      onClick={() => !isAdmin && openDialog()}
                      value={acc.amount ? formatCurrency(acc.amount) : ''}
                      onChange={(e) => updateAccount(idx, { amount: parseNumber(e.target.value) })}
                      placeholder="0"
                      className={inputClass}
                    />
                    <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground font-medium">원</span>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAccount(idx)}
                      className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {/* 통장 추가 버튼 */}
              <button
                type="button"
                onClick={handleAddAccount}
                className="w-full py-2.5 border border-dashed border-slate-300 rounded-xl text-xs font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> 통장 추가
              </button>

              {/* 하단 통장 합계 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">통장 총 입금합계</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {formatCurrency(bankTotal)} 원
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 하단 액션 버튼 그룹 */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 h-11 rounded-xl font-semibold border-slate-300 hover:bg-slate-50"
            >
              초기화
            </Button>
            <Button
              onClick={handleSave}
              className={`flex-[2] h-11 rounded-xl font-semibold text-white shadow-md ${
                isAdmin ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-slate-700 hover:bg-slate-800'
              }`}
            >
              {isAdmin ? '저장' : '🔒 로그인 후 저장'}
            </Button>
            <Button
              onClick={handleExportCSV}
              className="flex-1 h-11 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1"
            >
              <Download className="h-4 w-4" /> CSV 내보내기
            </Button>
          </div>
        </div>

        {/* 우측 영역 (5컬럼) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 상단 대형 그라데이션 마감금액 카드 */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/15 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-blue-100">
              <span className="font-semibold">정산 마감금액</span>
              <Badge className="bg-white/20 text-white border-0 text-[10px] font-mono px-2 py-0.5 rounded-full">
                {String(currentMonthly.year).slice(-2)}년 {String(currentMonthly.month).padStart(2, '0')}월
              </Badge>
            </div>

            <div className="mt-3">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight">
                {formatCurrency(closingAmount)}
              </span>
              <span className="text-xl font-semibold ml-1.5">원</span>
            </div>

            {/* 수식 시각화 바 */}
            <div className="mt-4 pt-3 border-t border-white/20 text-[11px] font-mono text-blue-100 space-y-0.5 break-all">
              <p>
                {formatCurrency(purchase)} - {formatCurrency(service)} - {formatCurrency(point)} - {formatCurrency(incentive)} - {formatCurrency(headquarters)}
              </p>
              <p className="text-[10px] text-blue-200 font-sans">
                매입금액 - 서비스 - 포인트 - 인센티브 - 본사입금
              </p>
            </div>
          </div>

          {/* 중간 통장 총액 & 차액 2열 그리드 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 통장 총액 카드 */}
            <Card className="shadow-sm border-slate-200 bg-white rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <span>통장 총액</span>
                <Badge variant="secondary" className="text-[10px] py-0 px-1">
                  {currentMonthly.accounts.length}
                </Badge>
              </div>
              <p className="text-lg font-bold font-mono text-slate-900 mt-1.5">
                {formatCurrency(bankTotal)} <span className="text-xs font-normal">원</span>
              </p>
              <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                {currentMonthly.accounts.map((a, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{a.name}</span>
                    <span className="font-mono">{formatCurrency(a.amount)}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 정산 차액 카드 */}
            <div
              className={`rounded-2xl p-4 border transition-all ${
                difference === 0
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-rose-200 bg-rose-50/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-rose-500 font-bold">정산 차액</span>
                {difference === 0 ? (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                    일치
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-100/70 px-1.5 py-0.5 rounded">
                    불일치
                  </span>
                )}
              </div>
              <p
                className={`text-lg font-bold font-mono mt-1.5 ${
                  difference === 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(difference)} <span className="text-xs font-normal">원</span>
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-2 break-all">
                {formatCurrency(closingAmount)} - {formatCurrency(bankTotal)} = {formatCurrency(difference)}
              </p>
            </div>
          </div>

          {/* 하단 정산 구성 현황 및 비율 프로그레스 바 */}
          <Card className="shadow-sm border-slate-200 bg-white rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900">
                정산 구성 현황
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              {/* 매입 */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>매입금액</span>
                  <span className="font-mono font-semibold text-slate-900">{formatCurrency(purchase)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-slate-900 h-2 rounded-full" style={{ width: getBarWidth(purchase) }} />
                </div>
              </div>

              {/* 서비스 */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>서비스 A/S</span>
                  <span className="font-mono text-slate-700">-{formatCurrency(service)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: getBarWidth(service) }} />
                </div>
              </div>

              {/* 포인트 */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>포인트</span>
                  <span className="font-mono text-slate-700">-{formatCurrency(point)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: getBarWidth(point) }} />
                </div>
              </div>

              {/* 인센티브 */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>인센티브</span>
                  <span className="font-mono text-slate-700">-{formatCurrency(incentive)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: getBarWidth(incentive) }} />
                </div>
              </div>

              {/* 본사입금 */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>본사입금</span>
                  <span className="font-mono text-slate-700">-{formatCurrency(headquarters)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: getBarWidth(headquarters) }} />
                </div>
              </div>

              {/* 최종 마감금액 */}
              <div className="pt-2 border-t space-y-1">
                <div className="flex justify-between text-blue-600 font-bold">
                  <span>최종 마감금액</span>
                  <span className="font-mono">{formatCurrency(closingAmount)}</span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: getBarWidth(closingAmount) }} />
                </div>
              </div>

              {/* 통장별 입금액 */}
              <div className="pt-2 border-t space-y-2">
                <span className="text-[11px] font-bold text-slate-800 block">통장별 입금액</span>
                {currentMonthly.accounts.map((acc, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>{acc.name}</span>
                      <span className="font-mono font-medium">{formatCurrency(acc.amount)}</span>
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

              {/* 국민 계좌 안내 */}
              <div className="mt-4 p-3 bg-slate-950 text-white rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 font-sans">국민은행</span>
                <span className="font-bold text-amber-400">3001-9029-00536-1</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
