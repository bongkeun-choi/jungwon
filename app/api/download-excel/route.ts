import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { monthlyClosing, vatQuarterly } from '@/lib/db/schema';
import { generateExcelPreservingDesign } from '@/lib/excel/generator';
import { ParsedMonthly, ParsedVat } from '@/lib/excel/parser';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const monthlyRecords = await db.select().from(monthlyClosing);
    const vatRecords = await db.select().from(vatQuarterly);

    // 템플릿 파일이 있으면 로드하여 서식 100% 보존
    const templatePath = path.join(process.cwd(), 'public', 'template.xlsx');
    const templateBuffer = fs.existsSync(templatePath)
      ? fs.readFileSync(templatePath)
      : undefined;

    const parsedMonthly: ParsedMonthly[] = monthlyRecords.map((m) => ({
      id: m.id,
      sheetName: m.rawExcelSheetName || `  ${String(m.year).slice(-2)}년 ${String(m.month).padStart(2, '0')}월`,
      year: m.year,
      month: m.month,
      purchaseAmount: m.purchaseAmount,
      serviceAs: m.serviceAs,
      point: m.point,
      incentive: m.incentive,
      headquartersDeposit: m.headquartersDeposit,
      closingAmount: m.closingAmount,
      accounts: (m.accounts as any) || [],
      bankTotal: m.bankTotal,
      difference: m.difference,
    }));

    const parsedVat: ParsedVat[] = vatRecords.map((v) => ({
      id: v.id,
      sheetName: v.rawSheetName || `${String(v.year).slice(-2)}년 ${v.quarter}분기 부가세`,
      year: v.year,
      quarter: v.quarter,
      title: v.title,
      salesData: (v.salesData as any) || [],
      purchaseData: (v.purchaseData as any) || [],
      salesTaxTotal: v.salesTaxTotal || 0,
      salesCardTotal: v.salesCardTotal || 0,
      salesTotal: v.salesTotal || 0,
      purchaseTotal: v.purchaseTotal || 0,
      difference: v.difference || 0,
    }));

    const excelBuffer = await generateExcelPreservingDesign(
      parsedMonthly,
      parsedVat,
      templateBuffer
    );

    const todayStr = new Date().toISOString().slice(0, 10);
    const fileName = encodeURIComponent(`본사마감_${todayStr}.xlsx`);

    return new Response(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${fileName}`,
      },
    });
  } catch (error: any) {
    console.error('[Download API Error]', error);
    return NextResponse.json(
      { error: error?.message || '엑셀 파일 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
