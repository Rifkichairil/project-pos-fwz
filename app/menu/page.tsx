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
  BookOpen,
  Receipt,
  Calculator,
  TrendingUp,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Mock Data ─── */

const ingredientPrices: Record<string, { unit: string; price: number; supplier: string; stock: number }> = {
  "Kopi Arabica": { unit: "gram", price: 40, supplier: "PT Kopi Nusantara", stock: 3500 },
  "Susu Full Cream": { unit: "ml", price: 35, supplier: "Indofood", stock: 8000 },
  "Gula Pasir": { unit: "gram", price: 25, supplier: "Gulaku", stock: 12000 },
  "Es Batu": { unit: "gram", price: 8, supplier: "CV Aneka Es", stock: 200 },
  Nasi: { unit: "gram", price: 25, supplier: "PT Beras Jaya", stock: 25000 },
  "Ayam Fillet": { unit: "gram", price: 60, supplier: "PT Sumber Protein", stock: 4500 },
  "Minyak Goreng": { unit: "ml", price: 30, supplier: "Bimoli", stock: 6000 },
  Telur: { unit: "pcs", price: 2500, supplier: "Peternakan Sejahtera", stock: 300 },
  "Tepung Terigu": { unit: "gram", price: 22, supplier: "Segitiga Biru", stock: 8000 },
  "Kecap Manis": { unit: "ml", price: 40, supplier: "ABC", stock: 4000 },
  Bawang: { unit: "gram", price: 30, supplier: "Sayurku", stock: 5000 },
  "Daging Sapi": { unit: "gram", price: 140, supplier: "PT Daging Segar", stock: 3000 },
  "Tusuk Sate": { unit: "pcs", price: 100, supplier: "CV Sate Jaya", stock: 2000 },
  "Santan": { unit: "ml", price: 50, supplier: "Kara", stock: 5000 },
  "Ketupat": { unit: "pcs", price: 3000, supplier: "Warung Ketupat", stock: 150 },
  "Mie Kering": { unit: "gram", price: 30, supplier: "Indomie", stock: 4000 },
  "Jeruk Peras": { unit: "ml", price: 20, supplier: "Petani Jeruk", stock: 10000 },
  "Teh Hitam": { unit: "gram", price: 80, supplier: "Sariwangi", stock: 2000 },
  "Sayur Sop": { unit: "gram", price: 35, supplier: "Sayurku", stock: 6000 },
  "Kulit Lumpia": { unit: "lembar", price: 500, supplier: "Toko Kue", stock: 500 },
  "Ubi": { unit: "gram", price: 25, supplier: "Petani Ubi", stock: 8000 },
  "Kelapa Parut": { unit: "gram", price: 35, supplier: "CV Kelapa", stock: 4000 },
  "Tepung Ketan": { unit: "gram", price: 35, supplier: "Bogasari", stock: 3000 },
  "Gula Merah": { unit: "gram", price: 32, supplier: "Gula Jawa", stock: 2500 },
  "Pisang": { unit: "gram", price: 25, supplier: "Petani Pisang", stock: 10000 },
  "Roti Tawar": { unit: "gram", price: 30, supplier: "Sari Roti", stock: 2000 },
  "Keju": { unit: "gram", price: 120, supplier: "Kraft", stock: 1500 },
  "Sosis": { unit: "gram", price: 70, supplier: "Sofyan", stock: 3000 },
  "Tepung Martabak": { unit: "gram", price: 25, supplier: "Bogasari", stock: 4000 },
  "Susu Kental Manis": { unit: "ml", price: 70, supplier: "Indomilk", stock: 3000 },
  "Coklat Bubuk": { unit: "gram", price: 180, supplier: "Silver Queen", stock: 1000 },
  "Susu UHT": { unit: "ml", price: 30, supplier: "Ultra", stock: 6000 },
  "Tepung Terigu Premium": { unit: "gram", price: 30, supplier: "Segitiga Biru", stock: 5000 },
  "Ragi": { unit: "gram", price: 180, supplier: "Fermipan", stock: 500 },
  "Margarin": { unit: "gram", price: 50, supplier: "Blue Band", stock: 2000 },
  "Garam": { unit: "gram", price: 20, supplier: "Garam Lokal", stock: 10000 },
  "Merica": { unit: "gram", price: 180, supplier: "Sasa", stock: 500 },
  "Bihun": { unit: "gram", price: 35, supplier: "Bihun Jaya", stock: 3000 },
  "Kubis": { unit: "gram", price: 25, supplier: "Sayurku", stock: 5000 },
  "Kacang Panjang": { unit: "gram", price: 35, supplier: "Sayurku", stock: 3000 },
  "Kacang Tanah": { unit: "gram", price: 45, supplier: "PT Kacang", stock: 4000 },
};

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

const initialRecipes: Recipe[] = [
  // Main Dish
  {
    id: 1,
    name: "Nasi Goreng",
    category: "Main Dish",
    ingredients: [
      { name: "Nasi", qty: 300, unit: "gram" },
      { name: "Minyak Goreng", qty: 15, unit: "ml" },
      { name: "Telur", qty: 1, unit: "pcs" },
      { name: "Kecap Manis", qty: 10, unit: "ml" },
      { name: "Bawang", qty: 20, unit: "gram" },
    ],
  },
  {
    id: 2,
    name: "Ayam Goreng",
    category: "Main Dish",
    ingredients: [
      { name: "Ayam Fillet", qty: 250, unit: "gram" },
      { name: "Minyak Goreng", qty: 50, unit: "ml" },
      { name: "Tepung Terigu", qty: 30, unit: "gram" },
      { name: "Telur", qty: 0.5, unit: "pcs" },
    ],
  },
  {
    id: 3,
    name: "Mie Goreng",
    category: "Main Dish",
    ingredients: [
      { name: "Minyak Goreng", qty: 10, unit: "ml" },
      { name: "Telur", qty: 1, unit: "pcs" },
      { name: "Kecap Manis", qty: 15, unit: "ml" },
      { name: "Bawang", qty: 15, unit: "gram" },
    ],
  },
  {
    id: 4,
    name: "Sate Ayam",
    category: "Main Dish",
    ingredients: [
      { name: "Ayam Fillet", qty: 200, unit: "gram" },
      { name: "Tusuk Sate", qty: 10, unit: "pcs" },
      { name: "Kecap Manis", qty: 20, unit: "ml" },
      { name: "Minyak Goreng", qty: 10, unit: "ml" },
      { name: "Bawang", qty: 10, unit: "gram" },
    ],
  },
  {
    id: 5,
    name: "Rendang",
    category: "Main Dish",
    ingredients: [
      { name: "Daging Sapi", qty: 200, unit: "gram" },
      { name: "Santan", qty: 150, unit: "ml" },
      { name: "Bawang", qty: 20, unit: "gram" },
      { name: "Minyak Goreng", qty: 20, unit: "ml" },
    ],
  },
  // Beverage
  {
    id: 6,
    name: "Kopi Susu",
    category: "Beverage",
    ingredients: [
      { name: "Kopi Arabica", qty: 18, unit: "gram" },
      { name: "Susu Full Cream", qty: 120, unit: "ml" },
      { name: "Gula Pasir", qty: 10, unit: "gram" },
    ],
  },
  {
    id: 7,
    name: "Es Buah",
    category: "Beverage",
    ingredients: [
      { name: "Es Batu", qty: 200, unit: "gram" },
      { name: "Gula Pasir", qty: 30, unit: "gram" },
    ],
  },
  {
    id: 8,
    name: "Es Teh",
    category: "Beverage",
    ingredients: [
      { name: "Teh Hitam", qty: 5, unit: "gram" },
      { name: "Gula Pasir", qty: 15, unit: "gram" },
      { name: "Es Batu", qty: 150, unit: "gram" },
    ],
  },
  {
    id: 9,
    name: "Jus Jeruk",
    category: "Beverage",
    ingredients: [
      { name: "Jeruk Peras", qty: 200, unit: "ml" },
      { name: "Gula Pasir", qty: 15, unit: "gram" },
      { name: "Es Batu", qty: 100, unit: "gram" },
    ],
  },
  {
    id: 10,
    name: "Kopi Hitam",
    category: "Beverage",
    ingredients: [
      { name: "Kopi Arabica", qty: 15, unit: "gram" },
      { name: "Gula Pasir", qty: 8, unit: "gram" },
    ],
  },
  // Appetizer
  {
    id: 11,
    name: "Gado-Gado",
    category: "Appetizer",
    ingredients: [
      { name: "Sayur Sop", qty: 150, unit: "gram" },
      { name: "Kacang Panjang", qty: 50, unit: "gram" },
      { name: "Kacang Tanah", qty: 30, unit: "gram" },
      { name: "Santan", qty: 50, unit: "ml" },
      { name: "Minyak Goreng", qty: 10, unit: "ml" },
    ],
  },
  {
    id: 12,
    name: "Bakso",
    category: "Appetizer",
    ingredients: [
      { name: "Ayam Fillet", qty: 100, unit: "gram" },
      { name: "Tepung Terigu", qty: 20, unit: "gram" },
      { name: "Bawang", qty: 10, unit: "gram" },
      { name: "Minyak Goreng", qty: 15, unit: "ml" },
    ],
  },
  {
    id: 13,
    name: "Soto",
    category: "Appetizer",
    ingredients: [
      { name: "Ayam Fillet", qty: 150, unit: "gram" },
      { name: "Santan", qty: 100, unit: "ml" },
      { name: "Bawang", qty: 15, unit: "gram" },
      { name: "Minyak Goreng", qty: 10, unit: "ml" },
    ],
  },
  {
    id: 14,
    name: "Lumpia",
    category: "Appetizer",
    ingredients: [
      { name: "Kulit Lumpia", qty: 2, unit: "lembar" },
      { name: "Ubi", qty: 100, unit: "gram" },
      { name: "Minyak Goreng", qty: 30, unit: "ml" },
      { name: "Bawang", qty: 5, unit: "gram" },
    ],
  },
  {
    id: 15,
    name: "Risoles",
    category: "Appetizer",
    ingredients: [
      { name: "Tepung Terigu", qty: 30, unit: "gram" },
      { name: "Telur", qty: 1, unit: "pcs" },
      { name: "Minyak Goreng", qty: 20, unit: "ml" },
      { name: "Susu Full Cream", qty: 30, unit: "ml" },
    ],
  },
  // Snack
  {
    id: 16,
    name: "Klepon",
    category: "Snack",
    ingredients: [
      { name: "Tepung Ketan", qty: 80, unit: "gram" },
      { name: "Gula Merah", qty: 20, unit: "gram" },
      { name: "Kelapa Parut", qty: 30, unit: "gram" },
    ],
  },
  {
    id: 17,
    name: "Onde-Onde",
    category: "Snack",
    ingredients: [
      { name: "Tepung Terigu", qty: 50, unit: "gram" },
      { name: "Kelapa Parut", qty: 40, unit: "gram" },
      { name: "Gula Pasir", qty: 15, unit: "gram" },
      { name: "Minyak Goreng", qty: 20, unit: "ml" },
    ],
  },
  {
    id: 18,
    name: "Pisang Goreng",
    category: "Snack",
    ingredients: [
      { name: "Pisang", qty: 150, unit: "gram" },
      { name: "Tepung Terigu", qty: 30, unit: "gram" },
      { name: "Minyak Goreng", qty: 30, unit: "ml" },
      { name: "Gula Pasir", qty: 10, unit: "gram" },
    ],
  },
  {
    id: 19,
    name: "Roti Bakar",
    category: "Snack",
    ingredients: [
      { name: "Roti Tawar", qty: 100, unit: "gram" },
      { name: "Margarin", qty: 15, unit: "gram" },
      { name: "Gula Pasir", qty: 10, unit: "gram" },
      { name: "Susu Kental Manis", qty: 10, unit: "ml" },
    ],
  },
  {
    id: 20,
    name: "Martabak",
    category: "Snack",
    ingredients: [
      { name: "Tepung Martabak", qty: 80, unit: "gram" },
      { name: "Telur", qty: 2, unit: "pcs" },
      { name: "Minyak Goreng", qty: 30, unit: "ml" },
      { name: "Bawang", qty: 10, unit: "gram" },
    ],
  },
  // Dessert
  {
    id: 21,
    name: "Es Krim",
    category: "Dessert",
    ingredients: [
      { name: "Susu UHT", qty: 200, unit: "ml" },
      { name: "Gula Pasir", qty: 25, unit: "gram" },
      { name: "Coklat Bubuk", qty: 10, unit: "gram" },
    ],
  },
  {
    id: 22,
    name: "Pudding",
    category: "Dessert",
    ingredients: [
      { name: "Susu UHT", qty: 150, unit: "ml" },
      { name: "Gula Pasir", qty: 20, unit: "gram" },
      { name: "Tepung Terigu Premium", qty: 15, unit: "gram" },
    ],
  },
  {
    id: 23,
    name: "Bolu",
    category: "Dessert",
    ingredients: [
      { name: "Tepung Terigu Premium", qty: 100, unit: "gram" },
      { name: "Telur", qty: 2, unit: "pcs" },
      { name: "Gula Pasir", qty: 50, unit: "gram" },
      { name: "Margarin", qty: 30, unit: "gram" },
    ],
  },
  {
    id: 24,
    name: "Donat",
    category: "Dessert",
    ingredients: [
      { name: "Tepung Terigu Premium", qty: 80, unit: "gram" },
      { name: "Telur", qty: 1, unit: "pcs" },
      { name: "Gula Pasir", qty: 30, unit: "gram" },
      { name: "Minyak Goreng", qty: 30, unit: "ml" },
    ],
  },
  {
    id: 25,
    name: "Cake",
    category: "Dessert",
    ingredients: [
      { name: "Tepung Terigu Premium", qty: 120, unit: "gram" },
      { name: "Telur", qty: 3, unit: "pcs" },
      { name: "Gula Pasir", qty: 80, unit: "gram" },
      { name: "Margarin", qty: 50, unit: "gram" },
    ],
  },
];

interface Product {
  id: number;
  name: string;
  category: string;
  hpp: number;
  price: number;
}

const initialProducts: Product[] = [
  // Main Dish
  { id: 1, name: "Nasi Goreng", category: "Main Dish", hpp: 10500, price: 35000 },
  { id: 4, name: "Ayam Goreng", category: "Main Dish", hpp: 12000, price: 40000 },
  { id: 5, name: "Mie Goreng", category: "Main Dish", hpp: 9600, price: 32000 },
  { id: 6, name: "Sate Ayam", category: "Main Dish", hpp: 11400, price: 38000 },
  { id: 7, name: "Rendang", category: "Main Dish", hpp: 16500, price: 55000 },
  // Beverage
  { id: 2, name: "Kopi Susu", category: "Beverage", hpp: 6600, price: 22000 },
  { id: 3, name: "Es Buah", category: "Beverage", hpp: 7800, price: 26000 },
  { id: 8, name: "Es Teh", category: "Beverage", hpp: 2400, price: 8000 },
  { id: 9, name: "Jus Jeruk", category: "Beverage", hpp: 5400, price: 18000 },
  { id: 10, name: "Kopi Hitam", category: "Beverage", hpp: 4500, price: 15000 },
  // Appetizer
  { id: 11, name: "Gado-Gado", category: "Appetizer", hpp: 7500, price: 25000 },
  { id: 12, name: "Bakso", category: "Appetizer", hpp: 8400, price: 28000 },
  { id: 13, name: "Soto", category: "Appetizer", hpp: 9000, price: 30000 },
  { id: 14, name: "Lumpia", category: "Appetizer", hpp: 6000, price: 20000 },
  { id: 15, name: "Risoles", category: "Appetizer", hpp: 5400, price: 18000 },
  // Snack
  { id: 16, name: "Klepon", category: "Snack", hpp: 4500, price: 15000 },
  { id: 17, name: "Onde-Onde", category: "Snack", hpp: 4800, price: 16000 },
  { id: 18, name: "Pisang Goreng", category: "Snack", hpp: 5400, price: 18000 },
  { id: 19, name: "Roti Bakar", category: "Snack", hpp: 6000, price: 20000 },
  { id: 20, name: "Martabak", category: "Snack", hpp: 7500, price: 25000 },
  // Dessert
  { id: 21, name: "Es Krim", category: "Dessert", hpp: 7500, price: 25000 },
  { id: 22, name: "Pudding", category: "Dessert", hpp: 6000, price: 20000 },
  { id: 23, name: "Bolu", category: "Dessert", hpp: 10500, price: 35000 },
  { id: 24, name: "Donat", category: "Dessert", hpp: 6600, price: 22000 },
  { id: 25, name: "Cake", category: "Dessert", hpp: 13500, price: 45000 },
];

/* ─── Helpers ─── */

const formatRp = (n: number) => `Rp. ${Math.round(n).toLocaleString("id-ID")}`;

function calcHPP(ingredients: RecipeIngredient[]) {
  return ingredients.reduce((sum, ing) => {
    const p = ingredientPrices[ing.name]?.price ?? 0;
    return sum + ing.qty * p;
  }, 0);
}

function calcMargin(hpp: number, price: number) {
  if (hpp <= 0) return 0;
  return ((price - hpp) / hpp) * 100;
}

export default function MenuRecipePage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("recipe");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [recipesData, setRecipesData] = useState<Recipe[]>(initialRecipes);
  const [productsData, setProductsData] = useState<Product[]>(initialProducts);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [pricingPage, setPricingPage] = useState(1);
  const pricingPerPage = 10;
  const [newMenu, setNewMenu] = useState({
    name: "",
    category: "Main Dish",
    price: "",
    ingredients: [{ name: "", qty: "", unit: "" }] as { name: string; qty: string; unit: string }[],
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

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAddMenu(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    setPricingPage(1);
  }, [search, activeTab]);

  const handleAddMenu = () => {
    if (!newMenu.name || !newMenu.price) return;
    const validIngredients = newMenu.ingredients
      .filter((ing) => ing.name && ing.qty)
      .map((ing) => ({
        name: ing.name,
        qty: Number(ing.qty),
        unit: ing.unit || ingredientPrices[ing.name]?.unit || "pcs",
      }));
    if (validIngredients.length === 0) return;

    const id = Math.max(...recipesData.map((r) => r.id), 0) + 1;
    const hpp = calcHPP(validIngredients);
    const price = Number(newMenu.price);

    setRecipesData([
      ...recipesData,
      { id, name: newMenu.name, category: newMenu.category, ingredients: validIngredients },
    ]);
    setProductsData([
      ...productsData,
      { id, name: newMenu.name, category: newMenu.category, hpp, price },
    ]);

    setNewMenu({
      name: "",
      category: "Main Dish",
      price: "",
      ingredients: [{ name: "", qty: "", unit: "" }],
    });
    setShowAddMenu(false);
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

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
        <h1 className="text-base font-semibold sm:text-lg">Menu & Recipe Management</h1>
        <Button
          className="h-8 gap-2 rounded-xl bg-blue-600 px-3 text-xs font-medium hover:bg-blue-700 sm:h-9 sm:px-4 sm:text-sm"
          onClick={() => setShowAddMenu(true)}
        >
          <Plus className="size-3.5 sm:size-4" />
          <span className="hidden sm:inline">Add Menu</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b px-4 pt-2 sm:px-6">
          <TabsList className="h-9 rounded-none bg-transparent p-0 flex-wrap">
            <TabsTrigger
              value="recipe"
              className="rounded-none border-b-2 border-transparent px-3 pb-2 pt-1 text-xs font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:text-sm"
            >
              <BookOpen className="mr-1.5 size-3.5" /> Recipe (BOM)
            </TabsTrigger>
            <TabsTrigger
              value="pricing"
              className="rounded-none border-b-2 border-transparent px-3 pb-2 pt-1 text-xs font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:text-sm"
            >
              <Receipt className="mr-1.5 size-3.5" /> Menu Pricing
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Search */}
        <div className="px-4 pt-4 sm:px-6">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border-border bg-muted/50 pl-8 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ─── Recipe / BOM ─── */}
          <TabsContent value="recipe" className="m-0 h-full">
            <div className="flex h-full overflow-hidden">
              {/* Left — Recipe Cards */}
              <div className="flex flex-1 flex-col overflow-y-auto px-4 sm:px-6">
                <p className="mb-3 text-xs text-muted-foreground">Showing {filteredRecipes.length} recipes</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredRecipes.map((recipe) => {
                    const hpp = calcHPP(recipe.ingredients);
                    return (
                      <Card
                        key={recipe.id}
                        onClick={() => { setSelectedRecipe(recipe); setSidebarOpen(true); }}
                        className={`cursor-pointer border-border/60 transition-colors hover:border-primary/30 hover:shadow-sm ${
                          selectedRecipe?.id === recipe.id ? "border-primary bg-primary/5" : ""
                        }`}
                      >
                        <CardContent className="flex items-center gap-3 p-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Calculator className="size-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{recipe.name}</p>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span>{recipe.category}</span>
                              <span>· {recipe.ingredients.length} ingredients</span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[10px] text-muted-foreground">HPP</p>
                            <p className="text-sm font-bold">{formatRp(hpp)}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Overlay */}
              {selectedRecipe && (
                <div
                  className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
              )}
              {/* Right — Recipe Detail Sidebar */}
              <aside
                className={cn(
                  "w-[32rem] shrink-0 overflow-y-auto border-l bg-background fixed inset-y-0 right-0 z-50 transition-transform duration-300 lg:static lg:translate-x-0 lg:z-auto",
                  sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
                )}
              >
                {selectedRecipe ? (
                  <div className="p-4 sm:p-6">
                    {/* Header */}
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                        <Calculator className="size-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold">{selectedRecipe.name}</p>
                          <Badge variant="outline" className="text-[10px] border-slate-200 bg-slate-50 text-slate-700">
                            {selectedRecipe.category}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{selectedRecipe.ingredients.length} ingredients · HPP {formatRp(calcHPP(selectedRecipe.ingredients))}</p>
                      </div>
                      <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden flex size-8 items-center justify-center rounded-lg border"
                      >
                        <X className="size-4" />
                      </button>
                    </div>

                    {/* BOM Table */}
                    <div>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bill of Materials</h3>
                      <div className="overflow-x-auto rounded-lg border border-border/60">
                        <table className="w-full text-left text-xs min-w-125">
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
                              const hpp = calcHPP(selectedRecipe.ingredients);
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
                                <span className="ml-2 text-sm font-bold">{formatRp(calcHPP(selectedRecipe.ingredients))}</span>
                              </td>
                              <td colSpan={1}></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                    Select a recipe to view BOM details
                  </div>
                )}
              </aside>
            </div>
          </TabsContent>

          {/* ─── Menu Pricing ─── */}
          <TabsContent value="pricing" className="m-0 p-4 sm:p-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Menu Pricing & Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-125 text-left text-xs">
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
                    {paginatedProducts.map((p) => {
                      const margin = calcMargin(p.hpp, p.price);
                      const profit = p.price - p.hpp;
                      const isHealthy = margin >= 100;
                      return (
                        <tr key={p.id}>
                          <td className="py-2.5 font-medium">{p.name}</td>
                          <td className="py-2.5 text-muted-foreground">{p.category}</td>
                          <td className="py-2.5">{formatRp(p.hpp)}</td>
                          <td className="py-2.5 font-semibold">{formatRp(p.price)}</td>
                          <td className="py-2.5">
                            <span className={cn("flex items-center gap-1 font-semibold", isHealthy ? "text-emerald-600" : "text-amber-600")}>
                              <TrendingUp className="size-3" />
                              {margin.toFixed(0)}%
                            </span>
                          </td>
                          <td className="py-2.5 font-semibold text-emerald-600">{formatRp(profit)}</td>
                          <td className="py-2.5">
                            {isHealthy ? (
                              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-600 text-[10px]">
                                Healthy
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-600 text-[10px]">
                                Review
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
                {/* Pagination */}
                {filteredProducts.length > pricingPerPage && (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Showing {(pricingPage - 1) * pricingPerPage + 1}–{Math.min(pricingPage * pricingPerPage, filteredProducts.length)} of {filteredProducts.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
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
                          className={cn("h-7 min-w-[28px] px-1.5 text-xs", pricingPage === page ? "bg-blue-600 hover:bg-blue-700" : "")}
                          onClick={() => setPricingPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
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
          </TabsContent>
        </div>
      </Tabs>

      {/* Add Menu Modal */}
      {showAddMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-background shadow-lg">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Add Menu</h2>
              <button onClick={() => setShowAddMenu(false)} className="rounded-lg p-1 hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Name</Label>
                  <Input placeholder="e.g. Nasi Goreng" value={newMenu.name} onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Category</Label>
                    <select
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
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
                    <Input placeholder="e.g. 35000" type="number" value={newMenu.price} onChange={(e) => setNewMenu({ ...newMenu, price: e.target.value })} />
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
                          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                          value={ing.name}
                          onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                        >
                          <option value="">Select ingredient...</option>
                          {Object.keys(ingredientPrices).map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                        <Input placeholder="Qty" type="number" value={ing.qty} onChange={(e) => updateIngredient(idx, "qty", e.target.value)} />
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
                </div>
              </div>
            </div>
            <div className="flex gap-2 border-t px-6 py-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddMenu(false)}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleAddMenu}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
