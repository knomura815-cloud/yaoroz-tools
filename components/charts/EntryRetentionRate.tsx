"use client";

import type { Plugin } from "chart.js";
import { Bar } from "react-chartjs-2";
import "./chartSetup";
import {
  ENTRY_HOURS,
  formatHourLabel,
  getEntryRetentionRate,
  isLateNightHour,
} from "@/lib/analyze";
import { OrderRow } from "@/lib/types";

const LATE_COLOR = "#2563eb"; // 青（20時以降）
const EVENING_COLOR = "#22c55e"; // 緑（18〜19時台）
const NORMAL_COLOR = "#9ca3af"; // グレー

const percentLabelPlugin: Plugin<"bar"> = {
  id: "percentLabel",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);

    meta.data.forEach((bar, index) => {
      const value = chart.data.datasets[0].data[index] as number;

      ctx.save();
      ctx.fillStyle = "#374151";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${Math.round(value * 100)}%`, bar.x, bar.y - 6);
      ctx.restore();
    });
  },
};

interface EntryRetentionRateProps {
  rows: OrderRow[];
}

export default function EntryRetentionRate({ rows }: EntryRetentionRateProps) {
  const points = getEntryRetentionRate(rows);

  const data = {
    labels: ENTRY_HOURS.map(formatHourLabel),
    datasets: [
      {
        label: "20時以降も在席していた割合",
        data: points.map((p) => p.rate),
        backgroundColor: points.map((p) => {
          if (isLateNightHour(p.hour)) return LATE_COLOR;
          if (p.hour === 18 || p.hour === 19) return EVENING_COLOR;
          return NORMAL_COLOR;
        }),
      },
    ],
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        入店時間帯別 在席継続率（20時以降）
      </h3>
      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
        18〜19時台は緑、20時以降は青で表示しています。
      </p>
      <div className="mt-4 h-72">
        <Bar
          data={data}
          plugins={[percentLabelPlugin]}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 16 } },
            plugins: { legend: { display: false } },
            scales: {
              y: {
                beginAtZero: true,
                max: 1,
                ticks: {
                  callback: (value) => `${Math.round(Number(value) * 100)}%`,
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
