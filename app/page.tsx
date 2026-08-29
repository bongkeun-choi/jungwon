"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthlyCalculator } from "@/components/monthly-calculator";
import { VatCalculator } from "@/components/vat-calculator";
import { HistoryTable } from "@/components/history-table";
import { DashboardView } from "@/components/dashboard-view";
import { ExcelUploader } from "@/components/excel-uploader";
import { useClosingStore } from "@/hooks/use-closing";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("monthly");
  const { fetchMonthlyList, fetchVatList } = useClosingStore();

  useEffect(() => {
    fetchMonthlyList();
    fetchVatList();
  }, [fetchMonthlyList, fetchVatList]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* 최상단 글로벌 헤더 */}
      <header className="border-b border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* 좌측 로고 & 타이틀 */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
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

          {/* 우측 공식 호환 & 국민 계좌 캡슐 */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-slate-900 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm">
              Excel 공식 100% 호환
            </div>
            <div className="border border-slate-200 bg-slate-50/70 text-slate-700 text-xs font-mono px-3.5 py-1.5 rounded-xl hidden sm:block">
              국민 3001-9029-00536-1
            </div>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 & 메인 컨테이너 */}
      <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* 알약 스타일 탭 바 */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <TabsList className="bg-slate-200/60 p-1 rounded-xl h-11 inline-flex space-x-1">
              <TabsTrigger
                value="monthly"
                className="rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all text-slate-600"
              >
                월 마감 계산기
              </TabsTrigger>
              <TabsTrigger
                value="vat"
                className="rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all text-slate-600"
              >
                분기 부가세
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all text-slate-600"
              >
                전체 히스토리
              </TabsTrigger>
              <TabsTrigger
                value="dashboard"
                className="rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all text-slate-600"
              >
                대시보드
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all text-slate-600"
              >
                엑셀 업로드
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 1. 월 마감 계산기 탭 */}
          <TabsContent value="monthly" className="focus-visible:outline-none">
            <MonthlyCalculator />
          </TabsContent>

          {/* 2. 분기 부가세 탭 */}
          <TabsContent value="vat" className="focus-visible:outline-none">
            <VatCalculator />
          </TabsContent>

          {/* 3. 전체 히스토리 탭 */}
          <TabsContent value="history" className="focus-visible:outline-none">
            <HistoryTable onSelectEdit={() => setActiveTab("monthly")} />
          </TabsContent>

          {/* 4. 대시보드 탭 */}
          <TabsContent value="dashboard" className="focus-visible:outline-none">
            <DashboardView />
          </TabsContent>

          {/* 5. 엑셀 업로드 탭 */}
          <TabsContent value="upload" className="focus-visible:outline-none">
            <ExcelUploader onUploaded={() => setActiveTab("monthly")} />
          </TabsContent>
        </Tabs>
      </main>

      {/* 하단 푸터 */}
      <footer className="py-6 text-center text-xs text-slate-400 font-medium">
        본사 마감 관리 시스템 &bull; 원본 엑셀 서식 100% 보존 &bull; Turso Cloud DB 연동 &bull; GitHub 자동 백업
      </footer>
    </div>
  );
}
