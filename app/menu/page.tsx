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
  Calculator,
  TrendingUp,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
  Pencil,
  Upload,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface IngredientPrice {
  unit: string;
  price: number;
  supplier: string | null;
  stock: number;
}

interface RecipeIngredient {
  name: string;
  qty: number;
  unit: string;
}

interface Recipe {
  id: number;
  name: string;
  category: string;
  ingredients: RecipeIngredient[];
}

interface Product {
  id: number;
  name: string;
  category: string;
  hpp: number;
  price: number;
  imageUrl?: string | null;
  addons?: Array<{ id: number; name: string; price: number }>;
}

interface MenuApiResponse {
  recipes: Recipe[];
  products: Product[];
  ingredients: Array<IngredientPrice & { name: string }>;
}

const initialRecipes: Recipe[] = [];
const initialProducts: Product[] = [];


/* ─── Helpers ─── */

const formatRp = (n: number) => `Rp. ${Math.round(n).toLocaleString("id-ID")}`;

function calcHPP(ingredients: RecipeIngredient[], ingredientPrices: Record<string, IngredientPrice>) {
  return ingredients.reduce((sum, ing) => {
    const p = ingredientPrices[ing.name]?.price ?? 0;
    return sum + ing.qty * p;
  }, 0);
}

function calcMargin(hpp: number, price: number) {
  if (hpp <= 0) return 0;
  return ((price - hpp) / hpp) * 100;
}

function marginStatus(margin: number): { label: string; color: string; textColor: string; borderColor: string } {
  if (margin >= 100) return { label: "Very Good", color: "bg-emerald-50", textColor: "text-emerald-600", borderColor: "border-emerald-200" };
  if (margin >= 80) return { label: "Good", color: "bg-blue-50", textColor: "text-blue-600", borderColor: "border-blue-200" };
  if (margin >= 50) return { label: "Normal", color: "bg-slate-50", textColor: "text-slate-600", borderColor: "border-slate-200" };
  if (margin >= 30) return { label: "Low", color: "bg-amber-50", textColor: "text-amber-600", borderColor: "border-amber-200" };
  return { label: "Critical", color: "bg-red-50", textColor: "text-red-600", borderColor: "border-red-200" };
}

export default function MenuRecipePage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"recipe" | "pricing" | "addon">("recipe");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [recipesData, setRecipesData] = useState<Recipe[]>(initialRecipes);
  const [productsData, setProductsData] = useState<Product[]>(initialProducts);
  const [ingredientPrices, setIngredientPrices] = useState<Record<string, IngredientPrice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [pricingPage, setPricingPage] = useState(1);
  const pricingPerPage = 20;
  const [newMenu, setNewMenu] = useState({
    name: "",
    category: "Main Dish",
    price: "",
    imageUrl: "" as string,
    imageFile: null as File | null,
    ingredients: [{ name: "", qty: "", unit: "" }] as { name: string; qty: string; unit: string }[],
    addonIds: [] as number[],
  });

  // Addon master data
  const [addonsData, setAddonsData] = useState<Array<{ id: number; name: string; price: number }>>([]);
  const [showAddAddon, setShowAddAddon] = useState(false);
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState("");
  const [addonPage, setAddonPage] = useState(1);
  const addonPerPage = 20;

  // Edit menu state
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [editMenu, setEditMenu] = useState({
    id: 0,
    name: "",
    category: "Main Dish",
    price: "",
    imageUrl: "" as string,
    imageFile: null as File | null,
    ingredients: [{ name: "", qty: "", unit: "" }] as { name: string; qty: string; unit: string }[],
    addonIds: [] as number[],
  });

  const filteredRecipes = recipesData.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = productsData.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const pricingTotalPages = Math.max(1, Math.ceil(filteredProducts.length / pricingPerPage));
  const paginatedProducts = filteredProducts.slice(
    (pricingPage - 1) * pricingPerPage,
    pricingPage * pricingPerPage
  );

  const loadMenuData = useCallback(async () => {
    try {
      const [menuRes, addonsRes] = await Promise.all([
        fetch("/api/menu", { cache: "no-store" }),
        fetch("/api/addons", { cache: "no-store" }),
      ]);

      if (!menuRes.ok) throw new Error("Failed to fetch menu data");

      const data = (await menuRes.json()) as MenuApiResponse;
      setRecipesData(data.recipes);
      setProductsData(data.products);
      setIngredientPrices(
        data.ingredients.reduce<Record<string, IngredientPrice>>((acc, ingredient) => {
          acc[ingredient.name] = {
            unit: ingredient.unit,
            price: ingredient.price,
            supplier: ingredient.supplier,
            stock: ingredient.stock,
          };
          return acc;
        }, {})
      );
      setSelectedRecipe((prev) => {
        if (!prev) return prev;
        const latestRecipe = data.recipes.find((recipe) => recipe.id === prev.id);
        if (!latestRecipe) {
          setSidebarOpen(false);
          return null;
        }
        return latestRecipe;
      });

      if (addonsRes.ok) {
        const addonsJson = (await addonsRes.json()) as { addons: Array<{ id: number; name: string; price: number }> };
        setAddonsData(addonsJson.addons || []);
      }

      setErrorMessage("");
    } catch {
      setErrorMessage("Failed to load menu data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadMenuData();
    });
  }, [loadMenuData]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAddMenu(false);
        setShowEditMenu(false);
        setShowAddAddon(false);
        setNewMenu({ name: "", category: "Main Dish", price: "", imageUrl: "", imageFile: null, ingredients: [{ name: "", qty: "", unit: "" }], addonIds: [] });
        setEditMenu({ id: 0, name: "", category: "Main Dish", price: "", imageUrl: "", imageFile: null, ingredients: [{ name: "", qty: "", unit: "" }], addonIds: [] });
        setNewAddonName("");
        setNewAddonPrice("");
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const [menuUploading, setMenuUploading] = useState(false);

  const handleAddMenu = async () => {
    if (!newMenu.name || !newMenu.price) return;

    const validIngredients = newMenu.ingredients
      .filter((ing) => ing.name && ing.qty)
      .map((ing) => ({
        name: ing.name,
        qty: Number(ing.qty),
        unit: ing.unit || ingredientPrices[ing.name]?.unit || "pcs",
      }))
      .filter((ing) => Number.isFinite(ing.qty) && ing.qty > 0);

    if (validIngredients.length === 0) return;

    try {
      // Upload image if selected
      let imageUrl: string | null = null;
      if (newMenu.imageFile) {
        setMenuUploading(true);
        const { uploadMenuImage } = await import("@/lib/upload-helper");
        imageUrl = await uploadMenuImage(newMenu.imageFile);
        setMenuUploading(false);
      }

      const response = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMenu.name,
          category: newMenu.category,
          price: Number(newMenu.price),
          imageUrl,
          ingredients: validIngredients,
          addonIds: newMenu.addonIds,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setErrorMessage(data.error || "Failed to create menu");
        return;
      }

      toast.success("Menu berhasil ditambahkan!");
      setIsLoading(true);
      await loadMenuData();

      setNewMenu({
        name: "",
        category: "Main Dish",
        price: "",
        imageUrl: "",
        imageFile: null,
        ingredients: [{ name: "", qty: "", unit: "" }],
        addonIds: [],
      });
      setShowAddMenu(false);
    } catch (err) {
      setMenuUploading(false);
      setErrorMessage(err instanceof Error ? err.message : "Failed to create menu");
    }
  };

  const updateIngredient = (index: number, field: "name" | "qty" | "unit", value: string) => {
    const updated = [...newMenu.ingredients];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "name" && value) {
      updated[index].unit = ingredientPrices[value]?.unit || "";
    }
    setNewMenu({ ...newMenu, ingredients: updated });
  };

  const addIngredientRow = () => {
    setNewMenu({ ...newMenu, ingredients: [...newMenu.ingredients, { name: "", qty: "", unit: "" }] });
  };

  const removeIngredientRow = (index: number) => {
    const updated = newMenu.ingredients.filter((_, i) => i !== index);
    if (updated.length === 0) {
      setNewMenu({ ...newMenu, ingredients: [{ name: "", qty: "", unit: "" }] });
    } else {
      setNewMenu({ ...newMenu, ingredients: updated });
    }
  };

  const handleAddAddon = async () => {
    if (!newAddonName.trim()) return;
    try {
      const res = await fetch("/api/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAddonName.trim(), price: Number(newAddonPrice) || 0 }),
      });
      const data = await res.json() as { error?: string; addon?: { id: number; name: string; price: number } };
      if (!res.ok) {
        toast.error(data.error || "Gagal menambah addon");
        return;
      }
      if (data.addon) {
        setAddonsData((prev) => [...prev, data.addon!]);
      }
      setNewAddonName("");
      setNewAddonPrice("");
      setShowAddAddon(false);
      toast.success("Addon berhasil ditambahkan!");
    } catch {
      toast.error("Gagal menambah addon");
    }
  };

  const handleDeleteAddon = async (id: number) => {
    try {
      const res = await fetch(`/api/addons?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Gagal menghapus addon");
        return;
      }
      setAddonsData((prev) => prev.filter((a) => a.id !== id));
      toast.success("Addon dihapus");
    } catch {
      toast.error("Gagal menghapus addon");
    }
  };

  const openEditMenu = (recipe: Recipe) => {
    const product = productsData.find((p) => p.id === recipe.id);
    setEditMenu({
      id: recipe.id,
      name: recipe.name,
      category: recipe.category,
      price: product?.price?.toString() || "",
      imageUrl: product?.imageUrl || "",
      imageFile: null,
      ingredients: recipe.ingredients.map((ing) => ({
        name: ing.name,
        qty: ing.qty.toString(),
        unit: ing.unit,
      })),
      addonIds: product?.addons?.map((a) => a.id) || [],
    });
    setShowEditMenu(true);
  };

  const updateEditIngredient = (index: number, field: "name" | "qty" | "unit", value: string) => {
    const updated = [...editMenu.ingredients];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "name" && value) {
      updated[index].unit = ingredientPrices[value]?.unit || "";
    }
    setEditMenu({ ...editMenu, ingredients: updated });
  };

  const addEditIngredientRow = () => {
    setEditMenu({ ...editMenu, ingredients: [...editMenu.ingredients, { name: "", qty: "", unit: "" }] });
  };

  const removeEditIngredientRow = (index: number) => {
    const updated = editMenu.ingredients.filter((_, i) => i !== index);
    if (updated.length === 0) {
      setEditMenu({ ...editMenu, ingredients: [{ name: "", qty: "", unit: "" }] });
    } else {
      setEditMenu({ ...editMenu, ingredients: updated });
    }
  };

  const handleEditMenu = async () => {
    if (!editMenu.name || !editMenu.price) return;

    const validIngredients = editMenu.ingredients
      .filter((ing) => ing.name && ing.qty)
      .map((ing) => ({
        name: ing.name,
        qty: Number(ing.qty),
        unit: ing.unit || ingredientPrices[ing.name]?.unit || "pcs",
      }))
      .filter((ing) => Number.isFinite(ing.qty) && ing.qty > 0);

    if (validIngredients.length === 0) return;

    try {
      // Upload new image if selected
      let imageUrl: string | null | undefined = undefined;
      if (editMenu.imageFile) {
        setMenuUploading(true);
        const { uploadMenuImage } = await import("@/lib/upload-helper");
        imageUrl = await uploadMenuImage(editMenu.imageFile);
        setMenuUploading(false);
      } else if (editMenu.imageUrl === "") {
        // Image was removed
        imageUrl = null;
      }

      const response = await fetch("/api/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editMenu.id,
          name: editMenu.name,
          category: editMenu.category,
          price: Number(editMenu.price),
          imageUrl,
          ingredients: validIngredients,
          addonIds: editMenu.addonIds,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        toast.error(data.error || "Failed to update menu");
        return;
      }

      toast.success("Menu updated successfully!");
      setShowEditMenu(false);
      setIsLoading(true);
      await loadMenuData();
    } catch (err) {
      setMenuUploading(false);
      toast.error(err instanceof Error ? err.message : "Failed to update menu");
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
        <h1 className="text-base font-semibold sm:text-lg">Menu & Recipe Management</h1>
        <Button
          className="h-8 gap-2 rounded-xl bg-primary px-3 text-xs font-medium hover:bg-primary/90 sm:h-9 sm:px-4 sm:text-sm"
          onClick={() => setShowAddMenu(true)}
          disabled={isLoading}
        >
          <Plus className="size-3.5 sm:size-4" />
          <span className="hidden sm:inline">Add Menu</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b px-4 pt-4 sm:px-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <button
          onClick={() => {
            setActiveTab("recipe");
            setPricingPage(1);
          }}
          className={cn(
            "rounded-t-lg px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95",
            activeTab === "recipe"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          Recipe (BOM)
        </button>
        <button
          onClick={() => {
            setActiveTab("pricing");
            setPricingPage(1);
          }}
          className={cn(
            "rounded-t-lg px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95",
            activeTab === "pricing"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          Menu Pricing
        </button>
        <button
          onClick={() => setActiveTab("addon")}
          className={cn(
            "rounded-t-lg px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95",
            activeTab === "addon"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Package className="mr-1.5 inline size-3.5" /> Addon
        </button>
      </div>

        {/* Search */}
        <div className="px-4 pt-4 pb-4 sm:px-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search menu..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPricingPage(1);
                }}
                className="h-9 w-full rounded-lg border-border bg-muted/50 pl-8 text-xs transition-all duration-200 focus:scale-105"
              />
            </div>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {isLoading ? "Loading menu..." : `Showing ${filteredRecipes.length} recipes`}
            </p>
          </div>
          {errorMessage && <p className="mt-2 text-xs text-red-600">{errorMessage}</p>}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "recipe" ? (
            <>
              {/* ─── Recipe / BOM ─── */}
              <div className="px-4 py-4 sm:px-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {filteredRecipes.map((recipe, index) => {
                    const hpp = calcHPP(recipe.ingredients, ingredientPrices);
                    return (
                      <Card
                        key={recipe.id}
                        onClick={() => { setSelectedRecipe(recipe); setSidebarOpen(true); }}
                        className={`cursor-pointer border-border/60 transition-all duration-200 hover:border-primary/30 hover:shadow-sm hover:scale-[1.02] animate-slide-up ${
                          selectedRecipe?.id === recipe.id ? "border-primary bg-primary/5" : ""
                        }`}
                        style={{ animationDelay: `${200 + index * 50}ms` }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2.5">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <Calculator className="size-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{recipe.name}</p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0 text-[11px] text-muted-foreground">
                                <span>{recipe.category}</span>
                                <span>· {recipe.ingredients.length} bahan</span>
                              </div>
                              <p className="mt-1 text-xs font-bold"><span className="font-normal text-muted-foreground">HPP </span>{formatRp(hpp)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openEditMenu(recipe); }}
                              className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                              title="Edit menu"
                            >
                              <Pencil className="size-3" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* BOM Detail Modal */}
              {selectedRecipe && sidebarOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSidebarOpen(false)}>
                  <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center gap-3 border-b px-6 py-4">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                        <Calculator className="size-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold">{selectedRecipe.name}</p>
                          <Badge variant="outline" className="text-[10px] border-slate-200 bg-slate-50 text-slate-700">
                            {selectedRecipe.category}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{selectedRecipe.ingredients.length} ingredients · HPP {formatRp(calcHPP(selectedRecipe.ingredients, ingredientPrices))}</p>
                      </div>
                      <button
                        onClick={() => setSidebarOpen(false)}
                        className="flex size-8 items-center justify-center rounded-lg border hover:bg-muted"
                      >
                        <X className="size-4" />
                      </button>
                    </div>

                    {/* BOM Table */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bill of Materials</h3>
                      <div className="overflow-x-auto rounded-lg border border-border/60">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-border/60 bg-muted/50 text-muted-foreground">
                              <th className="px-3 py-2.5 font-medium">Bahan</th>
                              <th className="px-3 py-2.5 font-medium">Supplier</th>
                              <th className="w-16 px-3 py-2.5 font-medium text-center">Qty</th>
                              <th className="w-12 px-3 py-2.5 font-medium text-center">Unit</th>
                              <th className="w-24 px-3 py-2.5 font-medium text-right">Price</th>
                              <th className="w-24 px-3 py-2.5 font-medium text-right">Subtotal</th>
                              <th className="w-16 px-3 py-2.5 font-medium text-right">Cost%</th>
                              <th className="w-20 px-3 py-2.5 font-medium text-right">Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {(() => {
                              const hpp = calcHPP(selectedRecipe.ingredients, ingredientPrices);
                              return selectedRecipe.ingredients.map((ing) => {
                                const ip = ingredientPrices[ing.name];
                                const subtotal = (ip?.price ?? 0) * ing.qty;
                                const costPct = hpp > 0 ? (subtotal / hpp) * 100 : 0;
                                return (
                                  <tr key={ing.name} className="hover:bg-muted/30">
                                    <td className="px-3 py-2.5 font-medium">{ing.name}</td>
                                    <td className="px-3 py-2.5 text-muted-foreground">{ip?.supplier ?? "-"}</td>
                                    <td className="px-3 py-2.5 text-center text-muted-foreground">{ing.qty}</td>
                                    <td className="px-3 py-2.5 text-center text-muted-foreground">{ing.unit}</td>
                                    <td className="px-3 py-2.5 text-right text-muted-foreground">{ip ? formatRp(ip.price) + "/" + ip.unit : "-"}</td>
                                    <td className="px-3 py-2.5 text-right font-semibold">{formatRp(subtotal)}</td>
                                    <td className="px-3 py-2.5 text-right text-muted-foreground">{costPct.toFixed(1)}%</td>
                                    <td className="px-3 py-2.5 text-right text-muted-foreground">{ip?.stock?.toLocaleString("id-ID") ?? "-"}</td>
                                  </tr>
                                );
                              });
                            })()}
                            <tr className="border-t-2 border-border/60 bg-muted/50">
                              <td colSpan={7} className="px-3 py-2.5 text-left">
                                <span className="text-xs font-semibold text-muted-foreground">Total HPP:</span>
                                <span className="ml-2 text-sm font-bold">{formatRp(calcHPP(selectedRecipe.ingredients, ingredientPrices))}</span>
                              </td>
                              <td colSpan={1}></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : activeTab === "pricing" ? (
            <>
              {/* ─── Menu Pricing ─── */}
              <div className="p-4 sm:p-6">
                <Card className="animate-slide-up" style={{ animationDelay: '0ms' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Menu Pricing & Margin</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Mobile card view */}
                    <div className="space-y-3 md:hidden">
                      {paginatedProducts.map((p) => {
                        const margin = calcMargin(p.hpp, p.price);
                        const profit = p.price - p.hpp;
                        const status = marginStatus(margin);
                        return (
                          <div key={p.id} className="rounded-lg border p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold">{p.name}</p>
                                <p className="text-[11px] text-muted-foreground">{p.category}</p>
                              </div>
                              <Badge variant="outline" className={cn("text-[10px]", status.borderColor, status.color, status.textColor)}>
                                {status.label}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                              <div><span className="text-muted-foreground">HPP:</span> <span className="font-medium">{formatRp(p.hpp)}</span></div>
                              <div><span className="text-muted-foreground">Harga Jual:</span> <span className="font-semibold">{formatRp(p.price)}</span></div>
                              <div>
                                <span className="text-muted-foreground">Margin:</span>{" "}
                                <span className={cn("font-semibold", status.textColor)}>{margin.toFixed(0)}%</span>
                              </div>
                              <div><span className="text-muted-foreground">Profit:</span> <span className="font-semibold text-emerald-600">{formatRp(profit)}</span></div>
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
                          <th className="pb-2 font-medium">Menu</th>
                          <th className="pb-2 font-medium">Category</th>
                          <th className="pb-2 font-medium">HPP</th>
                          <th className="pb-2 font-medium">Harga Jual</th>
                          <th className="pb-2 font-medium">Margin</th>
                          <th className="pb-2 font-medium">Keuntungan</th>
                          <th className="pb-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {paginatedProducts.map((p, index) => {
                          const margin = calcMargin(p.hpp, p.price);
                          const profit = p.price - p.hpp;
                          const status = marginStatus(margin);
                          return (
                            <tr key={p.id} className="hover:bg-muted/30 transition-all duration-200 animate-slide-up" style={{ animationDelay: `${50 + index * 30}ms` }}>
                              <td className="py-2.5 font-medium">{p.name}</td>
                              <td className="py-2.5 text-muted-foreground">{p.category}</td>
                              <td className="py-2.5">{formatRp(p.hpp)}</td>
                              <td className="py-2.5 font-semibold">{formatRp(p.price)}</td>
                              <td className="py-2.5">
                                <span className={cn("flex items-center gap-1 font-semibold", status.textColor)}>
                                  <TrendingUp className="size-3" />
                                  {margin.toFixed(0)}%
                                </span>
                              </td>
                              <td className="py-2.5 font-semibold text-emerald-600">{formatRp(profit)}</td>
                              <td className="py-2.5">
                                <Badge variant="outline" className={cn("text-[10px]", status.borderColor, status.color, status.textColor)}>
                                  {status.label}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                    {/* Pagination */}
                    {filteredProducts.length > pricingPerPage && (
                      <div className="mt-4 flex items-center justify-between animate-slide-up" style={{ animationDelay: '350ms' }}>
                        <span className="text-xs text-muted-foreground">
                          Showing {(pricingPage - 1) * pricingPerPage + 1}–{Math.min(pricingPage * pricingPerPage, filteredProducts.length)} of {filteredProducts.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 transition-all duration-200 hover:scale-110 active:scale-95"
                            disabled={pricingPage <= 1}
                            onClick={() => setPricingPage(pricingPage - 1)}
                          >
                            <ChevronLeft className="size-3.5" />
                          </Button>
                          {Array.from({ length: pricingTotalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={pricingPage === page ? "default" : "outline"}
                              size="sm"
                              className={cn(
                                "h-7 min-w-[28px] px-1.5 text-xs transition-all duration-200 hover:scale-110 active:scale-95",
                                pricingPage === page ? "bg-slate-600 hover:bg-slate-700" : ""
                              )}
                              onClick={() => setPricingPage(page)}
                            >
                              {page}
                            </Button>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 transition-all duration-200 hover:scale-110 active:scale-95"
                            disabled={pricingPage >= pricingTotalPages}
                            onClick={() => setPricingPage(pricingPage + 1)}
                          >
                            <ChevronRight className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}

          {/* ─── Addon Master Data ─── */}
          {activeTab === "addon" && (
            <div className="p-4 sm:p-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold">Master Data Addon</CardTitle>
                  <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setShowAddAddon(true)}>
                    <Plus className="size-3.5" /> Tambah Addon
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="pb-2 font-medium">Nama Addon</th>
                          <th className="pb-2 font-medium">Harga</th>
                          <th className="pb-2 font-medium text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {addonsData.length === 0 ? (
                          <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">Belum ada addon</td></tr>
                        ) : (
                          addonsData
                            .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
                            .slice((addonPage - 1) * addonPerPage, addonPage * addonPerPage)
                            .map((addon) => (
                            <tr key={addon.id} className="hover:bg-muted/30">
                              <td className="py-2.5 font-medium">{addon.name}</td>
                              <td className="py-2.5">Rp. {addon.price.toLocaleString("id-ID")}</td>
                              <td className="py-2.5 text-center">
                                <button
                                  onClick={() => handleDeleteAddon(addon.id)}
                                  className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                                  title="Hapus addon"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {(() => {
                    const filteredAddons = addonsData.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
                    const totalAddonPages = Math.max(1, Math.ceil(filteredAddons.length / addonPerPage));
                    if (filteredAddons.length <= addonPerPage) return null;
                    return (
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Showing {(addonPage - 1) * addonPerPage + 1}–{Math.min(addonPage * addonPerPage, filteredAddons.length)} of {filteredAddons.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={addonPage <= 1} onClick={() => setAddonPage(addonPage - 1)}>
                            <ChevronLeft className="size-3.5" />
                          </Button>
                          {Array.from({ length: totalAddonPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={addonPage === page ? "default" : "outline"}
                              size="sm"
                              className={cn("h-7 min-w-[28px] px-1.5 text-xs", addonPage === page ? "bg-slate-600 hover:bg-slate-700" : "")}
                              onClick={() => setAddonPage(page)}
                            >
                              {page}
                            </Button>
                          ))}
                          <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={addonPage >= totalAddonPages} onClick={() => setAddonPage(addonPage + 1)}>
                            <ChevronRight className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Add Addon Modal */}
              {showAddAddon && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="w-full max-w-sm rounded-xl bg-background p-6 shadow-xl">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Tambah Addon</h3>
                      <button onClick={() => { setShowAddAddon(false); setNewAddonName(""); setNewAddonPrice(""); }} className="rounded p-1 hover:bg-muted"><X className="size-4" /></button>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Nama Addon</Label>
                        <Input value={newAddonName} onChange={(e) => setNewAddonName(e.target.value)} placeholder="e.g. Extra Telur" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Harga</Label>
                        <Input type="number" value={newAddonPrice} onChange={(e) => setNewAddonPrice(e.target.value)} placeholder="e.g. 5000" min="0" />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => { setShowAddAddon(false); setNewAddonName(""); setNewAddonPrice(""); }}>Batal</Button>
                        <Button className="flex-1" onClick={handleAddAddon}>Simpan</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      {/* Add Menu Modal */}
      {showAddMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-background shadow-lg">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Add Menu</h2>
              <button onClick={() => { setShowAddMenu(false); setNewMenu({ name: "", category: "Main Dish", price: "", imageUrl: "", imageFile: null, ingredients: [{ name: "", qty: "", unit: "" }], addonIds: [] }); }} className="rounded-lg p-1 hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Gambar Menu</Label>
                  <div className="flex items-center gap-3">
                    {(newMenu.imageFile || newMenu.imageUrl) ? (
                      <div className="relative">
                        <img
                          src={newMenu.imageFile ? URL.createObjectURL(newMenu.imageFile) : newMenu.imageUrl}
                          alt="Preview"
                          className="h-20 w-20 rounded-lg border object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setNewMenu({ ...newMenu, imageUrl: "", imageFile: null })}
                          className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-colors">
                        <Upload className="size-5 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 1024 * 1024) { toast.error("Maks 1MB"); return; }
                              setNewMenu({ ...newMenu, imageFile: file });
                            }
                          }}
                        />
                      </label>
                    )}
                    <p className="text-[10px] text-muted-foreground">Maks 1MB. JPG, PNG, WebP</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Name</Label>
                  <Input placeholder="e.g. Nasi Goreng" value={newMenu.name} onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Category</Label>
                    <select
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm"
                      value={newMenu.category}
                      onChange={(e) => setNewMenu({ ...newMenu, category: e.target.value })}
                    >
                      <option value="Main Dish">Main Dish</option>
                      <option value="Beverage">Beverage</option>
                      <option value="Appetizer">Appetizer</option>
                      <option value="Snack">Snack</option>
                      <option value="Dessert">Dessert</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Selling Price</Label>
                    <Input placeholder="e.g. 35000" type="number" min="1" value={newMenu.price} onChange={(e) => setNewMenu({ ...newMenu, price: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Ingredients</Label>
                    <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addIngredientRow}>
                      <Plus className="size-3" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {newMenu.ingredients.map((ing, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_80px_80px_32px] gap-2">
                        <select
                          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm"
                          value={ing.name}
                          onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                        >
                          <option value="">Select ingredient...</option>
                          {Object.keys(ingredientPrices).map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                        <Input placeholder="Qty" type="number" min="1" value={ing.qty} onChange={(e) => updateIngredient(idx, "qty", e.target.value)} />
                        <Input placeholder="Unit" value={ing.unit} onChange={(e) => updateIngredient(idx, "unit", e.target.value)} />
                        <button
                          type="button"
                          onClick={() => removeIngredientRow(idx)}
                          className="flex h-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const hpp = newMenu.ingredients.reduce((sum, ing) => {
                      if (!ing.name || !ing.qty) return sum;
                      const price = ingredientPrices[ing.name]?.price ?? 0;
                      return sum + price * Number(ing.qty);
                    }, 0);
                    return hpp > 0 ? (
                      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                        <span className="text-xs text-muted-foreground">Estimasi HPP</span>
                        <span className="text-xs font-semibold">{formatRp(hpp)}</span>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Addon Selection */}
                {addonsData.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Addon (opsional)</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border p-2">
                    {addonsData.map((addon) => (
                      <label key={addon.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50">
                        <input
                          type="checkbox"
                          checked={newMenu.addonIds.includes(addon.id)}
                          onChange={() => {
                            setNewMenu((prev) => ({
                              ...prev,
                              addonIds: prev.addonIds.includes(addon.id)
                                ? prev.addonIds.filter((id) => id !== addon.id)
                                : [...prev.addonIds, addon.id],
                            }));
                          }}
                          className="size-3.5 rounded border-border"
                        />
                        <span className="flex-1 text-xs">{addon.name}</span>
                        <span className="text-xs text-muted-foreground">+Rp. {addon.price.toLocaleString("id-ID")}</span>
                      </label>
                    ))}
                  </div>
                </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 border-t px-6 py-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAddMenu(false); setNewMenu({ name: "", category: "Main Dish", price: "", imageUrl: "", imageFile: null, ingredients: [{ name: "", qty: "", unit: "" }], addonIds: [] }); }}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleAddMenu} disabled={menuUploading}>{menuUploading ? <><Loader2 className="size-3.5 animate-spin mr-1.5" />Uploading...</> : "Save"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Menu Modal */}
      {showEditMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-background shadow-lg">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Edit Menu</h2>
              <button onClick={() => { setShowEditMenu(false); setEditMenu({ id: 0, name: "", category: "Main Dish", price: "", imageUrl: "", imageFile: null, ingredients: [{ name: "", qty: "", unit: "" }], addonIds: [] }); }} className="rounded-lg p-1 hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Gambar Menu</Label>
                  <div className="flex items-center gap-3">
                    {(editMenu.imageFile || editMenu.imageUrl) ? (
                      <div className="relative">
                        <img
                          src={editMenu.imageFile ? URL.createObjectURL(editMenu.imageFile) : editMenu.imageUrl}
                          alt="Preview"
                          className="h-20 w-20 rounded-lg border object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setEditMenu({ ...editMenu, imageUrl: "", imageFile: null })}
                          className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-colors">
                        <Upload className="size-5 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 1024 * 1024) { toast.error("Maks 1MB"); return; }
                              setEditMenu({ ...editMenu, imageFile: file });
                            }
                          }}
                        />
                      </label>
                    )}
                    <p className="text-[10px] text-muted-foreground">Maks 1MB. JPG, PNG, WebP</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Name</Label>
                  <Input placeholder="e.g. Nasi Goreng" value={editMenu.name} onChange={(e) => setEditMenu({ ...editMenu, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Category</Label>
                    <select
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm"
                      value={editMenu.category}
                      onChange={(e) => setEditMenu({ ...editMenu, category: e.target.value })}
                    >
                      <option value="Main Dish">Main Dish</option>
                      <option value="Beverage">Beverage</option>
                      <option value="Appetizer">Appetizer</option>
                      <option value="Snack">Snack</option>
                      <option value="Dessert">Dessert</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Selling Price</Label>
                    <Input placeholder="e.g. 35000" type="number" min="1" value={editMenu.price} onChange={(e) => setEditMenu({ ...editMenu, price: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Ingredients</Label>
                    <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addEditIngredientRow}>
                      <Plus className="size-3" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editMenu.ingredients.map((ing, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_80px_80px_32px] gap-2">
                        <select
                          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm"
                          value={ing.name}
                          onChange={(e) => updateEditIngredient(idx, "name", e.target.value)}
                        >
                          <option value="">Select ingredient...</option>
                          {Object.keys(ingredientPrices).map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                        <Input placeholder="Qty" type="number" min="1" value={ing.qty} onChange={(e) => updateEditIngredient(idx, "qty", e.target.value)} />
                        <Input placeholder="Unit" value={ing.unit} onChange={(e) => updateEditIngredient(idx, "unit", e.target.value)} />
                        <button
                          type="button"
                          onClick={() => removeEditIngredientRow(idx)}
                          className="flex h-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const hpp = editMenu.ingredients.reduce((sum, ing) => {
                      if (!ing.name || !ing.qty) return sum;
                      const price = ingredientPrices[ing.name]?.price ?? 0;
                      return sum + price * Number(ing.qty);
                    }, 0);
                    return hpp > 0 ? (
                      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                        <span className="text-xs text-muted-foreground">Estimasi HPP</span>
                        <span className="text-xs font-semibold">{formatRp(hpp)}</span>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Addon Selection */}
                {addonsData.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Addon (opsional)</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border p-2">
                    {addonsData.map((addon) => (
                      <label key={addon.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50">
                        <input
                          type="checkbox"
                          checked={editMenu.addonIds.includes(addon.id)}
                          onChange={() => {
                            setEditMenu((prev) => ({
                              ...prev,
                              addonIds: prev.addonIds.includes(addon.id)
                                ? prev.addonIds.filter((id) => id !== addon.id)
                                : [...prev.addonIds, addon.id],
                            }));
                          }}
                          className="size-3.5 rounded border-border"
                        />
                        <span className="flex-1 text-xs">{addon.name}</span>
                        <span className="text-xs text-muted-foreground">+Rp. {addon.price.toLocaleString("id-ID")}</span>
                      </label>
                    ))}
                  </div>
                </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 border-t px-6 py-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowEditMenu(false); setEditMenu({ id: 0, name: "", category: "Main Dish", price: "", imageUrl: "", imageFile: null, ingredients: [{ name: "", qty: "", unit: "" }], addonIds: [] }); }}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleEditMenu} disabled={menuUploading}>{menuUploading ? <><Loader2 className="size-3.5 animate-spin mr-1.5" />Uploading...</> : "Save Changes"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
