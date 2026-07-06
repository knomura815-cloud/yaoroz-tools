import { query } from "./db";
import { Kpis } from "./analyze";

let schemaReady: Promise<void> | null = null;

/**
 * sales_reports テーブルが存在しなければ作成する（初回アクセス時に1回だけ実行）
 */
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = query(`
      CREATE TABLE IF NOT EXISTS sales_reports (
        id SERIAL PRIMARY KEY,
        week_start DATE NOT NULL,
        week_end DATE NOT NULL,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        total_sales NUMERIC NOT NULL,
        average_daily_visitors NUMERIC NOT NULL,
        average_spend_per_visitor NUMERIC NOT NULL,
        late_night_visitor_rate NUMERIC NOT NULL,
        average_stay_minutes NUMERIC NOT NULL,
        UNIQUE (week_start, week_end)
      );
    `).then(() => undefined);
  }
  return schemaReady;
}

export interface SalesReportRecord extends Kpis {
  id: number;
  weekStart: string; // "YYYY-MM-DD"
  weekEnd: string; // "YYYY-MM-DD"
  uploadedAt: string;
}

interface SalesReportRow {
  id: number;
  week_start: string;
  week_end: string;
  uploaded_at: string;
  total_sales: string;
  average_daily_visitors: string;
  average_spend_per_visitor: string;
  late_night_visitor_rate: string;
  average_stay_minutes: string;
}

function toRecord(row: SalesReportRow): SalesReportRecord {
  return {
    id: row.id,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    uploadedAt: row.uploaded_at,
    totalSales: Number(row.total_sales),
    averageDailyVisitors: Number(row.average_daily_visitors),
    averageSpendPerVisitor: Number(row.average_spend_per_visitor),
    lateNightVisitorRate: Number(row.late_night_visitor_rate),
    averageStayMinutes: Number(row.average_stay_minutes),
  };
}

/**
 * 売上分析データを保存する。同じ週（week_start, week_end）が既にあれば上書きする
 */
export async function upsertSalesReport(
  weekStart: string,
  weekEnd: string,
  kpis: Kpis
): Promise<SalesReportRecord> {
  await ensureSchema();

  const rows = await query<SalesReportRow>(
    `
    INSERT INTO sales_reports (
      week_start, week_end,
      total_sales, average_daily_visitors, average_spend_per_visitor,
      late_night_visitor_rate, average_stay_minutes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (week_start, week_end) DO UPDATE SET
      uploaded_at = now(),
      total_sales = EXCLUDED.total_sales,
      average_daily_visitors = EXCLUDED.average_daily_visitors,
      average_spend_per_visitor = EXCLUDED.average_spend_per_visitor,
      late_night_visitor_rate = EXCLUDED.late_night_visitor_rate,
      average_stay_minutes = EXCLUDED.average_stay_minutes
    RETURNING *;
    `,
    [
      weekStart,
      weekEnd,
      kpis.totalSales,
      kpis.averageDailyVisitors,
      kpis.averageSpendPerVisitor,
      kpis.lateNightVisitorRate,
      kpis.averageStayMinutes,
    ]
  );

  return toRecord(rows[0]);
}

/**
 * 保存済みの売上分析データを、週の開始日が新しい順に一覧取得する
 */
export async function listSalesReports(): Promise<SalesReportRecord[]> {
  await ensureSchema();

  const rows = await query<SalesReportRow>(
    `SELECT * FROM sales_reports ORDER BY week_start DESC;`
  );

  return rows.map(toRecord);
}
