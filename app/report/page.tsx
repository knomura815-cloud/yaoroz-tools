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
import { computeKpis, Kpis } from "@/lib/analyze";
import { OrderRow } from "@/lib/types";

export default function ReportPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [orderRows, setOrderRows] = useState<OrderRow[] | null>(null);
  const [hasData, setHasData] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("yaoroz-order-rows");
    if (!raw) {
      setHasData(false);
      return;
    }

    const rows: OrderRow[] = JSON.parse(raw);
    setOrderRows(rows);
    setKpis(computeKpis(rows));
  }, []);

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

        <div className="mt-8">
          {kpis ? (
            <KpiCards kpis={kpis} />
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              集計中...
            </p>
          )}
        </div>

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
