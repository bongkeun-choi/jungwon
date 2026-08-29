import { NextRequest, NextResponse } from 'next/server';
import { parseOriginalExcel } from '@/lib/excel/parser';
import { db } from '@/lib/db';
import { monthlyClosing, vatQuarterly, excelBackups } from '@/lib/db/schema';
import { backupToGitHub } from '@/lib/github';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '엑셀 파일이 전달되지 않았습니다.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. 원본 엑셀 파싱
    const { monthly, vat } = await parseOriginalExcel(buffer);

    if (monthly.length === 0 && vat.length === 0) {
      return NextResponse.json({ error: '엑셀에서 마감 또는 부가세 시트를 인식하지 못했습니다.' }, { status: 400 });
    }

    // 템플릿으로 활용하기 위해 public 디렉토리에 원본 저장 (디자인 유지 다운로드 템플릿용)
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicDir, 'template.xlsx'), buffer);

    // 2. Turso DB에 월마감 데이터 저장 (Upsert)
    for (const m of monthly) {
      await db
        .insert(monthlyClosing)
        .values({
          id: m.id,
          year: m.year,
          month: m.month,
          purchaseAmount: m.purchaseAmount,
          serviceAs: m.serviceAs,
          point: m.point,
          incentive: m.incentive,
          headquartersDeposit: m.headquartersDeposit,
          closingAmount: m.closingAmount,
          accounts: m.accounts,
          bankTotal: m.bankTotal,
          difference: m.difference,
          rawExcelSheetName: m.sheetName,
          updatedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: monthlyClosing.id,
          set: {
            year: m.year,
            month: m.month,
            purchaseAmount: m.purchaseAmount,
            serviceAs: m.serviceAs,
            point: m.point,
            incentive: m.incentive,
            headquartersDeposit: m.headquartersDeposit,
            closingAmount: m.closingAmount,
            accounts: m.accounts,
            bankTotal: m.bankTotal,
            difference: m.difference,
            rawExcelSheetName: m.sheetName,
            updatedAt: new Date().toISOString(),
          },
        });
    }

    // 3. Turso DB에 부가세 데이터 저장 (Upsert)
    for (const v of vat) {
      await db
        .insert(vatQuarterly)
        .values({
          id: v.id,
          year: v.year,
          quarter: v.quarter,
          title: v.title,
          salesData: v.salesData,
          purchaseData: v.purchaseData,
          salesTaxTotal: v.salesTaxTotal,
          salesCardTotal: v.salesCardTotal,
          salesTotal: v.salesTotal,
          purchaseTotal: v.purchaseTotal,
          difference: v.difference,
          rawSheetName: v.sheetName,
          updatedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: vatQuarterly.id,
          set: {
            title: v.title,
            salesData: v.salesData,
            purchaseData: v.purchaseData,
            salesTaxTotal: v.salesTaxTotal,
            salesCardTotal: v.salesCardTotal,
            salesTotal: v.salesTotal,
            purchaseTotal: v.purchaseTotal,
            difference: v.difference,
            rawSheetName: v.sheetName,
            updatedAt: new Date().toISOString(),
          },
        });
    }

    // 4. 백업 기록 DB 저장
    const backupId = `bk_${Date.now()}`;
    await db.insert(excelBackups).values({
      id: backupId,
      fileName: file.name,
      uploadType: 'upload',
    });

    // 5. GitHub 백업 시도
    const githubRes = await backupToGitHub({
      fileName: file.name,
      fileBuffer: buffer,
      jsonData: { monthly, vat, updatedAt: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      message: '엑셀 파싱 및 DB 저장이 완료되었습니다.',
      monthlyCount: monthly.length,
      vatCount: vat.length,
      githubBackup: githubRes.success,
      monthly,
      vat,
    });
  } catch (error: any) {
    console.error('[Upload API Error]', error);
    return NextResponse.json(
      { error: error?.message || '엑셀 업로드 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
