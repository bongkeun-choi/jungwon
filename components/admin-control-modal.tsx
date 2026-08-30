"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MonthlyCalculator } from '@/components/monthly-calculator';
import { VatCalculator } from '@/components/vat-calculator';
import { ExcelUploader } from '@/components/excel-uploader';
import { DashboardView } from '@/components/dashboard-view';
import { HistoryTable } from '@/components/history-table';
import { AdminPasswordTab } from '@/components/admin-password-tab';
import { useAdminStore } from '@/hooks/use-admin';
import { useClosingStore } from '@/hooks/use-closing';
import { ShieldCheck, LogOut, FileSpreadsheet, Calculator, Percent, BarChart3, History, KeyRound, X } from 'lucide-react';
import { toast } from 'sonner';

export function AdminControlModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState('monthly-edit');
  const { logout } = useAdminStore();
  const { fetchMonthlyList, fetchVatList } = useClosingStore();

  const handleLogout = () => {
    logout();
    onOpenChange(false);
    toast.info('관리자 모드에서 로그아웃되었습니다.');
  };

  const handleUploadSuccess = () => {
    fetchMonthlyList();
    fetchVatList();
    setActiveTab('monthly-edit');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 rounded-3xl bg-slate-50 overflow-hidden border-slate-200">
        {/* 모달 상단 헤더 */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                관리자 제어 센터
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  인증 완료
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                수치 직접 수정, 엑셀 파일 업로드, 부가세 정산, 비밀번호 변경 및 이력을 관리합니다.
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 rounded-xl border-slate-300 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-9"
            >
              <LogOut className="h-3.5 w-3.5" /> 로그아웃
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 탭 네비게이션 및 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-slate-200/70 p-1 rounded-2xl h-11 inline-flex space-x-1 w-full sm:w-auto overflow-x-auto">
              <TabsTrigger
                value="monthly-edit"
                className="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all gap-1.5"
              >
                <Calculator className="h-4 w-4 text-blue-600" /> 월마감 수정
              </TabsTrigger>
              <TabsTrigger
                value="vat-edit"
                className="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all gap-1.5"
              >
                <Percent className="h-4 w-4 text-emerald-600" /> 부가세 수정
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all gap-1.5"
              >
                <FileSpreadsheet className="h-4 w-4 text-amber-600" /> 엑셀 업로드
              </TabsTrigger>
              <TabsTrigger
                value="dashboard"
                className="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all gap-1.5"
              >
                <BarChart3 className="h-4 w-4 text-purple-600" /> 대시보드
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all gap-1.5"
              >
                <History className="h-4 w-4 text-slate-700" /> 전체 히스토리
              </TabsTrigger>
              <TabsTrigger
                value="password"
                className="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all gap-1.5"
              >
                <KeyRound className="h-4 w-4 text-amber-500" /> 비번 변경
              </TabsTrigger>
            </TabsList>

            {/* 1. 월마감 수정 */}
            <TabsContent value="monthly-edit" className="focus-visible:outline-none">
              <MonthlyCalculator />
            </TabsContent>

            {/* 2. 부가세 수정 */}
            <TabsContent value="vat-edit" className="focus-visible:outline-none">
              <VatCalculator />
            </TabsContent>

            {/* 3. 엑셀 업로드 */}
            <TabsContent value="upload" className="focus-visible:outline-none">
              <ExcelUploader onUploaded={handleUploadSuccess} />
            </TabsContent>

            {/* 4. 대시보드 */}
            <TabsContent value="dashboard" className="focus-visible:outline-none">
              <DashboardView />
            </TabsContent>

            {/* 5. 전체 히스토리 */}
            <TabsContent value="history" className="focus-visible:outline-none">
              <HistoryTable onSelectEdit={() => setActiveTab('monthly-edit')} />
            </TabsContent>

            {/* 6. 비밀번호 변경 */}
            <TabsContent value="password" className="focus-visible:outline-none">
              <AdminPasswordTab />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
