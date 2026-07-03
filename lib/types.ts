// 商品カテゴリ
export type ProductCategory =
  | "ドリンク"
  | "コース"
  | "飲み放題"
  | "お通し"
  | "フード";

// 汎用データ出力CSVの1行（ヘッダー＋明細を結合した1オーダー分）
export interface OrderRow {
  dayOfWeek: string; // H.曜日
  receiptIssuedAt: string; // H.伝票発行日 (例: "2026/05/01 17:02:48")
  guestCount: number; // H.客数（合計）
  subtotal: number; // H.小計
  orderedAt: string; // D.オーダー日時
  productName: string; // D.商品（":"で分割した右側）
  price: number; // D.価格
  category: ProductCategory; // 商品カテゴリ（自動分類）
}
