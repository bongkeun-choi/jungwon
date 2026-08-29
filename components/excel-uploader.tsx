"use client";

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useClosingStore } from '@/hooks/use-closing';

export function ExcelUploader({ onUploaded }: { onUploaded?: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lastUploadedInfo, setLastUploadedInfo] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fetchMonthlyList, fetchVatList } = useClosingStore();

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('엑셀 파일(.xlsx, .xls)만 업로드할 수 있습니다.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`엑셀 파싱 및 Turso DB 저장이 완료되었습니다! (월마감 ${data.monthlyCount}건, 부가세 ${data.vatCount}건)`);
        setLastUploadedInfo({
          fileName: file.name,
          monthlyCount: data.monthlyCount,
          vatCount: data.vatCount,
          githubBackup: data.githubBackup,
          time: new Date().toLocaleTimeString(),
        });
        await fetchMonthlyList();
        await fetchVatList();
        onUploaded?.();
      } else {
        toast.error(data.error || '엑셀 업로드 처리에 실패했습니다.');
      }
    } catch (error: any) {
      toast.error('업로드 중 네트워크 오류가 발생했습니다.');
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
              기존에 사용하시던 본사 마감 엑셀 파일을 업로드하면 자동으로 파싱하여 Turso DB에 저장하고 서식을 보존합니다.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            ExcelJS 서식 보존 지원
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
              <p className="text-sm font-medium text-slate-700">엑셀 서식 파싱 및 Turso DB 저장 중...</p>
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
                <strong>{lastUploadedInfo.fileName}</strong> 처리 완료 (월마감 {lastUploadedInfo.monthlyCount}개 시트, 부가세 {lastUploadedInfo.vatCount}개 시트)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white">
                {lastUploadedInfo.githubBackup ? 'GitHub 백업 완료' : '로컬 DB 동기화됨'}
              </Badge>
              <span className="text-muted-foreground">{lastUploadedInfo.time}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
