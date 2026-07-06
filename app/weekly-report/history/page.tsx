"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WeeklyReportKpis } from "@/lib/analyze";
import { formatCount, formatDecimal, formatRate, formatYen } from "@/lib/format";

interface WeeklyReportRecord extends WeeklyReportKpis {
  id: number;
  weekStart: string;
  weekEnd: string;
  uploadedAt: string;
}

type ValueFormat = "yen" | "count" | "rate" | "decimal";

interface Column {
  label: string;
  format: ValueFormat;
  unit: string;
  getValue: (report: WeeklyReportRecord) => number;
}

const COLUMNS: Column[] = [
  { label: "総客数", format: "count", unit: "人", getValue: (r) => r.totalGuestCount },
  { label: "総組数", format: "count", unit: "組", getValue: (r) => r.partyCount },
  { label: "売上高（ランチ）", format: "yen", unit: "", getValue: (r) => r.lunchSales },
  { label: "売上高（ディナー）", format: "yen", unit: "", getValue: (r) => r.dinnerSales },
  { label: "フード単価", format: "yen", unit: "", getValue: (r) => r.foodUnitPrice },
  { label: "コース件数", format: "count", unit: "件", getValue: (r) => r.courseCount },
  { label: "コース比率", format: "rate", unit: "", getValue: (r) => r.courseRate },
  { label: "PPJC合計受注数", format: "count", unit: "個", getValue: (r) => r.ppjcTotal },
  { label: "PPJC受注比率", format: "rate", unit: "", getValue: (r) => r.ppjcRate },
  { label: "おすすめ出数", format: "count", unit: "点", getValue: (r) => r.osusumeCount },
  { label: "おすすめ比率", format: "rate", unit: "", getValue: (r) => r.osusumeRate },
  { label: "平均皿数", format: "decimal", unit: "皿", getValue: (r) => r.avgDishCount },
  { label: "平均皿単価", format: "yen", unit: "", getValue: (r) => r.dishUnitPrice },
  { label: "ドリンク単価", format: "yen", unit: "", getValue: (r) => r.drinkUnitPrice },
  { label: "クラフトビール杯数", format: "count", unit: "杯", getValue: (r) => r.craftBeerCount },
  { label: "クラフトビール比率", format: "rate", unit: "", getValue: (r) => r.craftBeerRate },
  { label: "アラカルトドリンク単価", format: "yen", unit: "", getValue: (r) => r.alacarteDrinkUnitPrice },
  { label: "飲み放題ドリンク単価", format: "yen", unit: "", getValue: (r) => r.nomihodaiDrinkUnitPrice },
  { label: "平均ドリンク杯数", format: "decimal", unit: "杯", getValue: (r) => r.alacarteDrinkAvgCount },
  { label: "飲み放題獲得件数", format: "count", unit: "件", getValue: (r) => r.nomihodaiCount },
  { label: "飲み放題比率", format: "rate", unit: "", getValue: (r) => r.nomihodaiRate },
];

function formatColumnValue(column: Column, report: WeeklyReportRecord): string {
  const value = column.getValue(report);
  switch (column.format) {
    case "yen":
      return formatYen(value);
    case "rate":
      return formatRate(value);
    case "decimal":
      return formatDecimal(value, column.unit);
    case "count":
    default:
      return formatCount(value, column.unit);
  }
}

export default function WeeklyReportHistoryPage() {
  const [reports, setReports] = useState<WeeklyReportRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/weekly-reports")
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
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          過去の週次データ一覧
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          保存された週次業績データを、対象期間が新しい順に表示しています。
        </p>
        <Link
          href="/weekly-report"
          className="mt-1 inline-block text-xs font-medium text-zinc-500 underline dark:text-zinc-400"
        >
          週次業績レポート自動集計に戻る
        </Link>

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
              保存されたデータがまだありません。週次業績レポート画面からCSVをアップロードし、「この週のデータを保存」を押してください。
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
                          {formatColumnValue(column, report)}
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
