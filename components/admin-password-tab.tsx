"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminStore } from '@/hooks/use-admin';
import { KeyRound, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export function AdminPasswordTab() {
  const { changePassword } = useAdminStore();
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleUpdate = () => {
    if (!oldPin) {
      toast.error('현재 비밀번호를 입력해 주세요.');
      return;
    }
    if (!newPin) {
      toast.error('새 비밀번호를 입력해 주세요.');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('새 비밀번호와 확인이 일치하지 않습니다.');
      return;
    }

    const res = changePassword(oldPin, newPin);
    if (res.success) {
      toast.success(res.message);
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <Card className="max-w-md mx-auto shadow-sm border-slate-200 bg-white rounded-3xl p-6">
      <CardHeader className="text-center p-0 pb-6">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-lg font-bold text-slate-900">
          관리자 비밀번호 변경
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          관리자 모드 접속 시 사용할 새로운 비밀번호를 설정합니다.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 p-0">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">현재 비밀번호</label>
          <Input
            type="password"
            value={oldPin}
            onChange={(e) => setOldPin(e.target.value)}
            placeholder="현재 비밀번호 (초기값: 1234)"
            className="h-11 rounded-xl bg-slate-50 border-slate-200 text-sm font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">새 비밀번호</label>
          <Input
            type="password"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            placeholder="새 비밀번호 (4자리 이상)"
            className="h-11 rounded-xl bg-slate-50 border-slate-200 text-sm font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">새 비밀번호 확인</label>
          <Input
            type="password"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            placeholder="새 비밀번호 다시 입력"
            className="h-11 rounded-xl bg-slate-50 border-slate-200 text-sm font-mono"
          />
        </div>

        <div className="pt-2">
          <Button
            onClick={handleUpdate}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20"
          >
            비밀번호 변경 저장
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
