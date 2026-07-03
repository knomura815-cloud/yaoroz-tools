"use client";

import { Bar } from "react-chartjs-2";
import "./chartSetup";
import {
  ENTRY_HOURS,
  formatHourLabel,
  getHourlyVisitors,
  isLateNightHour,
} from "@/lib/analyze";
import { OrderRow } from "@/lib/types";

const LATE_COLOR = "#2563eb"; // 青
const NORMAL_COLOR = "#9ca3af"; // グレー
const LATE_COLOR_WEEKEND = "#93c5fd"; // 薄い青
const NORMAL_COLOR_WEEKEND = "#d1d5db"; // 薄いグレー

interface HourlyVisitorsProps {
  rows: OrderRow[];
}

export default function HourlyVisitors({ rows }: HourlyVisitorsProps) {
  const points = getHourlyVisitors(rows);

  const data = {
    labels: ENTRY_HOURS.map(formatHourLabel),
    datasets: [
      {
        label: "平日",
        data: points.map((p) => p.weekday),
        backgroundColor: points.map((p) =>
          isLateNightHour(p.hour) ? LATE_COLOR : NORMAL_COLOR
        ),
      },
      {
        label: "土日",
        data: points.map((p) => p.weekend),
        backgroundColor: points.map((p) =>
          isLateNightHour(p.hour) ? LATE_COLOR_WEEKEND : NORMAL_COLOR_WEEKEND
        ),
      },
    ],
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        時間帯別来客数
      </h3>
      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
        平日と土日を比較。20時以降は青で強調表示しています。
      </p>
      <div className="mt-4 h-72">
        <Bar
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: "来客数（人）" },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
