// 商品カテゴリ（自動分類、既存チャート用）
export type ProductCategory =
  | "ドリンク"
  | "コース"
  | "飲み放題"
  | "お通し"
  | "フード";

// 汎用データ出力CSVの1行（ヘッダー＋明細を結合した1オーダー分）
export interface OrderRow {
  categoryPrimary: string; // D.商品カテゴリ1（フード／ドリンク）
  categorySecondary: string; // D.商品カテゴリ2
  store: string; // H.店舗
  businessDate: string; // H.集計営業日
  dayOfWeek: string; // H.曜日
  receiptIssuedAt: string; // H.伝票発行日 (例: "2026/05/01 17:02:48")
  guestCount: number; // H.客数（合計）
  subtotal: number; // H.小計
  orderedAt: string; // D.オーダー日時
  productName: string; // D.商品（":"で分割した右側）
  price: number; // D.価格
  quantity: number; // D.数量（プラス・マイナスを合算したネット値）
  category: ProductCategory; // 商品カテゴリ（自動分類）
}
