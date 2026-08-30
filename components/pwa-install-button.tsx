"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Download, Monitor, Smartphone, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    // 이미 독립 실행(PWA) 모드인지 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('바탕화면에 앱이 성공적으로 설치되었습니다!');
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // 프롬프트가 지원되지 않거나 이미 설치된 경우 가이드 팝업 표시
      setIsGuideOpen(true);
    }
  };

  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
        <CheckCircle className="h-4 w-4" /> 앱 실행 중
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleInstall}
        className="gap-1.5 rounded-xl border-slate-300 text-xs font-semibold hover:bg-slate-50 text-slate-800 h-9 shadow-sm"
      >
        <Download className="h-3.5 w-3.5 text-blue-600" />
        바탕화면 앱 설치
      </Button>

      {/* 설치 가이드 모달 */}
      <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white border-slate-200">
          <DialogHeader className="space-y-2">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
              <Download className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-slate-900">
              바탕화면 바로가기 앱 설치 방법
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-500">
              클릭 한 번으로 PC 바탕화면 또는 스마트폰 홈 화면에 아이콘을 추가할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Monitor className="h-4 w-4 text-blue-600" /> PC (Chrome / Edge 브라우저)
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 leading-relaxed">
                <li>브라우저 상단 주소창 우측의 <strong>[설치 아이콘(⊕ 또는 컴퓨터 모양)]</strong>을 클릭합니다.</li>
                <li>또는 브라우저 메뉴 <strong>[⋮] ➡️ [저장 및 공유] / [앱] ➡️ [본사 마감 관리 시스템 설치]</strong>를 클릭합니다.</li>
              </ol>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Smartphone className="h-4 w-4 text-emerald-600" /> 모바일 (스마트폰)
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 leading-relaxed">
                <li><strong>Safari(아이폰)</strong>: 하단 공유 버튼 [↑] ➡️ <strong>[홈 화면에 추가]</strong></li>
                <li><strong>Chrome(안드로이드)</strong>: 우측 상단 메뉴 [⋮] ➡️ <strong>[홈 화면에 추가]</strong></li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
