"use client";

import Link from "next/link";
import { useState } from "react";
import WeeklyReportTable from "@/components/WeeklyReportTable";
import {
  computeWeeklyReportKpis,
  getWeekRange,
  WeekRange,
  WeeklyReportKpis,
} from "@/lib/analyze";
import { parseOrderCsv } from "@/lib/parseCsv";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function WeeklyReportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<WeeklyReportKpis | null>(null);
  const [weekRange, setWeekRange] = useState<WeekRange | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleFileChange(selected: File | null) {
    setFile(selected);
    setError(null);
    setKpis(null);
    setWeekRange(null);
    setSaveStatus("idle");
    setSaveError(null);
  }

  async function handleAnalyze() {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSaveStatus("idle");
    setSaveError(null);

    try {
      const buffer = await file.arrayBuffer();
      const orderRows = parseOrderCsv(buffer);
      setKpis(computeWeeklyReportKpis(orderRows));
      setWeekRange(getWeekRange(orderRows));
    } catch (e) {
      console.error(e);
      setError(
        "CSVの読み込みに失敗しました。ファイルの形式をご確認のうえ、もう一度お試しください。"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!kpis || !weekRange) return;

    setSaveStatus("saving");
    setSaveError(null);

    try {
      const res = await fetch("/api/weekly-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart: weekRange.weekStart,
          weekEnd: weekRange.weekEnd,
          kpis,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "保存に失敗しました。");
      }

      setSaveStatus("saved");
    } catch (e) {
      console.error(e);
      setSaveStatus("error");
      setSaveError(
        e instanceof Error ? e.message : "保存に失敗しました。"
      );
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
        <div className="mt-1 flex gap-4">
          <Link
            href="/"
            className="inline-block text-xs font-medium text-zinc-500 underline dark:text-zinc-400"
          >
            通常の売上分析ツールに戻る
          </Link>
          <Link
            href="/weekly-report/history"
            className="inline-block text-xs font-medium text-zinc-500 underline dark:text-zinc-400"
          >
            過去の週次データ一覧
          </Link>
        </div>

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
          <div className="mt-8 flex flex-col gap-4">
            <WeeklyReportTable kpis={kpis} />

            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    対象期間:{" "}
                    {weekRange
                      ? `${weekRange.weekStart} 〜 ${weekRange.weekEnd}`
                      : "不明"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                    同じ期間を再アップロードして保存すると、内容が上書きされます。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!weekRange || saveStatus === "saving"}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
                >
                  {saveStatus === "saving"
                    ? "保存中..."
                    : saveStatus === "saved"
                      ? "保存しました"
                      : "この週のデータを保存"}
                </button>
              </div>

              {saveStatus === "error" && saveError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {saveError}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
