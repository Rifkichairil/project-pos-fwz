"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Wallet,
  ArrowUpRight,
  Plus,
  Banknote,
  QrCode,
  Smartphone,
  CalendarDays,
} from "lucide-react";

const periods = [
  { label: "Hari Ini", value: "daily" },
  { label: "Minggu Ini", value: "weekly" },
  { label: "Bulan Ini", value: "monthly" },
  { label: "Tahun Ini", value: "yearly" },
] as const;

/* ───────── Mock Data ───────── */
const stats = [
  {
    label: "Total Revenue Hari Ini",
    value: "Rp. 2.847.000",
    change: "+12% vs kemarin",
    trend: "up" as const,
    icon: DollarSign,
  },
  {
    label: "Total Transaksi",
    value: "48",
    change: "+5 vs kemarin",
    trend: "up" as const,
    icon: ShoppingCart,
  },
  {
    label: "Average Order Value",
    value: "Rp. 59.300",
    change: "+3% vs kemarin",
    trend: "up" as const,
    icon: BarChart3,
  },
  {
    label: "Profit (estimasi)",
    value: "Rp. 1.423.000",
    change: "+8% vs kemarin",
    trend: "up" as const,
    icon: Wallet,
  },
  {
    label: "Growth vs Kemarin",
    value: "+12%",
    change: "Revenue naik signifikan",
    trend: "up" as const,
    icon: TrendingUp,
  },
];

const sales7Days = [
  { day: "Sen", val: 1800000 },
  { day: "Sel", val: 2100000 },
  { day: "Rab", val: 1950000 },
  { day: "Kam", val: 2847000 },
  { day: "Jum", val: 3200000 },
  { day: "Sab", val: 4500000 },
  { day: "Min", val: 3900000 },
];
const max7 = Math.max(...sales7Days.map((d) => d.val));

const salesPerJam = [
  { jam: "08", val: 120 }, { jam: "09", val: 280 }, { jam: "10", val: 450 },
  { jam: "11", val: 620 }, { jam: "12", val: 890 }, { jam: "13", val: 750 },
  { jam: "14", val: 540 }, { jam: "15", val: 380 }, { jam: "16", val: 420 },
  { jam: "17", val: 560 }, { jam: "18", val: 720 }, { jam: "19", val: 640 },
  { jam: "20", val: 480 },
];
const maxJam = Math.max(...salesPerJam.map((d) => d.val));

const bestSellers = [
  { name: "Nasi Goreng", qty: 42, pct: 100 },
  { name: "Es Buah", qty: 36, pct: 86 },
  { name: "Rendang", qty: 28, pct: 67 },
  { name: "Sate Ayam", qty: 24, pct: 57 },
  { name: "Gado-Gado", qty: 19, pct: 45 },
];

const leastSelling = [
  { name: "Es Teler", qty: 3, pct: 7 },
  { name: "Puding Coklat", qty: 5, pct: 12 },
  { name: "Klepon", qty: 6, pct: 14 },
  { name: "Es Doger", qty: 8, pct: 19 },
  { name: "Bubur Sumsum", qty: 9, pct: 21 },
];

const revenueByPayment = [
  { label: "Cash", value: 1423500, pct: 50, icon: Banknote, color: "bg-emerald-500" },
  { label: "QRIS", value: 854100, pct: 30, icon: QrCode, color: "bg-blue-500" },
  { label: "E-Wallet", value: 569400, pct: 20, icon: Smartphone, color: "bg-violet-500" },
];

/* ───────── Helpers ───────── */
function formatRp(n: number) {
  return "Rp. " + n.toLocaleString("id-ID");
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-6">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <Link href="/dashboard/pos">
          <Button className="h-9 gap-2 rounded-xl bg-blue-600 text-sm font-medium hover:bg-blue-700">
            <Plus className="size-4" />
            New Order
          </Button>
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Period Filter */}
        <div className="mb-4 flex items-center gap-2">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 rounded-lg text-xs",
                period === p.value && "bg-primary text-primary-foreground"
              )}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
          <div className="ml-2 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            <span>{new Date().toLocaleDateString("id-ID")}</span>
          </div>
        </div>
        {/* Stats */}
        <div className="mb-6 grid grid-cols-5 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="relative overflow-hidden border-border/60">
              {/* Background Icon */}
              <s.icon
                className="absolute -bottom-1 right-2 size-24 opacity-[0.06]"
                strokeWidth={1.2}
              />
              <CardContent className="relative z-10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{s.label}</span>
                  <div className="flex items-center gap-0.5 text-[11px]">
                    {s.trend === "up" ? (
                      <TrendingUp className="size-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="size-3 text-red-500" />
                    )}
                    <span className={s.trend === "up" ? "text-emerald-600" : "text-red-600"}>
                      {s.change}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-lg font-semibold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Breakdown */}
        <Card className="mb-6 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Revenue Breakdown by Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex h-5 overflow-hidden rounded-full">
              {revenueByPayment.map((p) => (
                <div
                  key={p.label}
                  className={`${p.color} h-full`}
                  style={{ width: `${p.pct}%` }}
                  title={`${p.label}: ${formatRp(p.value)} (${p.pct}%)`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-6">
              {revenueByPayment.map((p) => (
                <div key={p.label} className="flex items-center gap-2">
                  <div className={`size-3 rounded-full ${p.color}`} />
                  <p.icon className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{p.label}</span>
                  <span className="text-xs text-muted-foreground">{formatRp(p.value)} ({p.pct}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          {/* Sales per Hari (7 hari) */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Sales per Hari (7 Hari Terakhir)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 pt-2" style={{ height: 160 }}>
                {sales7Days.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-primary/70 transition-all hover:bg-primary"
                      style={{ height: `${(d.val / max7) * 100}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-muted/30 p-2 text-[11px] text-muted-foreground">
                <ArrowUpRight className="mt-0.5 size-3 shrink-0 text-emerald-500" />
                <span>Sabtu paling rame. Hari ini (Kam) sepi 37% vs Sabtu — pertimbangkan promo sore untuk dorong transaksi.</span>
              </div>
            </CardContent>
          </Card>

          {/* Sales per Jam (hari ini) */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Sales per Jam (Hari Ini)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 pt-2" style={{ height: 160 }}>
                {salesPerJam.map((d) => (
                  <div key={d.jam} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-amber-500/70 transition-all hover:bg-amber-500"
                      style={{ height: `${(d.val / maxJam) * 100}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{d.jam}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-muted/30 p-2 text-[11px] text-muted-foreground">
                <ArrowUpRight className="mt-0.5 size-3 shrink-0 text-amber-500" />
                <span>Peak jam 12 siang (890 trx). Siapkan 2 kasir di jam 11-13 & 17-19 untuk antrian.</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Best & Worst Menu */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          {/* Best Seller */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <span className="inline-block size-2 rounded-full bg-emerald-500" />
                Best Seller
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {bestSellers.map((item, i) => (
                <div key={i}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{i + 1}. {item.name}</span>
                    <span className="text-muted-foreground">{item.qty} pcs</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Least Selling */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <span className="inline-block size-2 rounded-full bg-red-500" />
                Least Selling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {leastSelling.map((item, i) => (
                <div key={i}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{i + 1}. {item.name}</span>
                    <span className="text-muted-foreground">{item.qty} pcs</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-red-400 transition-all"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
