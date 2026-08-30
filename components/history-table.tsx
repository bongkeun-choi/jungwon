"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClosingStore } from '@/hooks/use-closing';
import { useAdminStore } from '@/hooks/use-admin';
import { formatCurrency } from '@/lib/utils';
import { History, Download, Trash2, Edit3, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';

export function HistoryTable({ onSelectEdit }: { onSelectEdit?: () => void }) {
  const { monthlyList, setCurrentMonthly, deleteMonthly } = useClosingStore();
  const { isAdmin, openDialog } = useAdminStore();

  const handleEdit = (item: any) => {
    setCurrentMonthly({
      year: item.year,
      month: item.month,
      purchaseAmount: item.purchaseAmount,
      serviceAs: item.serviceAs,
      point: item.point,
      incentive: item.incentive,
      headquartersDeposit: item.headquartersDeposit,
      accounts: item.accounts || [],
    });
    toast.info(`${item.year}년 ${item.month}월 마감 데이터를 불러왔습니다.`);
    onSelectEdit?.();
  };

  const handleDelete = async (id: string, label: string) => {
    if (!isAdmin) {
      openDialog();
      toast.warning('데이터 삭제는 관리자 로그인이 필요합니다.');
      return;
    }

    if (confirm(`${label} 마감 데이터를 삭제하시겠습니까?`)) {
      const ok = await deleteMonthly(id);
      if (ok) {
        toast.success(`${label} 마감 데이터가 삭제되었습니다.`);
      } else {
        toast.error('삭제에 실패했습니다.');
      }
    }
  };

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            월별 마감 데이터 이력 ({monthlyList.length}건)
          </CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => window.open('/api/download-excel', '_blank')}
        >
          <Download className="h-3.5 w-3.5" /> 전체 엑셀 다운로드
        </Button>
      </CardHeader>
      <CardContent>
        {monthlyList.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            저장된 월마감 데이터가 없습니다. 엑셀을 업로드하거나 월마감 탭에서 입력하세요.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-bold text-slate-800">마감 연월</TableHead>
                <TableHead className="text-right font-bold text-slate-800">매입금액(B3)</TableHead>
                <TableHead className="text-right font-bold text-slate-800">정산 마감액(B8)</TableHead>
                <TableHead className="text-right font-bold text-slate-800">통장 총액</TableHead>
                <TableHead className="text-right font-bold text-slate-800">차액</TableHead>
                <TableHead className="text-center font-bold text-slate-800">상태</TableHead>
                <TableHead className="text-center font-bold text-slate-800 w-24">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyList.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-slate-800">
                    {item.year}년 {item.month}월
                    <span className="block text-xs font-normal text-muted-foreground">{item.rawExcelSheetName}</span>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.purchaseAmount)} 원</TableCell>
                  <TableCell className="text-right font-semibold text-blue-600">
                    {formatCurrency(item.closingAmount)} 원
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.bankTotal)} 원</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-semibold ${
                        item.difference === 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatCurrency(item.difference)} 원
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.difference === 0 ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        일치
                      </Badge>
                    ) : (
                      <Badge variant="destructive">차액발생</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600"
                        title="편집하기"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-600"
                        title="삭제하기"
                        onClick={() => handleDelete(item.id, `${item.year}년 ${item.month}월`)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
