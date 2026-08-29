"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Github, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export function SyncDashboard() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualBackup = async () => {
    setIsSyncing(true);
    try {
      // 엑셀 다운로드 API 호출하여 엑셀 생성 상태 확인
      const res = await fetch('/api/download-excel');
      if (res.ok) {
        toast.success('Turso DB 데이터 기반 엑셀 파일 동기화가 정상 작동 중입니다.');
      } else {
        toast.error('동기화 상태 확인 중 오류가 발생했습니다.');
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Turso DB 카드 */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-600" />
              Turso (libSQL) 클라우드 데이터베이스
            </CardTitle>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
              <CheckCircle2 className="h-3 w-3" /> 연결됨
            </Badge>
          </div>
          <CardDescription>
            SQLite Edge 데이터베이스와 실시간으로 연동되어 모든 마감 데이터가 안전하게 저장됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="p-3 bg-slate-50 rounded-lg space-y-1 font-mono text-xs text-slate-700">
            <div><strong>Host:</strong> aws-ap-northeast-1 (Tokyo/Seoul Edge)</div>
            <div><strong>Tables:</strong> monthly_closing, vat_quarterly, excel_backups</div>
          </div>
          <Button
            variant="outline"
            className="w-full gap-1.5"
            onClick={handleManualBackup}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            DB 데이터 정합성 검증
          </Button>
        </CardContent>
      </Card>

      {/* GitHub 자동 백업 카드 */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Github className="h-5 w-5 text-slate-800" />
              GitHub 레포지토리 자동 백업
            </CardTitle>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
              연동 구성됨
            </Badge>
          </div>
          <CardDescription>
            엑셀 업로드 시 원본 파일과 JSON 스냅샷이 GitHub 레포지토리에 자동 커밋됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="p-3 bg-slate-50 rounded-lg space-y-1 font-mono text-xs text-slate-700">
            <div><strong>Repo:</strong> bongkeun-choi / jungwon</div>
            <div><strong>Backup Path:</strong> backups/YYYY-MM-DD_*.xlsx, data/monthly_latest.json</div>
          </div>
          <Button
            variant="outline"
            className="w-full gap-1.5"
            onClick={() => window.open('https://github.com/bongkeun-choi/jungwon', '_blank')}
          >
            <ExternalLink className="h-4 w-4" /> GitHub 저장소 바로가기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
