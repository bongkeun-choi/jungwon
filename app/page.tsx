"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MonthlyViewer } from "@/components/monthly-viewer";
import { VatViewer } from "@/components/vat-viewer";
import { AdminLoginDialog } from "@/components/admin-login-dialog";
import { AdminControlModal } from "@/components/admin-control-modal";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { useClosingStore } from "@/hooks/use-closing";
import { useAdminStore } from "@/hooks/use-admin";
import { Lock, Settings, Calculator, Percent } from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("monthly-view");
  const { fetchMonthlyList, fetchVatList } = useClosingStore();
  const { isAdmin, openDialog, isControlModalOpen, openControlModal, closeControlModal } = useAdminStore();

  useEffect(() => {
    fetchMonthlyList();
    fetchVatList();
  }, [fetchMonthlyList, fetchVatList]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* 1. 최상단 글로벌 헤더 */}
      <header className="border-b border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] sticky top-0 z-30">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* 좌측 로고 & 타이틀 */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/25">
              본
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                본사 마감 관리 시스템
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                월마감 정산 &bull; 분기 부가세 &bull; 통장 입금 대조 &bull; 엑셀 서식 보존
              </p>
            </div>
          </div>

          {/* 우측 도구: PWA 설치 + 관리자 버튼 + 입금계좌 */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 바탕화면 앱 설치 버튼 */}
            <PwaInstallButton />

            {/* 관리자 모드 버튼 */}
            {isAdmin ? (
              <Button
                variant="default"
                size="sm"
                onClick={openControlModal}
                className="gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 shadow-md shadow-emerald-500/20"
              >
                <Settings className="h-3.5 w-3.5" />
                관리자 제어
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={openDialog}
                className="gap-1.5 rounded-xl border-slate-300 text-xs font-semibold hover:bg-slate-50 text-slate-700 h-9 shadow-sm"
              >
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                관리자 모드
              </Button>
            )}

            {/* 우측 계좌 안내 (헤더 미니 뱃지) */}
            <div className="hidden md:flex items-center gap-2 bg-slate-950 text-white px-3.5 py-1.5 rounded-xl shadow-sm border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">지정 계좌</span>
              <span className="font-bold font-mono text-amber-400 tracking-wide">
                국민 3001-9029-00536-1
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. 메인 컨테이너 */}
      <main className="container mx-auto max-w-5xl px-4 sm:px-6 py-8 flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* 심플 탭 셀렉터 */}
          <div className="flex items-center justify-center">
            <TabsList className="bg-slate-200/70 p-1 rounded-2xl h-12 inline-flex space-x-1 border border-slate-200 shadow-inner">
              <TabsTrigger
                value="monthly-view"
                className="rounded-xl px-6 py-2.5 text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all gap-2 text-slate-600"
              >
                <Calculator className="h-4 w-4" /> 월 마감 정산
              </TabsTrigger>
              <TabsTrigger
                value="vat-view"
                className="rounded-xl px-6 py-2.5 text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all gap-2 text-slate-600"
              >
                <Percent className="h-4 w-4" /> 분기 부가세 신고
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 1. 월 마감 조회 뷰어 (첨부 이미지 1 화면) */}
          <TabsContent value="monthly-view" className="focus-visible:outline-none animate-in fade-in-50 duration-300">
            <MonthlyViewer />
          </TabsContent>

          {/* 2. 분기 부가세 조회 뷰어 (첨부 이미지 2 화면) */}
          <TabsContent value="vat-view" className="focus-visible:outline-none animate-in fade-in-50 duration-300">
            <VatViewer />
          </TabsContent>
        </Tabs>
      </main>

      {/* 3. 푸터 */}
      <footer className="py-6 text-center text-xs text-slate-400 font-medium border-t border-slate-100">
        본사 마감 관리 시스템 &bull; 원본 엑셀 서식 100% 보존 &bull; Turso Cloud DB 연동 &bull; PWA 바탕화면 앱 지원
      </footer>

      {/* 관리자 로그인 비밀번호 다이얼로그 (1234) */}
      <AdminLoginDialog />

      {/* 관리자 전용 통합 제어 센터 팝업 모달 */}
      <AdminControlModal
        open={isControlModalOpen}
        onOpenChange={(open) => (open ? openControlModal() : closeControlModal())}
      />
    </div>
  );
}
