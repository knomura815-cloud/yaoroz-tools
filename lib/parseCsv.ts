import Papa from "papaparse";
import { categorizeProduct } from "./analyze";
import { OrderRow } from "./types";

const HEADER_MARKER = "D.商品カテゴリ1";

/**
 * 「￥1,234」形式の文字列を数値に変換する
 */
function parseYen(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/[￥¥,]/g, "").trim();
  if (cleaned === "") return 0;
  const num = Number(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

/**
 * カンマ区切りの数値文字列を数値に変換する（マイナス値も許容）
 */
function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, "").trim();
  if (cleaned === "") return 0;
  const num = Number(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

/**
 * 「00000063917:④料理2500プラン」のような商品コードから商品名を取り出す
 */
function extractProductName(value: string): string {
  const trimmed = value.trim();
  const sepIndex = trimmed.indexOf(":");
  return sepIndex === -1 ? trimmed : trimmed.slice(sepIndex + 1);
}

/**
 * POS+の汎用データ出力CSVを解析する
 * - エンコード: CP932 (Shift-JIS), カンマ区切り
 * - 先頭10行は説明文のためスキップ
 * - 「D.商品カテゴリ1」を含む行をヘッダー行として扱う
 */
export function parseOrderCsv(buffer: ArrayBuffer): OrderRow[] {
  const text = new TextDecoder("shift_jis").decode(buffer);
  const lines = text.split(/\r\n|\r|\n/).slice(10);

  const headerOffset = lines.findIndex((line) => line.includes(HEADER_MARKER));
  if (headerOffset === -1) {
    throw new Error(
      "ヘッダー行（D.商品カテゴリ1を含む行）が見つかりませんでした。"
    );
  }

  const csvText = lines.slice(headerOffset).join("\n");

  const result = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
  });

  const [header, ...dataRows] = result.data;

  const idxCategoryPrimary = header.indexOf("D.商品カテゴリ1");
  const idxCategorySecondary = header.indexOf("D.商品カテゴリ2");
  const idxStore = header.indexOf("H.店舗");
  const idxBusinessDate = header.indexOf("H.集計営業日");
  const idxDayOfWeek = header.indexOf("H.曜日");
  const idxIssuedAt = header.indexOf("H.伝票発行日");
  const idxGuestCount = header.indexOf("H.客数（合計）");
  const idxSubtotal = header.indexOf("H.小計");
  const idxOrderedAt = header.indexOf("D.オーダー日時");
  const idxProduct = header.indexOf("D.商品");
  const idxPrice = header.indexOf("D.価格");
  const idxQuantity = header.indexOf("D.数量");

  const rows: OrderRow[] = [];

  for (const fields of dataRows) {
    if (fields.length < header.length) continue;

    const productName = extractProductName(fields[idxProduct] ?? "");

    rows.push({
      categoryPrimary: (fields[idxCategoryPrimary] ?? "").trim(),
      categorySecondary: (fields[idxCategorySecondary] ?? "").trim(),
      store: (fields[idxStore] ?? "").trim(),
      businessDate: (fields[idxBusinessDate] ?? "").trim(),
      dayOfWeek: (fields[idxDayOfWeek] ?? "").trim(),
      receiptIssuedAt: (fields[idxIssuedAt] ?? "").trim(),
      guestCount: parseNumber(fields[idxGuestCount]),
      subtotal: parseYen(fields[idxSubtotal]),
      orderedAt: (fields[idxOrderedAt] ?? "").trim(),
      productName,
      price: parseYen(fields[idxPrice]),
      quantity: parseNumber(fields[idxQuantity]),
      category: categorizeProduct(productName),
    });
  }

  return rows;
}
