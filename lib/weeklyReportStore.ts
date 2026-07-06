import { query } from "./db";
import { WeeklyReportKpis } from "./analyze";

let schemaReady: Promise<void> | null = null;

/**
 * weekly_reports テーブルが存在しなければ作成する（初回アクセス時に1回だけ実行）
 */
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = query(`
      CREATE TABLE IF NOT EXISTS weekly_reports (
        id SERIAL PRIMARY KEY,
        week_start DATE NOT NULL,
        week_end DATE NOT NULL,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        total_guest_count INTEGER NOT NULL,
        party_count INTEGER NOT NULL,
        course_party_count INTEGER NOT NULL,
        lunch_sales NUMERIC NOT NULL,
        dinner_sales NUMERIC NOT NULL,
        food_unit_price NUMERIC NOT NULL,
        course_count INTEGER NOT NULL,
        course_rate NUMERIC NOT NULL,
        ppjc_total INTEGER NOT NULL,
        ppjc_rate NUMERIC NOT NULL,
        osusume_count INTEGER NOT NULL,
        osusume_rate NUMERIC NOT NULL,
        avg_dish_count NUMERIC NOT NULL,
        dish_unit_price NUMERIC NOT NULL,
        drink_unit_price NUMERIC NOT NULL,
        craft_beer_count INTEGER NOT NULL,
        craft_beer_rate NUMERIC NOT NULL,
        nomihodai_count INTEGER NOT NULL,
        nomihodai_rate NUMERIC NOT NULL,
        nomihodai_drink_unit_price NUMERIC NOT NULL,
        alacarte_drink_avg_count NUMERIC NOT NULL,
        alacarte_drink_unit_price NUMERIC NOT NULL,
        UNIQUE (week_start, week_end)
      );
    `).then(() => undefined);
  }
  return schemaReady;
}

export interface WeeklyReportRecord extends WeeklyReportKpis {
  id: number;
  weekStart: string; // "YYYY-MM-DD"
  weekEnd: string; // "YYYY-MM-DD"
  uploadedAt: string;
}

interface WeeklyReportRow {
  id: number;
  week_start: string;
  week_end: string;
  uploaded_at: string;
  total_guest_count: number;
  party_count: number;
  course_party_count: number;
  lunch_sales: string;
  dinner_sales: string;
  food_unit_price: string;
  course_count: number;
  course_rate: string;
  ppjc_total: number;
  ppjc_rate: string;
  osusume_count: number;
  osusume_rate: string;
  avg_dish_count: string;
  dish_unit_price: string;
  drink_unit_price: string;
  craft_beer_count: number;
  craft_beer_rate: string;
  nomihodai_count: number;
  nomihodai_rate: string;
  nomihodai_drink_unit_price: string;
  alacarte_drink_avg_count: string;
  alacarte_drink_unit_price: string;
}

function toRecord(row: WeeklyReportRow): WeeklyReportRecord {
  return {
    id: row.id,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    uploadedAt: row.uploaded_at,
    totalGuestCount: row.total_guest_count,
    partyCount: row.party_count,
    coursePartyCount: row.course_party_count,
    lunchSales: Number(row.lunch_sales),
    dinnerSales: Number(row.dinner_sales),
    foodUnitPrice: Number(row.food_unit_price),
    courseCount: row.course_count,
    courseRate: Number(row.course_rate),
    ppjcTotal: row.ppjc_total,
    ppjcRate: Number(row.ppjc_rate),
    osusumeCount: row.osusume_count,
    osusumeRate: Number(row.osusume_rate),
    avgDishCount: Number(row.avg_dish_count),
    dishUnitPrice: Number(row.dish_unit_price),
    drinkUnitPrice: Number(row.drink_unit_price),
    craftBeerCount: row.craft_beer_count,
    craftBeerRate: Number(row.craft_beer_rate),
    nomihodaiCount: row.nomihodai_count,
    nomihodaiRate: Number(row.nomihodai_rate),
    nomihodaiDrinkUnitPrice: Number(row.nomihodai_drink_unit_price),
    alacarteDrinkAvgCount: Number(row.alacarte_drink_avg_count),
    alacarteDrinkUnitPrice: Number(row.alacarte_drink_unit_price),
  };
}

/**
 * 週次レポートを保存する。同じ週（week_start, week_end）が既にあれば上書きする
 */
export async function upsertWeeklyReport(
  weekStart: string,
  weekEnd: string,
  kpis: WeeklyReportKpis
): Promise<WeeklyReportRecord> {
  await ensureSchema();

  const rows = await query<WeeklyReportRow>(
    `
    INSERT INTO weekly_reports (
      week_start, week_end,
      total_guest_count, party_count, course_party_count,
      lunch_sales, dinner_sales, food_unit_price,
      course_count, course_rate,
      ppjc_total, ppjc_rate,
      osusume_count, osusume_rate,
      avg_dish_count, dish_unit_price,
      drink_unit_price,
      craft_beer_count, craft_beer_rate,
      nomihodai_count, nomihodai_rate, nomihodai_drink_unit_price,
      alacarte_drink_avg_count, alacarte_drink_unit_price
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
    )
    ON CONFLICT (week_start, week_end) DO UPDATE SET
      uploaded_at = now(),
      total_guest_count = EXCLUDED.total_guest_count,
      party_count = EXCLUDED.party_count,
      course_party_count = EXCLUDED.course_party_count,
      lunch_sales = EXCLUDED.lunch_sales,
      dinner_sales = EXCLUDED.dinner_sales,
      food_unit_price = EXCLUDED.food_unit_price,
      course_count = EXCLUDED.course_count,
      course_rate = EXCLUDED.course_rate,
      ppjc_total = EXCLUDED.ppjc_total,
      ppjc_rate = EXCLUDED.ppjc_rate,
      osusume_count = EXCLUDED.osusume_count,
      osusume_rate = EXCLUDED.osusume_rate,
      avg_dish_count = EXCLUDED.avg_dish_count,
      dish_unit_price = EXCLUDED.dish_unit_price,
      drink_unit_price = EXCLUDED.drink_unit_price,
      craft_beer_count = EXCLUDED.craft_beer_count,
      craft_beer_rate = EXCLUDED.craft_beer_rate,
      nomihodai_count = EXCLUDED.nomihodai_count,
      nomihodai_rate = EXCLUDED.nomihodai_rate,
      nomihodai_drink_unit_price = EXCLUDED.nomihodai_drink_unit_price,
      alacarte_drink_avg_count = EXCLUDED.alacarte_drink_avg_count,
      alacarte_drink_unit_price = EXCLUDED.alacarte_drink_unit_price
    RETURNING *;
    `,
    [
      weekStart,
      weekEnd,
      kpis.totalGuestCount,
      kpis.partyCount,
      kpis.coursePartyCount,
      kpis.lunchSales,
      kpis.dinnerSales,
      kpis.foodUnitPrice,
      kpis.courseCount,
      kpis.courseRate,
      kpis.ppjcTotal,
      kpis.ppjcRate,
      kpis.osusumeCount,
      kpis.osusumeRate,
      kpis.avgDishCount,
      kpis.dishUnitPrice,
      kpis.drinkUnitPrice,
      kpis.craftBeerCount,
      kpis.craftBeerRate,
      kpis.nomihodaiCount,
      kpis.nomihodaiRate,
      kpis.nomihodaiDrinkUnitPrice,
      kpis.alacarteDrinkAvgCount,
      kpis.alacarteDrinkUnitPrice,
    ]
  );

  return toRecord(rows[0]);
}

/**
 * 保存済みの週次レポートを、週の開始日が新しい順に一覧取得する
 */
export async function listWeeklyReports(): Promise<WeeklyReportRecord[]> {
  await ensureSchema();

  const rows = await query<WeeklyReportRow>(
    `SELECT * FROM weekly_reports ORDER BY week_start DESC;`
  );

  return rows.map(toRecord);
}
