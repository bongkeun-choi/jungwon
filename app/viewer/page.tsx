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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col p-4 font-sans">
      {/* 윈도우 상단 미니 헤더 (주소창 없는 전용 창 내부 컨트롤) */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm">
            본
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">본사 마감 뷰어</h1>
            <p className="text-[10px] text-slate-400 font-mono">국민 3001-9029-00536-1</p>
          </div>
        </div>

        <div>
          {isAdmin ? (
            <Button
              variant="default"
              size="sm"
              onClick={openControlModal}
              className="gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 px-3"
            >
              <Settings className="h-3 w-3" /> 관리자
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={openDialog}
              className="gap-1 rounded-xl border-slate-300 text-xs font-semibold hover:bg-slate-50 text-slate-700 h-8 px-3"
            >
              <Lock className="h-3 w-3 text-slate-500" /> 관리자
            </Button>
          )}
        </div>
      </div>

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

      {/* 모달 연동 */}
      <AdminLoginDialog />
      <AdminControlModal
        open={isControlModalOpen}
        onOpenChange={(open) => (open ? openControlModal() : closeControlModal())}
      />
    </div>
  );
}
