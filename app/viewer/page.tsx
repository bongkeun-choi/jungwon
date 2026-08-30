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
import { Lock, Settings, Calculator, Percent, GripHorizontal } from "lucide-react";

export default function StandaloneViewerPage() {
  const [activeTab, setActiveTab] = useState("monthly-view");
  const { fetchMonthlyList, fetchVatList } = useClosingStore();
  const { isAdmin, openDialog, isControlModalOpen, openControlModal, closeControlModal } = useAdminStore();

  useEffect(() => {
    fetchMonthlyList();
    fetchVatList();
  }, [fetchMonthlyList, fetchVatList]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans select-none">
      {/* 1. 최상단 창 이동 드래그 타이틀바 (마우스로 잡고 창을 자유롭게 이동할 수 있는 영역) */}
      <header className="app-drag bg-slate-900 text-white px-4 py-2 flex items-center justify-between sticky top-0 z-40 cursor-move border-b border-slate-800 shadow-sm">
        {/* 좌측 타이틀 & 드래그 손잡이 아이콘 */}
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-4 w-4 text-slate-400 opacity-80" />
          <div className="h-6 w-6 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">
            본
          </div>
          <span className="text-xs font-bold tracking-tight text-slate-200">
            본사 마감 뷰어
          </span>
          <span className="text-[10px] font-mono text-amber-400 bg-slate-800/80 px-2 py-0.5 rounded ml-1">
            국민 3001-9029-00536-1
          </span>
        </div>

        {/* 우측 관리자 버튼 (클릭 영역은 no-drag) */}
        <div className="app-no-drag cursor-default flex items-center gap-2">
          {isAdmin ? (
            <Button
              variant="default"
              size="sm"
              onClick={openControlModal}
              className="gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold h-7 px-2.5 shadow-sm"
            >
              <Settings className="h-3 w-3" /> 관리자
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={openDialog}
              className="gap-1 rounded-lg border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium h-7 px-2.5 shadow-sm"
            >
              <Lock className="h-3 w-3 text-slate-400" /> 관리자
            </Button>
          )}
        </div>
      </header>

      {/* 2. 본문 컨텐츠 (뷰어 내용) */}
      <div className="p-4 flex-1 flex flex-col">
        {/* 심플 탭 셀렉터 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 flex-1">
          <div className="flex items-center justify-center">
            <TabsList className="bg-slate-200/70 p-1 rounded-xl h-10 inline-flex space-x-1 border border-slate-200">
              <TabsTrigger
                value="monthly-view"
                className="rounded-lg px-4 py-1.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all gap-1.5 text-slate-600"
              >
                <Calculator className="h-3.5 w-3.5" /> 월마감 정산
              </TabsTrigger>
              <TabsTrigger
                value="vat-view"
                className="rounded-lg px-4 py-1.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all gap-1.5 text-slate-600"
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
      </div>

      {/* 모달 연동 */}
      <AdminLoginDialog />
      <AdminControlModal
        open={isControlModalOpen}
        onOpenChange={(open) => (open ? openControlModal() : closeControlModal())}
      />
    </div>
  );
}
