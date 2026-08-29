import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { vatQuarterly } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// 부가세 목록 조회
export async function GET() {
  try {
    const list = await db.select().from(vatQuarterly).orderBy(desc(vatQuarterly.id));
    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

// 부가세 등록/수정 (Upsert)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      year,
      quarter,
      title,
      salesData = [],
      purchaseData = [],
    } = body;

    const id = `${String(year).slice(-2)}-${quarter}`;
    const salesTaxTotal = (salesData as { tax: number }[]).reduce((s, d) => s + (Number(d.tax) || 0), 0);
    const salesCardTotal = (salesData as { card: number }[]).reduce((s, d) => s + (Number(d.card) || 0), 0);
    const salesTotal = salesTaxTotal + salesCardTotal;
    const purchaseTotal = (purchaseData as { tax: number }[]).reduce((s, d) => s + (Number(d.tax) || 0), 0);
    const difference = salesTotal - purchaseTotal;
    const rawSheetName = `${String(year).slice(-2)}년 ${quarter}분기 부가세`;

    await db
      .insert(vatQuarterly)
      .values({
        id,
        year: Number(year),
        quarter: Number(quarter),
        title: title || `${String(year).slice(-2)}년 ${quarter}분기(${quarter * 3 - 2}~${quarter * 3}월) 부가세 신고`,
        salesData,
        purchaseData,
        salesTaxTotal,
        salesCardTotal,
        salesTotal,
        purchaseTotal,
        difference,
        rawSheetName,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: vatQuarterly.id,
        set: {
          title: title || `${String(year).slice(-2)}년 ${quarter}분기(${quarter * 3 - 2}~${quarter * 3}월) 부가세 신고`,
          salesData,
          purchaseData,
          salesTaxTotal,
          salesCardTotal,
          salesTotal,
          purchaseTotal,
          difference,
          rawSheetName,
          updatedAt: new Date().toISOString(),
        },
      });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

// 부가세 삭제
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.delete(vatQuarterly).where(eq(vatQuarterly.id, id));
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
