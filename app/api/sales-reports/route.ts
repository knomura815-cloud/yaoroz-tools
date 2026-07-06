import { NextRequest, NextResponse } from "next/server";
import { Kpis } from "@/lib/analyze";
import { listSalesReports, upsertSalesReport } from "@/lib/salesReportStore";

const KPI_NUMBER_FIELDS: (keyof Kpis)[] = [
  "totalSales",
  "averageDailyVisitors",
  "averageSpendPerVisitor",
  "lateNightVisitorRate",
  "averageStayMinutes",
];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidKpis(value: unknown): value is Kpis {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return KPI_NUMBER_FIELDS.every((field) => typeof record[field] === "number");
}

export async function GET() {
  try {
    const reports = await listSalesReports();
    return NextResponse.json({ reports });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "不明なエラーです。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストの形式が正しくありません。" },
      { status: 400 }
    );
  }

  const { weekStart, weekEnd, kpis } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof weekStart !== "string" ||
    typeof weekEnd !== "string" ||
    !ISO_DATE_PATTERN.test(weekStart) ||
    !ISO_DATE_PATTERN.test(weekEnd)
  ) {
    return NextResponse.json(
      { error: "対象期間（weekStart/weekEnd）が不正です。" },
      { status: 400 }
    );
  }

  if (!isValidKpis(kpis)) {
    return NextResponse.json(
      { error: "集計データ（kpis）が不正です。" },
      { status: 400 }
    );
  }

  try {
    const report = await upsertSalesReport(weekStart, weekEnd, kpis);
    return NextResponse.json({ report });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "不明なエラーです。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
