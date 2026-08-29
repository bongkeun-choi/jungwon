import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { monthlyClosing } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// 월마감 목록 조회
export async function GET() {
  try {
    const list = await db.select().from(monthlyClosing).orderBy(desc(monthlyClosing.id));
    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

// 월마감 등록/수정 (Upsert)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      year,
      month,
      purchaseAmount = 0,
      serviceAs = 0,
      point = 0,
      incentive = 0,
      headquartersDeposit = 0,
      accounts = [],
    } = body;

    const id = `${String(year).slice(-2)}-${String(month).padStart(2, '0')}`;
    const closingAmount = purchaseAmount - serviceAs - point - incentive - headquartersDeposit;
    const bankTotal = (accounts as { name: string; amount: number }[]).reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const difference = closingAmount - bankTotal;
    const rawExcelSheetName = `  ${String(year).slice(-2)}년 ${String(month).padStart(2, '0')}월`;

    await db
      .insert(monthlyClosing)
      .values({
        id,
        year: Number(year),
        month: Number(month),
        purchaseAmount: Number(purchaseAmount),
        serviceAs: Number(serviceAs),
        point: Number(point),
        incentive: Number(incentive),
        headquartersDeposit: Number(headquartersDeposit),
        closingAmount,
        accounts,
        bankTotal,
        difference,
        rawExcelSheetName,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: monthlyClosing.id,
        set: {
          year: Number(year),
          month: Number(month),
          purchaseAmount: Number(purchaseAmount),
          serviceAs: Number(serviceAs),
          point: Number(point),
          incentive: Number(incentive),
          headquartersDeposit: Number(headquartersDeposit),
          closingAmount,
          accounts,
          bankTotal,
          difference,
          rawExcelSheetName,
          updatedAt: new Date().toISOString(),
        },
      });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

// 월마감 삭제
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.delete(monthlyClosing).where(eq(monthlyClosing.id, id));
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
