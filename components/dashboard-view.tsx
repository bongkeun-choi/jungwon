"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

// 최근 12개월 데이터 (25-09 ~ 26-08)
const trendData = [
  { month: '25-09', purchase: 85000000, closing: 8000000, diff: 3200000, nonghyup: 4000000, ibk: 4000000 },
  { month: '25-10', purchase: 92000000, closing: 5000000, diff: 2100000, nonghyup: 3000000, ibk: 2000000 },
  { month: '25-11', purchase: 90000000, closing: 6000000, diff: 2500000, nonghyup: 3500000, ibk: 2500000 },
  { month: '25-12', purchase: 95000000, closing: 6500000, diff: 1800000, nonghyup: 4000000, ibk: 2500000 },
  { month: '26-01', purchase: 88000000, closing: 2000000, diff: -2000000, nonghyup: 2000000, ibk: 2000000 },
  { month: '26-02', purchase: 91000000, closing: 31000000, diff: -5200000, nonghyup: 16000000, ibk: 15000000 },
  { month: '26-03', purchase: 90000000, closing: 4000000, diff: 8500000, nonghyup: 2000000, ibk: 2000000 },
  { month: '26-04', purchase: 75000000, closing: 4000000, diff: 2200000, nonghyup: 2000000, ibk: 2000000 },
  { month: '26-05', purchase: 98000000, closing: 4000000, diff: 800000, nonghyup: 2000000, ibk: 2000000 },
  { month: '26-06', purchase: 104000000, closing: 4000000, diff: 500000, nonghyup: 2000000, ibk: 2000000 },
  { month: '26-07', purchase: 110000000, closing: 4000000, diff: 3800000, nonghyup: 2000000, ibk: 2000000 },
  { month: '26-08', purchase: 104611397, closing: 48698928, diff: 10473546, nonghyup: 18652077, ibk: 19573305 },
];

export function DashboardView() {
  return (
    <div className="space-y-6">
      {/* 상단 4개 KPI 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. 이번달 마감금액 */}
        <Card className="p-5 bg-white border-slate-200 shadow-sm rounded-2xl">
          <span className="text-xs text-slate-500 font-medium block">이번달 마감금액</span>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-slate-900">48,698,928</span>
            <span className="text-sm font-bold ml-1">원</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full w-2/3 rounded-full" />
          </div>
        </Card>

        {/* 2. 누적 매입 (전체) */}
        <Card className="p-5 bg-white border-slate-200 shadow-sm rounded-2xl">
          <span className="text-xs text-slate-500 font-medium block">누적 매입 총액</span>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-slate-900">15.99</span>
            <span className="text-base font-bold ml-0.5">억</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono block mt-1">1,599,345,599 원</span>
        </Card>

        {/* 3. 평균 차액 */}
        <Card className="p-5 bg-white border-slate-200 shadow-sm rounded-2xl">
          <span className="text-xs text-slate-500 font-medium block">평균 정산 차액</span>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-rose-600">-4,509,428</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">0원에 수렴할수록 정상</span>
        </Card>

        {/* 4. 계좌 안내 (검정 카드) */}
        <div className="p-5 bg-slate-950 text-white shadow-sm rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-medium">지정 입금계좌</span>
          <div>
            <span className="text-xs text-slate-300 mr-2">국민</span>
            <span className="text-sm sm:text-base font-bold font-mono text-amber-400">3001-9029-00536-1</span>
          </div>
          <span className="text-[10px] text-slate-400">통장 잔액 일치 여부 매월 확인</span>
        </div>
      </div>

      {/* 4개 차트 2x2 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. 마감금액 추이 (최근 12개월) */}
        <Card className="p-5 bg-white border-slate-200 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">월별 마감금액 추이 (최근 12개월)</h3>
            <Badge variant="outline" className="text-[10px] text-blue-600 bg-blue-50/50 border-blue-200">
              최근 1년
            </Badge>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClosing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `${v / 10000}만`} />
                <Tooltip formatter={(value: any) => [`${formatCurrency(value)}원`, '마감금액']} />
                <Area
                  type="monotone"
                  dataKey="closing"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorClosing)"
                  dot={{ r: 3, fill: '#2563eb' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 하단 요약 통계 */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-xl">
            <div>최고: <strong className="font-mono text-slate-900">48,698,928원</strong></div>
            <div>최저: <strong className="font-mono text-slate-900">0원</strong></div>
            <div>평균: <strong className="font-mono text-slate-900">9,039,890원</strong></div>
          </div>
        </Card>

        {/* 2. 차액 추이 */}
        <Card className="p-5 bg-white border-slate-200 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">정산 차액 추이 (0원 수렴 목표)</h3>
            <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200">
              차액 분석
            </Badge>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDiff" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `${v / 10000}만`} />
                <Tooltip formatter={(value: any) => [`${formatCurrency(value)}원`, '차액']} />
                <Area
                  type="monotone"
                  dataKey="diff"
                  stroke="#e11d48"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDiff)"
                  dot={{ r: 3, fill: '#e11d48' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            차액이 0이 아니면 통장 입금 누락 또는 불일치를 의미합니다. 그래프가 0선에 가까울수록 정상입니다.
          </p>
        </Card>

        {/* 3. 통장 잔액 누적 영역 */}
        <Card className="p-5 bg-white border-slate-200 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">통장별 입금 누적 현황</h3>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-600" /> 농협</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-300" /> 기업은행</span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNong" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="colorIbk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `${v / 10000}만`} />
                <Tooltip formatter={(value: any) => [`${formatCurrency(value)}원`]} />
                <Area type="monotone" dataKey="nonghyup" stackId="1" stroke="#2563eb" fill="url(#colorNong)" />
                <Area type="monotone" dataKey="ibk" stackId="1" stroke="#60a5fa" fill="url(#colorIbk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
            <Badge variant="outline" className="text-[10px] bg-slate-50">농협</Badge>
            <Badge variant="outline" className="text-[10px] bg-slate-50">기업은행</Badge>
          </div>
        </Card>

        {/* 4. 월별 매입 vs 마감 비교 */}
        <Card className="p-5 bg-white border-slate-200 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">월별 매입금액 vs 최종 마감금액 비교</h3>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="h-1.5 w-3 bg-slate-900 rounded" /> 매입금액</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-3 bg-blue-600 rounded" /> 마감금액</span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `${v / 10000}만`} />
                <Tooltip formatter={(value: any) => [`${formatCurrency(value)}원`]} />
                <Line type="monotone" dataKey="purchase" stroke="#0f172a" strokeWidth={2} dot={{ r: 3, fill: '#0f172a' }} />
                <Line type="monotone" dataKey="closing" stroke="#2563eb" strokeWidth={2} dot={{ r: 3, fill: '#2563eb' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-3 bg-slate-900 rounded" /> 매입금액</span>
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-3 bg-blue-600 rounded" /> 최종 마감금액</span>
          </div>
        </Card>

      </div>
    </div>
  );
}
