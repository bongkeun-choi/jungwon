import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export interface AccountItem {
  name: string;
  amount: number;
}

export interface VatSalesItem {
  m: number;
  tax: number;
  card: number;
}

export interface VatPurchaseItem {
  m: number;
  tax: number;
}

export const monthlyClosing = sqliteTable('monthly_closing', {
  id: text('id').primaryKey(), // 예: "26-08"
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  purchaseAmount: integer('purchase_amount').notNull().default(0), // 매입금액 B3
  serviceAs: integer('service_as').notNull().default(0), // B4
  point: integer('point').notNull().default(0), // B5
  incentive: integer('incentive').notNull().default(0), // B6
  headquartersDeposit: integer('headquarters_deposit').notNull().default(0), // 본사입금 B7
  closingAmount: integer('closing_amount').notNull().default(0), // B8: purchase - service - point - incentive - headquarters
  accounts: text('accounts', { mode: 'json' }).$type<AccountItem[]>().notNull().default(sql`'[]'`),
  bankTotal: integer('bank_total').notNull().default(0), // 통장 합계
  difference: integer('difference').notNull().default(0), // closingAmount - bankTotal (차액)
  rawExcelSheetName: text('raw_excel_sheet_name'), // "  26년 08월" 원본 시트명
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const vatQuarterly = sqliteTable('vat_quarterly', {
  id: text('id').primaryKey(), // 예: "26-2"
  year: integer('year').notNull(),
  quarter: integer('quarter').notNull(), // 1~4
  title: text('title').notNull(), // "26년 2분기(4~6월) 부가세 신고"
  salesData: text('sales_data', { mode: 'json' }).$type<VatSalesItem[]>().notNull().default(sql`'[]'`),
  purchaseData: text('purchase_data', { mode: 'json' }).$type<VatPurchaseItem[]>().notNull().default(sql`'[]'`),
  salesTaxTotal: integer('sales_tax_total').default(0),
  salesCardTotal: integer('sales_card_total').default(0),
  salesTotal: integer('sales_total').default(0),
  purchaseTotal: integer('purchase_total').default(0),
  difference: integer('difference').default(0),
  rawSheetName: text('raw_sheet_name'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const excelBackups = sqliteTable('excel_backups', {
  id: text('id').primaryKey(),
  fileName: text('file_name').notNull(),
  githubUrl: text('github_url'),
  githubSha: text('github_sha'),
  uploadType: text('upload_type').notNull(), // 'upload' | 'auto_backup' | 'download'
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});
