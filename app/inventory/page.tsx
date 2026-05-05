"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Boxes,
  Receipt,
  ArrowLeftRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Mock Data ─── */

const ingredients = [
  { id: 1, name: "Kopi Arabica", unit: "gram", price: 120000, supplier: "PT Kopi Nusantara", stock: 3500, minStock: 1000 },
  { id: 2, name: "Susu Full Cream", unit: "ml", price: 15000, supplier: "Indofood", stock: 8000, minStock: 2000 },
  { id: 3, name: "Gula Pasir", unit: "gram", price: 12000, supplier: "Gulaku", stock: 12000, minStock: 5000 },
  { id: 4, name: "Es Batu", unit: "kg", price: 8000, supplier: "CV Aneka Es", stock: 200, minStock: 50 },
  { id: 5, name: "Nasi", unit: "gram", price: 10000, supplier: "PT Beras Jaya", stock: 25000, minStock: 10000 },
  { id: 6, name: "Ayam Fillet", unit: "gram", price: 35000, supplier: "PT Sumber Protein", stock: 4500, minStock: 2000 },
  { id: 7, name: "Minyak Goreng", unit: "ml", price: 18000, supplier: "Bimoli", stock: 6000, minStock: 3000 },
  { id: 8, name: "Telur", unit: "pcs", price: 2500, supplier: "Peternakan Sejahtera", stock: 300, minStock: 100 },
];

const purchases = [
  { id: "PO-2026-001", date: "03 Mei 2026", item: "Kopi Arabica", qty: 5000, unit: "gram", price: 120000, total: 600000, supplier: "PT Kopi Nusantara" },
  { id: "PO-2026-002", date: "02 Mei 2026", item: "Susu Full Cream", qty: 10000, unit: "ml", price: 15000, total: 150000, supplier: "Indofood" },
  { id: "PO-2026-003", date: "28 Apr 2026", item: "Gula Pasir", qty: 15000, unit: "gram", price: 12000, total: 180000, supplier: "Gulaku" },
  { id: "PO-2026-004", date: "25 Apr 2026", item: "Ayam Fillet", qty: 5000, unit: "gram", price: 35000, total: 175000, supplier: "PT Sumber Protein" },
];

const stockMovements = [
  { id: "MV-001", date: "03 Mei 2026", item: "Kopi Arabica", type: "out" as const, qty: 250, unit: "gram", ref: "Order #TX4491", user: "Budi" },
  { id: "MV-002", date: "03 Mei 2026", item: "Susu Full Cream", type: "out" as const, qty: 500, unit: "ml", ref: "Order #TX4491", user: "Budi" },
  { id: "MV-003", date: "02 Mei 2026", item: "Kopi Arabica", type: "in" as const, qty: 5000, unit: "gram", ref: "PO-2026-001", user: "Admin" },
  { id: "MV-004", date: "02 Mei 2026", item: "Susu Full Cream", type: "in" as const, qty: 10000, unit: "ml", ref: "PO-2026-002", user: "Admin" },
  { id: "MV-005", date: "01 Mei 2026", item: "Gula Pasir", type: "out" as const, qty: 300, unit: "gram", ref: "Waste/Rusak", user: "Rudi" },
  { id: "MV-006", date: "01 Mei 2026", item: "Nasi", type: "out" as const, qty: 2000, unit: "gram", ref: "Order #TX4490", user: "Budi" },
];

/* ─── Helpers ─── */

const formatRp = (n: number) => `Rp. ${n.toLocaleString("id-ID")}`;

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ingredients");

  const [ingredientsData, setIngredientsData] = useState(ingredients);
  const [purchasesData, setPurchasesData] = useState(purchases);
  const [movementsData, setMovementsData] = useState(stockMovements);

  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [showAddMovement, setShowAddMovement] = useState(false);
  const [showRestock, setShowRestock] = useState(false);

  const [newIngredient, setNewIngredient] = useState({ name: "", unit: "", price: "", supplier: "", stock: "", minStock: "" });
  const [newPurchase, setNewPurchase] = useState({ item: "", qty: "", unit: "", price: "", supplier: "", date: "" });
  const [newMovement, setNewMovement] = useState({ item: "", type: "in" as "in" | "out", qty: "", unit: "", ref: "", user: "" });
  const [restock, setRestock] = useState({ ingredientId: "", qty: "", ref: "" });

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

  const filteredIngredients = ingredientsData.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = ingredientsData.filter((i) => i.stock <= i.minStock);

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
    closeAllModals();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
        <h1 className="text-base font-semibold sm:text-lg">Inventory</h1>
        <Button
          className="h-8 gap-2 rounded-xl bg-blue-600 px-3 text-xs font-medium hover:bg-blue-700 sm:h-9 sm:px-4 sm:text-sm"
          onClick={() => {
            if (activeTab === "ingredients") setShowAddIngredient(true);
            else if (activeTab === "purchase") setShowAddPurchase(true);
            else if (activeTab === "movement") setShowAddMovement(true);
            else if (activeTab === "stock") setShowRestock(true);
          }}
        >
          <Plus className="size-3.5 sm:size-4" />
          <span className="hidden sm:inline">
            {activeTab === "ingredients" && "Add Ingredient"}
            {activeTab === "purchase" && "Add Purchase"}
            {activeTab === "movement" && "Add Movement"}
            {activeTab === "stock" && "Restock"}
          </span>
          <span className="sm:hidden">Add</span>
        </Button>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b px-4 pt-2 sm:px-6">
          <TabsList className="h-9 rounded-none bg-transparent p-0 flex-wrap">
            <TabsTrigger
              value="ingredients"
              className="rounded-none border-b-2 border-transparent px-3 pb-2 pt-1 text-xs font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:text-sm"
            >
              <Boxes className="mr-1.5 size-3.5" /> Master Bahan
            </TabsTrigger>
            <TabsTrigger
              value="stock"
              className="rounded-none border-b-2 border-transparent px-3 pb-2 pt-1 text-xs font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:text-sm"
            >
              <Package className="mr-1.5 size-3.5" /> Stock Management
            </TabsTrigger>
            <TabsTrigger
              value="purchase"
              className="rounded-none border-b-2 border-transparent px-3 pb-2 pt-1 text-xs font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:text-sm"
            >
              <Receipt className="mr-1.5 size-3.5" /> Purchase
            </TabsTrigger>
            <TabsTrigger
              value="movement"
              className="rounded-none border-b-2 border-transparent px-3 pb-2 pt-1 text-xs font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:text-sm"
            >
              <ArrowLeftRight className="mr-1.5 size-3.5" /> Stock Movement
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Search bar */}
        <div className="px-4 pt-4 sm:px-6">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search ingredient, supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border-border bg-muted/50 pl-8 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* ─── Master Bahan ─── */}
          <TabsContent value="ingredients" className="m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Master Bahan</CardTitle>
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
                        <th className="pb-2 font-medium">Stok</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                    {filteredIngredients.map((i) => {
                      const isLow = i.stock <= i.minStock;
                      return (
                        <tr key={i.id} className="group">
                          <td className="py-2.5 font-medium">{i.name}</td>
                          <td className="py-2.5 text-muted-foreground">{i.unit}</td>
                          <td className="py-2.5">{formatRp(i.price)} / {i.unit}</td>
                          <td className="py-2.5 text-muted-foreground">{i.supplier}</td>
                          <td className="py-2.5">{i.stock.toLocaleString("id-ID")} {i.unit}</td>
                          <td className="py-2.5">
                            {isLow ? (
                              <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-[10px]">
                                <AlertTriangle className="mr-1 size-3" /> Low
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-600 text-[10px]">
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Stock Management ─── */}
          <TabsContent value="stock" className="m-0 space-y-4">
            {/* Alert Cards */}
            {lowStock.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {lowStock.map((i) => (
                  <Card key={i.id} className="border-red-200 bg-red-50/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="size-4 text-red-500" />
                        <span className="text-xs font-semibold text-red-700">Low Stock</span>
                      </div>
                      <p className="mt-1 text-sm font-bold">{i.name}</p>
                      <p className="text-[11px] text-muted-foreground">{i.stock.toLocaleString("id-ID")} {i.unit} (min: {i.minStock.toLocaleString("id-ID")})</p>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-[11px] border-red-300 text-red-700 hover:bg-red-100">
                        Restock
                      </Button>
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
                        <th className="pb-2 font-medium">Stok Saat Ini</th>
                        <th className="pb-2 font-medium">Minimum</th>
                        <th className="pb-2 font-medium">Masuk (30d)</th>
                        <th className="pb-2 font-medium">Keluar (30d)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                    {filteredIngredients.map((i) => (
                      <tr key={i.id}>
                        <td className="py-2.5 font-medium">{i.name}</td>
                        <td className={cn("py-2.5 font-semibold", i.stock <= i.minStock ? "text-red-600" : "text-emerald-600")}>
                          {i.stock.toLocaleString("id-ID")} {i.unit}
                        </td>
                        <td className="py-2.5 text-muted-foreground">{i.minStock.toLocaleString("id-ID")} {i.unit}</td>
                        <td className="py-2.5 text-emerald-600">
                          <span className="flex items-center gap-1">
                            <ArrowDownLeft className="size-3" />
                            {(i.stock * 0.4).toFixed(0)} {i.unit}
                          </span>
                        </td>
                        <td className="py-2.5 text-red-500">
                          <span className="flex items-center gap-1">
                            <ArrowUpRight className="size-3" />
                            {(i.stock * 0.25).toFixed(0)} {i.unit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Purchase ─── */}
          <TabsContent value="purchase" className="m-0">
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
                    {purchasesData.map((p) => (
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Stock Movement ─── */}
          <TabsContent value="movement" className="m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Stock Movement History</CardTitle>
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
                    {movementsData.map((m) => (
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
                                : "border-red-200 bg-red-50 text-red-600"
                            )}
                          >
                            {m.type === "in" ? (
                              <ArrowDownLeft className="mr-1 size-3" />
                            ) : (
                              <ArrowUpRight className="mr-1 size-3" />
                            )}
                            {m.type === "in" ? "Masuk" : "Keluar"}
                          </Badge>
                        </td>
                        <td className={cn("py-2.5 font-semibold", m.type === "in" ? "text-emerald-600" : "text-red-600")}>
                          {m.type === "in" ? "+" : "-"}{m.qty.toLocaleString("id-ID")} {m.unit}
                        </td>
                        <td className="py-2.5 text-muted-foreground">{m.ref}</td>
                        <td className="py-2.5 text-muted-foreground">{m.user}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

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
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleAddIngredient}>Save</Button>
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
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleAddPurchase}>Save</Button>
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
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleAddMovement}>Save</Button>
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
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleRestock}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
