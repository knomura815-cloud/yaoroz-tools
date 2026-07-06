"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Kpis } from "@/lib/analyze";

interface SalesReportRecord extends Kpis {
  id: number;
  weekStart: string;
  weekEnd: string;
  uploadedAt: string;
}

function formatYen(value: number): string {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

function formatCount(value: number): string {
  return `${value.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}人`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatMinutes(value: number): string {
  return `${value.toLocaleString("ja-JP", { maximumFractionDigits: 0 })}分`;
}

const COLUMNS: {
  label: string;
  getValue: (report: SalesReportRecord) => string;
}[] = [
  { label: "売上合計", getValue: (r) => formatYen(r.totalSales) },
  { label: "1日平均来客数", getValue: (r) => formatCount(r.averageDailyVisitors) },
  { label: "全体客単価", getValue: (r) => formatYen(r.averageSpendPerVisitor) },
  { label: "20時以降在席率", getValue: (r) => formatPercent(r.lateNightVisitorRate) },
  { label: "平均滞在時間", getValue: (r) => formatMinutes(r.averageStayMinutes) },
];

export default function SalesReportHistoryPage() {
  const [reports, setReports] = useState<SalesReportRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/sales-reports")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "データの取得に失敗しました。");
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setReports(data.reports);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "データの取得に失敗しました。");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          過去の売上分析データ一覧
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          保存された売上分析データを、対象期間が新しい順に表示しています。
        </p>
        <div className="mt-1 flex gap-4">
          <Link
            href="/"
            className="inline-block text-xs font-medium text-zinc-500 underline dark:text-zinc-400"
          >
            トップページに戻る
          </Link>
          <Link
            href="/report"
            className="inline-block text-xs font-medium text-zinc-500 underline dark:text-zinc-400"
          >
            売上レポートに戻る
          </Link>
        </div>

        <div className="mt-8">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {!error && reports === null && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              読み込み中...
            </p>
          )}

          {!error && reports !== null && reports.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              保存されたデータがまだありません。売上レポート画面からCSVをアップロードし、「この週のデータを保存」を押してください。
            </p>
          )}

          {!error && reports !== null && reports.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      対象期間
                    </th>
                    {COLUMNS.map((column) => (
                      <th
                        key={column.label}
                        className="whitespace-nowrap px-3 py-2 text-right font-medium"
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                    >
                      <td className="whitespace-nowrap px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                        {report.weekStart} 〜 {report.weekEnd}
                      </td>
                      {COLUMNS.map((column) => (
                        <td
                          key={column.label}
                          className="whitespace-nowrap px-3 py-2 text-right font-mono text-zinc-900 dark:text-zinc-50"
                        >
                          {column.getValue(report)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
