"use client";

import { Line } from "react-chartjs-2";
import "./chartSetup";
import { getMonthlyTrend } from "@/lib/analyze";
import { OrderRow } from "@/lib/types";

interface MonthlyTrendProps {
  rows: OrderRow[];
}

export default function MonthlyTrend({ rows }: MonthlyTrendProps) {
  const points = getMonthlyTrend(rows);

  const data = {
    labels: points.map((p) => p.month),
    datasets: [
      {
        label: "客単価",
        data: points.map((p) => Math.round(p.unitPrice)),
        borderColor: "#2563eb",
        backgroundColor: "#2563eb",
        yAxisID: "y",
        tension: 0.3,
      },
      {
        label: "20時以降在席率",
        data: points.map((p) => p.lateNightRate),
        borderColor: "#f97316",
        backgroundColor: "#f97316",
        yAxisID: "y1",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        月別 客単価・20時以降在席率
      </h3>
      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
        客単価（青・左軸）／20時以降在席率（橙・右軸）
      </p>
      {points.length < 2 ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          データが2ヶ月以上あるとトレンドが表示されます
        </p>
      ) : (
      <div className="mt-4 h-72">
        <Line
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                type: "linear",
                position: "left",
                beginAtZero: true,
                title: { display: true, text: "客単価（円）" },
              },
              y1: {
                type: "linear",
                position: "right",
                beginAtZero: true,
                max: 1,
                grid: { drawOnChartArea: false },
                title: { display: true, text: "20時以降在席率" },
                ticks: {
                  callback: (value) => `${Math.round(Number(value) * 100)}%`,
                },
              },
            },
          }}
        />
      </div>
      )}
    </div>
  );
}
