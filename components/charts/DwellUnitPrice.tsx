"use client";

import { Chart } from "react-chartjs-2";
import "./chartSetup";
import { getDwellUnitPrice } from "@/lib/analyze";
import { OrderRow } from "@/lib/types";

interface DwellUnitPriceProps {
  rows: OrderRow[];
}

export default function DwellUnitPrice({ rows }: DwellUnitPriceProps) {
  const points = getDwellUnitPrice(rows);

  const data = {
    labels: points.map((p) => p.label),
    datasets: [
      {
        type: "bar" as const,
        label: "客単価",
        data: points.map((p) => Math.round(p.unitPrice)),
        backgroundColor: "#2563eb",
        yAxisID: "y",
      },
      {
        type: "line" as const,
        label: "注文件数",
        data: points.map((p) => p.orderCount),
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
        滞在時間帯別 客単価・注文件数
      </h3>
      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
        棒グラフ：客単価（左軸）／折れ線：注文件数（右軸）
      </p>
      <div className="mt-4 h-72">
        <Chart
          type="bar"
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
                grid: { drawOnChartArea: false },
                title: { display: true, text: "注文件数" },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
