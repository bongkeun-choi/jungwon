import { createClient } from '@libsql/client/web';

const TURSO_URL = 'libsql://jungwoun-bongkeun-choi.aws-ap-northeast-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc5OTY4NDEsImlkIjoiMDFhMDRjZWEtNzIwMS03M2Y1LTkwYjgtZmI3YTZjNzEwMjYyIiwia2lkIjoicEo1RHFMd2V3dHJZLTBXWGNxRTd0cnVRNWxrWDlYOVFJNTYxZl9lSC1YTSIsInJpZCI6IjllYzJmNDlmLTdiMzAtNDIwYy05YjkzLWUxMzJkNzgxNTc2MyJ9.Tp3XKNkKXXC0stF2mWXHrkegb0sNLEgIWuTRVNt3HncwIzmxm5CHeZHbSw9-MOKqED1lAVCukA2e-ZVFLDdBCg';

export const clientDb = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN,
});

// 브라우저에서 직접 Turso DB 월마감 목록 가져오기
export async function getMonthlyFromTurso() {
  try {
    const rs = await clientDb.execute('SELECT * FROM monthly_closing ORDER BY id DESC');
    return rs.rows.map((r: any) => ({
      id: r.id,
      year: Number(r.year),
      month: Number(r.month),
      purchaseAmount: Number(r.purchase_amount) || 0,
      serviceAs: Number(r.service_as) || 0,
      point: Number(r.point) || 0,
      incentive: Number(r.incentive) || 0,
      headquartersDeposit: Number(r.headquarters_deposit) || 0,
      closingAmount: Number(r.closing_amount) || 0,
      accounts: typeof r.accounts === 'string' ? JSON.parse(r.accounts) : (r.accounts || []),
      bankTotal: Number(r.bank_total) || 0,
      difference: Number(r.difference) || 0,
      rawExcelSheetName: r.raw_excel_sheet_name,
    }));
  } catch (e) {
    console.error('[Turso Client DB Error - getMonthly]', e);
    return null;
  }
}

// 브라우저에서 직접 Turso DB에 월마감 저장하기 (Upsert)
export async function saveMonthlyToTurso(data: {
  id: string;
  year: number;
  month: number;
  purchaseAmount: number;
  serviceAs: number;
  point: number;
  incentive: number;
  headquartersDeposit: number;
  closingAmount: number;
  accounts: any[];
  bankTotal: number;
  difference: number;
  rawExcelSheetName?: string;
}) {
  try {
    const accountsJson = JSON.stringify(data.accounts || []);
    const now = new Date().toISOString();
    const sheetName = data.rawExcelSheetName || `  ${String(data.year).slice(-2)}년 ${String(data.month).padStart(2, '0')}월`;

    await clientDb.execute({
      sql: `INSERT INTO monthly_closing (
        id, year, month, purchase_amount, service_as, point, incentive, headquarters_deposit, closing_amount, accounts, bank_total, difference, raw_excel_sheet_name, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        year=excluded.year,
        month=excluded.month,
        purchase_amount=excluded.purchase_amount,
        service_as=excluded.service_as,
        point=excluded.point,
        incentive=excluded.incentive,
        headquarters_deposit=excluded.headquarters_deposit,
        closing_amount=excluded.closing_amount,
        accounts=excluded.accounts,
        bank_total=excluded.bank_total,
        difference=excluded.difference,
        raw_excel_sheet_name=excluded.raw_excel_sheet_name,
        updated_at=excluded.updated_at`,
      args: [
        data.id,
        data.year,
        data.month,
        data.purchaseAmount,
        data.serviceAs,
        data.point,
        data.incentive,
        data.headquartersDeposit,
        data.closingAmount,
        accountsJson,
        data.bankTotal,
        data.difference,
        sheetName,
        now,
      ],
    });
    return true;
  } catch (e) {
    console.error('[Turso Client DB Error - saveMonthly]', e);
    return false;
  }
}

// 브라우저에서 직접 Turso DB 월마감 삭제하기
export async function deleteMonthlyFromTurso(id: string) {
  try {
    await clientDb.execute({
      sql: 'DELETE FROM monthly_closing WHERE id = ?',
      args: [id],
    });
    return true;
  } catch (e) {
    console.error('[Turso Client DB Error - deleteMonthly]', e);
    return false;
  }
}

// 브라우저에서 직접 Turso DB 부가세 목록 가져오기
export async function getVatFromTurso() {
  try {
    const rs = await clientDb.execute('SELECT * FROM vat_quarterly ORDER BY id DESC');
    return rs.rows.map((r: any) => ({
      id: r.id,
      year: Number(r.year),
      quarter: Number(r.quarter),
      title: r.title,
      salesData: typeof r.sales_data === 'string' ? JSON.parse(r.sales_data) : (r.sales_data || []),
      purchaseData: typeof r.purchase_data === 'string' ? JSON.parse(r.purchase_data) : (r.purchase_data || []),
      salesTaxTotal: Number(r.sales_tax_total) || 0,
      salesCardTotal: Number(r.sales_card_total) || 0,
      salesTotal: Number(r.sales_total) || 0,
      purchaseTotal: Number(r.purchase_total) || 0,
      difference: Number(r.difference) || 0,
      rawSheetName: r.raw_sheet_name,
    }));
  } catch (e) {
    console.error('[Turso Client DB Error - getVat]', e);
    return null;
  }
}

// 브라우저에서 직접 Turso DB 부가세 저장하기 (Upsert)
export async function saveVatToTurso(data: {
  id: string;
  year: number;
  quarter: number;
  title: string;
  salesData: any[];
  purchaseData: any[];
  salesTaxTotal: number;
  salesCardTotal: number;
  salesTotal: number;
  purchaseTotal: number;
  difference: number;
  rawSheetName?: string;
}) {
  try {
    const now = new Date().toISOString();
    await clientDb.execute({
      sql: `INSERT INTO vat_quarterly (
        id, year, quarter, title, sales_data, purchase_data, sales_tax_total, sales_card_total, sales_total, purchase_total, difference, raw_sheet_name, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        sales_data=excluded.sales_data,
        purchase_data=excluded.purchase_data,
        sales_tax_total=excluded.sales_tax_total,
        sales_card_total=excluded.sales_card_total,
        sales_total=excluded.sales_total,
        purchase_total=excluded.purchase_total,
        difference=excluded.difference,
        raw_sheet_name=excluded.raw_sheet_name,
        updated_at=excluded.updated_at`,
      args: [
        data.id,
        data.year,
        data.quarter,
        data.title,
        JSON.stringify(data.salesData || []),
        JSON.stringify(data.purchaseData || []),
        data.salesTaxTotal,
        data.salesCardTotal,
        data.salesTotal,
        data.purchaseTotal,
        data.difference,
        data.rawSheetName || `${String(data.year).slice(-2)}년 ${data.quarter}분기 부가세`,
        now,
      ],
    });
    return true;
  } catch (e) {
    console.error('[Turso Client DB Error - saveVat]', e);
    return false;
  }
}
