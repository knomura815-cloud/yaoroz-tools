import { Kpis } from "@/lib/analyze";

interface KpiCardsProps {
  kpis: Kpis;
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

export default function KpiCards({ kpis }: KpiCardsProps) {
  const cards = [
    {
      label: "売上合計",
      value: formatYen(kpis.totalSales),
      description: "期間内の売上の合計です",
    },
    {
      label: "1日平均来客数",
      value: formatCount(kpis.averageDailyVisitors),
      description: "1日あたりの平均来客数です",
    },
    {
      label: "全体客単価",
      value: formatYen(kpis.averageSpendPerVisitor),
      description: "お客様1人あたりの平均売上です",
    },
    {
      label: "20時以降在席率",
      value: formatPercent(kpis.lateNightVisitorRate),
      description: "20時以降に来店したお客様の割合です",
    },
    {
      label: "平均滞在時間",
      value: formatMinutes(kpis.averageStayMinutes),
      description: "入店から最終オーダーまでの平均時間です",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {card.label}
          </p>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {card.value}
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            {card.description}
          </p>
        </div>
      ))}
    </div>
  );
}
