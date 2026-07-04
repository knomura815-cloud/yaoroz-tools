"use client";

import { useState } from "react";
import { WeeklyReportKpis } from "@/lib/analyze";

type ValueFormat = "yen" | "count" | "rate" | "decimal";

interface ReportRow {
  no: number;
  label: string;
  value: number;
  format: ValueFormat;
  unit: string;
}

// 浮動小数点の丸め誤差（例: 3300/1.1 = 2999.9999999999995）を吸収してから切り捨てる
function formatYen(value: number): string {
  return `${Math.floor(value + 1e-6).toLocaleString("ja-JP")}円`;
}

function formatCount(value: number, unit: string): string {
  return `${Math.floor(value).toLocaleString("ja-JP")}${unit}`;
}

function formatRate(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDecimal(value: number, unit: string): string {
  return `${value.toFixed(2)}${unit}`;
}

function formatValue(row: ReportRow): string {
  switch (row.format) {
    case "yen":
      return formatYen(row.value);
    case "rate":
      return formatRate(row.value);
    case "decimal":
      return formatDecimal(row.value, row.unit);
    case "count":
    default:
      return formatCount(row.value, row.unit);
  }
}

interface WeeklyReportTableProps {
  kpis: WeeklyReportKpis;
}

export default function WeeklyReportTable({ kpis }: WeeklyReportTableProps) {
  const [copied, setCopied] = useState(false);

  const rows: ReportRow[] = [
    { no: 1, label: "売上高（ランチ）", value: kpis.lunchSales, format: "yen", unit: "" },
    { no: 2, label: "売上高（ディナー）", value: kpis.dinnerSales, format: "yen", unit: "" },
    { no: 3, label: "フード単価", value: kpis.foodUnitPrice, format: "yen", unit: "" },
    { no: 4, label: "コース件数", value: kpis.courseCount, format: "count", unit: "件" },
    { no: 5, label: "PPJC合計受注数", value: kpis.ppjcTotal, format: "count", unit: "個" },
    { no: 6, label: "PPJC受注比率", value: kpis.ppjcRate, format: "rate", unit: "" },
    { no: 7, label: "おすすめ出数", value: kpis.osusumeCount, format: "count", unit: "点" },
    { no: 8, label: "おすすめ比率", value: kpis.osusumeRate, format: "rate", unit: "" },
    { no: 9, label: "平均皿数", value: kpis.avgDishCount, format: "decimal", unit: "皿" },
    { no: 10, label: "平均皿単価", value: kpis.dishUnitPrice, format: "yen", unit: "" },
    { no: 11, label: "ドリンク単価", value: kpis.drinkUnitPrice, format: "yen", unit: "" },
    { no: 12, label: "クラフトビール杯数", value: kpis.craftBeerCount, format: "count", unit: "杯" },
    { no: 13, label: "クラフトビール比率", value: kpis.craftBeerRate, format: "rate", unit: "" },
    { no: 14, label: "アラカルトドリンク単価", value: kpis.alacarteDrinkUnitPrice, format: "yen", unit: "" },
    { no: 15, label: "飲み放題ドリンク単価", value: kpis.nomihodaiDrinkUnitPrice, format: "yen", unit: "" },
    { no: 16, label: "平均ドリンク杯数", value: kpis.alacarteDrinkAvgCount, format: "decimal", unit: "杯" },
    { no: 17, label: "飲み放題獲得件数", value: kpis.nomihodaiCount, format: "count", unit: "件" },
    { no: 18, label: "飲み放題比率", value: kpis.nomihodaiRate, format: "rate", unit: "" },
  ];

  async function handleCopy() {
    const text = rows.map((row) => `${row.label}\t${formatValue(row)}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          週次業績レポート（18項目）
        </h2>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {copied ? "コピーしました" : "全項目をコピー"}
        </button>
      </div>

      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
        総客数: {Math.floor(kpis.totalGuestCount).toLocaleString("ja-JP")}人
        ／総組数: {kpis.partyCount.toLocaleString("ja-JP")}組（うちコース:{" "}
        {kpis.coursePartyCount.toLocaleString("ja-JP")}組）
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th className="w-10 py-2 pr-2 font-medium">No.</th>
              <th className="py-2 pr-2 font-medium">項目</th>
              <th className="py-2 text-right font-medium">値</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.no}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
              >
                <td className="py-2 pr-2 text-zinc-400 dark:text-zinc-500">
                  {row.no}
                </td>
                <td className="py-2 pr-2 text-zinc-700 dark:text-zinc-300">
                  {row.label}
                </td>
                <td className="py-2 text-right font-mono font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatValue(row)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
