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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [showRestock, setShowRestock] = useState(false);

  const [newIngredient, setNewIngredient] = useState({ name: "", unit: "", price: "", supplier: "", stock: "", minStock: "" });
  const [newPurchase, setNewPurchase] = useState({ item: "", qty: "", unit: "", price: "", supplier: "", date: "" });
  const [newMovement, setNewMovement] = useState({ item: "", type: "in" as "in" | "out", qty: "", unit: "", ref: "", user: "" });
  const [restock, setRestock] = useState({ ingredientId: "", qty: "", ref: "" });

  const [stockPage, setStockPage] = useState(1);
  const [purchasePage, setPurchasePage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);
  const [movementTypeFilter, setMovementTypeFilter] = useState<MovementTypeFilter>("all");
  const perPage = 8;

  const closeAllModals = () => {
    setShowAddIngredient(false);
    setShowAddPurchase(false);
    setShowAddMovement(false);
    setShowRestock(false);
    setNewIngredient({ name: "", unit: "", price: "", supplier: "", stock: "", minStock: "" });
    setNewPurchase({ item: "", qty: "", unit: "", price: "", supplier: "", date: "" });
    setNewMovement({ item: "", type: "in" as "in" | "out", qty: "", unit: "", ref: "", user: "" });
    setRestock({ ingredientId: "", qty: "", ref: "" });
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
    )
    .sort((a, b) => getPurchaseSequence(b.id) - getPurchaseSequence(a.id));

  const filteredMovements = movementsData
    .filter((m) => movementTypeFilter === "all" || m.type === movementTypeFilter)
    .filter((m) =>
      m.item.toLowerCase().includes(search.toLowerCase()) ||
      m.ref.toLowerCase().includes(search.toLowerCase()) ||
      m.user.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => getMovementSequence(b.id) - getMovementSequence(a.id));

  const stockPagination = paginateData(filteredIngredients, stockPage, perPage);
  const purchasePagination = paginateData(filteredPurchases, purchasePage, perPage);
  const movementPagination = paginateData(filteredMovements, movementPage, perPage);

  const handleAddIngredient = () => {
    if (!newIngredient.name || !newIngredient.unit || !newIngredient.price) return;
    const id = Math.max(...ingredientsData.map(i => i.id), 0) + 1;
    setIngredientsData([...ingredientsData, {
      id,
      name: newIngredient.name,
      unit: newIngredient.unit,
      price: parsePrice(newIngredient.price),
      supplier: newIngredient.supplier,
      stock: Number(newIngredient.stock) || 0,
      minStock: Number(newIngredient.minStock) || 0,
    }]);
    closeAllModals();
  };

  const handleAddPurchase = () => {
    if (!newPurchase.item || !newPurchase.qty || !newPurchase.price) return;
    const id = `PO-2026-${String(purchasesData.length + 1).padStart(3, "0")}`;
    const qty = Number(newPurchase.qty);
    const price = parsePrice(newPurchase.price);
    setPurchasesData([...purchasesData, {
      id,
      date: newPurchase.date || new Date().toLocaleDateString("id-ID"),
      item: newPurchase.item,
      qty,
      unit: newPurchase.unit || "pcs",
      price,
      total: qty * price,
      supplier: newPurchase.supplier || "-",
    }]);
    setPurchasePage(1);
    closeAllModals();
  };

  const handleAddMovement = () => {
    if (!newMovement.item || !newMovement.qty) return;
    const id = `MV-${String(movementsData.length + 1).padStart(3, "0")}`;
    setMovementsData([...movementsData, {
      id,
      date: new Date().toLocaleDateString("id-ID"),
      item: newMovement.item,
      type: newMovement.type,
      qty: Number(newMovement.qty),
      unit: newMovement.unit || "pcs",
      ref: newMovement.ref || "-",
      user: newMovement.user || "Admin",
    }]);
    setMovementPage(1);
    closeAllModals();
  };

  const handleRestock = () => {
    if (!restock.ingredientId || !restock.qty) return;
    const qty = Number(restock.qty);
    const ing = ingredientsData.find(i => i.id === Number(restock.ingredientId));
    if (!ing) return;
    setIngredientsData(ingredientsData.map(i =>
      i.id === Number(restock.ingredientId) ? { ...i, stock: i.stock + qty } : i
    ));
    const id = `MV-${String(movementsData.length + 1).padStart(3, "0")}`;
    setMovementsData([...movementsData, {
      id,
      date: new Date().toLocaleDateString("id-ID"),
      item: ing.name,
      type: "in" as const,
      qty,
      unit: ing.unit,
      ref: restock.ref || "Restock",
      user: "Admin",
    }]);
    setMovementPage(1);
    closeAllModals();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
        <h1 className="text-base font-semibold sm:text-lg">Inventory</h1>
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
              <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
                            setRestock({ ingredientId: String(i.id), qty: "", ref: "" });
                            setShowRestock(true);
                          }}
                        >
                          Restock
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
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left text-xs">
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
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-xs">
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
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-8 rounded-xl border px-3 text-xs",
                      movementTypeFilter === "all"
                        ? "border-[#de9a6a] bg-[#fff2e8] text-[#c46f35] hover:bg-[#ffecde]"
                        : "border-[#e2c8b7] bg-[#f8f3ef] text-[#9c6a4f] hover:bg-[#f2e7e0]"
                    )}
                    onClick={() => {
                      setMovementTypeFilter("all");
                      setMovementPage(1);
                    }}
                  >
                    Semua
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-8 rounded-xl border px-3 text-xs",
                      movementTypeFilter === "in"
                        ? "border-[#de9a6a] bg-[#fff2e8] text-[#c46f35] hover:bg-[#ffecde]"
                        : "border-[#e2c8b7] bg-[#f8f3ef] text-[#9c6a4f] hover:bg-[#f2e7e0]"
                    )}
                    onClick={() => {
                      setMovementTypeFilter("in");
                      setMovementPage(1);
                    }}
                  >
                    Masuk
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-8 rounded-xl border px-3 text-xs",
                      movementTypeFilter === "out"
                        ? "border-[#de9a6a] bg-[#fff2e8] text-[#c46f35] hover:bg-[#ffecde]"
                        : "border-[#e2c8b7] bg-[#f8f3ef] text-[#9c6a4f] hover:bg-[#f2e7e0]"
                    )}
                    onClick={() => {
                      setMovementTypeFilter("out");
                      setMovementPage(1);
                    }}
                  >
                    Keluar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-8 rounded-xl border px-3 text-xs",
                      movementTypeFilter === "adjustment"
                        ? "border-[#de9a6a] bg-[#fff2e8] text-[#c46f35] hover:bg-[#ffecde]"
                        : "border-[#e2c8b7] bg-[#f8f3ef] text-[#9c6a4f] hover:bg-[#f2e7e0]"
                    )}
                    onClick={() => {
                      setMovementTypeFilter("adjustment");
                      setMovementPage(1);
                    }}
                  >
                    Adjustment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left text-xs">
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
                  <select
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={newIngredient.unit}
                    onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option value="gram">gram</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                    <option value="pack">pack</option>
                    <option value="box">box</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Price</Label>
                  <Input placeholder="e.g. 50.000" type="text" inputMode="numeric" value={formatPrice(newIngredient.price)} onChange={(e) => setNewIngredient({ ...newIngredient, price: formatPrice(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Supplier</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={newIngredient.supplier}
                  onChange={(e) => setNewIngredient({ ...newIngredient, supplier: e.target.value })}
                >
                  <option value="">Select supplier...</option>
                  {[...new Set(ingredientsData.map(i => i.supplier))].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {newIngredient.supplier === "Other" && (
                  <Input placeholder="Enter supplier name" className="mt-2" value={newIngredient.supplier === "Other" ? "" : newIngredient.supplier} onChange={(e) => setNewIngredient({ ...newIngredient, supplier: e.target.value })} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Stock</Label>
                  <Input placeholder="e.g. 5000" type="number" min={1} value={newIngredient.stock} onChange={(e) => setNewIngredient({ ...newIngredient, stock: clampQty(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Min Stock</Label>
                  <Input placeholder="e.g. 1000" type="number" min={1} value={newIngredient.minStock} onChange={(e) => setNewIngredient({ ...newIngredient, minStock: clampQty(e.target.value) })} />
                </div>
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
                <Input placeholder="e.g. Kopi Arabica" value={newPurchase.item} onChange={(e) => setNewPurchase({ ...newPurchase, item: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Quantity</Label>
                  <Input placeholder="e.g. 5000" type="number" min={1} value={newPurchase.qty} onChange={(e) => setNewPurchase({ ...newPurchase, qty: clampQty(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Unit</Label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={newPurchase.unit}
                    onChange={(e) => setNewPurchase({ ...newPurchase, unit: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option value="gram">gram</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                    <option value="pack">pack</option>
                    <option value="box">box</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Price per Unit</Label>
                <Input placeholder="e.g. 50.000" type="text" inputMode="numeric" value={formatPrice(newPurchase.price)} onChange={(e) => setNewPurchase({ ...newPurchase, price: formatPrice(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Supplier</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={newPurchase.supplier}
                  onChange={(e) => setNewPurchase({ ...newPurchase, supplier: e.target.value })}
                >
                  <option value="">Select supplier...</option>
                  {[...new Set(ingredientsData.map(i => i.supplier))].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {newPurchase.supplier === "Other" && (
                  <Input placeholder="Enter supplier name" className="mt-2" value={newPurchase.supplier === "Other" ? "" : newPurchase.supplier} onChange={(e) => setNewPurchase({ ...newPurchase, supplier: e.target.value })} />
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
                <select
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={newMovement.item}
                  onChange={(e) => {
                    const ing = ingredientsData.find(i => i.name === e.target.value);
                    setNewMovement({ ...newMovement, item: e.target.value, unit: ing?.unit || newMovement.unit });
                  }}
                >
                  <option value="">Select ingredient...</option>
                  {ingredientsData.map((i) => (
                    <option key={i.id} value={i.name}>{i.name} ({i.stock} {i.unit})</option>
                  ))}
                </select>
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
                  <select
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={newMovement.unit}
                    onChange={(e) => setNewMovement({ ...newMovement, unit: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option value="gram">gram</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                    <option value="pack">pack</option>
                    <option value="box">box</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Reference</Label>
                <Input placeholder="e.g. PO-2026-001" value={newMovement.ref} onChange={(e) => setNewMovement({ ...newMovement, ref: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">User</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={newMovement.user}
                  onChange={(e) => setNewMovement({ ...newMovement, user: e.target.value })}
                >
                  <option value="">Select user...</option>
                  <option value="Admin">Admin</option>
                  <option value="Budi">Budi</option>
                  <option value="Rudi">Rudi</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={closeAllModals}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleAddMovement}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Restock Ingredient</h2>
              <button onClick={closeAllModals} className="rounded-lg p-1 hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Ingredient</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={restock.ingredientId}
                  onChange={(e) => setRestock({ ...restock, ingredientId: e.target.value })}
                >
                  <option value="">Select ingredient...</option>
                  {ingredientsData.map((i) => (
                    <option key={i.id} value={i.id}>{i.name} ({i.stock} {i.unit})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                  <Label className="text-xs font-medium">Quantity</Label>
                  <Input placeholder="e.g. 1000" type="number" min={1} value={restock.qty} onChange={(e) => setRestock({ ...restock, qty: clampQty(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Reference</Label>
                <Input placeholder="e.g. Restock manual" value={restock.ref} onChange={(e) => setRestock({ ...restock, ref: e.target.value })} />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={closeAllModals}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleRestock}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
