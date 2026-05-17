import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Period = "daily" | "weekly" | "monthly" | "yearly";

function getDateFilter(period: Period) {
  switch (period) {
    case "daily":
      return "order_at::date = CURRENT_DATE";
    case "weekly":
      return "order_at >= date_trunc('week', NOW())";
    case "monthly":
      return "order_at >= date_trunc('month', NOW())";
    case "yearly":
      return "order_at >= date_trunc('year', NOW())";
  }
}

function getChartGrouping(period: Period) {
  switch (period) {
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
      return {
        select: "EXTRACT(MONTH FROM so.order_at)::int AS label",
        groupBy: "EXTRACT(MONTH FROM so.order_at)",
        orderBy: "label ASC",
      };
  }
}

function formatChartLabel(period: Period, value: number): string {
  switch (period) {
    case "daily":
      return `${String(value).padStart(2, "0")}:00`;
    case "weekly": {
      const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
      return days[value - 1] || String(value);
    }
    case "monthly":
      return `Minggu ${value}`;
    case "yearly": {
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      return months[value - 1] || String(value);
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") || "daily") as Period;

  if (!["daily", "weekly", "monthly", "yearly"].includes(period)) {
    return NextResponse.json(
      { error: "Invalid period. Use: daily, weekly, monthly, yearly" },
      { status: 400 }
    );
  }

  const dateFilter = getDateFilter(period);
  const statusFilter = "so.status IN ('open', 'paid')";
  const baseWhere = `${dateFilter} AND ${statusFilter}`;

  try {
    // 1. Stats: totalRevenue, totalTransactions, averageOrderValue
    const statsQuery = `
      SELECT
        COALESCE(SUM(so.total_amount), 0)::numeric AS total_revenue,
        COUNT(so.id)::int AS total_transactions,
        COALESCE(AVG(so.total_amount), 0)::numeric AS average_order_value
      FROM sales_orders so
      WHERE so.${baseWhere}
    `;

    // 2. Revenue breakdown by payment method
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
    const chartGrouping = getChartGrouping(period);
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

    // 5. Least seller (bottom 5)
    const leastSellerQuery = `
      SELECT
        soi.menu_name_snapshot AS name,
        SUM(soi.qty)::int AS qty
      FROM sales_order_items soi
      INNER JOIN sales_orders so ON so.id = soi.sales_order_id
      WHERE so.${baseWhere}
      GROUP BY soi.menu_name_snapshot
      ORDER BY qty ASC
      LIMIT 5
    `;

    const [statsResult, revenueResult, chartResult, bestResult, leastResult] =
      await Promise.all([
        db.query(statsQuery),
        db.query(revenueQuery),
        db.query(chartQuery),
        db.query(bestSellerQuery),
        db.query(leastSellerQuery),
      ]);

    const stats = statsResult.rows[0];
    const revenue = revenueResult.rows[0];

    const totalRevenue = Number(stats.total_revenue);
    const totalTransactions = Number(stats.total_transactions);
    const averageOrderValue = Number(stats.average_order_value);

    const salesChart = chartResult.rows.map((row: { label: number; val: string; trx: number }) => ({
      label: formatChartLabel(period, row.label),
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
      let compQuery = "";
      if (period === "daily") {
        compQuery = `SELECT order_at::date AS d, COALESCE(SUM(total_amount), 0)::numeric AS val, COUNT(id)::int AS trx FROM sales_orders WHERE order_at >= CURRENT_DATE - INTERVAL '6 days' AND status IN ('open', 'paid') GROUP BY order_at::date ORDER BY d`;
      } else if (period === "weekly") {
        compQuery = `SELECT date_trunc('week', order_at)::date AS d, COALESCE(SUM(total_amount), 0)::numeric AS val, COUNT(id)::int AS trx FROM sales_orders WHERE order_at >= NOW() - INTERVAL '4 weeks' AND status IN ('open', 'paid') GROUP BY date_trunc('week', order_at) ORDER BY d`;
      } else if (period === "monthly") {
        compQuery = `SELECT date_trunc('month', order_at)::date AS d, COALESCE(SUM(total_amount), 0)::numeric AS val, COUNT(id)::int AS trx FROM sales_orders WHERE order_at >= NOW() - INTERVAL '6 months' AND status IN ('open', 'paid') GROUP BY date_trunc('month', order_at) ORDER BY d`;
      } else {
        compQuery = `SELECT EXTRACT(YEAR FROM order_at)::int AS d, COALESCE(SUM(total_amount), 0)::numeric AS val, COUNT(id)::int AS trx FROM sales_orders WHERE order_at >= NOW() - INTERVAL '5 years' AND status IN ('open', 'paid') GROUP BY EXTRACT(YEAR FROM order_at) ORDER BY d`;
      }
      const compResult = await db.query(compQuery);
      const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      comparisonChart = compResult.rows.map((row: { d: string | number; val: string; trx: number }) => {
        let label = String(row.d);
        if (period === "daily") {
          const date = new Date(row.d as string);
          label = dayNames[date.getDay()] || label;
        } else if (period === "weekly") {
          const date = new Date(row.d as string);
          label = "W" + Math.ceil(date.getDate() / 7);
        } else if (period === "monthly") {
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
