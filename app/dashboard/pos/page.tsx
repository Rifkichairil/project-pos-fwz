"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ShoppingBag,
  Trash2,
  Pencil,
  Minus,
  Plus,
  Calendar,
  Bell,
  RotateCcw,
  Wallet,
  ArrowUpDown,
} from "lucide-react";

interface CartItem {
  id: number;
  name: string;
  variant: string;
  sugar: string;
  price: number;
  qty: number;
  note: string;
  image: string;
}

interface BoardOrder {
  id: string;
  name: string;
  type: string;
  status: string;
  time: string;
  items: number;
  total: number;
  menuItems?: { name: string; qty: number; price: number; variant?: string; sugar?: string; note?: string }[];
}

const categories = ["All", "Appetizer", "Main Dish", "Beverage", "Snack", "Dessert"];

const menuItems = [
  {
    id: 1,
    name: "Es Buah",
    price: 26000,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80",
    category: "Beverage",
  },
  {
    id: 2,
    name: "Es Cincau",
    price: 20000,
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80",
    category: "Beverage",
  },
  {
    id: 3,
    name: "Es Cendol Ijo",
    price: 20000,
    image: "https://images.unsplash.com/photo-1558857563-b371033873b8?w=400&q=80",
    category: "Beverage",
  },
  {
    id: 4,
    name: "Es Pisang Ijo",
    price: 25000,
    image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&q=80",
    category: "Dessert",
  },
  {
    id: 5,
    name: "Es Kelapa Muda",
    price: 22000,
    image: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400&q=80",
    category: "Beverage",
  },
  {
    id: 6,
    name: "Es Teler",
    price: 28000,
    image: "https://images.unsplash.com/photo-1505253758473-96b701f8fb89?w=400&q=80",
    category: "Dessert",
  },
  {
    id: 7,
    name: "Nasi Goreng",
    price: 35000,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80",
    category: "Main Dish",
  },
  {
    id: 8,
    name: "Mie Goreng",
    price: 32000,
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80",
    category: "Main Dish",
  },
  {
    id: 9,
    name: "Ayam Goreng",
    price: 40000,
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80",
    category: "Main Dish",
  },
  {
    id: 10,
    name: "Sate Ayam",
    price: 38000,
    image: "https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=400&q=80",
    category: "Main Dish",
  },
  {
    id: 11,
    name: "Rujak Buah",
    price: 18000,
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80",
    category: "Appetizer",
  },
  {
    id: 12,
    name: "Gado-Gado",
    price: 25000,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
    category: "Appetizer",
  },
];

export default function PosPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuQuantities, setMenuQuantities] = useState<Record<number, number>>({});
  const [menuSearch, setMenuSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [orderType, setOrderType] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [selectedVariants, setSelectedVariants] = useState<Record<number, string>>({});
  const [selectedSugar, setSelectedSugar] = useState<Record<number, string>>({});
  const [editingCartItem, setEditingCartItem] = useState<number | null>(null);
  const [selectedPromo, setSelectedPromo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptOrderId, setReceiptOrderId] = useState("");
  const [activeTab, setActiveTab] = useState<"new" | "list">("new");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [boardOrders, setBoardOrders] = useState<BoardOrder[]>([
    { id: "#4480", name: "Juna Wok", type: "Takeaway", status: "Waiting", time: "07-05-2025, 03:18 pm", items: 3, total: 75000, menuItems: [
      { name: "Es Buah", qty: 1, price: 26000, variant: "Regular", sugar: "Normal Sugar", note: "Tidak pakai es batu, ganti jelly cincau dan tambahkan topping kelapa muda sebanyak-banyaknya" },
      { name: "Nasi Goreng", qty: 2, price: 32000, variant: "Regular" },
    ]},
    { id: "#4481", name: "Jung Kit", type: "Delivery", status: "Ready", time: "07-05-2025, 03:18 pm", items: 2, total: 52000, menuItems: [
      { name: "Sate Ayam", qty: 2, price: 26000 },
    ]},
    { id: "#4482", name: "John Pantau", type: "Dine in", status: "Cancel", time: "07-05-2025, 02:18 pm", items: 5, total: 128000, menuItems: [
      { name: "Rendang", qty: 1, price: 45000, variant: "Large" },
      { name: "Teh Tarik", qty: 2, price: 15000, sugar: "Less Sugar" },
      { name: "Kerupuk", qty: 2, price: 5000 },
    ]},
    { id: "#4483", name: "Jane Doe", type: "Takeaway", status: "Ready", time: "07-05-2025, 01:45 pm", items: 1, total: 26000, menuItems: [
      { name: "Es Buah", qty: 1, price: 26000, variant: "Regular", sugar: "Normal Sugar" },
    ]},
    { id: "#4484", name: "Bob Smith", type: "Dine in", status: "Waiting", time: "07-05-2025, 12:30 pm", items: 4, total: 96000, menuItems: [
      { name: "Nasi Goreng", qty: 2, price: 32000, variant: "Large" },
      { name: "Es Teh", qty: 2, price: 16000, sugar: "Less Sugar" },
    ]},
    { id: "#4485", name: "Alice Chan", type: "Takeaway", status: "Done", time: "07-05-2025, 11:15 am", items: 2, total: 45000, menuItems: [
      { name: "Mie Goreng", qty: 1, price: 28000 },
      { name: "Es Jeruk", qty: 1, price: 17000 },
    ]},
  ]);

  const promoMap: Record<string, { label: string; calc: (sub: number) => number }> = {
    WELCOME10: { label: "WELCOME10", calc: (sub) => Math.round(sub * 0.1) },
    CASHBACK5: { label: "CASHBACK5", calc: () => 5000 },
    BUNDLE20: { label: "BUNDLE20", calc: (sub) => Math.round(sub * 0.2) },
  };

  const filteredMenu = menuItems
    .filter((item) => activeCategory === "All" || item.category === activeCategory)
    .filter((item) => item.name.toLowerCase().includes(menuSearch.toLowerCase()));

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = selectedPromo && promoMap[selectedPromo] ? promoMap[selectedPromo].calc(subtotal) : 0;
  const taxes = Math.round((subtotal - discount) * 0.02);
  const total = subtotal - discount + taxes;
  const change = paymentMethod === "cash" && cashAmount ? Math.max(0, Number(cashAmount) - total) : 0;

  const updateMenuQty = (id: number, delta: number) => {
    setMenuQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  const addToCart = (item: typeof menuItems[0]) => {
    const qty = menuQuantities[item.id] || 1;
    const variant = selectedVariants[item.id] || "Regular";
    const sugar = selectedSugar[item.id] || "Normal Sugar";

    setCart((prev) => {
      const existing = prev.find(
        (c) => c.name === item.name && c.variant === variant && c.sugar === sugar
      );
      if (existing) {
        return prev.map((c) =>
          c.name === item.name && c.variant === variant && c.sugar === sugar
            ? { ...c, qty: c.qty + qty }
            : c
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          variant,
          sugar,
          price: item.price,
          qty,
          note: "",
          image: item.image.replace("?w=400&q=80", "?w=100&q=80"),
        },
      ];
    });

    setMenuQuantities((prev) => ({ ...prev, [item.id]: 0 }));
  };

  const resetCart = () => {
    setCart([]);
    setEditingCartItem(null);
  };

  const removeCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
    if (editingCartItem === index) setEditingCartItem(null);
    else if (editingCartItem !== null && editingCartItem > index) {
      setEditingCartItem(editingCartItem - 1);
    }
  };

  const updateCartQty = (index: number, delta: number) => {
    setCart((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  };

  const updateCartVariant = (index: number, val: string) => {
    setCart((prev) =>
      prev.map((item, i) => (i === index ? { ...item, variant: val } : item))
    );
  };

  const updateCartSugar = (index: number, val: string) => {
    setCart((prev) =>
      prev.map((item, i) => (i === index ? { ...item, sugar: val } : item))
    );
  };

  const updateCartNote = (index: number, val: string) => {
    setCart((prev) =>
      prev.map((item, i) => (i === index ? { ...item, note: val } : item))
    );
  };

  const splitCartItem = (index: number) => {
    setCart((prev) => {
      const item = prev[index];
      if (item.qty <= 1) return prev;
      const updated = prev.map((c, i) =>
        i === index ? { ...c, qty: c.qty - 1 } : c
      );
      const clone = { ...item, qty: 1, note: item.note || "" };
      updated.splice(index + 1, 0, clone);
      return updated;
    });
  };

  return (
    <>
      <div className="flex h-full">
      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center gap-4 border-b px-6">
          <h1 className="text-lg font-semibold">Welcome, Jennie Doe</h1>
          <div className="relative ml-auto flex w-80 items-center">
            <Search className="absolute left-3 size-4 text-muted-foreground" />
            <Input
              placeholder="Search anything"
              className="h-9 rounded-lg border-border bg-muted/50 pl-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <RotateCcw className="size-4" />
            <Bell className="size-4" />
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar className="size-4" />
              <span>07 Mei 2025</span>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 border-b px-6 pt-4">
          <button
            onClick={() => setActiveTab("new")}
            className={cn(
              "rounded-t-lg px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "new"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            New Order
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={cn(
              "rounded-t-lg px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "list"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Order List
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "new" ? (
            <>
          {/* Orders List */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-base font-semibold">Orders List</h2>
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setActiveTab("list")}
            >
              View all orders
            </button>
          </div>

          <div className="mb-8 grid grid-cols-5 gap-4">
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Takeaway</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-md border-amber-200 bg-amber-50 text-amber-600"
                  >
                    Waiting
                  </Badge>
                </div>
                <p className="text-sm font-medium">Juna Wok</p>
                <p className="text-xs text-muted-foreground">
                  07-05-2025, 03:18 pm
                </p>
                <p className="mt-2 text-xs text-muted-foreground">4 Items</p>
                <p className="mt-1 text-xs text-muted-foreground">#3243908</p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Delivery</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-md border-emerald-200 bg-emerald-50 text-emerald-600"
                  >
                    Ready
                  </Badge>
                </div>
                <p className="text-sm font-medium">Jung Kit</p>
                <p className="text-xs text-muted-foreground">
                  07-05-2025, 03:18 pm
                </p>
                <p className="mt-2 text-xs text-muted-foreground">6 Items</p>
                <p className="mt-1 text-xs text-muted-foreground">#223399</p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossedIcon />
                    <span className="text-sm font-medium">Dine in</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-md border-red-200 bg-red-50 text-red-600"
                  >
                    Cancel
                  </Badge>
                </div>
                <p className="text-sm font-medium">John Pantau</p>
                <p className="text-xs text-muted-foreground">
                  07-05-2025, 02:18 pm
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  10 Items · Table 3A
                </p>
                <p className="mt-1 text-xs text-muted-foreground">#4487</p>
              </CardContent>
            </Card>
          </div>

          {/* Menu List */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Menu List</h2>
            <div className="relative flex w-64 items-center">
              <Search className="absolute left-3 size-4 text-muted-foreground" />
              <Input
                placeholder="Search menu"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="h-9 rounded-lg border-border bg-muted/50 pl-9 text-sm"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-4 flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={
                  cat === activeCategory
                    ? "rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background"
                    : "rounded-full px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                }
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-5 gap-4">
            {filteredMenu.map((item) => (
              <Card key={item.id} className="flex h-full flex-col gap-0 overflow-hidden rounded-none border-0 py-0 shadow-none">
                <div className="relative aspect-square w-full overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    width={400}
                    height={400}
                    className="block h-full w-full object-cover object-center"
                  />
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-sm font-semibold">
                    Rp. {item.price.toLocaleString("id-ID")}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Select
                      value={selectedVariants[item.id] || "regular"}
                      onValueChange={(val) => {
                        if (val) setSelectedVariants((prev) => ({ ...prev, [item.id]: val }));
                      }}
                    >
                      <SelectTrigger className="h-7 flex-1 text-xs">
                        <SelectValue placeholder="Regular" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedSugar[item.id] || "normal"}
                      onValueChange={(val) => {
                        if (val) setSelectedSugar((prev) => ({ ...prev, [item.id]: val }));
                      }}
                    >
                      <SelectTrigger className="h-7 flex-1 text-xs">
                        <SelectValue placeholder="Normal Sugar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal Sugar</SelectItem>
                        <SelectItem value="less">Less Sugar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center rounded-lg border">
                      <button
                        onClick={() => updateMenuQty(item.id, -1)}
                        className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-6 text-center text-sm">
                        {menuQuantities[item.id] || 0}
                      </span>
                      <button
                        onClick={() => updateMenuQty(item.id, 1)}
                        className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <Button
                      variant="outline"
                      className="h-8 flex-1 rounded-lg text-xs"
                      onClick={() => addToCart(item)}
                    >
                      + Add to cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            </>
          ) : (
            <div className="flex h-full flex-col gap-4">
              <h2 className="text-base font-semibold">Order Board</h2>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {[
                  { key: "Waiting", label: "Waiting", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
                  { key: "Ready", label: "Ready", color: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
                  { key: "Done", label: "Done", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
                  { key: "Cancel", label: "Cancel", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
                ].map((col) => {
                  const orders = boardOrders.filter((o) => o.status === col.key);
                  return (
                    <div
                      key={col.key}
                      className="flex min-w-72 flex-1 flex-col gap-3 rounded-xl bg-muted/30 p-3 transition-colors"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const id = e.dataTransfer.getData("orderId");
                        setBoardOrders((prev) =>
                          prev.map((o) => (o.id === id ? { ...o, status: col.key } : o))
                        );
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn("size-2 rounded-full", col.dot)} />
                          <span className="text-sm font-semibold">{col.label}</span>
                        </div>
                        <Badge variant="outline" className={cn("text-xs", col.color)}>
                          {orders.length}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-2">
                        {orders.map((order) => (
                          <Card
                            key={order.id}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData("orderId", order.id)}
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            className="cursor-grab border-border/60 shadow-sm transition-colors hover:bg-muted/20 active:cursor-grabbing"
                          >
                            <CardContent className="p-3">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{order.id}</span>
                                <span className="text-xs text-muted-foreground">{order.time}</span>
                              </div>
                              <p className="text-sm font-medium">{order.name}</p>
                              <p className="text-xs text-muted-foreground">{order.type}</p>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{order.items} items</span>
                                <span className="text-xs font-semibold">Rp. {order.total.toLocaleString("id-ID")}</span>
                              </div>
                              <div
                                className={cn(
                                  "grid transition-all duration-300 ease-out",
                                  expandedOrder === order.id ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"
                                )}
                              >
                                <div className="overflow-hidden">
                                  <hr className="mb-2 border-border/60" />
                                  <p className="mb-2 text-xs font-semibold">Ordered Items:</p>
                                  <div className="space-y-2">
                                    {order.menuItems?.map((m, idx) => (
                                      <div key={idx} className="flex items-start justify-between text-xs">
                                        <div className="flex flex-col gap-0.5">
                                          <span className="font-medium">{m.name} <span className="text-muted-foreground">x{m.qty}</span></span>
                                          {m.variant && (
                                            <span className="text-muted-foreground">({m.variant}{m.sugar ? `, ${m.sugar}` : ""})</span>
                                          )}
                                          {m.note && (
                                            <span className="max-w-56 wrap-break-word text-[10px] italic leading-tight text-muted-foreground">
                                              Note: {m.note}
                                            </span>
                                          )}
                                        </div>
                                        <span className="shrink-0 pl-2">Rp. {(m.price * m.qty).toLocaleString("id-ID")}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === "new" && (
      <aside className="flex w-[340px] shrink-0 flex-col border-l bg-background">
        <div className="border-b p-4">
          <h2 className="text-base font-semibold">Order Details</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Customer Info */}
          <div className="mb-4">
            <h3 className="mb-3 text-sm font-semibold">Customer Information</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Customer name
                </label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter name"
                  className="h-9 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Order Type
                  </label>
                  <Select value={orderType} onValueChange={(val) => { if (val) setOrderType(val); }}>
                    <SelectTrigger className="h-9 w-full rounded-lg text-sm">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="takeaway">Take Away</SelectItem>
                      <SelectItem value="dinein">Dine In</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Table number
                  </label>
                  <Select value={tableNumber} onValueChange={(val) => { if (val) setTableNumber(val); }}>
                    <SelectTrigger className="h-9 w-full rounded-lg text-sm">
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Table 1</SelectItem>
                      <SelectItem value="2">Table 2</SelectItem>
                      <SelectItem value="3A">Table 3A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Order Items</h3>
              <button
                onClick={resetCart}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Reset Order
              </button>
            </div>
            <div>
              {cart.map((item, index) => (
                <div key={index}>
                  <div className="flex gap-3 py-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium">{item.name}</p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => removeCartItem(index)}
                            className="rounded p-0.5 text-red-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setEditingCartItem(
                                editingCartItem === index ? null : index
                              )
                            }
                            className="rounded p-0.5 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Variant : {item.variant}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sugar : {item.sugar}
                      </p>
                      {item.note && (
                        <p className="text-xs italic text-amber-600">
                          Note: {item.note}
                        </p>
                      )}
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-sm font-semibold">
                          Rp. {item.price.toLocaleString("id-ID")}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          x{item.qty}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Inline Edit Panel */}
                  {editingCartItem === index && (
                    <div className="mb-3 rounded-lg border bg-muted/30 p-3">
                      <div className="mb-2 grid grid-cols-2 gap-2">
                        <Select
                          value={item.variant.toLowerCase()}
                          onValueChange={(val) => {
                            if (val) updateCartVariant(index, val);
                          }}
                        >
                          <SelectTrigger className="h-8 w-full text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={item.sugar.toLowerCase().replace(" sugar", "")}
                          onValueChange={(val) => {
                            if (val) updateCartSugar(index, val);
                          }}
                        >
                          <SelectTrigger className="h-8 w-full text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal Sugar</SelectItem>
                            <SelectItem value="less">Less Sugar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="mb-2">
                        <label className="mb-1 block text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                          Note
                        </label>
                        <textarea
                          value={item.note || ""}
                          onChange={(e) => updateCartNote(index, e.target.value)}
                          placeholder="Add a note..."
                          rows={2}
                          className="w-full rounded-md border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Qty</span>
                        <div className="flex items-center rounded-lg border bg-background">
                          <button
                            onClick={() => updateCartQty(index, -1)}
                            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-6 text-center text-sm">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateCartQty(index, 1)}
                            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </div>
                      {item.qty > 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 h-7 w-full text-xs"
                          onClick={() => splitCartItem(index)}
                        >
                          Split 1x
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="mt-2 h-7 w-full bg-blue-500 text-xs text-white hover:bg-blue-600"
                        onClick={() => setEditingCartItem(null)}
                      >
                        Save
                      </Button>
                    </div>
                  )}

                  {index < cart.length - 1 && <hr className="border-border/60" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="border-t p-4">
          <h3 className="mb-3 text-sm font-semibold">Payment Details</h3>
          <div className="space-y-3">
            <Select value={paymentMethod} onValueChange={(val) => { if (val) setPaymentMethod(val); }}>
              <SelectTrigger className="h-9 w-full rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <Wallet className="size-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="qris">QRIS</SelectItem>
              </SelectContent>
            </Select>

            {paymentMethod === "cash" && (
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Amount Paid
                </label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="h-9 rounded-lg text-sm"
                />
              </div>
            )}

            <Select value={selectedPromo} onValueChange={(val) => { if (val) setSelectedPromo(val); }}>
              <SelectTrigger className="h-9 w-full rounded-lg text-sm">
                <SelectValue placeholder="Select promo code" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WELCOME10">WELCOME10 - 10% Off</SelectItem>
                <SelectItem value="CASHBACK5">CASHBACK5 - Rp.5.000</SelectItem>
                <SelectItem value="BUNDLE20">BUNDLE20 - 20% Off</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-2 pt-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sub total</span>
                <span>Rp. {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-Rp. {discount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxes(2%)</span>
                <span>Rp. {taxes.toLocaleString("id-ID")}</span>
              </div>
              {paymentMethod === "cash" && change > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Change</span>
                  <span className="font-medium">Rp. {change.toLocaleString("id-ID")}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between border-t pt-3">
              <span className="font-semibold">Total</span>
              <span className="font-bold">
                Rp. {total.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <Button
            className="h-11 w-full rounded-xl bg-blue-600 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            disabled={!customerName.trim() || !orderType || !tableNumber || cart.length === 0}
            onClick={() => setShowConfirmModal(true)}
          >
            Confirm Payment
          </Button>
        </div>
      </aside>
      )}
    </div>

      {/* Payment Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-background p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Confirm Payment</h3>
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span className="capitalize">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span>{cart.reduce((sum, i) => sum + i.qty, 0)} items</span>
              </div>
              {paymentMethod === "cash" && cashAmount && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid</span>
                    <span>Rp. {Number(cashAmount).toLocaleString("id-ID")}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">Rp. {total.toLocaleString("id-ID")}</span>
              </div>
              {paymentMethod === "cash" && cashAmount && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Change</span>
                    <span className="font-medium text-green-600">Rp. {change.toLocaleString("id-ID")}</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setShowConfirmModal(false);
                  setReceiptOrderId(`#${Date.now().toString().slice(-4)}`);
                  setShowReceiptModal(true);
                }}
              >
                Pay Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-background p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Receipt Preview</h3>
            <div className="mx-auto mb-4 max-w-[230px] rounded border border-dashed border-muted-foreground/30 bg-white p-4 font-mono text-[11px] leading-relaxed text-black dark:bg-white dark:text-black">
              <div className="text-center">
                <p className="font-bold">RASA NUSA</p>
                <p>Jl. Kemang Raya No. 12</p>
                <p>Jakarta Selatan</p>
                <p>--------------------------</p>
              </div>
              <div className="flex justify-between">
                <span>Order</span>
                <span>{receiptOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span>Date</span>
                <span>{new Date().toLocaleDateString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>Time</span>
                <span>{new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer</span>
                <span>{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Type</span>
                <span className="capitalize">{orderType}</span>
              </div>
              <div className="flex justify-between">
                <span>Table</span>
                <span>{tableNumber}</span>
              </div>
              <p>--------------------------</p>
              {cart.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between">
                    <span>{item.name} x{item.qty}</span>
                    <span>Rp. {(item.price * item.qty).toLocaleString("id-ID")}</span>
                  </div>
                  {item.variant && (
                    <p className="pl-2 text-[10px]">{item.variant}{item.sugar ? `, ${item.sugar}` : ""}</p>
                  )}
                  {item.note && (
                    <p className="pl-2 text-[10px] italic">Note: {item.note}</p>
                  )}
                </div>
              ))}
              <p>--------------------------</p>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rp. {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>-Rp. {discount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (2%)</span>
                <span>Rp. {taxes.toLocaleString("id-ID")}</span>
              </div>
              <p>--------------------------</p>
              <div className="flex justify-between font-bold">
                <span>TOTAL</span>
                <span>Rp. {total.toLocaleString("id-ID")}</span>
              </div>
              {paymentMethod === "cash" && (
                <>
                  <div className="flex justify-between">
                    <span>Cash</span>
                    <span>Rp. {Number(cashAmount).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Change</span>
                    <span>Rp. {change.toLocaleString("id-ID")}</span>
                  </div>
                </>
              )}
              <p className="mt-2 text-center">*** Thank you ***</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowReceiptModal(false)}
              >
                Close
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setShowReceiptModal(false);
                  const newOrderId = receiptOrderId;
                  setBoardOrders((prev) => [
                    {
                      id: newOrderId,
                      name: customerName,
                      type: orderType.charAt(0).toUpperCase() + orderType.slice(1),
                      status: "Waiting",
                      time: new Date().toLocaleString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", ""),
                      items: cart.reduce((sum, i) => sum + i.qty, 0),
                      total,
                      menuItems: cart.map((c) => ({ name: c.name, qty: c.qty, price: c.price, variant: c.variant, sugar: c.sugar, note: c.note })),
                    },
                    ...prev,
                  ]);
                  setCart([]);
                  setCustomerName("");
                  setOrderType("");
                  setTableNumber("");
                  setSelectedPromo("");
                  setCashAmount("");
                  setEditingCartItem(null);
                  setMenuQuantities({});
                }}
              >
                Print & Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UtensilsCrossedIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 text-muted-foreground"
    >
      <path d="m3 2 1.578 17.824L12 22l7.467-2.175L21 2z" />
      <path d="M12 12V7" />
      <path d="m17 2-5 5-5-5" />
      <path d="m17 22-5-5-5 5" />
    </svg>
  );
}
