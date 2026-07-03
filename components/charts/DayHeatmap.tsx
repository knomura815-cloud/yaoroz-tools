import { DAYS_OF_WEEK, getDayMonthHeatmap } from "@/lib/analyze";
import { OrderRow } from "@/lib/types";

interface DayHeatmapProps {
  rows: OrderRow[];
}

const getCellStyle = (value: number) => {
  if (value >= 65) return { backgroundColor: "#1e40af", color: "white" };
  if (value >= 55) return { backgroundColor: "#3266ad", color: "white" };
  if (value >= 45) return { backgroundColor: "#93c5fd", color: "black" };
  if (value >= 35) return { backgroundColor: "#bfdbfe", color: "black" };
  return { backgroundColor: "#f8fafc", color: "black" };
};

export default function DayHeatmap({ rows }: DayHeatmapProps) {
  const { months, cells } = getDayMonthHeatmap(rows);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        曜日×月別 20時以降在席率
      </h3>
      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
        65%以上：濃い青／55〜64%：青／45〜54%：薄い青／35〜44%：さらに薄い青／それ以下：白
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-center text-sm">
          <thead>
            <tr>
              <th className="border border-zinc-200 p-2 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                曜日
              </th>
              {months.map((month) => (
                <th
                  key={month}
                  className="border border-zinc-200 p-2 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
                >
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS_OF_WEEK.map((dayOfWeek, rowIndex) => (
              <tr key={dayOfWeek}>
                <th className="border border-zinc-200 p-2 font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                  {dayOfWeek}
                </th>
                {cells[rowIndex].map((cell) => {
                  const percent = Math.round(cell.rate * 100);

                  return (
                    <td
                      key={`${cell.dayOfWeek}-${cell.month}`}
                      className="border border-zinc-200 p-2 dark:border-zinc-700"
                      style={getCellStyle(percent)}
                    >
                      {cell.totalGuests === 0 ? "-" : `${percent}%`}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
