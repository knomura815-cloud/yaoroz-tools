import { OrderRow, ProductCategory } from "./types";

// ★なしでもドリンクに分類するキーワード
const DRINK_KEYWORDS = [
  "IPA",
  "エール",
  "ヴァイツェン",
  "ピルスナー",
  "アルト",
  "スタウト",
  "ラガー",
  "日本酒",
  "酒",
  "ハイボール",
  "サワー",
  "ワイン",
  "梅",
  "みかん",
  "もも",
  "ほうじ茶",
  "ウーロン",
  "ジュース",
  "コーラ",
  "ソーダ",
  "お茶",
  "風の森",
  "寫楽",
  "八海山",
  "PPJC",
  "あたごの松",
];

/**
 * 商品名から商品カテゴリを判定する
 * - ★で始まる → ドリンク
 * - ①〜⑨で始まる → コース
 * - 「飲み放題」を含む → 飲み放題
 * - 「お通し」と完全一致 → お通し
 * - ドリンクのキーワードを含む → ドリンク
 * - それ以外 → フード
 */
export function categorizeProduct(productName: string): ProductCategory {
  const name = productName.trim();

  if (name.startsWith("★")) return "ドリンク";
  if (/^[①②③④⑤⑥⑦⑧⑨]/.test(name)) return "コース";
  if (name.includes("飲み放題")) return "飲み放題";
  if (name === "お通し") return "お通し";
  if (DRINK_KEYWORDS.some((keyword) => name.includes(keyword)))
    return "ドリンク";

  return "フード";
}

/**
 * "2026/05/01 17:02:48" 形式の文字列をDateに変換する
 */
function parseDateTime(value: string): Date | null {
  const match = value.match(
    /^(\d{4})\/(\d{1,2})\/(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/
  );
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match.map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
}

export interface Receipt {
  receiptIssuedAt: string; // H.伝票発行日
  date: string; // 営業日 (例: "2026/05/01")
  dayOfWeek: string; // 曜日
  guestCount: number; // 客数（合計）
  subtotal: number; // 小計
  entryHour: number; // 入店時間帯（時）
  lastOrderedAt: string; // 最終オーダー日時
  stayMinutes: number; // 滞在時間（分）
}

/**
 * オーダー明細を伝票（H.伝票発行日が同じ行）ごとに集約する
 */
export function getReceipts(rows: OrderRow[]): Receipt[] {
  const map = new Map<string, Receipt>();

  for (const row of rows) {
    let receipt = map.get(row.receiptIssuedAt);

    if (!receipt) {
      const issuedAt = parseDateTime(row.receiptIssuedAt);

      receipt = {
        receiptIssuedAt: row.receiptIssuedAt,
        date: row.receiptIssuedAt.split(" ")[0] ?? "",
        dayOfWeek: row.dayOfWeek,
        guestCount: row.guestCount,
        subtotal: row.subtotal,
        entryHour: issuedAt ? issuedAt.getHours() : 0,
        lastOrderedAt: row.orderedAt,
        stayMinutes: 0,
      };
      map.set(row.receiptIssuedAt, receipt);
    }

    if (row.orderedAt > receipt.lastOrderedAt) {
      receipt.lastOrderedAt = row.orderedAt;
    }
  }

  for (const receipt of map.values()) {
    const issuedAt = parseDateTime(receipt.receiptIssuedAt);
    const lastOrderedAt = parseDateTime(receipt.lastOrderedAt);

    if (issuedAt && lastOrderedAt) {
      const diffMs = lastOrderedAt.getTime() - issuedAt.getTime();
      receipt.stayMinutes = Math.max(0, Math.round(diffMs / 60000));
    }
  }

  return Array.from(map.values());
}

export interface CategorySales {
  category: ProductCategory;
  sales: number;
  quantity: number;
}

/**
 * オーダー明細を商品カテゴリごとに集計する
 */
export function getCategorySales(rows: OrderRow[]): CategorySales[] {
  const map = new Map<ProductCategory, CategorySales>();

  for (const row of rows) {
    const entry = map.get(row.category) ?? {
      category: row.category,
      sales: 0,
      quantity: 0,
    };

    entry.sales += row.price;
    entry.quantity += 1;

    map.set(row.category, entry);
  }

  return Array.from(map.values()).sort((a, b) => b.sales - a.sales);
}

export interface ProductSales {
  productName: string;
  category: ProductCategory;
  sales: number;
  quantity: number;
}

/**
 * オーダー明細を商品ごとに集計し、売上上位を返す
 */
export function getTopProducts(rows: OrderRow[], limit = 10): ProductSales[] {
  const map = new Map<string, ProductSales>();

  for (const row of rows) {
    const entry = map.get(row.productName) ?? {
      productName: row.productName,
      category: row.category,
      sales: 0,
      quantity: 0,
    };

    entry.sales += row.price;
    entry.quantity += 1;

    map.set(row.productName, entry);
  }

  return Array.from(map.values())
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit);
}

// 「20時以降」とみなす時間帯
const LATE_NIGHT_HOUR = 20;

export interface Kpis {
  totalSales: number;
  averageDailyVisitors: number;
  averageSpendPerVisitor: number;
  lateNightVisitorRate: number; // 20時以降に入店したお客様の割合
  averageStayMinutes: number; // 平均滞在時間（分）
}

/**
 * オーダー明細からKPIをまとめて計算する
 * - 来客数・小計は伝票（H.伝票発行日）ごとに重複除外して集計する
 */
export function computeKpis(rows: OrderRow[]): Kpis {
  const receipts = getReceipts(rows);

  const totalSales = receipts.reduce((sum, r) => sum + r.subtotal, 0);
  const totalVisitors = receipts.reduce((sum, r) => sum + r.guestCount, 0);

  const dateSet = new Set(receipts.map((r) => r.date));
  const averageDailyVisitors =
    dateSet.size === 0 ? 0 : totalVisitors / dateSet.size;

  const averageSpendPerVisitor =
    totalVisitors === 0 ? 0 : totalSales / totalVisitors;

  const lateNightVisitors = receipts
    .filter((r) => r.entryHour >= LATE_NIGHT_HOUR)
    .reduce((sum, r) => sum + r.guestCount, 0);
  const lateNightVisitorRate =
    totalVisitors === 0 ? 0 : lateNightVisitors / totalVisitors;

  const averageStayMinutes =
    receipts.length === 0
      ? 0
      : receipts.reduce((sum, r) => sum + r.stayMinutes, 0) / receipts.length;

  return {
    totalSales,
    averageDailyVisitors,
    averageSpendPerVisitor,
    lateNightVisitorRate,
    averageStayMinutes,
  };
}

// 平日/休日判定で「土日」とみなす曜日
const WEEKEND_DAYS = new Set(["土", "日"]);

export function isWeekend(dayOfWeek: string): boolean {
  return WEEKEND_DAYS.has(dayOfWeek);
}

/**
 * 「20時以降」とみなす時間帯（深夜0時〜4時台も含む）
 */
export function isLateNightHour(hour: number): boolean {
  return hour >= 20 || hour < 5;
}

// 入店時間帯の表示順（12時〜22時）
export const ENTRY_HOURS = [
  12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
] as const;

export function formatHourLabel(hour: number): string {
  return `${hour}時`;
}

export interface HourlyVisitorPoint {
  hour: number;
  weekday: number;
  weekend: number;
}

/**
 * 入店時間帯別の来客数を平日/土日で集計する
 */
export function getHourlyVisitors(rows: OrderRow[]): HourlyVisitorPoint[] {
  const receipts = getReceipts(rows);

  return ENTRY_HOURS.map((hour) => {
    let weekday = 0;
    let weekend = 0;

    for (const receipt of receipts) {
      if (receipt.entryHour !== hour) continue;
      if (isWeekend(receipt.dayOfWeek)) {
        weekend += receipt.guestCount;
      } else {
        weekday += receipt.guestCount;
      }
    }

    return { hour, weekday, weekend };
  });
}

export interface RetentionPoint {
  hour: number;
  rate: number; // 0〜1
  totalGuests: number;
}

/**
 * 入店時間帯別「20時以降も在席していた割合」を集計する
 */
export function getEntryRetentionRate(rows: OrderRow[]): RetentionPoint[] {
  const receipts = getReceipts(rows);

  return ENTRY_HOURS.map((hour) => {
    let totalGuests = 0;
    let lateGuests = 0;

    for (const receipt of receipts) {
      if (receipt.entryHour !== hour) continue;

      totalGuests += receipt.guestCount;

      const lastOrderedAt = parseDateTime(receipt.lastOrderedAt);
      if (lastOrderedAt && isLateNightHour(lastOrderedAt.getHours())) {
        lateGuests += receipt.guestCount;
      }
    }

    return {
      hour,
      rate: totalGuests === 0 ? 0 : lateGuests / totalGuests,
      totalGuests,
    };
  });
}

// 滞在時間帯の区分
const DWELL_BUCKETS = [
  { label: "30分以内", max: 30 },
  { label: "〜60分", max: 60 },
  { label: "〜90分", max: 90 },
  { label: "〜120分", max: 120 },
  { label: "〜150分", max: 150 },
  { label: "〜180分", max: 180 },
  { label: "180分超", max: Infinity },
] as const;

function getDwellBucketLabel(stayMinutes: number): string {
  for (const bucket of DWELL_BUCKETS) {
    if (stayMinutes <= bucket.max) return bucket.label;
  }
  return DWELL_BUCKETS[DWELL_BUCKETS.length - 1].label;
}

export interface DwellUnitPricePoint {
  label: string;
  unitPrice: number;
  orderCount: number;
}

/**
 * 滞在時間帯別の客単価と注文件数を集計する
 */
export function getDwellUnitPrice(rows: OrderRow[]): DwellUnitPricePoint[] {
  const receipts = getReceipts(rows);

  const bucketByReceipt = new Map<string, string>();
  const sales = new Map<string, number>();
  const guests = new Map<string, number>();
  const orderCounts = new Map<string, number>();

  for (const bucket of DWELL_BUCKETS) {
    sales.set(bucket.label, 0);
    guests.set(bucket.label, 0);
    orderCounts.set(bucket.label, 0);
  }

  for (const receipt of receipts) {
    const label = getDwellBucketLabel(receipt.stayMinutes);
    bucketByReceipt.set(receipt.receiptIssuedAt, label);
    sales.set(label, (sales.get(label) ?? 0) + receipt.subtotal);
    guests.set(label, (guests.get(label) ?? 0) + receipt.guestCount);
  }

  for (const row of rows) {
    const label = bucketByReceipt.get(row.receiptIssuedAt);
    if (!label) continue;
    orderCounts.set(label, (orderCounts.get(label) ?? 0) + 1);
  }

  return DWELL_BUCKETS.map((bucket) => {
    const totalSales = sales.get(bucket.label) ?? 0;
    const totalGuests = guests.get(bucket.label) ?? 0;

    return {
      label: bucket.label,
      unitPrice: totalGuests === 0 ? 0 : totalSales / totalGuests,
      orderCount: orderCounts.get(bucket.label) ?? 0,
    };
  });
}

export interface MonthlyTrendPoint {
  month: string; // "2026/05"
  unitPrice: number;
  lateNightRate: number; // 0〜1
}

/**
 * 月別の客単価と20時以降在席率を集計する
 */
export function getMonthlyTrend(rows: OrderRow[]): MonthlyTrendPoint[] {
  const receipts = getReceipts(rows);

  const map = new Map<
    string,
    { sales: number; guests: number; lateGuests: number }
  >();

  for (const receipt of receipts) {
    const month = receipt.date.slice(0, 7);
    const entry = map.get(month) ?? { sales: 0, guests: 0, lateGuests: 0 };

    entry.sales += receipt.subtotal;
    entry.guests += receipt.guestCount;
    if (isLateNightHour(receipt.entryHour)) {
      entry.lateGuests += receipt.guestCount;
    }

    map.set(month, entry);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, entry]) => ({
      month,
      unitPrice: entry.guests === 0 ? 0 : entry.sales / entry.guests,
      lateNightRate: entry.guests === 0 ? 0 : entry.lateGuests / entry.guests,
    }));
}

// 曜日の表示順
export const DAYS_OF_WEEK = ["月", "火", "水", "木", "金", "土", "日"] as const;

export interface HeatmapCell {
  dayOfWeek: string;
  month: string;
  rate: number; // 0〜1
  totalGuests: number;
}

/**
 * 曜日×月の20時以降在席率を集計する
 */
export function getDayMonthHeatmap(rows: OrderRow[]): {
  months: string[];
  cells: HeatmapCell[][];
} {
  const receipts = getReceipts(rows);

  const months = Array.from(
    new Set(receipts.map((r) => r.date.slice(0, 7)))
  ).sort((a, b) => a.localeCompare(b));

  const map = new Map<string, { guests: number; lateGuests: number }>();

  for (const receipt of receipts) {
    const month = receipt.date.slice(0, 7);
    const key = `${receipt.dayOfWeek}_${month}`;
    const entry = map.get(key) ?? { guests: 0, lateGuests: 0 };

    entry.guests += receipt.guestCount;
    if (isLateNightHour(receipt.entryHour)) {
      entry.lateGuests += receipt.guestCount;
    }

    map.set(key, entry);
  }

  const cells = DAYS_OF_WEEK.map((dayOfWeek) =>
    months.map((month) => {
      const entry = map.get(`${dayOfWeek}_${month}`);
      const guests = entry?.guests ?? 0;
      const lateGuests = entry?.lateGuests ?? 0;

      return {
        dayOfWeek,
        month,
        rate: guests === 0 ? 0 : lateGuests / guests,
        totalGuests: guests,
      };
    })
  );

  return { months, cells };
}

// ランチ／ディナーの切り替え時刻（17時以降はディナー）
const LUNCH_DINNER_CUTOFF_HOUR = 17;

// CSV上の金額はすべて税込のため、税抜換算に使う税率
const TAX_RATE = 1.1;

export interface WeeklyReportKpis {
  lunchSales: number; // 1. 売上高（ランチ）
  dinnerSales: number; // 2. 売上高（ディナー）
  foodUnitPrice: number; // 3. フード単価
  courseCount: number; // 4. コース件数
  courseRate: number; // コース比率（コース件数÷総客数）
  ppjcTotal: number; // 5. PPJC合計数
  ppjcRate: number; // 6. PPJC受注比率
  osusumeCount: number; // 7. おすすめ出数
  osusumeRate: number; // 8. おすすめ比率
  avgDishCount: number; // 9. 平均皿数
  dishUnitPrice: number; // 10. 皿単価
  drinkUnitPrice: number; // 11. ドリンク単価
  craftBeerCount: number; // 12. クラフトビール杯数
  craftBeerRate: number; // 13. クラフトビール比率
  nomihodaiCount: number; // 14. 飲み放題獲得件数
  nomihodaiRate: number; // 15. 飲み放題比率
  nomihodaiDrinkUnitPrice: number; // 16. 飲み放題ドリンク単価
  alacarteDrinkAvgCount: number; // 17. アラカルト平均ドリンク杯数
  alacarteDrinkUnitPrice: number; // 18. アラカルトドリンク単価
  totalGuestCount: number; // 総客数（参考値）
  partyCount: number; // 総組数（参考値、伝票＝テーブル単位の件数）
  coursePartyCount: number; // うちコースを注文した組数（参考値）
}

interface WeeklyReceipt {
  subtotal: number;
  guestCount: number;
  hour: number;
  courseQuantity: number; // その伝票内のコース商品の数量合計（ネット値）
}

/**
 * H.伝票発行日をキーに伝票を重複排除する（週次レポート集計用）
 * - CSVには実際の注文とは別に「価格・数量ともに0のメニュー一覧行」が同じ伝票番号で
 *   紛れ込んでいることがあり、そのH.客数（合計）・H.小計は実際より少ない値（例:1人・0円）
 *   になっている。そのため単純に最初に出てきた行の値を採用せず、同一伝票内の最大値を
 *   採用することで、実際の客数・小計を正しく拾う
 */
function getWeeklyReceipts(rows: OrderRow[]): WeeklyReceipt[] {
  const map = new Map<string, WeeklyReceipt>();

  for (const row of rows) {
    const issuedAt = parseDateTime(row.receiptIssuedAt);
    const existing = map.get(row.receiptIssuedAt);

    if (!existing) {
      map.set(row.receiptIssuedAt, {
        subtotal: row.subtotal,
        guestCount: row.guestCount,
        hour: issuedAt ? issuedAt.getHours() : 0,
        courseQuantity: row.categorySecondary === "コース" ? row.quantity : 0,
      });
    } else {
      existing.subtotal = Math.max(existing.subtotal, row.subtotal);
      existing.guestCount = Math.max(existing.guestCount, row.guestCount);
      if (row.categorySecondary === "コース") {
        existing.courseQuantity += row.quantity;
      }
    }
  }

  return Array.from(map.values());
}

function divide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * 週次業績レポート用の18項目を計算する
 * - 数量はD.数量の合計（プラス・マイナスを合算したネット値）で集計する
 * - 客数・小計は伝票（H.伝票発行日）ごとに重複除外して集計する
 * - 金額はすべて税抜（÷1.1）に変換する
 */
export function computeWeeklyReportKpis(rows: OrderRow[]): WeeklyReportKpis {
  const receipts = getWeeklyReceipts(rows);
  const totalGuestCount = receipts.reduce((sum, r) => sum + r.guestCount, 0);
  const partyCount = receipts.length;
  const coursePartyCount = receipts.filter((r) => r.courseQuantity > 0).length;

  const lunchSales =
    receipts
      .filter((r) => r.hour < LUNCH_DINNER_CUTOFF_HOUR)
      .reduce((sum, r) => sum + r.subtotal, 0) / TAX_RATE;

  const dinnerSales =
    receipts
      .filter((r) => r.hour >= LUNCH_DINNER_CUTOFF_HOUR)
      .reduce((sum, r) => sum + r.subtotal, 0) / TAX_RATE;

  const sumQty = (predicate: (row: OrderRow) => boolean): number =>
    rows.filter(predicate).reduce((sum, r) => sum + r.quantity, 0);

  // 取消行はD.価格・D.数量がともにマイナスで記録されるため、価格は単価の絶対値として
  // 扱い、符号（プラス/マイナス）はD.数量側だけで表現する（そうしないと符号同士が
  // 打ち消し合い、取消のはずが売上に加算されてしまう）
  const sumAmount = (predicate: (row: OrderRow) => boolean): number =>
    rows
      .filter(predicate)
      .reduce((sum, r) => sum + Math.abs(r.price) * r.quantity, 0);

  const isFood = (row: OrderRow) => row.categoryPrimary === "フード";
  const isDrink = (row: OrderRow) => row.categoryPrimary === "ドリンク";
  const isCourse = (row: OrderRow) => row.categorySecondary === "コース";
  const isNomihodaiPlanRow = (row: OrderRow) =>
    row.categorySecondary === "飲み放題" &&
    row.productName.includes("飲み放題") &&
    !row.productName.startsWith("★");

  const foodUnitPrice = divide(
    sumAmount(isFood) / TAX_RATE,
    totalGuestCount
  );

  const courseCount = sumQty(isCourse);
  const courseRate = divide(courseCount, totalGuestCount);

  const ppjcTotal = sumQty((row) => row.productName === "PPJC");
  // PPJC受注比率は客数比ではなく、コースを注文した組を除いた組数比で算出する
  const ppjcRate = divide(ppjcTotal, partyCount - coursePartyCount);

  const osusumeCount = sumQty(
    (row) => row.categorySecondary === "季節のおすすめ"
  );
  const osusumeRate = divide(osusumeCount, totalGuestCount);

  const nonCourseGuests = totalGuestCount - courseCount;
  const isDishRow = (row: OrderRow) => isFood(row) && !isCourse(row);
  const avgDishCount = divide(sumQty(isDishRow), nonCourseGuests);
  // 皿単価は「1皿あたりの平均価格」のため、客数ではなく皿数（数量の合計）で割る
  const dishUnitPrice = divide(
    sumAmount(isDishRow) / TAX_RATE,
    sumQty(isDishRow)
  );

  const drinkUnitPrice = divide(
    sumAmount(isDrink) / TAX_RATE,
    totalGuestCount
  );

  const craftBeerCount = sumQty(
    (row) => row.categorySecondary === "ライディーンビール"
  );
  const craftBeerRate = divide(craftBeerCount, totalGuestCount);

  const nomihodaiCount = sumQty(isNomihodaiPlanRow);
  const nomihodaiRate = divide(nomihodaiCount, totalGuestCount);
  const nomihodaiDrinkUnitPrice = divide(
    sumAmount(isNomihodaiPlanRow) / TAX_RATE,
    nomihodaiCount
  );

  const nonNomihodaiGuests = totalGuestCount - nomihodaiCount;
  const isAlacarteDrinkRow = (row: OrderRow) =>
    isDrink(row) && row.categorySecondary !== "飲み放題";
  const alacarteDrinkAvgCount = divide(
    sumQty(isAlacarteDrinkRow),
    nonNomihodaiGuests
  );
  const alacarteDrinkUnitPrice = divide(
    sumAmount(isAlacarteDrinkRow) / TAX_RATE,
    nonNomihodaiGuests
  );

  return {
    lunchSales,
    dinnerSales,
    foodUnitPrice,
    courseCount,
    courseRate,
    ppjcTotal,
    ppjcRate,
    osusumeCount,
    osusumeRate,
    avgDishCount,
    dishUnitPrice,
    drinkUnitPrice,
    craftBeerCount,
    craftBeerRate,
    nomihodaiCount,
    nomihodaiRate,
    nomihodaiDrinkUnitPrice,
    alacarteDrinkAvgCount,
    alacarteDrinkUnitPrice,
    totalGuestCount,
    partyCount,
    coursePartyCount,
  };
}

export interface WeekRange {
  weekStart: string; // "YYYY-MM-DD"
  weekEnd: string; // "YYYY-MM-DD"
}

function toIsoDate(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/**
 * H.伝票発行日の日付部分の最小・最大からCSV全体の対象期間を求める
 */
export function getWeekRange(rows: OrderRow[]): WeekRange | null {
  let min: string | null = null;
  let max: string | null = null;

  for (const row of rows) {
    const match = row.receiptIssuedAt.match(
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})/
    );
    if (!match) continue;

    const [, year, month, day] = match;
    const iso = toIsoDate(Number(year), Number(month), Number(day));

    if (min === null || iso < min) min = iso;
    if (max === null || iso > max) max = iso;
  }

  if (min === null || max === null) return null;

  return { weekStart: min, weekEnd: max };
}

export interface LateNightTopProducts {
  drinks: ProductSales[];
  foods: ProductSales[];
}

/**
 * 20時以降に入店した伝票内の商品を、ドリンク/フードそれぞれ売上上位順に集計する
 */
export function getLateNightTopProducts(
  rows: OrderRow[],
  limit = 10
): LateNightTopProducts {
  const receipts = getReceipts(rows);
  const lateReceipts = new Set(
    receipts
      .filter((r) => isLateNightHour(r.entryHour))
      .map((r) => r.receiptIssuedAt)
  );

  const lateRows = rows.filter((row) => lateReceipts.has(row.receiptIssuedAt));

  return {
    drinks: getTopProducts(
      lateRows.filter((row) => row.category === "ドリンク"),
      limit
    ),
    foods: getTopProducts(
      lateRows.filter((row) => row.category === "フード"),
      limit
    ),
  };
}
