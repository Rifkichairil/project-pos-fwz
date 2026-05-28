import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireTenantScope } from "@/lib/tenant-scope";

type Period = "daily" | "weekly" | "monthly" | "yearly" | "custom";

function buildDateFilter(period: Period, startDate?: string, endDate?: string): { sql: string; params: string[] } {
  switch (period) {
    case "daily":
      return { sql: "order_at::date = CURRENT_DATE", params: [] };
    case "weekly":
      return { sql: "order_at >= date_trunc('week', NOW())", params: [] };
    case "monthly":
      return { sql: "order_at >= date_trunc('month', NOW())", params: [] };
    case "yearly":
      return { sql: "order_at >= date_trunc('year', NOW())", params: [] };
    case "custom":
      return { sql: "order_at::date BETWEEN $1::date AND $2::date", params: [startDate!, endDate!] };
  }
}

function detectPeriodFromRange(startDate: string, endDate: string): "daily" | "weekly" | "monthly" | "yearly" {
  const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 1) return "daily";
  if (diffDays <= 7) return "weekly";
  if (diffDays <= 62) return "monthly";
  return "yearly";
}

function getChartGrouping(period: Period, startDate?: string, endDate?: string) {
  const effective = period === "custom" && startDate && endDate ? detectPeriodFromRange(startDate, endDate) : period;

  switch (effective) {
    case "daily":
      return {
        select: "EXTRACT(HOUR FROM so.order_at)::int AS label",
        groupBy: "EXTRACT(HOUR FROM so.order_at)",
        orderBy: "label ASC",
      };
    case "weekly":
      return {
        select: "EXTRACT(ISODOW FROM so.order_at)::int AS label",
        groupBy: "EXTRACT(ISODOW FROM so.order_at)",
        orderBy: "label ASC",
      };
    case "monthly":
      return {
        select: "EXTRACT(WEEK FROM so.order_at)::int AS label",
        groupBy: "EXTRACT(WEEK FROM so.order_at)",
        orderBy: "label ASC",
      };
    case "yearly":
    default:
      return {
        select: "EXTRACT(MONTH FROM so.order_at)::int AS label",
        groupBy: "EXTRACT(MONTH FROM so.order_at)",
        orderBy: "label ASC",
      };
  }
}

function formatChartLabel(period: Period, value: number, startDate?: string, endDate?: string): string {
  const effective = period === "custom" && startDate && endDate ? detectPeriodFromRange(startDate, endDate) : period;

  switch (effective) {
    case "daily":
      return `${String(value).padStart(2, "0")}:00`;
    case "weekly": {
      const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
      return days[value - 1] || String(value);
    }
    case "monthly":
      return `Minggu ${value}`;
    case "yearly":
    default: {
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      return months[value - 1] || String(value);
    }
  }
}

export async function GET(request: Request) {
  const tenant = await requireTenantScope();
  if ("error" in tenant) return tenant.error;

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") || "daily") as Period;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  const validPeriods = ["daily", "weekly", "monthly", "yearly", "custom"];
  if (!validPeriods.includes(period)) {
    return NextResponse.json(
      { error: "Invalid period. Use: daily, weekly, monthly, yearly, custom" },
      { status: 400 }
    );
  }

  if (period === "custom" && (!startDate || !endDate)) {
    return NextResponse.json(
      { error: "startDate and endDate are required for custom period" },
      { status: 400 }
    );
  }

  const tenantId = tenant.context.tenantId;
  const df = buildDateFilter(period, startDate, endDate);
  const statusFilter = "so.status IN ('open', 'paid')";
  const tenantParamIdx = df.params.length + 1;

  const baseWhere = `${df.sql} AND ${statusFilter} AND so.tenant_id = $${tenantParamIdx}`;
  const commonParams = [...df.params, tenantId];

  try {
    // 1. Stats
    const statsQuery = `
      SELECT
        COALESCE(SUM(so.total_amount), 0)::numeric AS total_revenue,
        COUNT(so.id)::int AS total_transactions,
        COALESCE(AVG(so.total_amount), 0)::numeric AS average_order_value
      FROM sales_orders so
      WHERE so.${baseWhere}
    `;

    // 2. Revenue breakdown
    const revenueQuery = `
      SELECT
        COALESCE(SUM(CASE WHEN op.method = 'cash' THEN op.amount ELSE 0 END), 0)::numeric AS cash,
        COALESCE(SUM(CASE WHEN op.method = 'qris' THEN op.amount ELSE 0 END), 0)::numeric AS qris,
        COALESCE(SUM(CASE WHEN op.method NOT IN ('cash', 'qris') THEN op.amount ELSE 0 END), 0)::numeric AS other
      FROM sales_orders so
      INNER JOIN order_payments op ON op.sales_order_id = so.id
      WHERE so.${baseWhere}
    `;

    // 3. Sales chart
    const chartGrouping = getChartGrouping(period, startDate, endDate);
    const chartQuery = `
      SELECT
        ${chartGrouping.select},
        COALESCE(SUM(so.total_amount), 0)::numeric AS val,
        COUNT(so.id)::int AS trx
      FROM sales_orders so
      WHERE so.${baseWhere}
      GROUP BY ${chartGrouping.groupBy}
      ORDER BY ${chartGrouping.orderBy}
    `;

    // 4. Best seller (top 5)
    const bestSellerQuery = `
      SELECT
        soi.menu_name_snapshot AS name,
        SUM(soi.qty)::int AS qty
      FROM sales_order_items soi
      INNER JOIN sales_orders so ON so.id = soi.sales_order_id
      WHERE so.${baseWhere}
      GROUP BY soi.menu_name_snapshot
      ORDER BY qty DESC
      LIMIT 5
    `;

    // 5. Least seller (bottom 5, termasuk yang belum terjual)
    const leastParamIdx = df.params.length + 1;
    const leastSellerQuery = `
      SELECT
        m.name,
        COALESCE(SUM(soi.qty), 0)::int AS qty
      FROM menus m
      LEFT JOIN sales_order_items soi ON soi.menu_name_snapshot = m.name
      LEFT JOIN sales_orders so ON so.id = soi.sales_order_id
        AND ${df.sql}
        AND so.status IN ('open', 'paid')
        AND so.tenant_id = $${leastParamIdx}
      WHERE m.is_active = true AND m.tenant_id = $${leastParamIdx + 1}
      GROUP BY m.name
      ORDER BY qty ASC
      LIMIT 5
    `;
    const leastParams = [...df.params, tenantId, tenantId];

    const [statsResult, revenueResult, chartResult, bestResult, leastResult] =
      await Promise.all([
        db.query(statsQuery, commonParams),
        db.query(revenueQuery, commonParams),
        db.query(chartQuery, commonParams),
        db.query(bestSellerQuery, commonParams),
        db.query(leastSellerQuery, leastParams),
      ]);

    const stats = statsResult.rows[0];
    const revenue = revenueResult.rows[0];

    const totalRevenue = Number(stats.total_revenue);
    const totalTransactions = Number(stats.total_transactions);
    const averageOrderValue = Number(stats.average_order_value);

    const salesChart = chartResult.rows.map((row: { label: number; val: string; trx: number }) => ({
      label: formatChartLabel(period, row.label, startDate, endDate),
      val: Number(row.val),
      trx: Number(row.trx),
    }));

    const bestSeller = bestResult.rows.map((row: { name: string; qty: number }) => ({
      name: row.name,
      qty: Number(row.qty),
    }));

    const leastSeller = leastResult.rows.map((row: { name: string; qty: number }) => ({
      name: row.name,
      qty: Number(row.qty),
    }));

    // Comparison chart (historical)
    let comparisonChart: Array<{ label: string; val: number; trx: number }> = [];
    try {
      let compQuery: string, compParams: (string | number)[];
      if (period === "custom" && startDate && endDate) {
        const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
        const prevEnd = new Date(new Date(startDate).getTime() - 86400000).toISOString().split("T")[0];
        const prevStart = new Date(new Date(prevEnd).getTime() - diffMs + 86400000).toISOString().split("T")[0];
        compQuery = "SELECT order_at::date AS d, COALESCE(SUM(total_amount), 0)::numeric AS val, COUNT(id)::int AS trx FROM sales_orders WHERE order_at::date BETWEEN $1::date AND $2::date AND status IN ('open', 'paid') AND tenant_id = $3 GROUP BY order_at::date ORDER BY d";
        compParams = [prevStart, prevEnd, tenantId];
      } else if (period === "daily") {
        compQuery = "SELECT order_at::date AS d, COALESCE(SUM(total_amount), 0)::numeric AS val, COUNT(id)::int AS trx FROM sales_orders WHERE order_at >= CURRENT_DATE - INTERVAL '6 days' AND status IN ('open', 'paid') AND tenant_id = $1 GROUP BY order_at::date ORDER BY d";
        compParams = [tenantId];
      } else if (period === "weekly") {
        compQuery = "SELECT date_trunc('week', order_at)::date AS d, COALESCE(SUM(total_amount), 0)::numeric AS val, COUNT(id)::int AS trx FROM sales_orders WHERE order_at >= NOW() - INTERVAL '4 weeks' AND status IN ('open', 'paid') AND tenant_id = $1 GROUP BY date_trunc('week', order_at) ORDER BY d";
        compParams = [tenantId];
      } else if (period === "monthly") {
        compQuery = "SELECT date_trunc('month', order_at)::date AS d, COALESCE(SUM(total_amount), 0)::numeric AS val, COUNT(id)::int AS trx FROM sales_orders WHERE order_at >= NOW() - INTERVAL '6 months' AND status IN ('open', 'paid') AND tenant_id = $1 GROUP BY date_trunc('month', order_at) ORDER BY d";
        compParams = [tenantId];
      } else {
        compQuery = "SELECT EXTRACT(YEAR FROM order_at)::int AS d, COALESCE(SUM(total_amount), 0)::numeric AS val, COUNT(id)::int AS trx FROM sales_orders WHERE order_at >= NOW() - INTERVAL '5 years' AND status IN ('open', 'paid') AND tenant_id = $1 GROUP BY EXTRACT(YEAR FROM order_at) ORDER BY d";
        compParams = [tenantId];
      }
      const compResult = await db.query(compQuery, compParams);
      const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const effectivePeriod = period === "custom" && startDate && endDate ? detectPeriodFromRange(startDate, endDate) : period;
      comparisonChart = compResult.rows.map((row: { d: string | number; val: string; trx: number }) => {
        let label = String(row.d);
        if (effectivePeriod === "daily") {
          const date = new Date(row.d as string);
          label = dayNames[date.getDay()] || label;
        } else if (effectivePeriod === "weekly") {
          const date = new Date(row.d as string);
          label = "W" + Math.ceil(date.getDate() / 7);
        } else if (effectivePeriod === "monthly") {
          const date = new Date(row.d as string);
          label = monthNames[date.getMonth()] || label;
        }
        return { label, val: Number(row.val), trx: Number(row.trx) };
      });
    } catch { comparisonChart = []; }

    return NextResponse.json({
      stats: {
        totalRevenue,
        totalTransactions,
        averageOrderValue: Math.round(averageOrderValue),
        estimatedProfit: Math.round(totalRevenue * 0.5),
      },
      revenue: {
        cash: Number(revenue?.cash || 0),
        qris: Number(revenue?.qris || 0),
        other: Number(revenue?.other || 0),
      },
      salesChart,
      comparisonChart,
      bestSeller,
      leastSeller,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
