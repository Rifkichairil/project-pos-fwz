"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Wallet,
  ArrowUpRight,
  Banknote,
  QrCode,
  Smartphone,
  CalendarDays,
  Download,
  FileText,
  RefreshCw,
} from "lucide-react";
import { exportDashboardPDF, exportDashboardExcel } from "@/lib/export-pdf";

type Period = "daily" | "weekly" | "monthly" | "yearly" | "custom";

const periods: { label: string; value: Period }[] = [
  { label: "Hari Ini", value: "daily" },
  { label: "Minggu Ini", value: "weekly" },
  { label: "Bulan Ini", value: "monthly" },
  { label: "Tahun Ini", value: "yearly" },
];

function formatRp(n: number) {
  return "Rp. " + n.toLocaleString("id-ID");
}

type DashboardData = {
  stats: {
    totalRevenue: number;
    totalTransactions: number;
    averageOrderValue: number;
    estimatedProfit: number;
  };
  revenue: { cash: number; qris: number; other: number };
  salesChart: Array<{ label: string; val: number; trx: number }>;
  comparisonChart: Array<{ label: string; val: number; trx: number }>;
  bestSeller: Array<{ name: string; qty: number }>;
  leastSeller: Array<{ name: string; qty: number }>;
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const loadDashboard = useCallback(async (p: Period, range?: DateRange) => {
    setLoading(true);
    try {
      let url = `/api/dashboard?period=${p}`;
      if (p === "custom" && range?.from && range?.to) {
        const start = format(range.from, "yyyy-MM-dd");
        const end = format(range.to, "yyyy-MM-dd");
        url += `&startDate=${start}&endDate=${end}`;
      }
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const json = (await res.json()) as DashboardData;
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard(period, dateRange);
  }, [period, dateRange, loadDashboard]);

  const handlePeriodChange = (p: Period) => {
    if (p === period) return;
    if (p !== "custom") {
      setDateRange(undefined);
    }
    setPeriod(p);
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setPeriod("custom");
    }
  };

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 140);
    return () => clearTimeout(t);
  }, [period]);

  const totalRevenue = data?.stats.totalRevenue ?? 0;
  const totalTransactions = data?.stats.totalTransactions ?? 0;
  const avgOrder = data?.stats.averageOrderValue ?? 0;
  const profit = data?.stats.estimatedProfit ?? 0;

  const cashRevenue = data?.revenue.cash ?? 0;
  const qrisRevenue = data?.revenue.qris ?? 0;
  const otherRevenue = data?.revenue.other ?? 0;
  const revenueTotal = cashRevenue + qrisRevenue + otherRevenue || 1;
  const cashPct = Math.round((cashRevenue / revenueTotal) * 100);
  const qrisPct = Math.round((qrisRevenue / revenueTotal) * 100);
  const otherPct = Math.max(0, 100 - cashPct - qrisPct);

  const salesChart = data?.salesChart ?? [];
  const comparisonChart = data?.comparisonChart ?? [];
  const maxLeft = Math.max(...salesChart.map((b) => b.val), 1);
  const maxRight = Math.max(...comparisonChart.map((b) => b.val), 1);

  const bestSeller = data?.bestSeller ?? [];
  const leastSeller = data?.leastSeller ?? [];
  const maxBest = bestSeller[0]?.qty || 1;
  const maxLeast = leastSeller.length > 0 ? Math.max(...leastSeller.map(i => i.qty)) : 1;

  const statCards = [
    { label: "Total Revenue", value: formatRp(totalRevenue), icon: DollarSign },
    { label: "Total Transaksi", value: totalTransactions.toLocaleString("id-ID"), icon: ShoppingCart },
    { label: "Avg Order Value", value: formatRp(avgOrder), icon: BarChart3 },
    { label: "Profit (estimasi)", value: formatRp(profit), icon: Wallet },
    { label: "Growth", value: totalRevenue > 0 ? "Active" : "-", icon: TrendingUp },
  ];

  const chartTitleLeft = period === "custom"
    ? (dateRange?.from && dateRange?.to ? `Sales (${format(dateRange.from, "dd MMM")} - ${format(dateRange.to, "dd MMM yyyy")})` : "Sales (Custom)")
    : period === "daily" ? "Sales per Jam (Hari Ini)" : period === "weekly" ? "Sales per Hari (Minggu Ini)" : period === "monthly" ? "Sales per Minggu (Bulan Ini)" : "Sales per Bulan (Tahun Ini)";
  const chartTitleRight = period === "custom"
    ? (dateRange?.from && dateRange?.to ? `Periode Sebelumnya (${format(dateRange.from, "dd MMM")} - ${format(dateRange.to, "dd MMM yyyy")})` : "Periode Sebelumnya")
    : period === "daily" ? "Sales 7 Hari Terakhir" : period === "weekly" ? "Sales 4 Minggu Terakhir" : period === "monthly" ? "Sales 6 Bulan Terakhir" : "Sales per Tahun";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
        <h1 className="text-base font-semibold sm:text-lg">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg text-xs"
            onClick={() => void loadDashboard(period, dateRange)}
            disabled={loading}
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        {data && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-lg text-xs"
              onClick={() => {
                const dateLabel = period === "custom" && dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, "dd MMM yyyy")} - ${format(dateRange.to, "dd MMM yyyy")}`
                  : period === "daily" ? "Hari Ini" : period === "weekly" ? "Minggu Ini" : period === "monthly" ? "Bulan Ini" : "Tahun Ini";
                void exportDashboardExcel({
                  period,
                  dateLabel,
                  tenantName: "-",
                  stats: data.stats,
                  revenue: data.revenue,
                  salesChart: data.salesChart,
                  bestSeller: data.bestSeller,
                  leastSeller: data.leastSeller,
                });
              }}
            >
              <FileText className="size-3.5" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-lg text-xs"
              onClick={() => {
                const dateLabel = period === "custom" && dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, "dd MMM yyyy")} - ${format(dateRange.to, "dd MMM yyyy")}`
                  : period === "daily" ? "Hari Ini" : period === "weekly" ? "Minggu Ini" : period === "monthly" ? "Bulan Ini" : "Tahun Ini";
                exportDashboardPDF({
                  period,
                  dateLabel,
                  tenantName: "-",
                  stats: data.stats,
                  revenue: data.revenue,
                  salesChart: data.salesChart,
                  bestSeller: data.bestSeller,
                  leastSeller: data.leastSeller,
                });
              }}
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </>
        )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Period Filter */}
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "outline"}
              size="sm"
              className={cn("h-8 shrink-0 rounded-lg text-xs whitespace-nowrap", period === p.value && "bg-primary text-primary-foreground")}
              onClick={() => handlePeriodChange(p.value)}
            >
              {p.label}
            </Button>
          ))}
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("ml-2 h-8 shrink-0 gap-1.5 rounded-lg text-xs whitespace-nowrap", period === "custom" && "border-primary text-primary")}
                />
              }
            >
              <CalendarDays className="size-3.5" />
              {period === "custom" && dateRange?.from ? (
                dateRange.to ? (
                  <span>{format(dateRange.from, "dd MMM yyyy")} - {format(dateRange.to, "dd MMM yyyy")}</span>
                ) : (
                  <span>{format(dateRange.from, "dd MMM yyyy")}</span>
                )
              ) : (
                <span>{new Date().toLocaleDateString("id-ID")}</span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateRangeSelect}
                numberOfMonths={2}
                disabled={(date) => date > new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat data dashboard...</p>
        ) : !data ? (
          <p className="text-sm text-red-600">Gagal memuat data dashboard</p>
        ) : (
          <div key={period} className="animate-in fade-in-0 slide-in-from-bottom-3 duration-[1500ms]">
            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {statCards.map((s) => (
                <Card key={s.label} className="relative overflow-hidden border-border/60">
                  <s.icon className="absolute -bottom-1 right-2 size-24 opacity-[0.06]" strokeWidth={1.2} />
                  <CardContent className="relative z-10 p-3 sm:p-4">
                    <span className="text-[10px] text-muted-foreground sm:text-[11px]">{s.label}</span>
                    <p className="mt-1 text-base font-semibold sm:text-lg">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Revenue Breakdown */}
            <Card className="mb-6 border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold sm:text-sm">Revenue Breakdown by Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex h-5 overflow-hidden rounded-full" style={{ transform: visible ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left", transition: "transform 4.8s cubic-bezier(0.22, 1, 0.36, 1)" }}>
                  {cashPct > 0 && <div className="h-full bg-emerald-500" style={{ width: `${cashPct}%` }} />}
                  {qrisPct > 0 && <div className="h-full bg-blue-500" style={{ width: `${qrisPct}%` }} />}
                  {otherPct > 0 && <div className="h-full bg-violet-500" style={{ width: `${otherPct}%` }} />}
                </div>
                <div className="flex flex-wrap gap-3 sm:gap-6">
                  <div className="flex items-center gap-2"><div className="size-3 rounded-full bg-emerald-500" /><Banknote className="size-3.5 text-muted-foreground" /><span className="text-xs font-medium">Cash</span><span className="text-xs text-muted-foreground">{formatRp(cashRevenue)} ({cashPct}%)</span></div>
                  <div className="flex items-center gap-2"><div className="size-3 rounded-full bg-blue-500" /><QrCode className="size-3.5 text-muted-foreground" /><span className="text-xs font-medium">QRIS</span><span className="text-xs text-muted-foreground">{formatRp(qrisRevenue)} ({qrisPct}%)</span></div>
                  {otherRevenue > 0 && <div className="flex items-center gap-2"><div className="size-3 rounded-full bg-violet-500" /><Smartphone className="size-3.5 text-muted-foreground" /><span className="text-xs font-medium">Lainnya</span><span className="text-xs text-muted-foreground">{formatRp(otherRevenue)} ({otherPct}%)</span></div>}
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Left chart */}
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold sm:text-sm">{chartTitleLeft}</CardTitle>
                </CardHeader>
                <CardContent>
                  <TooltipProvider>
                    <div className="flex items-end gap-1 pt-2" style={{ height: 140 }}>
                      {salesChart.map((bar) => (
                        <Tooltip key={bar.label}>
                          <TooltipTrigger
                            className="flex h-full flex-1 flex-col justify-end items-center gap-1 cursor-pointer"
                          >
                            <div
                              className="w-full rounded-t bg-amber-500/80 hover:bg-amber-500 active:bg-amber-500"
                              style={{ height: visible ? `${(bar.val / maxLeft) * 100}%` : "0%", transition: "height 3.4s cubic-bezier(0.22, 1, 0.36, 1)", minHeight: bar.val > 0 ? 4 : 0 }}
                            />
                            <span className="text-[9px] text-muted-foreground sm:text-[10px]">{bar.label}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-center">
                            <div className="font-medium">{bar.label}</div>
                            <div>{bar.trx.toLocaleString("id-ID")} transaksi</div>
                            <div>{formatRp(bar.val)}</div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TooltipProvider>
                </CardContent>
              </Card>

              {/* Right chart */}
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold sm:text-sm">{chartTitleRight}</CardTitle>
                </CardHeader>
                <CardContent>
                  <TooltipProvider>
                    <div className="flex items-end gap-1.5 pt-2" style={{ height: 140 }}>
                      {comparisonChart.map((bar) => (
                        <Tooltip key={bar.label}>
                          <TooltipTrigger
                            className="flex h-full flex-1 flex-col justify-end items-center gap-1 cursor-pointer"
                          >
                            <div
                              className="w-full rounded-t bg-primary/70 hover:bg-primary active:bg-primary"
                              style={{ height: visible ? `${(bar.val / maxRight) * 100}%` : "0%", transition: "height 3.6s cubic-bezier(0.22, 1, 0.36, 1) 0.25s", minHeight: bar.val > 0 ? 4 : 0 }}
                            />
                            <span className="text-[9px] text-muted-foreground sm:text-[10px]">{bar.label}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-center">
                            <div className="font-medium">{bar.label}</div>
                            <div>{bar.trx.toLocaleString("id-ID")} transaksi</div>
                            <div>{formatRp(bar.val)}</div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TooltipProvider>
                </CardContent>
              </Card>
            </div>

            {/* Best & Least Seller */}
            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold sm:text-sm">
                    <span className="inline-block size-2 rounded-full bg-emerald-500" /> Best Seller
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {bestSeller.length === 0 ? <p className="text-xs text-muted-foreground">Belum ada data</p> : bestSeller.map((item, i) => (
                    <div key={i}>
                      <div className="mb-1 flex items-center justify-between text-xs"><span className="font-medium">{i + 1}. {item.name}</span><span className="text-muted-foreground">{item.qty} pcs</span></div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500" style={{ width: visible ? `${(item.qty / maxBest) * 100}%` : "0%", transition: `width 3.2s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.32}s` }} /></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold sm:text-sm">
                    <span className="inline-block size-2 rounded-full bg-red-500" /> Least Selling
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {leastSeller.length === 0 ? <p className="text-xs text-muted-foreground">Belum ada data</p> : leastSeller.map((item, i) => (
                    <div key={i}>
                      <div className="mb-1 flex items-center justify-between text-xs"><span className="font-medium">{i + 1}. {item.name}</span><span className="text-muted-foreground">{item.qty} pcs</span></div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-red-400" style={{ width: visible ? `${(item.qty / maxLeast) * 100}%` : "0%", transition: `width 3.2s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.32}s` }} /></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
