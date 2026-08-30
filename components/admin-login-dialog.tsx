"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminStore } from '@/hooks/use-admin';
import { Lock, ShieldCheck, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export function AdminLoginDialog() {
  const { isDialogOpen, closeDialog, login } = useAdminStore();
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!password) {
      toast.error('비밀번호를 입력해 주세요.');
      return;
    }

    const success = login(password);
    if (success) {
      toast.success('관리자 모드로 전환되었습니다. 이제 수정 및 저장이 가능합니다.');
      setPassword('');
    } else {
      toast.error('비밀번호가 올바르지 않습니다. (기본: 1234)');
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white border-slate-200">
        <DialogHeader className="space-y-2">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-lg font-bold text-slate-900">
            관리자 인증
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-slate-500">
            데이터 수정 및 저장은 관리자 권한이 필요합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-slate-400" />
              관리자 비밀번호
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="비밀번호 입력 (기본: 1234)"
              className="h-11 rounded-xl bg-slate-50 border-slate-200 text-center font-mono tracking-widest text-base"
              autoFocus
            />
          </div>
          <p className="text-[11px] text-center text-muted-foreground">
            초기 기본 비밀번호는 <span className="font-mono font-bold text-slate-700">1234</span> 입니다.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={closeDialog}
            className="w-full sm:w-auto h-10 rounded-xl"
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleLogin}
            className="w-full sm:w-auto h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            로그인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
