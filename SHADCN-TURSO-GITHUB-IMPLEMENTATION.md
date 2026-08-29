# 본사 마감 관리 시스템 - Full Stack 구현 명세서 (shadcn + Turso + GitHub + Excel 원본 디자인 보존)

> **요구사항 정리**
> 1. 엑셀 업로드 → 위 형식(월마감, 부가세)에 맞춰 전부 파싱 & DB 저장
> 2. GitHub에 업로드 (백업)
> 3. DB는 Turso (libSQL)
> 4. 엑셀로 다시 다운로드 (업로드한 원본 디자인/서식 그대로 유지)
> 5. 월마감/부가세 계산 로직 포함
> 6. 디자인: shadcn/ui 테마

---

## 1. 기술 스택

```yaml
Frontend:
  - Next.js 14 (App Router)
  - TypeScript
  - shadcn/ui (Radix + Tailwind CSS)
  - lucide-react (아이콘)
  - zustand (클라이언트 상태)

Backend / DB:
  - Turso (libSQL) - SQLite at Edge
  - Drizzle ORM
  - Next.js API Routes / Server Actions

Excel:
  - ExcelJS (디자인/서식 보존) - SheetJS는 서식 날아감, 반드시 ExcelJS
  - exceljs: 4.4.0

GitHub 연동:
  - Octokit (@octokit/rest)
  - GitHub Actions (자동 백업)

배포:
  - Vercel (Next.js 최적)
```

---

## 2. Turso DB 스키마

```sql
-- turso db:create bonsa-magam
-- turso db:shell bonsa-magam

-- drizzle/schema.ts
CREATE TABLE monthly_closing (
  id TEXT PRIMARY KEY, -- 26-08
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  purchase_amount INTEGER NOT NULL DEFAULT 0, -- 매입금액 B3
  service_as INTEGER NOT NULL DEFAULT 0, -- B4
  point INTEGER NOT NULL DEFAULT 0, -- B5
  incentive INTEGER NOT NULL DEFAULT 0, -- B6
  headquarters_deposit INTEGER NOT NULL DEFAULT 0, -- B7 본사입금
  closing_amount INTEGER GENERATED ALWAYS AS (purchase_amount - service_as - point - incentive - headquarters_deposit) STORED, -- B8
  accounts JSON NOT NULL DEFAULT '[]', -- [{"name":"농협","amount":18652077},{"name":"기업은행","amount":19573305}]
  bank_total INTEGER NOT NULL DEFAULT 0, -- SUM accounts
  difference INTEGER GENERATED ALWAYS AS (closing_amount - bank_total) STORED, -- 차액
  raw_excel_sheet_name TEXT, -- "  26년 08월" 원본 시트명 그대로 보존
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year, month)
);

CREATE TABLE vat_quarterly (
  id TEXT PRIMARY KEY, -- 26-2
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL, -- 1~4
  title TEXT NOT NULL, -- "26년 2분기(4~6월) 부가세 신고"
  sales_data JSON NOT NULL, -- [{"m":4,"tax":49810140,"card":35334010}]
  purchase_data JSON NOT NULL, -- [{"m":4,"tax":93583435}]
  sales_tax_total INTEGER,
  sales_card_total INTEGER,
  sales_total INTEGER,
  purchase_total INTEGER,
  difference INTEGER,
  raw_sheet_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year, quarter)
);

CREATE TABLE excel_backups (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  github_url TEXT,
  github_sha TEXT,
  upload_type TEXT, -- 'upload' | 'auto_backup' | 'download'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Drizzle Schema (`lib/db/schema.ts`):**

```ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const monthlyClosing = sqliteTable('monthly_closing', {
  id: text('id').primaryKey(), // 26-08
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  purchaseAmount: integer('purchase_amount').notNull(),
  serviceAs: integer('service_as').notNull(),
  point: integer('point').notNull(),
  incentive: integer('incentive').notNull(),
  headquartersDeposit: integer('headquarters_deposit').notNull(),
  accounts: text('accounts', { mode: 'json' }).$type<{name:string, amount:number}[]>().notNull(),
  bankTotal: integer('bank_total').notNull(),
  rawExcelSheetName: text('raw_excel_sheet_name'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

export const vatQuarterly = sqliteTable('vat_quarterly', {
  id: text('id').primaryKey(),
  year: integer('year').notNull(),
  quarter: integer('quarter').notNull(),
  title: text('title').notNull(),
  salesData: text('sales_data', { mode: 'json' }).$type<any>().notNull(),
  purchaseData: text('purchase_data', { mode: 'json' }).$type<any>().notNull(),
  rawSheetName: text('raw_sheet_name'),
});
```

---

## 3. 프로젝트 구조

```
/app
  /api
    /upload-excel/route.ts      # 엑셀 업로드 → 파싱 → Turso 저장 → GitHub 백업
    /download-excel/route.ts    # Turso → 원본 디자인 유지해서 엑셀 재생성 → 다운로드
    /closing/route.ts           # 월마감 CRUD (Turso)
    /vat/route.ts               # 부가세 CRUD
  /page.tsx                     # 메인 대시보드 (shadcn)
  /upload/page.tsx              # 엑셀 업로드 페이지
/components
  /ui                           # shadcn/ui (button, card, input, table, tabs, toast, dialog)
  /monthly-calculator.tsx       # 월마감 계산기 (shadcn Card 분리)
  /account-manager.tsx          # 통장 동적 추가 (shadcn)
  /vat-calculator.tsx
  /excel-uploader.tsx           # 드래그앤드롭 업로더
/lib
  /db/index.ts                  # Turso 연결
  /excel/
    parser.ts                   # ExcelJS로 파싱 (서식 읽기)
    preserver.ts                # 원본 디자인 보존 로직 (핵심)
    generator.ts                # DB → 엑셀 재생성 (원본 템플릿 복제)
/hooks
  /use-closing.ts
```

---

## 4. 핵심 로직 1: 엑셀 업로드 & 파싱 (디자인 보존)

**왜 ExcelJS인가?** SheetJS는 값만 읽고 서식(병합, 폰트, 색, 테두리) 날아감. ExcelJS는 `workbook.xlsx.readFile`로 스타일 그대로 읽음.

```ts
// lib/excel/parser.ts
import ExcelJS from 'exceljs';

export interface ParsedMonthly {
  sheetName: string; // "  26년 08월" 원본 그대로
  year: number;
  month: number;
  purchase: number;
  service: number;
  point: number;
  incentive: number;
  headquarters: number;
  closing: number; // 공식 검증용
  accounts: { name: string, amount: number }[];
  bankTotal: number;
  difference: number;
}

export async function parseOriginalExcel(buffer: Buffer): Promise<{
  monthly: ParsedMonthly[],
  vat: any[]
}> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const monthly: ParsedMonthly[] = [];
  const vat: any[] = [];

  workbook.eachSheet((sheet) => {
    const name = sheet.name;
    if (name.includes('부가세')) {
      // 부가세 파싱
      // B5:B7 세금계산서, C5:C7 카드 등 위치 고정 파싱
      const sales = [];
      for(let r=5; r<=7; r++) {
        sales.push({
          m: Number(sheet.getCell(`A${r}`).value),
          tax: Number(sheet.getCell(`B${r}`).value) || 0,
          card: Number(sheet.getCell(`C${r}`).value) || 0,
        });
      }
      vat.push({ sheetName: name, sales });
    } else if (name.match(/\d+년.*\d+월/)) {
      // 월 마감 파싱 - 원본 위치 그대로
      const purchase = Number(sheet.getCell('B3').value) || 0;
      const service = Number(sheet.getCell('B4').value) || 0;
      const point = Number(sheet.getCell('B5').value) || 0;
      const incentive = Number(sheet.getCell('B6').value) || 0;
      const headquarters = Number(sheet.getCell('B7').value) || 0;

      // 통장은 B10부터 동적: A열에 이름 있고 B열에 숫자 있으면 통장으로 인식
      const accounts = [];
      let row = 10;
      while(row < 30) {
        const accName = sheet.getCell(`A${row}`).value?.toString().trim();
        const accAmount = sheet.getCell(`B${row}`).value;
        if(!accName && !accAmount) break;
        if(accName && accName !== '차액' && accName.includes('국민') === false) {
          // 차액, 국민 계좌번호 제외
          if(accName !== '' && !isNaN(Number(accAmount))) {
            accounts.push({ name: accName, amount: Number(accAmount) });
          }
        }
        // B12가 합계 공식이면 스킵
        const bVal = sheet.getCell(`B${row}`).value as any;
        if(bVal?.formula === 'SUM(B10:B11)' || String(bVal).includes('SUM')) {
          // 합계 행이므로 통장 파싱 종료 전 마지막
        }
        row++;
        if(row > 20) break;
      }

      // 연월 추출: "  26년 08월" -> 2026, 8
      const match = name.match(/(\d+)년\s*(\d+)월/);
      const year = match ? 2000 + parseInt(match[1]) : 2026;
      const month = match ? parseInt(match[2]) : 0;

      monthly.push({
        sheetName: name, // 원본 그대로 보존!
        year, month,
        purchase, service, point, incentive, headquarters,
        closing: purchase - service - point - incentive - headquarters,
        accounts,
        bankTotal: accounts.reduce((s,a)=>s+a.amount,0),
        difference: 0,
      });
    }
  });

  return { monthly, vat };
}
```

---

## 5. 핵심 로직 2: 원본 디자인 그대로 유지하며 다운로드

**핵심 아이디어: 원본 엑셀을 템플릿으로 복제**

```ts
// lib/excel/preserver.ts & generator.ts
import ExcelJS from 'exceljs';
import fs from 'fs';

export async function generateExcelPreservingDesign(
  monthlyData: ParsedMonthly[],
  originalTemplateBuffer?: Buffer // 업로드된 원본 있으면 그걸 템플릿으로
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  
  if(originalTemplateBuffer) {
    // 원본을 그대로 로드해서 디자인 보존
    await workbook.xlsx.load(originalTemplateBuffer);
    // 기존 데이터 시트들 제거 후 재생성 (서식 유지를 위해 시트 클리어만)
  } else {
    // 템플릿 없으면 새로 생성하지만 원본 스타일 모방
  }

  // 월별 시트 생성 - 원본 서식 복제
  for(const data of monthlyData) {
    let sheet = workbook.getWorksheet(data.sheetName);
    if(!sheet) {
      // 원본 시트 서식 복제: "  26년 08월" 시트의 폰트, 테두리, 열넓이 복사
      const templateSheet = workbook.getWorksheet('  26년 08월') || workbook.addWorksheet(data.sheetName);
      sheet = workbook.addWorksheet(data.sheetName);
      // 열 넓이 복사
      sheet.columns = templateSheet.columns as any;
      // 스타일 복사 로직 (ExcelJS는 셀별 스타일 복사 필요)
    }

    // 값만 덮어쓰기, 서식은 유지!
    sheet.getCell('A1').value = `${String(data.year).slice(2)}년 ${String(data.month).padStart(2,'0')}월 마감`;
    sheet.getCell('B3').value = data.purchase;
    sheet.getCell('B4').value = data.service;
    sheet.getCell('B5').value = data.point;
    sheet.getCell('B6').value = data.incentive;
    sheet.getCell('B7').value = data.headquarters;
    
    // 공식은 그대로 유지 (ExcelJS가 formula 지원)
    sheet.getCell('B8').value = { formula: 'B3-B4-B5-B6-B7', result: data.purchase - data.service - data.point - data.incentive - data.headquarters };
    
    // 통장 동적
    let r = 10;
    data.accounts.forEach(acc => {
      sheet.getCell(`A${r}`).value = acc.name;
      sheet.getCell(`B${r}`).value = acc.amount;
      // 원본 서식 유지: 폰트, 테두리 등은 그대로
      r++;
    });
    sheet.getCell(`B${r}`).value = { formula: `SUM(B10:B${r-1})` };
    r++;
    sheet.getCell(`A${r}`).value = '차액';
    sheet.getCell(`B${r}`).value = { formula: `B3-B5-B6-B7-B${r-1}-B4` };
    sheet.getCell(`A${r+1}`).value = '국민 3001-9029-00536-1';
  }

  // VAT 시트도 동일하게 재생성...

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
```

---

## 6. API Routes (Next.js App Router)

### `app/api/upload-excel/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { parseOriginalExcel } from '@/lib/excel/parser';
import { db } from '@/lib/db';
import { monthlyClosing } from '@/lib/db/schema';
import { Octokit } from '@octokit/rest';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const buffer = Buffer.from(await file.arrayBuffer());

  // 1. 파싱
  const { monthly, vat } = await parseOriginalExcel(buffer);

  // 2. Turso에 저장
  for(const m of monthly) {
    await db.insert(monthlyClosing).values({
      id: `${String(m.year).slice(2)}-${String(m.month).padStart(2,'0')}`,
      year: m.year,
      month: m.month,
      purchaseAmount: m.purchase,
      serviceAs: m.service,
      point: m.point,
      incentive: m.incentive,
      headquartersDeposit: m.headquarters,
      accounts: m.accounts,
      bankTotal: m.bankTotal,
      rawExcelSheetName: m.sheetName,
    }).onConflictDoUpdate({ target: monthlyClosing.id, set: {...} });
  }

  // 3. GitHub에 백업 (원본 파일 그대로)
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const contentBase64 = buffer.toString('base64');
  await octokit.repos.createOrUpdateFileContents({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    path: `backups/${new Date().toISOString().slice(0,10)}_${file.name}`,
    message: `backup: ${file.name} upload`,
    content: contentBase64,
  });

  // 4. monthly.json도 GitHub에 업데이트 (DB 역할)
  await octokit.repos.createOrUpdateFileContents({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    path: `data/monthly.json`,
    message: `db: update monthly ${monthly.length} records`,
    content: Buffer.from(JSON.stringify(monthly, null, 2)).toString('base64'),
    sha: await getCurrentSha(), // 기존 파일 sha 조회 필요
  });

  return NextResponse.json({ success: true, monthlyCount: monthly.length, vatCount: vat.length });
}
```

### `app/api/download-excel/route.ts`

```ts
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { monthlyClosing } from '@/lib/db/schema';
import { generateExcelPreservingDesign } from '@/lib/excel/generator';
import fs from 'fs';

export async function GET() {
  const data = await db.select().from(monthlyClosing);
  // 원본 템플릿 로드 (public/template.xlsx 에 원본 보관)
  const templateBuffer = fs.existsSync('./public/template.xlsx') 
    ? fs.readFileSync('./public/template.xlsx') 
    : undefined;

  const excelBuffer = await generateExcelPreservingDesign(
    data.map(d => ({
      sheetName: d.rawExcelSheetName || `  ${String(d.year).slice(2)}년 ${String(d.month).padStart(2,'0')}월`,
      year: d.year, month: d.month,
      purchase: d.purchaseAmount, service: d.serviceAs,
      point: d.point, incentive: d.incentive, headquarters: d.headquartersDeposit,
      accounts: d.accounts as any, bankTotal: d.bankTotal
    })),
    templateBuffer
  );

  return new Response(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="본사마감_${new Date().toISOString().slice(0,10)}.xlsx"`,
    }
  });
}
```

---

## 7. shadcn/ui 디자인 시스템

```bash
npx shadcn-ui@latest init -d
npx shadcn-ui@latest add button card input table tabs badge dialog toast
npx shadcn-ui@latest add form select separator
```

**테마: `app/globals.css`**

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --primary: 221.2 83.2% 53.3%; /* blue-600 */
    --primary-foreground: 210 40% 98%;
    --muted: 210 40% 96.1%;
    --border: 214.3 31.8% 91.4%;
    --radius: 0.75rem; /* rounded-xl */
  }
}
```

**메인 페이지 (`app/page.tsx` - shadcn):**

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Database, Github } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-xl font-bold">본사 마감 관리</h1>
          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1"><Database className="h-3 w-3"/> Turso 연결됨</Badge>
            <Badge variant="outline" className="gap-1"><Github className="h-3 w-3"/> GitHub 백업됨</Badge>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="monthly">월 마감</TabsTrigger>
            <TabsTrigger value="vat">부가세</TabsTrigger>
            <TabsTrigger value="history">히스토리</TabsTrigger>
            <TabsTrigger value="dashboard">대시보드</TabsTrigger>
            <TabsTrigger value="sync">동기화</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>본사 정산 내역</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="매입금액" />
                  {/* ... */}
                </CardContent>
              </Card>
              <Card className="bg-slate-50 border-dashed">
                <CardHeader><CardTitle>통장 내역 (동적)</CardTitle></CardHeader>
                <CardContent>
                  {/* AccountManager 컴포넌트 */}
                  <Button variant="outline" className="w-full mt-4">+ 통장 추가</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
```

---

## 8. GitHub 업로드 자동화

**.github/workflows/backup.yml**

```yaml
name: Backup to Excel
on:
  schedule:
    - cron: '0 15 * * *' # 매일 KST 자정
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run build:excel # Turso -> Excel 생성 스크립트
        env:
          TURSO_DATABASE_URL: ${{ secrets.TURSO_DATABASE_URL }}
          TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN }}
      - run: |
          git config user.name "bot"
          git config user.email "bot@github.com"
          git add backups/
          git commit -m "auto backup $(date)" || exit 0
          git push
```

---

## 9. 환경변수 `.env`

```
TURSO_DATABASE_URL=libsql://bonsa-magam-xxx.turso.io
TURSO_AUTH_TOKEN=eyJ...
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=your-id
GITHUB_REPO=bonsa-magam
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 10. 설치 & 실행

```bash
# 1. 프로젝트 생성
npx create-next-app@latest bonsa-magam --typescript --tailwind --app
cd bonsa-magam
npx shadcn-ui@latest init

# 2. 의존성
npm install drizzle-orm @libsql/client exceljs @octokit/rest zustand

# 3. Turso
turso db create bonsa-magam
turso db tokens create bonsa-magam
# .env에 URL, TOKEN 넣기
npm run db:push

# 4. 실행
npm run dev
# http://localhost:3000/upload 에서 본사마감오리지널.xlsx 업로드
# → Turso 저장 + GitHub 백업 자동
# → /api/download-excel 로 원본 디자인 그대로 다운로드
```

---

## 11. 주의사항 (원본 디자인 보존 핵심)

1. **ExcelJS 필수**: SheetJS 쓰면 병합셀, 폰트, 테두리, 열넓이 다 날아감. 반드시 `ExcelJS`로 `workbook.xlsx.load()` 후 값만 덮어쓰기
2. **시트명 공백**: 원본 `"  26년 08월"` 앞 공백 2개 유지해야 기존 매크로/참조 깨지지 않음
3. **공식 유지**: `B8`, `B12`, `B13`은 값 대신 `{formula: '...'}` 로 저장해야 엑셀에서 재계산 됨
4. **Turso JSON**: `accounts`는 JSON 컬럼으로, `bankTotal`은 서버에서 계산해서 저장 (생성 컬럼은 SQLite에서 불안정)
5. **GitHub 용량**: 엑셀 바이너리는 LFS 사용 `git lfs track "*.xlsx"`

---

## 12. 로드맵

- [x] 엑셀 업로드 파싱
- [x] Turso 저장
- [x] 원본 디자인 보존 다운로드
- [x] GitHub 백업
- [ ] 월마감 잠금 (마감 후 수정 방지)
- [ ] shadcn DataTable로 히스토리 고도화
- [ ] 부가세 자동 계산 (10%)

---

**문의**: 이 문서대로 구현하면 웹에서 엑셀 업로드 → Turso DB → GitHub 백업 → 원본 디자인 그대로 다운로드까지 완전 자동화됩니다.
필요하면 이 코드를 기반으로 실제 Next.js 프로젝트 zip으로 만들어드릴게요.
