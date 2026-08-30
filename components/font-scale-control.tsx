"use client";

import React, { useEffect, useState } from 'react';
import { useFontScaleStore } from '@/hooks/use-font-scale';
import { Plus, Minus } from 'lucide-react';

export function FontScaleControl() {
  const { scale, zoomIn, zoomOut, resetZoom } = useFontScaleStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const percentage = Math.round(scale * 100);

  return (
    <div className="inline-flex items-center gap-0.5 bg-white/90 border border-slate-300/80 rounded-lg p-0.5 shadow-sm text-slate-700 select-none">
      {/* 글씨 축소 버튼 (-) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          zoomOut();
        }}
        title="글씨/화면 축소 (-)"
        className="h-6 w-6 rounded-md hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
      >
        <Minus className="h-3 w-3 stroke-[2.5]" />
      </button>

      {/* 현재 배율 표시 및 클릭 시 100% 초기화 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          resetZoom();
        }}
        title="100% 기본 크기로 복원"
        className="px-1 text-[10px] font-mono font-bold hover:text-blue-600 cursor-pointer min-w-[32px] text-center"
      >
        {percentage}%
      </button>

      {/* 글씨 확대 버튼 (+) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          zoomIn();
        }}
        title="글씨/화면 확대 (+)"
        className="h-6 w-6 rounded-md hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
      >
        <Plus className="h-3 w-3 stroke-[2.5]" />
      </button>
    </div>
  );
}
