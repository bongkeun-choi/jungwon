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
import { Lock, Settings, Calculator, Percent, ExternalLink, Sparkles } from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("monthly-view");
  const { fetchMonthlyList, fetchVatList } = useClosingStore();
  const { isAdmin, openDialog, isControlModalOpen, openControlModal, closeControlModal } = useAdminStore();

  useEffect(() => {
    fetchMonthlyList();
    fetchVatList();
  }, [fetchMonthlyList, fetchVatList]);

  // 브라우저 주소창/메뉴바가 전혀 없는 윈도우 팝업으로 띄우기
  const openStandaloneViewer = () => {
    const width = 540;
    const height = 920;
    const left = Math.max(0, (window.screen.width - width) / 2);
    const top = Math.max(0, (window.screen.height - height) / 2);
    window.open(
      '/jungwon/viewer/',
      'BonsaMagamViewerWindow',
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-blue-100">
      {/* 1. 최상단 컴팩트 컨트롤 바 (마우스로 잡고 창 이동 가능 영역) */}
      <header className="app-drag cursor-move bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)] select-none">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* 로고 & 타이틀 */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm shadow-blue-500/20">
              본
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">본사 마감 뷰어</h1>
              <p className="text-[10px] text-slate-400 font-mono">국민 3001-9029-00536-1</p>
            </div>
          </div>

          {/* 우측 도구 모음 (클릭 영역은 no-drag) */}
          <div className="app-no-drag cursor-default flex items-center gap-1.5 sm:gap-2">
            {/* 주소창 없는 전용 창 팝업 버튼 */}
            <Button
              variant="outline"
              size="sm"
              onClick={openStandaloneViewer}
              className="gap-1 rounded-xl border-blue-200 bg-blue-50/70 text-blue-700 hover:bg-blue-100 text-xs font-semibold h-8 px-2.5 shadow-sm"
              title="브라우저 주소창 없는 전용 창으로 분리"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">전용창</span>
            </Button>

            {/* 바탕화면 앱 설치 (PWA) */}
            <PwaInstallButton />

            {/* 관리자 모드 버튼 */}
            {isAdmin ? (
              <Button
                variant="default"
                size="sm"
                onClick={openControlModal}
                className="gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 px-3 shadow-sm"
              >
                <Settings className="h-3 w-3" /> 관리자
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={openDialog}
                className="gap-1 rounded-xl border-slate-300 text-xs font-semibold hover:bg-slate-50 text-slate-700 h-8 px-3 shadow-sm"
              >
                <Lock className="h-3 w-3 text-slate-500" /> 관리자
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 2. 메인 컨텐츠 영역 (컴팩트 밀착 뷰) */}
      <main className="max-w-xl w-full mx-auto px-3.5 py-3 flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
          {/* 심플 탭 셀렉터 */}
          <div className="flex items-center justify-center">
            <TabsList className="bg-slate-200/70 p-1 rounded-xl h-10 inline-flex space-x-1 border border-slate-200">
              <TabsTrigger
                value="monthly-view"
                className="rounded-lg px-4 py-1.5 text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all gap-1.5 text-slate-600"
              >
                <Calculator className="h-3.5 w-3.5" /> 월 마감 정산
              </TabsTrigger>
              <TabsTrigger
                value="vat-view"
                className="rounded-lg px-4 py-1.5 text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all gap-1.5 text-slate-600"
              >
                <Percent className="h-3.5 w-3.5" /> 분기 부가세
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 1. 월 마감 조회 뷰어 */}
          <TabsContent value="monthly-view" className="focus-visible:outline-none">
            <MonthlyViewer />
          </TabsContent>

          {/* 2. 분기 부가세 조회 뷰어 */}
          <TabsContent value="vat-view" className="focus-visible:outline-none">
            <VatViewer />
          </TabsContent>
        </Tabs>
      </main>

      {/* 3. 푸터 */}
      <footer className="py-3 text-center text-[11px] text-slate-400 font-medium border-t border-slate-100">
        본사 마감 관리 시스템 &bull; Turso Cloud DB 실시간 연동
      </footer>

      {/* 관리자 로그인 비밀번호 다이얼로그 */}
      <AdminLoginDialog />

      {/* 관리자 전용 통합 제어 센터 팝업 모달 */}
      <AdminControlModal
        open={isControlModalOpen}
        onOpenChange={(open) => (open ? openControlModal() : closeControlModal())}
      />
    </div>
  );
}
