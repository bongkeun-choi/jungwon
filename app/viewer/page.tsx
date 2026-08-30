"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MonthlyViewer } from "@/components/monthly-viewer";
import { VatViewer } from "@/components/vat-viewer";
import { AdminLoginDialog } from "@/components/admin-login-dialog";
import { AdminControlModal } from "@/components/admin-control-modal";
import { useClosingStore } from "@/hooks/use-closing";
import { useAdminStore } from "@/hooks/use-admin";
import { Lock, Settings, Calculator, Percent } from "lucide-react";

export default function StandaloneViewerPage() {
  const [activeTab, setActiveTab] = useState("monthly-view");
  const { fetchMonthlyList, fetchVatList } = useClosingStore();
  const { isAdmin, openDialog, isControlModalOpen, openControlModal, closeControlModal } = useAdminStore();

  useEffect(() => {
    fetchMonthlyList();
    fetchVatList();
  }, [fetchMonthlyList, fetchVatList]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* 1. 최상단 창 드래그 타이틀 바 (불필요한 버튼 없이 깔끔하게 구성) */}
      <header className="app-drag cursor-move bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm select-none px-4 py-2 flex items-center justify-between">
        {/* 좌측 로고 & 타이틀 */}
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-sm">
            본
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">본사 마감 뷰어</h1>
            <p className="text-[10px] text-slate-400 font-mono">국민 3001-9029-00536-1</p>
          </div>
        </div>
      </header>

      {/* 2. 본문 컨텐츠 */}
      <main className="max-w-xl w-full mx-auto px-2.5 py-1.5 flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2">
          {/* 상단 탭 바 + 본문 내 안전한 관리자 버튼 배치 (2중 안전 장치!) */}
          <div className="flex items-center justify-between bg-slate-200/70 p-1 rounded-2xl border border-slate-200 shadow-inner">
            <TabsList className="bg-transparent p-0 h-9 inline-flex space-x-1">
              <TabsTrigger
                value="monthly-view"
                className="rounded-xl px-4 py-1.5 text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all gap-1.5 text-slate-600"
              >
                <Calculator className="h-3.5 w-3.5" /> 월 마감 정산
              </TabsTrigger>
              <TabsTrigger
                value="vat-view"
                className="rounded-xl px-4 py-1.5 text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all gap-1.5 text-slate-600"
              >
                <Percent className="h-3.5 w-3.5" /> 분기 부가세
              </TabsTrigger>
            </TabsList>

            {/* 본문 내부 안전한 관리자 버튼 (윈도우 시스템 버튼과 절대 안 겹침!) */}
            <div className="pr-1">
              {isAdmin ? (
                <Button
                  size="sm"
                  onClick={openControlModal}
                  className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm gap-1"
                >
                  <Settings className="h-3 w-3" /> 관리자
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openDialog}
                  className="h-8 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border-slate-300 text-xs font-bold shadow-sm gap-1"
                >
                  <Lock className="h-3 w-3 text-slate-500" /> 관리자 로그인
                </Button>
              )}
            </div>
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

      {/* 관리자 로그인 비밀번호 모달 (1234) */}
      <AdminLoginDialog />

      {/* 관리자 전용 통합 제어 센터 팝업 모달 */}
      <AdminControlModal
        open={isControlModalOpen}
        onOpenChange={(open) => (open ? openControlModal() : closeControlModal())}
      />
    </div>
  );
}
