"use client";

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UploadCloud, FileSpreadsheet, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useClosingStore } from '@/hooks/use-closing';
import { parseOriginalExcel } from '@/lib/excel/parser';

export function ExcelUploader({ onUploaded }: { onUploaded?: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lastUploadedInfo, setLastUploadedInfo] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setCurrentMonthly, setMonthlyList, setVatList } = useClosingStore();

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('엑셀 파일(.xlsx, .xls)만 업로드할 수 있습니다.');
      return;
    }

    setIsUploading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 브라우저에서 직접 ExcelJS 파싱 실행
      const { monthly, vat } = await parseOriginalExcel(buffer);

      if (monthly.length === 0 && vat.length === 0) {
        toast.error('엑셀에서 월마감 또는 부가세 시트를 인식하지 못했습니다.');
        return;
      }

      // 1. 전체 월마감 목록 및 부가세 목록을 스토어와 Turso DB에 동기화
      if (monthly.length > 0) {
        setMonthlyList(monthly);

        // Turso DB에 일괄 저장
        const { saveMonthlyToTurso } = await import('@/lib/db/client-db');
        for (const m of monthly) {
          saveMonthlyToTurso(m);
        }

        // 최신 월마감 데이터를 현재 입력 폼에 즉시 로드
        const latest = monthly[monthly.length - 1];
        setCurrentMonthly({
          year: latest.year,
          month: latest.month,
          purchaseAmount: latest.purchaseAmount,
          serviceAs: latest.serviceAs,
          point: latest.point,
          incentive: latest.incentive,
          headquartersDeposit: latest.headquartersDeposit,
          accounts: latest.accounts || [],
        });
      }

      if (vat.length > 0) {
        setVatList(vat);
        const { saveVatToTurso } = await import('@/lib/db/client-db');
        for (const v of vat) {
          saveVatToTurso(v);
        }
      }

      // 서버 API가 있으면 전송도 시도
      try {
        const formData = new FormData();
        formData.append('file', file);
        fetch('/api/upload-excel', { method: 'POST', body: formData });
      } catch {
        // 정적 환경 에러 무시
      }

      toast.success(`엑셀 파싱이 완료되었습니다! (월마감 ${monthly.length}건, 부가세 ${vat.length}건)`);
      setLastUploadedInfo({
        fileName: file.name,
        monthlyCount: monthly.length,
        vatCount: vat.length,
        time: new Date().toLocaleTimeString(),
      });

      onUploaded?.();
    } catch (error: any) {
      console.error('[Excel Upload Error]', error);
      toast.error(`엑셀 처리 중 오류: ${error?.message || error}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <Card className="border-2 border-dashed transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              엑셀 원본 파일 업로드
            </CardTitle>
            <CardDescription className="mt-1">
              기존에 사용하시던 본사 마감 엑셀 파일을 업로드하면 자동으로 파싱하여 모든 탭(월마감, 부가세, 히스토리, 대시보드)에 즉시 반영합니다.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            ExcelJS 정밀 파서 적용
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 rounded-lg cursor-pointer transition-all border-2 border-dashed ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[0.99]'
              : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) handleUpload(e.target.files[0]);
            }}
            accept=".xlsx, .xls"
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-slate-700">엑셀 서식 파싱 및 계산기 연동 중...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="p-4 bg-primary/10 rounded-full text-primary">
                <UploadCloud className="h-8 w-8" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">
                  클릭하거나 엑셀 파일을 여기로 드래그하세요
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  .xlsx 형식의 원본 파일 (월마감 시트: &quot;26년 08월&quot; 등 / 부가세 시트 지원)
                </p>
              </div>
            </div>
          )}
        </div>

        {lastUploadedInfo && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>
                <strong>{lastUploadedInfo.fileName}</strong> 파싱 완료 (월마감 {lastUploadedInfo.monthlyCount}개 시트, 부가세 {lastUploadedInfo.vatCount}개 시트)
              </span>
            </div>
            <span className="text-muted-foreground">{lastUploadedInfo.time}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
