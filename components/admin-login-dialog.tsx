"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminStore } from '@/hooks/use-admin';
import { ShieldCheck, KeyRound, X } from 'lucide-react';
import { toast } from 'sonner';

export function AdminLoginDialog() {
  const { isDialogOpen, closeDialog, login } = useAdminStore();
  const [password, setPassword] = useState('');

  if (!isDialogOpen) return null;

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password) {
      toast.error('비밀번호를 입력해 주세요.');
      return;
    }

    const success = login(password);
    if (success) {
      toast.success('관리자 모드로 전환되었습니다. 제어 센터가 열립니다.');
      setPassword('');
    } else {
      toast.error('비밀번호가 올바르지 않습니다. (초기값: 1234)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={closeDialog}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 헤더 */}
        <div className="text-center space-y-2 mb-5">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">관리자 인증</h2>
          <p className="text-xs text-slate-500">
            데이터 수정 및 엑셀 관리는 관리자 권한이 필요합니다.
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 justify-center">
              <KeyRound className="h-3.5 w-3.5 text-slate-400" />
              비밀번호 입력
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력 (초기값: 1234)"
              className="h-11 rounded-2xl bg-slate-50 border-slate-200 text-center font-mono tracking-widest text-base focus-visible:ring-2 focus-visible:ring-blue-500"
              autoFocus
            />
          </div>

          <p className="text-[11px] text-center text-muted-foreground">
            초기 비밀번호는 <span className="font-mono font-bold text-slate-700">1234</span> 입니다.
          </p>

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              className="flex-1 h-10 rounded-xl font-medium border-slate-200"
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
            >
              로그인
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
