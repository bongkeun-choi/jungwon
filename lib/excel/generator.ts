import ExcelJS from 'exceljs';
import { AccountItem } from '@/lib/db/schema';
import { ParsedMonthly, ParsedVat } from './parser';

export async function generateExcelPreservingDesign(
  monthlyList: ParsedMonthly[],
  vatList: ParsedVat[] = [],
  templateBuffer?: Buffer
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  if (templateBuffer && templateBuffer.length > 0) {
    // 1. 원본 템플릿 로드 (스타일 및 시트 구조 보존)
    await workbook.xlsx.load(templateBuffer as any);
  }

  // 월별 시트 처리
  for (const data of monthlyList) {
    const targetSheetName = data.sheetName || `  ${String(data.year).slice(-2)}년 ${String(data.month).padStart(2, '0')}월`;
    let sheet = workbook.getWorksheet(targetSheetName);

    if (!sheet) {
      // 템플릿에 해당 시트가 없으면 기존 시트 스타일을 본따 새 시트 생성
      sheet = workbook.addWorksheet(targetSheetName);
      sheet.views = [{ showGridLines: true }];
      sheet.getColumn('A').width = 24;
      sheet.getColumn('B').width = 18;
      sheet.getColumn('C').width = 15;
    }

    // A1: 타이틀
    const titleCell = sheet.getCell('A1');
    titleCell.value = `${String(data.year).slice(-2)}년 ${String(data.month).padStart(2, '0')}월 마감`;
    titleCell.font = { name: '맑은 고딕', size: 14, bold: true };

    // 항목 레이블 및 수치 기입
    const labels = [
      { cellA: 'A3', cellB: 'B3', label: '매입금액', val: data.purchaseAmount },
      { cellA: 'A4', cellB: 'B4', label: 'A/S 및 서비스', val: data.serviceAs },
      { cellA: 'A5', cellB: 'B5', label: '포인트', val: data.point },
      { cellA: 'A6', cellB: 'B6', label: '인센티브', val: data.incentive },
      { cellA: 'A7', cellB: 'B7', label: '본사입금', val: data.headquartersDeposit },
    ];

    labels.forEach((item) => {
      sheet.getCell(item.cellA).value = item.label;
      const bCell = sheet.getCell(item.cellB);
      bCell.value = item.val;
      bCell.numFmt = '#,##0';
    });

    // B8: 마감 계산 공식 보존
    const b8 = sheet.getCell('B8');
    b8.value = {
      formula: 'B3-B4-B5-B6-B7',
      result: data.purchaseAmount - data.serviceAs - data.point - data.incentive - data.headquartersDeposit,
    };
    b8.numFmt = '#,##0';
    b8.font = { bold: true };

    // 동적 통장 리스트 (B10부터)
    let curRow = 10;
    data.accounts.forEach((acc) => {
      const aCell = sheet.getCell(`A${curRow}`);
      const bCell = sheet.getCell(`B${curRow}`);
      aCell.value = acc.name;
      bCell.value = acc.amount;
      bCell.numFmt = '#,##0';
      curRow++;
    });

    // 통장 합계
    const bankSumRow = curRow;
    const bankSumCell = sheet.getCell(`B${bankSumRow}`);
    bankSumCell.value = {
      formula: `SUM(B10:B${bankSumRow - 1})`,
      result: data.bankTotal,
    };
    bankSumCell.numFmt = '#,##0';
    bankSumCell.font = { bold: true };
    curRow++;

    // 차액 행
    const diffRow = curRow;
    sheet.getCell(`A${diffRow}`).value = '차액';
    const diffCell = sheet.getCell(`B${diffRow}`);
    diffCell.value = {
      formula: `B8-B${bankSumRow}`,
      result: data.difference,
    };
    diffCell.numFmt = '#,##0';
    diffCell.font = { bold: true, color: { argb: data.difference === 0 ? '000000' : 'FF0000' } };
    curRow++;

    // 국민 계좌 메모
    sheet.getCell(`A${curRow}`).value = '국민 3001-9029-00536-1';
  }

  // 부가세 시트 처리
  for (const vData of vatList) {
    const targetSheetName = vData.sheetName || `${String(vData.year).slice(-2)}년 ${vData.quarter}분기 부가세`;
    let sheet = workbook.getWorksheet(targetSheetName);

    if (!sheet) {
      sheet = workbook.addWorksheet(targetSheetName);
      sheet.views = [{ showGridLines: true }];
      sheet.getColumn('A').width = 12;
      sheet.getColumn('B').width = 18;
      sheet.getColumn('C').width = 18;
      sheet.getColumn('D').width = 18;
      sheet.getColumn('E').width = 18;
    }

    sheet.getCell('A1').value = vData.title;
    sheet.getCell('A1').font = { name: '맑은 고딕', size: 13, bold: true };

    sheet.getCell('A3').value = '월';
    sheet.getCell('B3').value = '세금계산서';
    sheet.getCell('C3').value = '신용카드/현금';
    sheet.getCell('D3').value = '매출합계';
    sheet.getCell('E3').value = '매입세금계산서';

    let r = 4;
    vData.salesData.forEach((s) => {
      const p = vData.purchaseData.find((pd) => pd.m === s.m) || { tax: 0 };
      sheet.getCell(`A${r}`).value = `${s.m}월`;
      
      const bCell = sheet.getCell(`B${r}`);
      bCell.value = s.tax;
      bCell.numFmt = '#,##0';

      const cCell = sheet.getCell(`C${r}`);
      cCell.value = s.card;
      cCell.numFmt = '#,##0';

      const dCell = sheet.getCell(`D${r}`);
      dCell.value = { formula: `B${r}+C${r}`, result: s.tax + s.card };
      dCell.numFmt = '#,##0';

      const eCell = sheet.getCell(`E${r}`);
      eCell.value = p.tax;
      eCell.numFmt = '#,##0';

      r++;
    });

    // 부가세 합계 행
    sheet.getCell(`A${r}`).value = '합계';
    const sumTax = sheet.getCell(`B${r}`);
    sumTax.value = { formula: `SUM(B4:B${r - 1})`, result: vData.salesTaxTotal };
    sumTax.numFmt = '#,##0';
    sumTax.font = { bold: true };

    const sumCard = sheet.getCell(`C${r}`);
    sumCard.value = { formula: `SUM(C4:C${r - 1})`, result: vData.salesCardTotal };
    sumCard.numFmt = '#,##0';
    sumCard.font = { bold: true };

    const sumTotal = sheet.getCell(`D${r}`);
    sumTotal.value = { formula: `SUM(D4:D${r - 1})`, result: vData.salesTotal };
    sumTotal.numFmt = '#,##0';
    sumTotal.font = { bold: true };

    const sumPurchase = sheet.getCell(`E${r}`);
    sumPurchase.value = { formula: `SUM(E4:E${r - 1})`, result: vData.purchaseTotal };
    sumPurchase.numFmt = '#,##0';
    sumPurchase.font = { bold: true };
  }

  const outputBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(outputBuffer);
}
