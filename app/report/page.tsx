"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import KpiCards from "@/components/KpiCards";
import DayHeatmap from "@/components/charts/DayHeatmap";
import DwellUnitPrice from "@/components/charts/DwellUnitPrice";
import EntryRetentionRate from "@/components/charts/EntryRetentionRate";
import HourlyVisitors from "@/components/charts/HourlyVisitors";
import ItemRanking from "@/components/charts/ItemRanking";
import MonthlyTrend from "@/components/charts/MonthlyTrend";
import { computeKpis, getWeekRange, Kpis, WeekRange } from "@/lib/analyze";
import { OrderRow } from "@/lib/types";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function ReportPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [orderRows, setOrderRows] = useState<OrderRow[] | null>(null);
  const [hasData, setHasData] = useState(true);
  const [weekRange, setWeekRange] = useState<WeekRange | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("yaoroz-order-rows");
    if (!raw) {
      setHasData(false);
      return;
    }

    const rows: OrderRow[] = JSON.parse(raw);
    setOrderRows(rows);
    setKpis(computeKpis(rows));
    setWeekRange(getWeekRange(rows));
  }, []);

  async function handleSave() {
    if (!kpis || !weekRange) return;

    setSaveStatus("saving");
    setSaveError(null);

    try {
      const res = await fetch("/api/sales-reports", {
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
      setSaveError(e instanceof Error ? e.message : "保存に失敗しました。");
    }
  }

  if (!hasData) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            データが見つかりませんでした。先にCSVをアップロードしてください。
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-50"
          >
            アップロード画面に戻る
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          売上レポート
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          アップロードされたCSVをもとに集計した結果です。
        </p>
        <Link
          href="/report/history"
          className="mt-1 inline-block text-xs font-medium text-zinc-500 underline dark:text-zinc-400"
        >
          過去の売上分析データ一覧
        </Link>

        <div className="mt-8">
          {kpis ? (
            <KpiCards kpis={kpis} />
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              集計中...
            </p>
          )}
        </div>

        {kpis && (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
        )}

        {orderRows && (
          <div className="mt-8 flex flex-col gap-6">
            <HourlyVisitors rows={orderRows} />
            <EntryRetentionRate rows={orderRows} />
            <DwellUnitPrice rows={orderRows} />
            <MonthlyTrend rows={orderRows} />
            <DayHeatmap rows={orderRows} />
            <ItemRanking rows={orderRows} />
          </div>
        )}
      </main>
    </div>
  );
}
