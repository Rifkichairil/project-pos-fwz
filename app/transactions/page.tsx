"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CalendarIcon,
} from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  time: string;
  customer: string;
  handledBy?: string;
  type: string;
  items: number;
  total: number;
  method: "Cash" | "QRIS" | "Debit" | "OVO" | "GoPay" | "Transfer";
  paymentStatus: "Success" | "Pending" | "Failed";
  orderStatus: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled";
}

type TransactionsApiResponse = {
  transactions: Transaction[];
};

const perPage = 10;
type DateFilter = "All" | "Today" | "Weekly" | "Monthly" | "Custom";

const parseTransactionDate = (date: string) => {
  const [day, month, year] = date.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);
  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
};

const isWithinDateFilter = (date: string, dateFilter: DateFilter, customRange: DateRange | undefined) => {
  const transactionDate = parseTransactionDate(date);

  if (dateFilter === "Custom") {
    const fromDate = customRange?.from ? new Date(customRange.from) : null;
    const toDate = customRange?.to ? new Date(customRange.to) : null;

    if (fromDate) fromDate.setHours(0, 0, 0, 0);
    if (toDate) toDate.setHours(0, 0, 0, 0);

    if (fromDate && transactionDate < fromDate) return false;
    if (toDate && transactionDate > toDate) return false;

    return true;
  }

  if (dateFilter === "All") return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dateFilter === "Today") {
    return transactionDate.getTime() === today.getTime();
  }

  if (dateFilter === "Weekly") {
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return transactionDate >= oneWeekAgo && transactionDate <= today;
  }

  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return transactionDate >= oneMonthAgo && transactionDate <= today;
};

const methodIcon = (method: string) => {
  switch (method) {
    case "Cash": return <Banknote className="size-3.5 text-emerald-600" />;
    case "QRIS": return <Smartphone className="size-3.5 text-blue-600" />;
    case "Debit": return <CreditCard className="size-3.5 text-violet-600" />;
    case "OVO": return <Wallet className="size-3.5 text-purple-600" />;
    case "GoPay": return <Wallet className="size-3.5 text-cyan-600" />;
    case "Transfer": return <Wallet className="size-3.5 text-slate-600" />;
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
  const [dateFilter, setDateFilter] = useState<DateFilter>("Today");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTransactions = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const response = await fetch("/api/transactions?limit=30", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load transactions");
      }

      const data = (await response.json()) as TransactionsApiResponse;
      setTransactions(data.transactions || []);
      setError("");
    } catch {
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadTransactions();
    });
  }, [loadTransactions]);

  useEffect(() => {
    const timer = setInterval(() => {
      void loadTransactions(false);
    }, 3000);

    return () => clearInterval(timer);
  }, [loadTransactions]);

  const dateFilteredTransactions = transactions.filter((t) =>
    isWithinDateFilter(t.date, dateFilter, customRange)
  );

  const filtered = dateFilteredTransactions.filter((t) => {
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

  const totalNominal = dateFilteredTransactions.reduce((sum, t) => sum + t.total, 0);
  const successCount = dateFilteredTransactions.filter((t) => t.paymentStatus === "Success").length;
  const pendingCount = dateFilteredTransactions.filter((t) => t.paymentStatus === "Pending").length;
  const failedCount = dateFilteredTransactions.filter((t) => t.paymentStatus === "Failed").length;
  const successNominal = dateFilteredTransactions
    .filter((t) => t.paymentStatus === "Success")
    .reduce((sum, t) => sum + t.total, 0);
  const pendingNominal = dateFilteredTransactions
    .filter((t) => t.paymentStatus === "Pending")
    .reduce((sum, t) => sum + t.total, 0);
  const failedNominal = dateFilteredTransactions
    .filter((t) => t.paymentStatus === "Failed")
    .reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="flex h-full flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <header className="flex h-16 items-center border-b px-4 sm:px-6">
        <h1 className="text-base font-semibold sm:text-lg">Transactions</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Summary */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="animate-slide-up" style={{ animationDelay: '0ms' }}>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="text-lg font-bold">Rp. {totalNominal.toLocaleString("id-ID")}</span>
              <span className="text-[11px] text-muted-foreground">{dateFilteredTransactions.length} transaksi</span>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs text-muted-foreground">Success</span>
              <span className="text-lg font-bold text-emerald-600">Rp. {successNominal.toLocaleString("id-ID")}</span>
              <span className="text-[11px] text-muted-foreground">{successCount} transaksi</span>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs text-muted-foreground">Pending</span>
              <span className="text-lg font-bold text-amber-600">Rp. {pendingNominal.toLocaleString("id-ID")}</span>
              <span className="text-[11px] text-muted-foreground">{pendingCount} transaksi</span>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs text-muted-foreground">Failed</span>
              <span className="text-lg font-bold text-red-600">Rp. {failedNominal.toLocaleString("id-ID")}</span>
              <span className="text-[11px] text-muted-foreground">{failedCount} transaksi</span>
            </CardContent>
          </Card>
        </div>


        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-slide-up" style={{ animationDelay: '250ms' }}>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search ID, customer, method..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border-border bg-muted/50 pl-8 text-xs transition-all duration-200 focus:scale-105"
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 px-3 text-xs" onClick={() => { setSearch(""); setStatusFilter("All"); setDateFilter("Today"); setCustomRange(undefined); setPage(1); }}>
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Date</span>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={dateFilter}
                  onValueChange={(value) => {
                    setDateFilter(value as DateFilter);
                    if (value !== "Custom") {
                      setCustomRange(undefined);
                    }
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[180px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Today">Today</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                {dateFilter === "Custom" && (
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          variant="outline"
                          className="h-8 min-w-[220px] justify-start px-2 text-xs font-normal"
                        />
                      }
                    >
                      <CalendarIcon className="size-3.5" />
                      {customRange?.from ? (
                        customRange.to ? (
                          <>
                            {format(customRange.from, "dd MMM yyyy")} - {format(customRange.to, "dd MMM yyyy")}
                          </>
                        ) : (
                          format(customRange.from, "dd MMM yyyy")
                        )
                      ) : (
                        <span className="text-muted-foreground">Pick a date range</span>
                      )}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        defaultMonth={customRange?.from}
                        selected={customRange}
                        onSelect={(range) => {
                          setCustomRange(range);
                          setPage(1);
                        }}
                        numberOfMonths={2}
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Payment Status</span>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as "All" | "Success" | "Pending" | "Failed");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Success">Success</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <Card className="animate-slide-up" style={{ animationDelay: '300ms' }}>
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
                    <th className="pb-2 font-medium text-left">Handled By</th>
                    <th className="pb-2 font-medium text-left">Type</th>
                    <th className="pb-2 font-medium border-r text-left">Total</th>
                    <th className="pb-2 font-medium text-center">Method</th>
                    <th className="pb-2 font-medium">Payment Status</th>
                    <th className="pb-2 font-medium">Order Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-xs text-muted-foreground">Loading transactions...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-xs text-red-600">{error}</td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-xs text-muted-foreground">No transactions found.</td>
                    </tr>
                  ) : (
                    paginated.map((t, index) => (
                      <tr
                        key={t.id}
                        className="hover:bg-muted/30 transition-all duration-200 animate-slide-up"
                        style={{ animationDelay: `${350 + index * 30}ms` }}
                      >
                        <td className="py-2.5 text-left font-medium">{t.id}</td>
                        <td className="py-2.5 text-left text-muted-foreground">{t.date}, {t.time}</td>
                        <td className="py-2.5 text-left">{t.customer}</td>
                        <td className="py-2.5 text-left text-muted-foreground">{t.handledBy || "-"}</td>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filtered.length > perPage && (
              <div className="mt-4 flex items-center justify-between animate-slide-up" style={{ animationDelay: '650ms' }}>
                <span className="text-xs text-muted-foreground">
                  Showing {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 transition-all duration-200 hover:scale-110 active:scale-95"
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
                      className={cn(
                        "h-7 min-w-7 px-1.5 text-xs transition-all duration-200 hover:scale-110 active:scale-95",
                        safePage === p ? "bg-slate-600 hover:bg-slate-700" : ""
                      )}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 transition-all duration-200 hover:scale-110 active:scale-95"
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
