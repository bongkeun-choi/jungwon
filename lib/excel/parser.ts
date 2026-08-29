import ExcelJS from 'exceljs';
import { AccountItem, VatSalesItem, VatPurchaseItem } from '@/lib/db/schema';

export interface ParsedMonthly {
  id: string; // "26-08"
  sheetName: string; // "  26년 08월" 원본 그대로
  year: number;
  month: number;
  purchaseAmount: number;
  serviceAs: number;
  point: number;
  incentive: number;
  headquartersDeposit: number;
  closingAmount: number;
  accounts: AccountItem[];
  bankTotal: number;
  difference: number;
}

export interface ParsedVat {
  id: string; // "26-2"
  sheetName: string;
  year: number;
  quarter: number;
  title: string;
  salesData: VatSalesItem[];
  purchaseData: VatPurchaseItem[];
  salesTaxTotal: number;
  salesCardTotal: number;
  salesTotal: number;
  purchaseTotal: number;
  difference: number;
}

function getCellValueAsNumber(cell: ExcelJS.Cell | undefined): number {
  if (!cell || cell.value === null || cell.value === undefined) return 0;
  const val = cell.value;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null) {
    if ('result' in val && typeof (val as any).result === 'number') {
      return (val as any).result;
    }
    if ('result' in val && typeof (val as any).result === 'string') {
      const p = parseFloat((val as any).result.replace(/,/g, '').trim());
      if (!isNaN(p)) return p;
    }
  }
  const str = String(val).replace(/,/g, '').trim();
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

function getCellValueAsString(cell: ExcelJS.Cell | undefined): string {
  if (!cell || cell.value === null || cell.value === undefined) return '';
  const val = cell.value;
  if (typeof val === 'object' && val !== null) {
    if ('result' in val) {
      return String((val as any).result || '');
    }
    if ('richText' in val) {
      return (val as any).richText.map((t: any) => t.text).join('');
    }
  }
  return String(val).trim();
}

function extractMonthNumber(str: string | number | null | undefined): number | null {
  if (typeof str === 'number' && str >= 1 && str <= 12) return str;
  if (!str) return null;
  const clean = String(str).trim();
  const m = clean.match(/^(\d{1,2})월?$/);
  if (m) {
    const num = parseInt(m[1]);
    if (num >= 1 && num <= 12) return num;
  }
  return null;
}

export async function parseOriginalExcel(buffer: Buffer): Promise<{
  monthly: ParsedMonthly[];
  vat: ParsedVat[];
}> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const monthly: ParsedMonthly[] = [];
  const vat: ParsedVat[] = [];

  workbook.eachSheet((sheet) => {
    const name = sheet.name;
    
    // 1. 부가세 시트 파싱
    if (name.includes('부가세')) {
      let year = 2026;
      let quarter = 2;
      
      const match = name.match(/(\d+)년\s*(\d+)분기/);
      if (match) {
        year = 2000 + parseInt(match[1]);
        quarter = parseInt(match[2]);
      } else {
        const titleCell = getCellValueAsString(sheet.getCell('A1')) || getCellValueAsString(sheet.getCell('A2'));
        const tMatch = titleCell.match(/(\d+)년\s*(\d+)분기/);
        if (tMatch) {
          year = 2000 + parseInt(tMatch[1]);
          quarter = parseInt(tMatch[2]);
        }
      }

      const id = `${String(year).slice(-2)}-${quarter}`;
      const title = getCellValueAsString(sheet.getCell('A1')) || `${String(year).slice(-2)}년 ${quarter}분기 부가세 신고`;

      const quarterMonths = [quarter * 3 - 2, quarter * 3 - 1, quarter * 3];
      const salesMap = new Map<number, { tax: number; card: number }>();
      const purchaseMap = new Map<number, { tax: number; card: number }>();

      // 초기화
      quarterMonths.forEach((m) => {
        salesMap.set(m, { tax: 0, card: 0 });
        purchaseMap.set(m, { tax: 0, card: 0 });
      });

      // 시트 전체 행을 스캔하여 매출과 매입 섹션 분리 탐색
      let currentSection: 'sales' | 'purchase' | 'unknown' = 'sales';

      for (let r = 1; r <= 40; r++) {
        const aText = getCellValueAsString(sheet.getCell(`A${r}`));
        const bText = getCellValueAsString(sheet.getCell(`B${r}`));
        const cText = getCellValueAsString(sheet.getCell(`C${r}`));
        const dText = getCellValueAsString(sheet.getCell(`D${r}`));
        const eText = getCellValueAsString(sheet.getCell(`E${r}`));

        // 섹션 헤더 감지
        if (aText.includes('매입') || bText.includes('매입')) {
          currentSection = 'purchase';
        } else if (aText.includes('매출') || bText.includes('매출')) {
          currentSection = 'sales';
        }

        const mNum = extractMonthNumber(sheet.getCell(`A${r}`).value as any);

        if (mNum && quarterMonths.includes(mNum)) {
          const bVal = getCellValueAsNumber(sheet.getCell(`B${r}`));
          const cVal = getCellValueAsNumber(sheet.getCell(`C${r}`));
          const dVal = getCellValueAsNumber(sheet.getCell(`D${r}`));
          const eVal = getCellValueAsNumber(sheet.getCell(`E${r}`));
          const fVal = getCellValueAsNumber(sheet.getCell(`F${r}`));

          // 매입 섹션이거나 아래쪽 행에 위치한 경우
          if (currentSection === 'purchase' || r >= 8) {
            purchaseMap.set(mNum, {
              tax: bVal || dVal || eVal || 0,
              card: cVal || fVal || 0,
            });
          } else {
            // 매출 섹션
            salesMap.set(mNum, {
              tax: bVal,
              card: cVal,
            });

            // 만약 같은 행의 D/E열에 매입 데이터가 있다면 함께 추출
            if (eVal > 0 || dVal > 0) {
              purchaseMap.set(mNum, {
                tax: eVal || dVal,
                card: fVal || 0,
              });
            }
          }
        }
      }

      const salesData: VatSalesItem[] = quarterMonths.map((m) => ({
        m,
        tax: salesMap.get(m)?.tax || 0,
        card: salesMap.get(m)?.card || 0,
      }));

      const purchaseData: VatPurchaseItem[] = quarterMonths.map((m) => ({
        m,
        tax: purchaseMap.get(m)?.tax || 0,
      }));

      const salesTaxTotal = salesData.reduce((s, d) => s + d.tax, 0);
      const salesCardTotal = salesData.reduce((s, d) => s + d.card, 0);
      const salesTotal = salesTaxTotal + salesCardTotal;
      const purchaseTotal = purchaseData.reduce((s, d) => s + d.tax, 0);
      const difference = salesTotal - purchaseTotal;

      vat.push({
        id,
        sheetName: name,
        year,
        quarter,
        title,
        salesData,
        purchaseData,
        salesTaxTotal,
        salesCardTotal,
        salesTotal,
        purchaseTotal,
        difference,
      });
    } 
    // 2. 월 마감 시트 파싱
    else if (name.match(/\d+년.*\d+월/)) {
      const match = name.match(/(\d+)년\s*(\d+)월/);
      const year = match ? 2000 + parseInt(match[1]) : 2026;
      const month = match ? parseInt(match[2]) : 1;
      const id = `${String(year).slice(-2)}-${String(month).padStart(2, '0')}`;

      const purchaseAmount = getCellValueAsNumber(sheet.getCell('B3'));
      const serviceAs = getCellValueAsNumber(sheet.getCell('B4'));
      const point = getCellValueAsNumber(sheet.getCell('B5'));
      const incentive = getCellValueAsNumber(sheet.getCell('B6'));
      const headquartersDeposit = getCellValueAsNumber(sheet.getCell('B7'));

      // 마감금액 = B3 - B4 - B5 - B6 - B7
      const closingAmount = purchaseAmount - serviceAs - point - incentive - headquartersDeposit;

      // B10부터 통장 목록 파싱
      const accounts: AccountItem[] = [];
      for (let row = 10; row <= 30; row++) {
        const aCell = sheet.getCell(`A${row}`);
        const bCell = sheet.getCell(`B${row}`);
        const accName = getCellValueAsString(aCell).trim();
        const accAmount = getCellValueAsNumber(bCell);

        if (!accName && accAmount === 0 && !aCell.value && !bCell.value) {
          if (row > 15) break;
          continue;
        }

        // 차액, 계좌번호 메모, 합계 등 필터링 (국민은행 통장은 포함)
        const isMemoOrTotal =
          accName.includes('합계') ||
          accName.includes('차액') ||
          accName.includes('3001-9029') ||
          accName.includes('계좌') ||
          accName === 'SUM';

        if (accName && !isMemoOrTotal && accAmount > 0) {
          accounts.push({
            name: accName,
            amount: accAmount,
          });
        }
      }

      const bankTotal = accounts.reduce((s, a) => s + a.amount, 0);
      const difference = closingAmount - bankTotal;

      monthly.push({
        id,
        sheetName: name,
        year,
        month,
        purchaseAmount,
        serviceAs,
        point,
        incentive,
        headquartersDeposit,
        closingAmount,
        accounts,
        bankTotal,
        difference,
      });
    }
  });

  return { monthly, vat };
}
