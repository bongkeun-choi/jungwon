"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Landmark, Calculator } from 'lucide-react';
import { useClosingStore } from '@/hooks/use-closing';
import { formatCurrency, parseNumber } from '@/lib/utils';

export function AccountManager() {
  const { currentMonthly, addAccount, removeAccount, updateAccount } = useClosingStore();
  const [newAccName, setNewAccName] = useState('');
  const [newAccAmount, setNewAccAmount] = useState('');

  const handleAdd = () => {
    if (!newAccName.trim()) return;
    addAccount({
      name: newAccName.trim(),
      amount: parseNumber(newAccAmount),
    });
    setNewAccName('');
    setNewAccAmount('');
  };

  const bankTotal = currentMonthly.accounts.reduce((s, a) => s + (Number(a.amount) || 0), 0);

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4 text-blue-600" />
            통장 입금 내역 (동적 관리)
          </CardTitle>
          <div className="text-sm font-semibold text-slate-700">
            통장 합계: <span className="text-blue-600">{formatCurrency(bankTotal)}</span> 원
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 통장 목록 */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {currentMonthly.accounts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">등록된 통장이 없습니다.</p>
          ) : (
            currentMonthly.accounts.map((acc, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                <Input
                  value={acc.name}
                  onChange={(e) => updateAccount(idx, { name: e.target.value })}
                  placeholder="통장명 (예: 농협, 기업)"
                  className="h-8 text-sm flex-1 bg-white"
                />
                <div className="relative flex-1">
                  <Input
                    value={acc.amount ? formatCurrency(acc.amount) : ''}
                    onChange={(e) => updateAccount(idx, { amount: parseNumber(e.target.value) })}
                    placeholder="금액 (원)"
                    className="h-8 text-sm text-right pr-6 bg-white"
                  />
                  <span className="absolute right-2 top-1.5 text-xs text-muted-foreground">원</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAccount(idx)}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* 새 통장 추가 입력란 */}
        <div className="pt-2 border-t flex items-center gap-2">
          <Input
            value={newAccName}
            onChange={(e) => setNewAccName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="통장명 (예: 하나은행)"
            className="h-8 text-sm flex-1"
          />
          <Input
            value={newAccAmount ? formatCurrency(parseNumber(newAccAmount)) : ''}
            onChange={(e) => setNewAccAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="금액"
            className="h-8 text-sm flex-1 text-right"
          />
          <Button size="sm" onClick={handleAdd} className="h-8 gap-1 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" /> 추가
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
