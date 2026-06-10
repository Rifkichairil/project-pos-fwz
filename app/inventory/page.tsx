"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Receipt,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  FileText,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { exportInventoryPDF, exportInventoryExcel } from "@/lib/export-inventory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MovementType = "in" | "out" | "adjustment";
type MovementTypeFilter = "all" | MovementType;

type IngredientData = {
  id: number;
  name: string;
  unit: string;
  price: number;
  supplier: string;
  stock: number;
  minStock: number;
  in30d: number;
  out30d: number;
};

type PurchaseData = {
  id: string;
  date: string;
  item: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
  supplier: string;
};

type MovementData = {
  id: string;
  date: string;
  item: string;
  type: MovementType;
  qty: number;
  unit: string;
  ref: string;
  user: string;
};

type InventoryApiResponse = {
  ingredients: IngredientData[];
  purchases: PurchaseData[];
  movements: MovementData[];
};

/* ─── Helpers ─── */

const formatRp = (n: number) => `Rp. ${n.toLocaleString("id-ID")}`;

function getPurchaseSequence(id: string) {
  const match = id.match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function getMovementSequence(id: string) {
  const match = id.match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function paginateData<T>(data: T[], page: number, perPage: number) {
  const totalPages = Math.max(1, Math.ceil(data.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginated = data.slice((safePage - 1) * perPage, safePage * perPage);

  return { totalPages, safePage, paginated };
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("stock");

  const [ingredientsData, setIngredientsData] = useState<IngredientData[]>([]);
  const [purchasesData, setPurchasesData] = useState<PurchaseData[]>([]);
  const [movementsData, setMovementsData] = useState<MovementData[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [showAddMovement, setShowAddMovement] = useState(false);

  const [newIngredient, setNewIngredient] = useState({ name: "", unit: "", price: "", supplier: "", stock: "", minStock: "" });
  const [newPurchase, setNewPurchase] = useState({ item: "", qty: "", unit: "", price: "", supplier: "", date: "" });
  const [newMovement, setNewMovement] = useState({ item: "", type: "in" as "in" | "out", qty: "", unit: "", ref: "", user: "" });

  const [stockPage, setStockPage] = useState(1);
  const [purchasePage, setPurchasePage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);
  const [movementTypeFilter, setMovementTypeFilter] = useState<MovementTypeFilter>("all");
  const perPage = 20;

  const closeAllModals = () => {
    setShowAddIngredient(false);
    setShowAddPurchase(false);
    setShowAddMovement(false);
    setNewIngredient({ name: "", unit: "", price: "", supplier: "", stock: "", minStock: "" });
    setNewPurchase({ item: "", qty: "", unit: "", price: "", supplier: "", date: "" });
    setNewMovement({ item: "", type: "in" as "in" | "out", qty: "", unit: "", ref: "", user: "" });
  };

  const loadInventory = useCallback(async () => {
    try {
      const response = await fetch("/api/inventory", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch inventory");
      }

      const data = (await response.json()) as InventoryApiResponse;
      setIngredientsData(data.ingredients);
      setPurchasesData(data.purchases);
      setMovementsData(data.movements);
      setErrorMessage("");
    } catch {
      setErrorMessage("Failed to load inventory data");
    }
  }, []);

  const formatPrice = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (!digits) return "";
    return Number(digits).toLocaleString("id-ID");
  };

  const parsePrice = (val: string) => Number(val.replace(/\./g, ""));

  const clampQty = (val: string) => {
    const num = Number(val.replace(/\D/g, ""));
    if (!val) return "";
    return String(Math.max(1, num));
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAllModals();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadInventory();
    });
  }, [loadInventory]);

  const filteredIngredients = ingredientsData.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = ingredientsData.filter((i) => i.stock <= i.minStock);

  const filteredPurchases = purchasesData
    .filter((p) =>
      p.item.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
    );

  const filteredMovements = movementsData
    .filter((m) => movementTypeFilter === "all" || m.type === movementTypeFilter)
    .filter((m) =>
      m.item.toLowerCase().includes(search.toLowerCase()) ||
      m.ref.toLowerCase().includes(search.toLowerCase()) ||
      m.user.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase())
    );

  const stockPagination = paginateData(filteredIngredients, stockPage, perPage);
  const purchasePagination = paginateData(filteredPurchases, purchasePage, perPage);
  const movementPagination = paginateData(filteredMovements, movementPage, perPage);

  const handleAddIngredient = async () => {
    if (!newIngredient.name || !newIngredient.unit || !newIngredient.price || !newIngredient.stock) return;
    const totalPrice = parsePrice(newIngredient.price);
    const stock = Number(newIngredient.stock);
    const pricePerUnit = stock > 0 ? Math.round(totalPrice / stock) : 0;
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addIngredient",
          name: newIngredient.name,
          unit: newIngredient.unit,
          price: pricePerUnit,
          supplier: newIngredient.supplier,
          stock: stock,
          minStock: Number(newIngredient.minStock) || 0,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { toast.error(data.error || "Gagal menambah ingredient"); return; }
      toast.success("Ingredient berhasil ditambahkan!");
      closeAllModals();
      void loadInventory();
    } catch {
      toast.error("Gagal menambah ingredient");
    }
  };

  const handleAddPurchase = async () => {
    if (!newPurchase.item || !newPurchase.qty || !newPurchase.price) return;
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addPurchase",
          item: newPurchase.item,
          qty: Number(newPurchase.qty),
          pricePerUnit: parsePrice(newPurchase.price),
          supplier: newPurchase.supplier,
          date: newPurchase.date || undefined,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { toast.error(data.error || "Gagal menambah purchase"); return; }
      toast.success("Purchase berhasil ditambahkan!");
      setPurchasePage(1);
      closeAllModals();
      void loadInventory();
    } catch {
      toast.error("Gagal menambah purchase");
    }
  };

  const handleAddMovement = async () => {
    if (!newMovement.item || !newMovement.qty) return;
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addMovement",
          ingredientName: newMovement.item,
          qty: Number(newMovement.qty),
          type: newMovement.type,
          unit: newMovement.unit || undefined,
          ref: newMovement.ref || undefined,
          user: newMovement.user || undefined,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { toast.error(data.error || "Gagal menambah movement"); return; }
      toast.success("Stock movement berhasil ditambahkan!");
      setMovementPage(1);
      closeAllModals();
      void loadInventory();
    } catch {
      toast.error("Gagal menambah movement");
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
        <h1 className="text-base font-semibold sm:text-lg">Inventory</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg text-xs"
            onClick={() => void loadInventory()}
          >
            <RefreshCw className="size-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg text-xs"
            onClick={() => void exportInventoryExcel(ingredientsData, purchasesData, movementsData, activeTab)}
          >
            <FileText className="size-3.5" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg text-xs"
            onClick={() => exportInventoryPDF(ingredientsData, purchasesData, movementsData, activeTab)}
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button
            className="h-8 gap-2 rounded-xl bg-primary px-3 text-xs font-medium hover:bg-primary/90 sm:h-9 sm:px-4 sm:text-sm"
            onClick={() => {
              if (activeTab === "stock") setShowAddIngredient(true);
              else if (activeTab === "purchase") setShowAddPurchase(true);
              else if (activeTab === "movement") setShowAddMovement(true);
            }}
          >
            <Plus className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline">
              {activeTab === "stock" && "Add Ingredient"}
              {activeTab === "purchase" && "Add Purchase"}
              {activeTab === "movement" && "Add Movement"}
            </span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex gap-1 border-b px-4 pt-4 sm:px-6">
          <button
            onClick={() => {
              setActiveTab("stock");
              setStockPage(1);
            }}
            className={cn(
              "rounded-t-lg px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-colors",
              activeTab === "stock"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Package className="mr-1.5 inline size-3.5" /> Stock Management
          </button>
          <button
            onClick={() => {
              setActiveTab("purchase");
              setPurchasePage(1);
            }}
            className={cn(
              "rounded-t-lg px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-colors",
              activeTab === "purchase"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Receipt className="mr-1.5 inline size-3.5" /> Purchase
          </button>
          <button
            onClick={() => {
              setActiveTab("movement");
              setMovementPage(1);
            }}
            className={cn(
              "rounded-t-lg px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-colors",
              activeTab === "movement"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <ArrowLeftRight className="mr-1.5 inline size-3.5" /> Stock Movement
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 pt-4 sm:px-6">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search ingredient, supplier..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setStockPage(1);
                setPurchasePage(1);
                setMovementPage(1);
              }}
              className="h-9 w-full rounded-lg border-border bg-muted/50 pl-8 text-xs"
            />
          </div>
        </div>

        <div className="px-4 pt-2 sm:px-6">
          {errorMessage && <p className="mt-1 text-xs text-red-600">{errorMessage}</p>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* ─── Stock Management ─── */}
          {activeTab === "stock" && (
            <>
            {/* Alert Cards */}
            {lowStock.length > 0 && (
              <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {lowStock.map((i) => (
                  <Card key={i.id} className="border-red-200 bg-red-50/50">
                    <CardContent className="p-2 sm:p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="size-3 text-red-500" />
                            <span className="text-[10px] font-semibold text-red-700">Low Stock</span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] font-bold sm:text-xs">{i.name}</p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {i.stock.toLocaleString("id-ID")} {i.unit} (min: {i.minStock.toLocaleString("id-ID")})
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 shrink-0 border-red-300 px-2 text-[10px] text-red-700 hover:bg-red-100"
                          onClick={() => {
                            setActiveTab("purchase");
                            setShowAddPurchase(true);
                            setNewPurchase({ ...newPurchase, item: i.name, unit: i.unit });
                          }}
                        >
                          Purchase
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Stock Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Mobile card view */}
                <div className="space-y-3 md:hidden">
                  {stockPagination.paginated.map((i) => {
                    const isLow = i.stock <= i.minStock;
                    return (
                      <div key={i.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{i.name}</span>
                          {isLow ? (
                            <Badge variant="outline" className="border-red-200 bg-red-50 text-[10px] text-red-600">
                              <AlertTriangle className="mr-1 size-3" /> Low
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-600">
                              OK
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div><span className="text-muted-foreground">Satuan:</span> <span className="font-medium">{i.unit}</span></div>
                          <div><span className="text-muted-foreground">Harga:</span> <span className="font-medium">{formatRp(i.price)}/{i.unit}</span></div>
                          <div><span className="text-muted-foreground">Supplier:</span> <span className="font-medium">{i.supplier}</span></div>
                          <div><span className="text-muted-foreground">Minimum:</span> <span className="font-medium">{i.minStock.toLocaleString("id-ID")} {i.unit}</span></div>
                          <div><span className="text-muted-foreground">Stok:</span> <span className={cn("font-semibold", isLow ? "text-red-600" : "text-emerald-600")}>{i.stock.toLocaleString("id-ID")} {i.unit}</span></div>
                          <div className="flex gap-3">
                            <span className="text-emerald-600 flex items-center gap-0.5"><ArrowDownLeft className="size-3" />{i.in30d.toLocaleString("id-ID")}</span>
                            <span className="text-red-500 flex items-center gap-0.5"><ArrowUpRight className="size-3" />{i.out30d.toLocaleString("id-ID")}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Desktop table view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="pb-2 font-medium">Nama Bahan</th>
                        <th className="pb-2 font-medium">Satuan</th>
                        <th className="pb-2 font-medium">Harga Beli</th>
                        <th className="pb-2 font-medium">Supplier</th>
                        <th className="pb-2 font-medium">Stok Saat Ini</th>
                        <th className="pb-2 font-medium">Minimum</th>
                        <th className="pb-2 font-medium">Masuk (30d)</th>
                        <th className="pb-2 font-medium">Keluar (30d)</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                    {stockPagination.paginated.map((i) => {
                      const isLow = i.stock <= i.minStock;
                      return (
                        <tr key={i.id}>
                          <td className="py-2.5 font-medium">{i.name}</td>
                          <td className="py-2.5 text-muted-foreground">{i.unit}</td>
                          <td className="py-2.5">{formatRp(i.price)} / {i.unit}</td>
                          <td className="py-2.5 text-muted-foreground">{i.supplier}</td>
                          <td className={cn("py-2.5 font-semibold", isLow ? "text-red-600" : "text-emerald-600")}>
                            {i.stock.toLocaleString("id-ID")} {i.unit}
                          </td>
                          <td className="py-2.5 text-muted-foreground">{i.minStock.toLocaleString("id-ID")} {i.unit}</td>
                          <td className="py-2.5 text-emerald-600">
                            <span className="flex items-center gap-1">
                              <ArrowDownLeft className="size-3" />
                              {i.in30d.toLocaleString("id-ID")} {i.unit}
                            </span>
                          </td>
                          <td className="py-2.5 text-red-500">
                            <span className="flex items-center gap-1">
                              <ArrowUpRight className="size-3" />
                              {i.out30d.toLocaleString("id-ID")} {i.unit}
                            </span>
                          </td>
                          <td className="py-2.5">
                            {isLow ? (
                              <Badge variant="outline" className="border-red-200 bg-red-50 text-[10px] text-red-600">
                                <AlertTriangle className="mr-1 size-3" /> Low
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-600">
                                OK
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
                {filteredIngredients.length > perPage && (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Showing {(stockPagination.safePage - 1) * perPage + 1}–{Math.min(stockPagination.safePage * perPage, filteredIngredients.length)} of {filteredIngredients.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled={stockPagination.safePage <= 1}
                        onClick={() => setStockPage(stockPagination.safePage - 1)}
                      >
                        <ChevronLeft className="size-3.5" />
                      </Button>
                      {Array.from({ length: stockPagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={stockPagination.safePage === page ? "default" : "outline"}
                          size="sm"
                          className={cn("h-7 min-w-[28px] px-1.5 text-xs", stockPagination.safePage === page ? "bg-slate-600 hover:bg-slate-700" : "")}
                          onClick={() => setStockPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled={stockPagination.safePage >= stockPagination.totalPages}
                        onClick={() => setStockPage(stockPagination.safePage + 1)}
                      >
                        <ChevronRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            </>
          )}

          {/* ─── Purchase ─── */}
          {activeTab === "purchase" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Purchase History</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Mobile card view */}
                <div className="space-y-3 md:hidden">
                  {purchasePagination.paginated.map((p) => (
                    <div key={p.id} className="rounded-lg border p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-primary">{p.id}</span>
                        <span className="text-[11px] text-muted-foreground">{p.date}</span>
                      </div>
                      <p className="text-sm font-medium">{p.item}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><span className="text-muted-foreground">Qty:</span> <span className="font-medium">{p.qty.toLocaleString("id-ID")} {p.unit}</span></div>
                        <div><span className="text-muted-foreground">Harga:</span> <span className="font-medium">{formatRp(p.price)}/{p.unit}</span></div>
                        <div><span className="text-muted-foreground">Total:</span> <span className="font-semibold">{formatRp(p.total)}</span></div>
                        <div><span className="text-muted-foreground">Supplier:</span> <span className="font-medium">{p.supplier}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop table view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="pb-2 font-medium">ID PO</th>
                        <th className="pb-2 font-medium">Tanggal</th>
                        <th className="pb-2 font-medium">Item</th>
                        <th className="pb-2 font-medium">Qty</th>
                        <th className="pb-2 font-medium">Harga / Unit</th>
                        <th className="pb-2 font-medium">Total</th>
                        <th className="pb-2 font-medium">Supplier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                    {purchasePagination.paginated.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 font-medium">{p.id}</td>
                        <td className="py-2.5 text-muted-foreground">{p.date}</td>
                        <td className="py-2.5">{p.item}</td>
                        <td className="py-2.5">{p.qty.toLocaleString("id-ID")} {p.unit}</td>
                        <td className="py-2.5">{formatRp(p.price)} / {p.unit}</td>
                        <td className="py-2.5 font-semibold">{formatRp(p.total)}</td>
                        <td className="py-2.5 text-muted-foreground">{p.supplier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                {filteredPurchases.length > perPage && (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Showing {(purchasePagination.safePage - 1) * perPage + 1}–{Math.min(purchasePagination.safePage * perPage, filteredPurchases.length)} of {filteredPurchases.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled={purchasePagination.safePage <= 1}
                        onClick={() => setPurchasePage(purchasePagination.safePage - 1)}
                      >
                        <ChevronLeft className="size-3.5" />
                      </Button>
                      {Array.from({ length: purchasePagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={purchasePagination.safePage === page ? "default" : "outline"}
                          size="sm"
                          className={cn("h-7 min-w-[28px] px-1.5 text-xs", purchasePagination.safePage === page ? "bg-slate-600 hover:bg-slate-700" : "")}
                          onClick={() => setPurchasePage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled={purchasePagination.safePage >= purchasePagination.totalPages}
                        onClick={() => setPurchasePage(purchasePagination.safePage + 1)}
                      >
                        <ChevronRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── Stock Movement ─── */}
          {activeTab === "movement" && (
            <Card>
              <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-sm font-semibold">Stock Movement History</CardTitle>
                <Select
                  value={movementTypeFilter}
                  onValueChange={(val) => {
                    if (!val) return;
                    setMovementTypeFilter(val as MovementTypeFilter);
                    setMovementPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[150px] rounded-lg text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="in">Masuk</SelectItem>
                    <SelectItem value="out">Keluar</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {/* Mobile card view */}
                <div className="space-y-3 md:hidden">
                  {movementPagination.paginated.map((m) => (
                    <div key={m.id} className="rounded-lg border p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{m.id}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            m.type === "in"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                              : m.type === "out"
                                ? "border-red-200 bg-red-50 text-red-600"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                          )}
                        >
                          {m.type === "in" ? "Masuk" : m.type === "out" ? "Keluar" : "Adjustment"}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{m.item}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><span className="text-muted-foreground">Tanggal:</span> <span className="font-medium">{m.date}</span></div>
                        <div>
                          <span className="text-muted-foreground">Qty:</span>{" "}
                          <span className={cn("font-semibold", m.type === "in" ? "text-emerald-600" : m.type === "out" ? "text-red-600" : "text-amber-700")}>
                            {m.type === "in" ? "+" : m.type === "out" ? "-" : "±"}{m.qty.toLocaleString("id-ID")} {m.unit}
                          </span>
                        </div>
                        <div><span className="text-muted-foreground">Ref:</span> <span className="font-medium">{m.ref}</span></div>
                        <div><span className="text-muted-foreground">User:</span> <span className="font-medium">{m.user}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop table view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="pb-2 font-medium">ID</th>
                        <th className="pb-2 font-medium">Tanggal</th>
                        <th className="pb-2 font-medium">Item</th>
                        <th className="pb-2 font-medium">Tipe</th>
                        <th className="pb-2 font-medium">Qty</th>
                        <th className="pb-2 font-medium">Ref</th>
                        <th className="pb-2 font-medium">User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                    {movementPagination.paginated.map((m) => (
                      <tr key={m.id}>
                        <td className="py-2.5 font-medium">{m.id}</td>
                        <td className="py-2.5 text-muted-foreground">{m.date}</td>
                        <td className="py-2.5">{m.item}</td>
                        <td className="py-2.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              m.type === "in"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                : m.type === "out"
                                  ? "border-red-200 bg-red-50 text-red-600"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                            )}
                          >
                            {m.type === "in" ? (
                              <ArrowDownLeft className="mr-1 size-3" />
                            ) : (
                              <ArrowUpRight className="mr-1 size-3" />
                            )}
                            {m.type === "in" ? "Masuk" : m.type === "out" ? "Keluar" : "Adjustment"}
                          </Badge>
                        </td>
                        <td
                          className={cn(
                            "py-2.5 font-semibold",
                            m.type === "in" ? "text-emerald-600" : m.type === "out" ? "text-red-600" : "text-amber-700"
                          )}
                        >
                          {m.type === "in" ? "+" : m.type === "out" ? "-" : "±"}
                          {m.qty.toLocaleString("id-ID")} {m.unit}
                        </td>
                        <td className="py-2.5 text-muted-foreground">{m.ref}</td>
                        <td className="py-2.5 text-muted-foreground">{m.user}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                {filteredMovements.length > perPage && (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Showing {(movementPagination.safePage - 1) * perPage + 1}–{Math.min(movementPagination.safePage * perPage, filteredMovements.length)} of {filteredMovements.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled={movementPagination.safePage <= 1}
                        onClick={() => setMovementPage(movementPagination.safePage - 1)}
                      >
                        <ChevronLeft className="size-3.5" />
                      </Button>
                      {Array.from({ length: movementPagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={movementPagination.safePage === page ? "default" : "outline"}
                          size="sm"
                          className={cn("h-7 min-w-[28px] px-1.5 text-xs", movementPagination.safePage === page ? "bg-slate-600 hover:bg-slate-700" : "")}
                          onClick={() => setMovementPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled={movementPagination.safePage >= movementPagination.totalPages}
                        onClick={() => setMovementPage(movementPagination.safePage + 1)}
                      >
                        <ChevronRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Ingredient Modal */}
      {showAddIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Ingredient</h2>
              <button onClick={closeAllModals} className="rounded-lg p-1 hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Name</Label>
                <Input placeholder="e.g. Kopi Arabica" value={newIngredient.name} onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Unit</Label>
                  <Select value={newIngredient.unit} onValueChange={(val) => setNewIngredient({ ...newIngredient, unit: val ?? "" })}>
                    <SelectTrigger className="h-8 w-full text-xs">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gram">gram</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="pcs">pcs</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="liter">liter</SelectItem>
                      <SelectItem value="pack">pack</SelectItem>
                      <SelectItem value="box">box</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Stock Awal</Label>
                  <Input placeholder="e.g. 5000" type="number" min={1} value={newIngredient.stock} onChange={(e) => setNewIngredient({ ...newIngredient, stock: clampQty(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Harga Total</Label>
                  <Input placeholder="e.g. 100.000" type="text" inputMode="numeric" value={formatPrice(newIngredient.price)} onChange={(e) => setNewIngredient({ ...newIngredient, price: formatPrice(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Harga per Unit</Label>
                  <Input
                    value={
                      newIngredient.stock && parsePrice(newIngredient.price) > 0
                        ? `Rp. ${Math.round(parsePrice(newIngredient.price) / Number(newIngredient.stock)).toLocaleString("id-ID")} / ${newIngredient.unit || "unit"}`
                        : "-"
                    }
                    disabled
                    className="h-8 w-full rounded-lg text-base md:text-sm bg-muted/50 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Supplier</Label>
                <Select value={newIngredient.supplier} onValueChange={(val) => setNewIngredient({ ...newIngredient, supplier: val ?? "" })}>
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue placeholder="Select supplier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[...new Set(ingredientsData.map(i => i.supplier))].filter(Boolean).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {newIngredient.supplier === "Other" && (
                  <Input placeholder="Enter supplier name" className="mt-2" onChange={(e) => setNewIngredient({ ...newIngredient, supplier: e.target.value })} />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Min Stock</Label>
                <Input placeholder="e.g. 1000" type="number" min={1} value={newIngredient.minStock} onChange={(e) => setNewIngredient({ ...newIngredient, minStock: clampQty(e.target.value) })} />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={closeAllModals}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleAddIngredient}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Purchase Modal */}
      {showAddPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Purchase</h2>
              <button onClick={closeAllModals} className="rounded-lg p-1 hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Item Name</Label>
                <Select value={newPurchase.item} onValueChange={(val) => {
                  if (!val) return;
                  const selected = ingredientsData.find(i => i.name === val);
                  setNewPurchase({
                    ...newPurchase,
                    item: val || "",
                    unit: selected?.unit || newPurchase.unit,
                    price: selected ? selected.price.toLocaleString("id-ID") : newPurchase.price,
                  });
                }}>
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue placeholder="Pilih ingredient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredientsData.map((i) => (
                      <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Quantity</Label>
                  <Input placeholder="e.g. 5000" type="number" min={1} value={newPurchase.qty} onChange={(e) => setNewPurchase({ ...newPurchase, qty: clampQty(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Unit</Label>
                  <Input
                    value={newPurchase.unit || "-"}
                    disabled
                    className="h-8 w-full rounded-lg text-base md:text-sm bg-muted/50 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-muted-foreground">Otomatis dari ingredient</p>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Price per Unit</Label>
                <Input placeholder="e.g. 50.000" type="text" inputMode="numeric" value={formatPrice(newPurchase.price)} onChange={(e) => setNewPurchase({ ...newPurchase, price: formatPrice(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Supplier</Label>
                <Select value={newPurchase.supplier} onValueChange={(val) => setNewPurchase({ ...newPurchase, supplier: val ?? "" })}>
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue placeholder="Select supplier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[...new Set(ingredientsData.map(i => i.supplier))].filter(Boolean).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {newPurchase.supplier === "Other" && (
                  <Input placeholder="Enter supplier name" className="mt-2" onChange={(e) => setNewPurchase({ ...newPurchase, supplier: e.target.value })} />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Date</Label>
                <Input type="date" value={newPurchase.date} onChange={(e) => setNewPurchase({ ...newPurchase, date: e.target.value })} />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={closeAllModals}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleAddPurchase}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Movement Modal */}
      {showAddMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Stock Movement</h2>
              <button onClick={closeAllModals} className="rounded-lg p-1 hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Item Name</Label>
                <Select value={newMovement.item} onValueChange={(val) => {
                  if (!val) return;
                  const ing = ingredientsData.find(i => i.name === val);
                  setNewMovement({ ...newMovement, item: val || "", unit: ing?.unit || newMovement.unit });
                }}>
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue placeholder="Select ingredient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredientsData.map((i) => (
                      <SelectItem key={i.id} value={i.name}>{i.name} ({i.stock} {i.unit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Type</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewMovement({ ...newMovement, type: "in" })}
                    className={cn("flex-1 rounded-lg border py-2 text-sm font-medium", newMovement.type === "in" ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "")}
                  >
                    In (Masuk)
                  </button>
                  <button
                    onClick={() => setNewMovement({ ...newMovement, type: "out" })}
                    className={cn("flex-1 rounded-lg border py-2 text-sm font-medium", newMovement.type === "out" ? "border-red-200 bg-red-50 text-red-600" : "")}
                  >
                    Out (Keluar)
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Quantity</Label>
                  <Input placeholder="e.g. 500" type="number" min={1} value={newMovement.qty} onChange={(e) => setNewMovement({ ...newMovement, qty: clampQty(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Unit</Label>
                  <Input
                    value={newMovement.unit || "-"}
                    disabled
                    className="h-8 w-full rounded-lg text-base md:text-sm bg-muted/50 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Reference</Label>
                <Input placeholder="e.g. PO-2026-001" value={newMovement.ref} onChange={(e) => setNewMovement({ ...newMovement, ref: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">User</Label>
                <Select value={newMovement.user} onValueChange={(val) => setNewMovement({ ...newMovement, user: val ?? "" })}>
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue placeholder="Select user..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Budi">Budi</SelectItem>
                    <SelectItem value="Rudi">Rudi</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={closeAllModals}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleAddMovement}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* End Modals */}
    </div>
  );
}
