"use client";

import { Bar } from "react-chartjs-2";
import "./chartSetup";
import { getLateNightTopProducts, ProductSales } from "@/lib/analyze";
import { OrderRow } from "@/lib/types";

interface ItemRankingProps {
  rows: OrderRow[];
}

function buildData(items: ProductSales[], color: string) {
  return {
    labels: items.map((item) => item.productName),
    datasets: [
      {
        label: "売上金額",
        data: items.map((item) => Number(item.sales)),
        backgroundColor: color,
      },
    ],
  };
}

function buildOptions() {
  return {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        beginAtZero: true,
        max: undefined,
        title: { display: true, text: "売上（円）" },
        ticks: {
          callback: (value: number | string) =>
            `¥${Number(value).toLocaleString("ja-JP")}`,
        },
      },
    },
  };
}

export default function ItemRanking({ rows }: ItemRankingProps) {
  const { drinks, foods } = getLateNightTopProducts(rows, 10);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        20時以降 売上ランキング（ドリンク・フード）
      </h3>
      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
        20時以降に入店した伝票内の商品を集計したTOP10です。
      </p>
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ドリンク TOP10
          </h4>
          <div className="h-96">
            {drinks.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                データがありません
              </p>
            ) : (
              <Bar data={buildData(drinks, "#2563eb")} options={buildOptions()} />
            )}
          </div>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            フード TOP10
          </h4>
          <div className="h-96">
            {foods.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                データがありません
              </p>
            ) : (
              <Bar data={buildData(foods, "#16a34a")} options={buildOptions()} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
