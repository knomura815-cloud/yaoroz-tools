"use client";

import Link from "next/link";
import { useState } from "react";
import WeeklyReportTable from "@/components/WeeklyReportTable";
import { computeWeeklyReportKpis, WeeklyReportKpis } from "@/lib/analyze";
import { parseOrderCsv } from "@/lib/parseCsv";

export default function WeeklyReportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<WeeklyReportKpis | null>(null);

  function handleFileChange(selected: File | null) {
    setFile(selected);
    setError(null);
    setKpis(null);
  }

  async function handleAnalyze() {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const orderRows = parseOrderCsv(buffer);
      setKpis(computeWeeklyReportKpis(orderRows));
    } catch (e) {
      console.error(e);
      setError(
        "CSVの読み込みに失敗しました。ファイルの形式をご確認のうえ、もう一度お試しください。"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          週次業績レポート 自動集計
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          POS+の汎用データ出力（D.商品カテゴリ1／D.商品カテゴリ2を含む形式）からダウンロードしたCSVをアップロードしてください。
        </p>
        <Link
          href="/"
          className="mt-1 inline-block text-xs font-medium text-zinc-500 underline dark:text-zinc-400"
        >
          通常の売上分析ツールに戻る
        </Link>

        <div className="mt-8 flex flex-col gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              汎用データ出力CSV（新フォーマット）
            </h2>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              出力項目：D.商品カテゴリ1・D.商品・H.店舗・H.集計営業日・H.曜日・H.伝票発行日・H.客数（合計）・H.小計・D.商品カテゴリ2・D.価格・D.数量・D.オーダー日時
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              対応形式: CSV（カンマ区切り / Shift-JIS）
            </p>

            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              className="mt-4 block w-full text-sm text-zinc-700 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700 dark:text-zinc-300 dark:file:bg-zinc-100 dark:file:text-zinc-900 dark:hover:file:bg-zinc-300"
            />

            {file && (
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                選択中: {file.name}
              </p>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!file || isLoading}
          className="mt-8 w-full rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
        >
          {isLoading ? "集計中..." : "集計開始"}
        </button>

        {kpis && (
          <div className="mt-8">
            <WeeklyReportTable kpis={kpis} />
          </div>
        )}
      </main>
    </div>
  );
}
