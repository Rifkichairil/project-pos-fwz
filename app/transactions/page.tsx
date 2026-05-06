"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Receipt,
  RotateCcw,
  Wallet,
  Smartphone,
  CreditCard,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  date: string;
  time: string;
  customer: string;
  type: string;
  items: number;
  total: number;
  method: "Cash" | "QRIS" | "Debit" | "OVO" | "GoPay";
  paymentStatus: "Success" | "Pending" | "Failed";
  orderStatus: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled";
}

const mockTransactions: Transaction[] = [
  { id: "TRX-2026-0001", date: "05-05-2026", time: "10:23", customer: "Budi Santoso", type: "Dine in", items: 3, total: 85000, method: "Cash", paymentStatus: "Success", orderStatus: "Completed" },
  { id: "TRX-2026-0002", date: "05-05-2026", time: "10:45", customer: "Siti Aminah", type: "Takeaway", items: 2, total: 52000, method: "QRIS", paymentStatus: "Success", orderStatus: "Completed" },
  { id: "TRX-2026-0003", date: "05-05-2026", time: "11:12", customer: "Ahmad Hidayat", type: "Delivery", items: 5, total: 128000, method: "GoPay", paymentStatus: "Pending", orderStatus: "Pending" },
  { id: "TRX-2026-0004", date: "05-05-2026", time: "11:38", customer: "Dewi Kusuma", type: "Dine in", items: 4, total: 96000, method: "Debit", paymentStatus: "Success", orderStatus: "Preparing" },
  { id: "TRX-2026-0005", date: "05-05-2026", time: "12:05", customer: "Rudi Hartono", type: "Takeaway", items: 2, total: 45000, method: "OVO", paymentStatus: "Failed", orderStatus: "Cancelled" },
  { id: "TRX-2026-0006", date: "05-05-2026", time: "12:30", customer: "Lina Marlina", type: "Dine in", items: 6, total: 142000, method: "Cash", paymentStatus: "Success", orderStatus: "Completed" },
  { id: "TRX-2026-0007", date: "05-05-2026", time: "13:15", customer: "Juna Wok", type: "Delivery", items: 3, total: 75000, method: "QRIS", paymentStatus: "Pending", orderStatus: "Pending" },
  { id: "TRX-2026-0008", date: "05-05-2026", time: "13:42", customer: "Jung Kit", type: "Takeaway", items: 2, total: 52000, method: "GoPay", paymentStatus: "Success", orderStatus: "Completed" },
  { id: "TRX-2026-0009", date: "05-05-2026", time: "14:10", customer: "John Pantau", type: "Dine in", items: 5, total: 128000, method: "Debit", paymentStatus: "Success", orderStatus: "Ready" },
  { id: "TRX-2026-0010", date: "05-05-2026", time: "14:55", customer: "Jane Doe", type: "Takeaway", items: 1, total: 26000, method: "OVO", paymentStatus: "Failed", orderStatus: "Cancelled" },
  { id: "TRX-2026-0011", date: "05-05-2026", time: "15:20", customer: "Bob Smith", type: "Dine in", items: 4, total: 96000, method: "Cash", paymentStatus: "Success", orderStatus: "Preparing" },
  { id: "TRX-2026-0012", date: "05-05-2026", time: "16:00", customer: "Alice Chan", type: "Delivery", items: 2, total: 45000, method: "QRIS", paymentStatus: "Success", orderStatus: "Completed" },
  { id: "TRX-2026-0013", date: "05-05-2026", time: "16:45", customer: "Budi Santoso", type: "Dine in", items: 3, total: 85000, method: "GoPay", paymentStatus: "Pending", orderStatus: "Pending" },
  { id: "TRX-2026-0014", date: "05-05-2026", time: "17:10", customer: "Siti Aminah", type: "Takeaway", items: 2, total: 52000, method: "Debit", paymentStatus: "Success", orderStatus: "Completed" },
  { id: "TRX-2026-0015", date: "05-05-2026", time: "17:40", customer: "Ahmad Hidayat", type: "Dine in", items: 5, total: 128000, method: "OVO", paymentStatus: "Success", orderStatus: "Ready" },
  { id: "TRX-2026-0016", date: "05-05-2026", time: "18:05", customer: "Dewi Kusuma", type: "Delivery", items: 4, total: 96000, method: "Cash", paymentStatus: "Success", orderStatus: "Completed" },
  { id: "TRX-2026-0017", date: "05-05-2026", time: "18:35", customer: "Rudi Hartono", type: "Dine in", items: 2, total: 45000, method: "QRIS", paymentStatus: "Failed", orderStatus: "Cancelled" },
  { id: "TRX-2026-0018", date: "05-05-2026", time: "19:00", customer: "Lina Marlina", type: "Takeaway", items: 3, total: 72000, method: "GoPay", paymentStatus: "Success", orderStatus: "Completed" },
  { id: "TRX-2026-0019", date: "05-05-2026", time: "19:30", customer: "Juna Wok", type: "Dine in", items: 4, total: 110000, method: "Debit", paymentStatus: "Pending", orderStatus: "Preparing" },
  { id: "TRX-2026-0020", date: "05-05-2026", time: "20:00", customer: "Jung Kit", type: "Delivery", items: 2, total: 58000, method: "OVO", paymentStatus: "Success", orderStatus: "Completed" },
];

const perPage = 10;

const methodIcon = (method: string) => {
  switch (method) {
    case "Cash": return <Banknote className="size-3.5 text-emerald-600" />;
    case "QRIS": return <Smartphone className="size-3.5 text-blue-600" />;
    case "Debit": return <CreditCard className="size-3.5 text-violet-600" />;
    case "OVO": return <Wallet className="size-3.5 text-purple-600" />;
    case "GoPay": return <Wallet className="size-3.5 text-cyan-600" />;
    default: return <Receipt className="size-3.5 text-muted-foreground" />;
  }
};

const paymentStatusBadge = (status: string) => {
  switch (status) {
    case "Success": return (
      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-600 text-[10px]">
        Success
      </Badge>
    );
    case "Pending": return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-600 text-[10px]">
        Pending
      </Badge>
    );
    case "Failed": return (
      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-[10px]">
        Failed
      </Badge>
    );
    default: return null;
  }
};

const orderStatusBadge = (status: string) => {
  switch (status) {
    case "Pending": return (
      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[10px]">
        Pending
      </Badge>
    );
    case "Preparing": return (
      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-600 text-[10px]">
        Preparing
      </Badge>
    );
    case "Ready": return (
      <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-600 text-[10px]">
        Ready
      </Badge>
    );
    case "Completed": return (
      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-600 text-[10px]">
        Completed
      </Badge>
    );
    case "Cancelled": return (
      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-[10px]">
        Cancelled
      </Badge>
    );
    default: return null;
  }
};

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Success" | "Pending" | "Failed">("All");
  const [page, setPage] = useState(1);

  const filtered = mockTransactions.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.customer.toLowerCase().includes(search.toLowerCase()) ||
      t.method.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || t.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
        <h1 className="text-base font-semibold sm:text-lg">Transactions</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => { setSearch(""); setStatusFilter("All"); setPage(1); }}>
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Summary */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs text-muted-foreground">Total Transactions</span>
              <span className="text-lg font-bold">{mockTransactions.length}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs text-muted-foreground">Success</span>
              <span className="text-lg font-bold text-emerald-600">{mockTransactions.filter(t => t.paymentStatus === "Success").length}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs text-muted-foreground">Pending</span>
              <span className="text-lg font-bold text-amber-600">{mockTransactions.filter(t => t.paymentStatus === "Pending").length}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs text-muted-foreground">Failed</span>
              <span className="text-lg font-bold text-red-600">{mockTransactions.filter(t => t.paymentStatus === "Failed").length}</span>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown by Payment */}
        <div className="mb-4">
          <h2 className="mb-3 text-sm font-semibold">Revenue Breakdown by Payment</h2>
          {(() => {
            const methods = ["Cash","QRIS","Debit","OVO","GoPay"] as const;
            const colors: Record<string, string> = {
              Cash: "bg-emerald-500",
              QRIS: "bg-blue-500",
              Debit: "bg-violet-500",
              OVO: "bg-purple-500",
              GoPay: "bg-cyan-500",
            };
            const grandTotal = mockTransactions.reduce((s, t) => s + t.total, 0);
            const breakdown = methods.map((m) => {
              const total = mockTransactions
                .filter((t) => t.method === m)
                .reduce((sum, t) => sum + t.total, 0);
              const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
              return { method: m, total, pct };
            });
            return (
              <div>
                <div className="flex h-5 w-full overflow-hidden rounded-full">
                  {breakdown.map(({ method, pct }) => (
                    <div
                      key={method}
                      className={cn("h-full", colors[method])}
                      style={{ width: `${pct}%` }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {breakdown.map(({ method, total, pct }) => (
                    <div key={method} className="flex items-center gap-1.5 text-xs">
                      <span className={cn("inline-block size-2.5 rounded-full", colors[method])} />
                      <span className="text-muted-foreground">{methodIcon(method)}</span>
                      <span className="font-medium">{method}</span>
                      <span className="text-muted-foreground">
                        Rp {total.toLocaleString("id-ID")} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search ID, customer, method..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border-border bg-muted/50 pl-8 text-xs"
            />
          </div>
          <div className="flex gap-1.5">
            {(["All", "Success", "Pending", "Failed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  statusFilter === s
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Transaction List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-175 text-center text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 font-medium text-left">Transaction ID</th>
                    <th className="pb-2 font-medium text-left">Date & Time</th>
                    <th className="pb-2 font-medium text-left">Customer</th>
                    <th className="pb-2 font-medium text-left">Type</th>
                    <th className="pb-2 font-medium border-r text-left">Total</th>
                    <th className="pb-2 font-medium text-center">Method</th>
                    <th className="pb-2 font-medium">Payment Status</th>
                    <th className="pb-2 font-medium">Order Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginated.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 text-left font-medium">{t.id}</td>
                      <td className="py-2.5 text-left text-muted-foreground">{t.date}, {t.time}</td>
                      <td className="py-2.5 text-left">{t.customer}</td>
                      <td className="py-2.5 text-left text-muted-foreground">{t.type}</td>
                      <td className="py-2.5 text-left font-semibold">Rp {t.total.toLocaleString("id-ID")}</td>
                      <td className="py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {methodIcon(t.method)}
                          <span className="text-muted-foreground">{t.method}</span>
                        </div>
                      </td>
                      <td className="py-2.5">{paymentStatusBadge(t.paymentStatus)}</td>
                      <td className="py-2.5">{orderStatusBadge(t.orderStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filtered.length > perPage && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Showing {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="size-3.5" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={safePage === p ? "default" : "outline"}
                      size="sm"
                      className={cn("h-7 min-w-7 px-1.5 text-xs", safePage === p ? "bg-blue-600 hover:bg-blue-700" : "")}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
