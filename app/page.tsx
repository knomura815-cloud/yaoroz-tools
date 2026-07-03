"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseOrderCsv } from "@/lib/parseCsv";

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(selected: File | null) {
    setFile(selected);
    setError(null);
  }

  async function handleAnalyze() {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const orderRows = parseOrderCsv(buffer);

      sessionStorage.setItem("yaoroz-order-rows", JSON.stringify(orderRows));

      router.push("/report");
    } catch (e) {
      console.error(e);
      setError(
        "CSVの読み込みに失敗しました。ファイルの形式をご確認のうえ、もう一度お試しください。"
      );
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          ヤオロズクラフト 売上分析ツール
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          POS+の汎用データ出力からダウンロードしたCSVをアップロードしてください。
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              汎用データ出力CSV
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              POS+の汎用データ出力からダウンロードしたCSVをアップロードしてください。
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              出力項目：曜日・伝票発行日・客数（合計）・小計・オーダー日時・商品・価格
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              対応形式: CSV（カンマ区切り / Shift-JIS）
            </p>

            <input
              type="file"
              accept=".csv"
              onChange={(e) =>
                handleFileChange(e.target.files?.[0] ?? null)
              }
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
          {isLoading ? "分析中..." : "分析開始"}
        </button>

        {!file && (
          <p className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
            ファイルを選択すると「分析開始」が押せるようになります。
          </p>
        )}
      </main>
    </div>
  );
}
