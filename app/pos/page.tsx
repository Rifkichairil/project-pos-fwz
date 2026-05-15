"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
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
  ShoppingCart,
  Trash2,
  Pencil,
  Minus,
  Plus,
  Calendar,
  Bell,
  RotateCcw,
  Wallet,
  ArrowUpDown,
  Users,
  User,
  Plus as AddIcon,
  Info,
  X,
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
  category: string;
}

type KanbanStatus = "Queue" | "Process" | "Ready" | "Served" | "Done";

interface BoardOrder {
  id: string;
  orderCode: string;
  name: string;
  type: string;
  tableName?: string;
  status: KanbanStatus;
  time: string;
  orderAt?: string;
  items: number;
  total: number;
  handledBy?: string;
  menuItems?: { name: string; qty: number; price: number; variant?: string; sugar?: string; note?: string; refunded?: boolean }[];
}

type PosOrdersApiResponse = {
  orders: BoardOrder[];
};

type TableStatus = "Available" | "Occupied" | "Reserved" | "Cleaning";

type PosTable = {
  id: number;
  name: string;
  capacity: number;
  status: TableStatus;
};

type PosTablesApiResponse = {
  tables: Array<{
    id: number;
    name: string;
    capacity: number;
    status: "available" | "occupied" | "reserved" | "cleaning";
  }>;
};

type PaymentMethod = "cash" | "qris" | "card" | "midtrans" | "e_wallet" | "transfer";

type PosMenuItem = {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  lowStock: boolean;
  lowStockItems: string[];
};

type MenuApiResponse = {
  products: Array<{
    id: number;
    name: string;
    category: string;
    price: number;
    lowStock?: boolean;
    lowStockItems?: string[];
  }>;
};

function createOrderCode() {
  return `TRX-${Date.now()}`;
}

function getMenuInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "--";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function normalizeTableStatus(status: "available" | "occupied" | "reserved" | "cleaning"): TableStatus {
  if (status === "occupied") return "Occupied";
  if (status === "reserved") return "Reserved";
  if (status === "cleaning") return "Cleaning";
  return "Available";
}

function serializeTableStatus(status: TableStatus): "available" | "occupied" | "reserved" | "cleaning" {
  if (status === "Occupied") return "occupied";
  if (status === "Reserved") return "reserved";
  if (status === "Cleaning") return "cleaning";
  return "available";
}

const fallbackMenuImage = "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80";

const memberList = [
  { id: 1, name: "Budi Santoso", phone: "0812-3456-7890" },
  { id: 2, name: "Siti Aminah", phone: "0821-9876-5432" },
  { id: 3, name: "Ahmad Hidayat", phone: "0856-1234-5678" },
  { id: 4, name: "Dewi Kusuma", phone: "0813-5678-9012" },
  { id: 5, name: "Rudi Hartono", phone: "0877-4455-6677" },
  { id: 6, name: "Lina Marlina", phone: "0899-1122-3344" },
];


export default function PosPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [menuItems, setMenuItems] = useState<PosMenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuQuantities, setMenuQuantities] = useState<Record<number, number>>({});
  const [menuSearch, setMenuSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [orderType, setOrderType] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [selectedVariants, setSelectedVariants] = useState<Record<number, string>>({});
  const [selectedSugar, setSelectedSugar] = useState<Record<number, string>>({});
  const [editingCartItem, setEditingCartItem] = useState<number | null>(null);
  const [selectedPromo, setSelectedPromo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMidtransQRModal, setShowMidtransQRModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptOrderId, setReceiptOrderId] = useState("");
  const [receiptData, setReceiptData] = useState<{
    customerName: string;
    orderType: string;
    tableNumber: string;
    paymentMethod: PaymentMethod;
    cashAmount: string;
    cart: CartItem[];
    subtotal: number;
    discount: number;
    taxPb1: number;
    taxPb1Amount: number;
    taxService: number;
    taxServiceAmount: number;
    taxPpn: number;
    taxPpnAmount: number;
    taxes: number;
    total: number;
    change: number;
  } | null>(null);
  const [midtransRedirectUrl, setMidtransRedirectUrl] = useState("");
  const [midtransLoading, setMidtransLoading] = useState(false);
  const [midtransError, setMidtransError] = useState("");
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderSaveError, setOrderSaveError] = useState("");
  const [activeOrderCode, setActiveOrderCode] = useState("");
  const [activeTab, setActiveTab] = useState<"new" | "list" | "table">("new");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [boardOrders, setBoardOrders] = useState<BoardOrder[]>([]);
  const [boardLoading, setBoardLoading] = useState(true);
  const [boardError, setBoardError] = useState("");
  const [boardStatusSaving, setBoardStatusSaving] = useState<string | null>(null);
  const [boardDateFilter, setBoardDateFilter] = useState<"today" | "weekly" | "monthly" | "custom">("today");
  const [boardCustomStartDate, setBoardCustomStartDate] = useState("");
  const [boardCustomEndDate, setBoardCustomEndDate] = useState("");

  const [tables, setTables] = useState<PosTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState("");
  const [tableStatusSavingId, setTableStatusSavingId] = useState<number | null>(null);
  const [tableCreateSaving, setTableCreateSaving] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [taxPb1, setTaxPb1] = useState(0);
  const [taxService, setTaxService] = useState(0);
  const [taxPpn, setTaxPpn] = useState(0);
  const [storeWifiPassword, setStoreWifiPassword] = useState("");

  const cashierName = "Jennie Doe";

  const promoMap: Record<string, { label: string; calc: (sub: number) => number }> = {
    WELCOME10: { label: "WELCOME10", calc: (sub) => Math.round(sub * 0.1) },
    CASHBACK5: { label: "CASHBACK5", calc: () => 5000 },
    BUNDLE20: { label: "BUNDLE20", calc: (sub) => Math.round(sub * 0.2) },
  };

  const loadTaxSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/settings", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as {
        wifiPassword: string;
        pb1Enabled: boolean;
        pb1Rate: number;
        serviceEnabled: boolean;
        serviceRate: number;
        ppnEnabled: boolean;
        ppnRate: number;
      };
      setTaxPb1(data.pb1Enabled ? data.pb1Rate : 0);
      setTaxService(data.serviceEnabled ? data.serviceRate : 0);
      setTaxPpn(data.ppnEnabled ? data.ppnRate : 0);
      setStoreWifiPassword(data.wifiPassword || "");
    } catch {
      // fallback to 0
    }
  }, []);

  const loadMenuList = useCallback(async () => {
    try {
      const response = await fetch("/api/menu", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch menu list");
      }

      const data = (await response.json()) as MenuApiResponse;
      const mapped = (data.products || []).map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        image: fallbackMenuImage,
        lowStock: product.lowStock || false,
        lowStockItems: product.lowStockItems || [],
      }));

      setMenuItems(mapped);
      setMenuError("");
    } catch {
      setMenuError("Failed to load menu list");
      toast.error("Gagal memuat daftar menu");
    } finally {
      setMenuLoading(false);
    }
  }, []);

  const loadBoardOrders = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setBoardLoading(true);
    }

    try {
      const params = new URLSearchParams({
        limit: "100",
        period: boardDateFilter,
      });

      if (boardDateFilter === "custom" && boardCustomStartDate && boardCustomEndDate) {
        params.set("startDate", boardCustomStartDate);
        params.set("endDate", boardCustomEndDate);
      }

      const response = await fetch(`/api/pos?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load order board");
      }

      const data = (await response.json()) as PosOrdersApiResponse;
      setBoardOrders(data.orders || []);
      setBoardError("");
    } catch {
      setBoardError("Failed to load order board");
    } finally {
      setBoardLoading(false);
    }
  }, [boardCustomEndDate, boardCustomStartDate, boardDateFilter]);

  const updateBoardOrderStatus = useCallback(async (orderId: string, nextStatus: KanbanStatus) => {
    const current = boardOrders.find((order) => order.id === orderId);
    if (!current || current.status === nextStatus) {
      return;
    }

    setBoardStatusSaving(orderId);
    setBoardOrders((prev) => {
      const moving = prev.find((order) => order.id === orderId);
      if (!moving) return prev;

      const nextOrders = prev.filter((order) => order.id !== orderId);
      const moved = { ...moving, status: nextStatus };
      const destinationIndex = nextOrders.findIndex((order) => order.status === nextStatus);

      if (destinationIndex === -1) {
        return [moved, ...nextOrders];
      }

      nextOrders.splice(destinationIndex, 0, moved);
      return nextOrders;
    });

    try {
      const response = await fetch("/api/pos", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderCode: current.orderCode,
          status: nextStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      // Release table when order moves to Done
      if (nextStatus === "Done" && current.tableName) {
        const matchedTable = tables.find((t) => t.name === current.tableName);
        if (matchedTable) {
          void fetch(`/api/tables/${matchedTable.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "available" }),
          });
          setTables((prev) => prev.map((t) => t.id === matchedTable.id ? { ...t, status: "Available" } : t));
        }
      }

      // Re-occupy table when order moves away from Done
      if (current.status === "Done" && nextStatus !== "Done" && current.tableName) {
        const matchedTable = tables.find((t) => t.name === current.tableName);
        if (matchedTable) {
          void fetch(`/api/tables/${matchedTable.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "occupied" }),
          });
          setTables((prev) => prev.map((t) => t.id === matchedTable.id ? { ...t, status: "Occupied" } : t));
        }
      }
    } catch {
      void loadBoardOrders(false);
    } finally {
      setBoardStatusSaving(null);
    }
  }, [boardOrders, loadBoardOrders, tables]);

  const loadTables = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setTablesLoading(true);
    }

    try {
      const response = await fetch("/api/tables", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load tables");
      }

      const data = (await response.json()) as PosTablesApiResponse;
      const mapped = (data.tables || []).map((table) => ({
        id: table.id,
        name: table.name,
        capacity: table.capacity,
        status: normalizeTableStatus(table.status),
      }));

      setTables(mapped);
      setTablesError("");
    } catch {
      setTablesError("Failed to load tables");
    } finally {
      setTablesLoading(false);
    }
  }, []);

  const updateTableStatus = useCallback(async (tableId: number, status: TableStatus) => {
    const current = tables.find((table) => table.id === tableId);
    if (!current || current.status === status) {
      return;
    }

    setTableStatusSavingId(tableId);
    setTables((prev) => prev.map((table) => (table.id === tableId ? { ...table, status } : table)));

    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: serializeTableStatus(status) }),
      });

      if (!response.ok) {
        throw new Error("Failed to update table status");
      }

      setTablesError("");
    } catch {
      setTables((prev) => prev.map((table) => (table.id === tableId ? { ...table, status: current.status } : table)));
      setTablesError("Failed to update table status");
    } finally {
      setTableStatusSavingId(null);
    }
  }, [tables]);

  const createTable = useCallback(async () => {
    const name = newTableName.trim();
    const capacity = Number(newTableCapacity);

    if (!name || !Number.isFinite(capacity) || capacity <= 0) {
      setTablesError("Table name and capacity are required");
      toast.error("Nama meja dan kapasitas harus diisi");
      return;
    }

    setTableCreateSaving(true);

    try {
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          capacity: Math.trunc(capacity),
          status: "available",
        }),
      });

      const data = (await response.json()) as { error?: string; table?: { id: number; name: string; capacity: number; status: "available" | "occupied" | "reserved" | "cleaning" } };

      if (!response.ok || !data.table) {
        throw new Error(data.error || "Failed to create table");
      }

      setTables((prev) => [
        {
          id: data.table!.id,
          name: data.table!.name,
          capacity: data.table!.capacity,
          status: normalizeTableStatus(data.table!.status),
        },
        ...prev,
      ]);
      setTablesError("");
      setShowAddTableModal(false);
      setNewTableName("");
      setNewTableCapacity("");
      toast.success("Meja berhasil ditambahkan!");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to create table";
      setTablesError(msg);
      toast.error(msg);
    } finally {
      setTableCreateSaving(false);
    }
  }, [newTableCapacity, newTableName]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadMenuList();
      void loadBoardOrders();
      void loadTables();
      void loadTaxSettings();
    });
  }, [loadMenuList, loadBoardOrders, loadTables, loadTaxSettings]);

  useEffect(() => {
    const timer = setInterval(() => {
      void loadBoardOrders(false);
      void loadTables(false);
    }, 3000);

    return () => clearInterval(timer);
  }, [loadBoardOrders, loadTables]);

  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(menuItems.map((item) => item.category))).sort((a, b) => a.localeCompare(b)),
  ];

  const filteredMenu = menuItems
    .filter((item) => activeCategory === "All" || item.category === activeCategory)
    .filter((item) => item.name.toLowerCase().includes(menuSearch.toLowerCase()));

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = selectedPromo && promoMap[selectedPromo] ? promoMap[selectedPromo].calc(subtotal) : 0;
  const afterDiscount = subtotal - discount;
  const taxPb1Amount = Math.round(afterDiscount * (taxPb1 / 100));
  const taxServiceAmount = Math.round(afterDiscount * (taxService / 100));
  const taxPpnAmount = Math.round(afterDiscount * (taxPpn / 100));
  const taxes = taxPb1Amount + taxServiceAmount + taxPpnAmount;
  const total = afterDiscount + taxes;
  const change = paymentMethod === "cash" && cashAmount ? Math.max(0, Number(cashAmount) - total) : 0;

  const updateMenuQty = (id: number, delta: number) => {
    setMenuQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  const addToCart = (item: PosMenuItem) => {
    const qty = menuQuantities[item.id] || 1;
    const variant = selectedVariants[item.id] || "Regular";
    const sugar = item.category === "Beverage"
      ? (selectedSugar[item.id] || "Normal")
      : "-";

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
          image: item.image,
          category: item.category,
        },
      ];
    });

    setMenuQuantities((prev) => ({ ...prev, [item.id]: 0 }));
  };

  const resetCart = () => {
    setCart([]);
    setEditingCartItem(null);
  };

  const resetOrderDetails = () => {
    setCart([]);
    setCustomerName("");
    setIsMember(false);
    setOrderType("");
    setTableNumber("");
    setSelectedPromo("");
    setCashAmount("");
    setEditingCartItem(null);
    setMenuQuantities({});
    setOrderSaveError("");
    setActiveOrderCode("");
    void loadBoardOrders();
  };

  const refundItem = async (orderCode: string, itemName: string, itemIndex: number) => {
    try {
      const response = await fetch("/api/pos/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode, itemName, itemIndex }),
      });

      const data = await response.json() as { success?: boolean; error?: string };

      if (!response.ok) {
        toast.error(data.error || "Gagal refund item");
        return;
      }

      toast.success(`${itemName} berhasil di-refund`);
      void loadBoardOrders(false);
    } catch {
      toast.error("Gagal memproses refund");
    }
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

  const switchToNewOrderTab = () => {
    setActiveTab("new");
    setBoardDateFilter("today");
    setBoardCustomStartDate("");
    setBoardCustomEndDate("");
  };

  const saveOrderToDb = async (paymentStatus: "pending" | "paid", methodOverride?: PaymentMethod) => {
    const orderCode = activeOrderCode || createOrderCode();
    const payment = methodOverride || paymentMethod;

    setOrderSaving(true);
    setOrderSaveError("");
    setActiveOrderCode(orderCode);

    try {
      const response = await fetch("/api/pos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderCode,
          customerName,
          memberName: isMember ? customerName : undefined,
          orderType,
          tableNumber,
          cashierName,
          paymentMethod: payment,
          paymentStatus,
          provider: payment === "midtrans" ? "midtrans" : undefined,
          providerTxId: orderCode,
          subtotal,
          discount,
          taxes,
          pb1Amount: taxPb1Amount,
          serviceAmount: taxServiceAmount,
          ppnAmount: taxPpnAmount,
          total,
          items: cart.map((item) => ({
            menuId: item.id,
            name: item.name,
            variant: item.variant,
            sugar: item.sugar,
            price: item.price,
            qty: item.qty,
            note: item.note,
          })),
        }),
      });

      const data = (await response.json()) as { error?: string; orderCode?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to save order");
      }

      // Update table status to occupied when order is paid
      if (paymentStatus === "paid" && tableNumber) {
        const selectedTable = tables.find((t) => t.name === tableNumber);
        if (selectedTable) {
          void fetch(`/api/tables/${selectedTable.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "occupied" }),
          });
        }
      }

      return data.orderCode || orderCode;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save order";
      setOrderSaveError(message);
      toast.error(message);
      throw error;
    } finally {
      setOrderSaving(false);
    }
  };

  const finalizeOrderPayment = async (orderCode: string) => {
    setOrderSaving(true);
    setOrderSaveError("");

    try {
      const response = await fetch("/api/pos", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderCode,
          paymentStatus: "paid",
          handledBy: cashierName,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to finalize payment");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to finalize payment";
      setOrderSaveError(message);
      toast.error(message);
      throw error;
    } finally {
      setOrderSaving(false);
    }
  };

  const handleMidtransPayNow = async (orderIdOverride?: string) => {
    const orderId = orderIdOverride || activeOrderCode || createOrderCode();
    setActiveOrderCode(orderId);
    setMidtransLoading(true);
    setMidtransError("");

    try {
      const response = await fetch("/api/midtrans/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          total,
          customerName,
          items: cart.map((item) => ({
            id: String(item.id),
            price: item.price,
            quantity: item.qty,
            name: item.name,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create Midtrans transaction");
      }

      setReceiptOrderId(`#${orderId.slice(-4)}`);
      setMidtransRedirectUrl(data.redirect_url || "");
      setShowConfirmModal(false);
      setShowMidtransQRModal(true);
    } catch (error) {
      setMidtransError(error instanceof Error ? error.message : "Midtrans payment failed");
      toast.error(error instanceof Error ? error.message : "Midtrans payment failed");
      setShowConfirmModal(false);
      setShowMidtransQRModal(true);
    } finally {
      setMidtransLoading(false);
    }
  };

  return (
    <>
      <div className="flex h-full">
      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center gap-3 border-b px-4 sm:gap-4 sm:px-6">
          <h1 className="text-base font-semibold sm:text-lg">Welcome, {cashierName}</h1>
          <div className="relative ml-auto hidden sm:flex w-64 items-center">
            <Search className="absolute left-3 size-4 text-muted-foreground" />
            <Input
              placeholder="Search anything"
              className="h-9 rounded-lg border-border bg-muted/50 pl-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="size-4" />
            <span>
              {currentTime.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
              {" · "}
              {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 border-b px-4 pt-4 sm:px-6">
          <button
            onClick={switchToNewOrderTab}
            className={cn(
              "rounded-t-lg px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-colors",
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
              "rounded-t-lg px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-colors",
              activeTab === "list"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Order List
          </button>
          <button
            onClick={() => setActiveTab("table")}
            className={cn(
              "rounded-t-lg px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-colors",
              activeTab === "table"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Table
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
          {/* Mobile Cart Toggle */}
          <button
            onClick={() => setCartOpen(true)}
            className="lg:hidden fixed bottom-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
          >
            <ShoppingCart className="size-6" />
            {cart.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {cart.length}
              </span>
            )}
          </button>

          <div
            key={activeTab}
            className="animate-in fade-in-0 slide-in-from-bottom-2 duration-[650ms]"
          >
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

          <div className="mb-8">
            {boardLoading ? (
              <p className="text-xs text-muted-foreground">Loading order board...</p>
            ) : boardError ? (
              <p className="text-xs text-red-600">{boardError}</p>
            ) : boardOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground">No orders found.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 2xl:gap-4">
                {boardOrders.slice(0, 5).map((order) => (
                  <Card key={order.id} className="border-border/60">
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {order.type.toLowerCase() === "takeaway" ? (
                            <ShoppingBag className="size-4 text-muted-foreground" />
                          ) : order.type.toLowerCase() === "delivery" ? (
                            <ArrowUpDown className="size-4 text-muted-foreground" />
                          ) : (
                            <UtensilsCrossedIcon />
                          )}
                          <span className="text-sm font-medium">{order.type}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-md",
                            order.status === "Queue"
                              ? "border-amber-200 bg-amber-50 text-amber-600"
                              : order.status === "Process"
                                ? "border-blue-200 bg-blue-50 text-blue-600"
                                : order.status === "Ready"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                  : order.status === "Served"
                                    ? "border-purple-200 bg-purple-50 text-purple-600"
                                    : "border-green-200 bg-green-50 text-green-600"
                          )}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{order.name}</p>
                      <p className="text-xs text-muted-foreground">{order.time}</p>
                      <p className="text-xs text-muted-foreground">Handled by: {order.handledBy || "-"}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{order.items} Items</p>
                      <p className="mt-1 text-xs text-muted-foreground">#{order.orderCode.slice(-4)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Menu List */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold">Menu List</h2>
            <div className="relative flex w-full items-center sm:w-64">
              <Search className="absolute left-3 size-4 text-muted-foreground" />
              <Input
                placeholder="Search menu"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="h-9 rounded-lg border-border bg-muted/50 pl-9 text-sm"
              />
            </div>
          </div>

          <div className="mb-3">
            {menuLoading ? (
              <p className="text-xs text-muted-foreground">Loading menu...</p>
            ) : menuError ? (
              <p className="text-xs text-red-600">{menuError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{filteredMenu.length} menu items</p>
            )}
          </div>

          {/* Categories */}
          <div className="mb-4 flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={
                  cat === activeCategory
                    ? "rounded-full bg-primary px-3 py-1.5 text-xs sm:px-4 sm:py-1.5 sm:text-sm font-medium text-primary-foreground whitespace-nowrap"
                    : "rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-1.5 sm:text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground whitespace-nowrap"
                }
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <div
            key={activeCategory}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 animate-in fade-in-0 duration-[700ms]"
          >
            {filteredMenu.map((item) => (
              <Card key={item.id} className={cn("flex flex-col gap-0 overflow-hidden rounded-xl py-0 shadow-none transition-all duration-500 hover:-translate-y-0.5", cart.some((c) => c.id === item.id) ? "border-orange-300 border-2" : "border border-border/40")}>
                <div className="relative flex aspect-square w-full shrink-0 items-center justify-center bg-muted/40">
                  {item.lowStock && (
                    <div className="absolute top-2 right-2 group/lowstock">
                      <Badge variant="outline" className="cursor-help border-red-200 bg-red-50 text-[9px] text-red-600 px-1.5 py-0.5">
                        Stok Menipis
                      </Badge>
                      <span className="pointer-events-none absolute top-full right-0 z-50 mt-1 whitespace-nowrap rounded-lg border bg-popover px-2.5 py-1.5 text-[10px] text-popover-foreground shadow-md opacity-0 transition-opacity group-hover/lowstock:opacity-100">
                        {item.lowStockItems.map((name, i) => (
                          <span key={i} className="block">{name}</span>
                        ))}
                      </span>
                    </div>
                  )}
                  <Avatar className="size-20 border-none after:hidden">
                    <AvatarFallback className="bg-primary/10 text-xl font-semibold tracking-wide text-primary">
                      {getMenuInitials(item.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardContent className="p-2">
                  <p className="text-sm font-medium leading-tight">{item.name}</p>
                  <p className="text-sm font-semibold leading-tight">
                    Rp. {item.price.toLocaleString("id-ID")}
                  </p>
                  {item.category === "Beverage" ? (
                  <div className="mt-1 flex gap-1.5">
                    <Select
                      value={selectedVariants[item.id] || "regular"}
                      onValueChange={(val) => {
                        if (val) setSelectedVariants((prev) => ({ ...prev, [item.id]: val }));
                      }}
                    >
                      <SelectTrigger className="h-6 flex-1 text-xs px-2">
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
                      <SelectTrigger className="h-6 flex-1 text-xs px-2">
                        <SelectValue placeholder="Normal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="less">Less Sugar</SelectItem>
                        <SelectItem value="no">No Sugar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  ) : (
                  <div className="mt-1">
                    <Select
                      value={selectedVariants[item.id] || "regular"}
                      onValueChange={(val) => {
                        if (val) setSelectedVariants((prev) => ({ ...prev, [item.id]: val }));
                      }}
                    >
                      <SelectTrigger className="h-6 w-full text-xs px-2">
                        <SelectValue placeholder="Regular" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="extra">Extra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  )}
                  <div className="mt-1.5 flex items-center justify-between gap-1.5">
                    <div className="flex items-center rounded-lg border">
                      <button
                        onClick={() => updateMenuQty(item.id, -1)}
                        className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-5 text-center text-sm">
                        {cart.filter((c) => c.id === item.id).reduce((sum, c) => sum + c.qty, 0) || menuQuantities[item.id] || 0}
                      </span>
                      <button
                        onClick={() => updateMenuQty(item.id, 1)}
                        className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <Button
                      variant="outline"
                      className="h-7 w-7 flex-none rounded-lg p-0"
                      onClick={() => addToCart(item)}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            </>
          ) : activeTab === "list" ? (
            <div className="flex h-full flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold">Order Board</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant={boardDateFilter === "today" ? "default" : "outline"}
                    className="h-8 px-3 text-xs"
                    onClick={() => setBoardDateFilter("today")}
                  >
                    Today
                  </Button>
                  <Button
                    type="button"
                    variant={boardDateFilter === "weekly" ? "default" : "outline"}
                    className="h-8 px-3 text-xs"
                    onClick={() => setBoardDateFilter("weekly")}
                  >
                    Weekly
                  </Button>
                  <Button
                    type="button"
                    variant={boardDateFilter === "monthly" ? "default" : "outline"}
                    className="h-8 px-3 text-xs"
                    onClick={() => setBoardDateFilter("monthly")}
                  >
                    Monthly
                  </Button>
                  <Button
                    type="button"
                    variant={boardDateFilter === "custom" ? "default" : "outline"}
                    className="h-8 px-3 text-xs"
                    onClick={() => setBoardDateFilter("custom")}
                  >
                    Custom Range
                  </Button>
                </div>
              </div>

              {boardDateFilter === "custom" && (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="date"
                    value={boardCustomStartDate}
                    onChange={(e) => setBoardCustomStartDate(e.target.value)}
                    className="h-8 w-[170px] text-xs"
                  />
                  <Input
                    type="date"
                    value={boardCustomEndDate}
                    onChange={(e) => setBoardCustomEndDate(e.target.value)}
                    className="h-8 w-[170px] text-xs"
                  />
                </div>
              )}

              {boardLoading ? (
                <p className="text-xs text-muted-foreground">Loading order board...</p>
              ) : boardError ? (
                <p className="text-xs text-red-600">{boardError}</p>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {[
                    { key: "Queue", label: "Queue", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
                    { key: "Process", label: "Process", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
                    { key: "Ready", label: "Ready", color: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
                    { key: "Served", label: "Served", color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
                    { key: "Done", label: "Done", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
                  ].map((col) => {
                    const orders = boardOrders.filter((o) => o.status === (col.key as KanbanStatus));
                    return (
                      <div
                        key={col.key}
                        className="flex min-w-72 flex-1 flex-col gap-3 rounded-xl bg-muted/30 p-3 transition-colors duration-500"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const id = e.dataTransfer.getData("orderId");
                          if (!id) return;
                          void updateBoardOrderStatus(id, col.key as KanbanStatus);
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
                              draggable={boardStatusSaving !== order.id}
                              onDragStart={(e) => e.dataTransfer.setData("orderId", order.id)}
                              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                              className={cn(
                                "border-border/60 shadow-sm transition-all duration-500 hover:-translate-y-0.5 hover:bg-muted/20",
                                boardStatusSaving === order.id ? "cursor-wait opacity-70" : "cursor-grab active:cursor-grabbing"
                              )}
                            >
                              <CardContent className="p-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">#{order.orderCode.slice(-4)}</span>
                                  <span className="text-xs text-muted-foreground">{order.time}</span>
                                </div>
                                <p className="text-sm font-medium">{order.name}</p>
                                <p className="text-xs text-muted-foreground">{order.type}</p>
                                <p className="text-xs text-muted-foreground">Handled by: {order.handledBy || "-"}</p>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">{order.items} items</span>
                                  <span className="text-xs font-semibold">Rp. {order.total.toLocaleString("id-ID")}</span>
                                </div>
                                <div
                                  className={cn(
                                    "grid transition-all duration-500 ease-out",
                                    expandedOrder === order.id ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"
                                  )}
                                >
                                  <div className="overflow-hidden">
                                    <hr className="mb-2 border-border/60" />
                                    <p className="mb-2 text-xs font-semibold">Ordered Items:</p>
                                    <div className="space-y-2">
                                      {order.menuItems?.map((m, idx) => (
                                        <div key={idx} className={cn("flex items-start justify-between text-xs", m.refunded && "opacity-50")}>
                                          <div className="flex flex-col gap-0.5">
                                            <span className={cn("font-medium", m.refunded && "line-through")}>{m.name} <span className="text-muted-foreground">x{m.qty}</span></span>
                                            {m.variant && (
                                              <span className="text-muted-foreground">({m.variant}{m.sugar ? `, ${m.sugar}` : ""})</span>
                                            )}
                                            {m.note && (
                                              <span className="max-w-56 wrap-break-word text-[10px] italic leading-tight text-muted-foreground">
                                                Note: {m.note}
                                              </span>
                                            )}
                                            {m.refunded && (
                                              <Badge variant="outline" className="w-fit border-red-200 bg-red-50 text-red-600 text-[9px] px-1 py-0">Refunded</Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1.5 shrink-0 pl-2">
                                            <span className={cn(m.refunded && "line-through")}>Rp. {(m.price * m.qty).toLocaleString("id-ID")}</span>
                                            {!m.refunded && order.status === "Done" && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  void refundItem(order.orderCode, m.name, idx);
                                                }}
                                                className="rounded p-0.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                                                title="Refund item ini"
                                              >
                                                <RotateCcw className="size-3" />
                                              </button>
                                            )}
                                          </div>
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
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Table Management</h2>
                <Button
                  onClick={() => setShowAddTableModal(true)}
                  className="h-8 gap-1.5 px-3 text-xs"
                >
                  <AddIcon className="size-3.5" />
                  Add Table
                </Button>
              </div>
              {tablesLoading ? (
                <p className="text-xs text-muted-foreground">Loading tables...</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                  {tables.map((table) => (
                    <Card key={table.id} className="border-border/60">
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-semibold">{table.name}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-md text-xs",
                              table.status === "Available" && "border-emerald-200 bg-emerald-50 text-emerald-600",
                              table.status === "Occupied" && "border-red-200 bg-red-50 text-red-600",
                              table.status === "Reserved" && "border-amber-200 bg-amber-50 text-amber-600",
                              table.status === "Cleaning" && "border-blue-200 bg-blue-50 text-blue-600"
                            )}
                          >
                            {table.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Capacity: {table.capacity} persons</p>
                        {table.status === "Available" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 h-7 w-full text-xs"
                            disabled={tableStatusSavingId === table.id}
                            onClick={() => void updateTableStatus(table.id, "Reserved")}
                          >
                            Reserved
                          </Button>
                        ) : table.status === "Occupied" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 h-7 w-full text-xs"
                            disabled={tableStatusSavingId === table.id}
                            onClick={() => void updateTableStatus(table.id, "Cleaning")}
                          >
                            Cleaning
                          </Button>
                        ) : table.status === "Reserved" ? (
                          <div className="mt-3 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-7 text-xs"
                              disabled={tableStatusSavingId === table.id}
                              onClick={() => void updateTableStatus(table.id, "Occupied")}
                            >
                              Occupied
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-7 text-xs"
                              disabled={tableStatusSavingId === table.id}
                              onClick={() => void updateTableStatus(table.id, "Available")}
                            >
                              Available
                            </Button>
                          </div>
                        ) : table.status === "Cleaning" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 h-7 w-full text-xs"
                            disabled={tableStatusSavingId === table.id}
                            onClick={() => void updateTableStatus(table.id, "Available")}
                          >
                            Available
                          </Button>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {tablesError && (
                <p className="text-xs text-red-600">{tablesError}</p>
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      {activeTab === "new" && (
      <>
      {/* Mobile Overlay */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setCartOpen(false)}
        />
      )}
      <aside
        className={cn(
          "flex w-[340px] shrink-0 flex-col border-l bg-background fixed inset-y-0 right-0 z-50 transition-transform duration-500 lg:static lg:translate-x-0 lg:z-auto",
          cartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        <div className="border-b p-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Order Details</h2>
          <button
            onClick={resetOrderDetails}
            className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500"
            title="Clear semua order"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Customer Info */}
          <div className="mb-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Customer Information</h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Edit customer info"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => {
                    setCustomerName("");
                    setIsMember(false);
                    setOrderType("");
                    setTableNumber("");
                  }}
                  className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500"
                  title="Clear customer info"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
            {(customerName || orderType || tableNumber) ? (
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{customerName || "-"} {isMember ? <Badge variant="outline" className="ml-1 text-[9px] px-1 py-0">Member</Badge> : <Badge variant="outline" className="ml-1 text-[9px] px-1 py-0">Guest</Badge>}</span>
                <span className="text-muted-foreground">
                  {orderType ? (orderType === "dinein" ? "Dine In" : orderType === "takeaway" ? "Take Away" : "Delivery") : "-"}
                  {tableNumber ? ` // ${tableNumber}` : ""}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Belum ada data customer. Klik ikon pensil untuk mengisi.</p>
            )}
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
                    <div className="relative size-14 shrink-0">
                      <Avatar className="size-14 border-none after:hidden">
                        <AvatarFallback className="bg-primary/10 text-sm font-semibold tracking-wide text-primary">
                          {getMenuInitials(item.name)}
                        </AvatarFallback>
                      </Avatar>
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
                        {item.category === "Beverage" ? "Size" : "Porsi"} : {item.variant}
                      </p>
                      {item.category === "Beverage" && (
                      <p className="text-xs text-muted-foreground">
                        Sugar : {item.sugar}
                      </p>
                      )}
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
                            {item.category === "Beverage" ? (
                              <>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="extra">Extra</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        {item.category === "Beverage" && (
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
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="less">Less Sugar</SelectItem>
                            <SelectItem value="no">No Sugar</SelectItem>
                          </SelectContent>
                        </Select>
                        )}
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
            <div className="grid grid-cols-5 gap-2">
              <Select value={paymentMethod} onValueChange={(val) => { if (val) setPaymentMethod(val as PaymentMethod); }}>
                <SelectTrigger className="col-span-2 h-9 w-full rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <Wallet className="size-3.5" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedPromo} onValueChange={(val) => { setSelectedPromo(val === "none" ? "" : val); }}>
                <SelectTrigger className="col-span-3 h-9 w-full rounded-lg text-sm">
                  <SelectValue placeholder="Promo code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Promo</SelectItem>
                  <SelectItem value="WELCOME10">WELCOME10 - 10%</SelectItem>
                  <SelectItem value="CASHBACK5">CASHBACK5 - Rp.5K</SelectItem>
                  <SelectItem value="BUNDLE20">BUNDLE20 - 20%</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

            <div className="space-y-2 pt-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sub total</span>
                <span>Rp. {subtotal.toLocaleString("id-ID")}</span>
              </div>
              {selectedPromo && discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-Rp. {discount.toLocaleString("id-ID")}</span>
              </div>
              )}
              {(taxPb1 > 0 || taxService > 0 || taxPpn > 0) && (
              <div className="relative group/tax">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    Taxes
                    <span className="relative inline-block">
                      <Info className="size-3.5 text-muted-foreground cursor-help" />
                      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md opacity-0 transition-opacity group-hover/tax:opacity-100">
                        {taxPb1 > 0 && <span className="block">PB1: {taxPb1}% = Rp. {taxPb1Amount.toLocaleString("id-ID")}</span>}
                        {taxService > 0 && <span className="block">Service: {taxService}% = Rp. {taxServiceAmount.toLocaleString("id-ID")}</span>}
                        {taxPpn > 0 && <span className="block">PPN: {taxPpn}% = Rp. {taxPpnAmount.toLocaleString("id-ID")}</span>}
                      </span>
                    </span>
                  </span>
                  <span>Rp. {taxes.toLocaleString("id-ID")}</span>
                </div>
              </div>
              )}
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
            disabled={!customerName.trim() || !orderType || !tableNumber || cart.length === 0 || (paymentMethod === "cash" && (!cashAmount || Number(cashAmount) < total))}
            onClick={() => {
              setMidtransError("");
              setMidtransRedirectUrl("");
              setOrderSaveError("");
              setShowConfirmModal(true);
            }}
          >
            Confirm Payment
          </Button>
        </div>
      </aside>
      </>
      )}
    </div>

      {/* Customer Information Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Customer Information</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Guest / Member toggle */}
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">Tipe Customer</label>
                <div className="flex overflow-hidden rounded-lg border">
                  <button
                    onClick={() => { setIsMember(false); setCustomerName(""); }}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
                      !isMember ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <User className="size-3.5" /> Guest
                  </button>
                  <button
                    onClick={() => { setIsMember(true); setCustomerName(""); }}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
                      isMember ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Users className="size-3.5" /> Member
                  </button>
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">Customer Name</label>
                {isMember ? (
                  <Select value={customerName} onValueChange={(val) => { if (val) setCustomerName(val); }}>
                    <SelectTrigger className="h-9 w-full rounded-lg text-sm">
                      <SelectValue placeholder="Pilih member" />
                    </SelectTrigger>
                    <SelectContent>
                      {memberList.map((m) => (
                        <SelectItem key={m.id} value={m.name}>{m.name} — {m.phone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Masukkan nama customer"
                    className="h-9 rounded-lg text-sm"
                  />
                )}
              </div>

              {/* Order Type */}
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">Order Type</label>
                <Select value={orderType} onValueChange={(val) => { if (val) setOrderType(val); }}>
                  <SelectTrigger className="h-9 w-full rounded-lg text-sm">
                    <SelectValue placeholder="Pilih tipe order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="takeaway">Take Away</SelectItem>
                    <SelectItem value="dinein">Dine In</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table Number */}
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">Table Number</label>
                <Select value={tableNumber} onValueChange={(val) => { if (val) setTableNumber(val); }}>
                  <SelectTrigger className="h-9 w-full rounded-lg text-sm">
                    <SelectValue placeholder="Pilih meja" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.filter((t) => t.status === "Available").map((table) => (
                      <SelectItem key={table.id} value={table.name}>{table.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Save Button */}
              <Button
                className="w-full"
                onClick={() => setShowCustomerModal(false)}
              >
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

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
              {(paymentMethod === "card" || paymentMethod === "qris" || paymentMethod === "midtrans") && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Gateway</span>
                  <span>Midtrans</span>
                </div>
              )}
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
                disabled={midtransLoading || orderSaving}
                onClick={async () => {
                  if (paymentMethod === "cash") {
                    try {
                      const savedOrderCode = await saveOrderToDb("paid", "cash");
                      setShowConfirmModal(false);
                      setReceiptOrderId(`#${savedOrderCode.slice(-4)}`);
                      setReceiptData({
                        customerName, orderType, tableNumber, paymentMethod, cashAmount,
                        cart: [...cart], subtotal, discount,
                        taxPb1, taxPb1Amount, taxService, taxServiceAmount, taxPpn, taxPpnAmount,
                        taxes, total, change,
                      });
                      setShowReceiptModal(true);
                      toast.success("Pembayaran berhasil!");
                      resetOrderDetails();
                    } catch {
                      return;
                    }
                    return;
                  }

                  // QRIS → via Midtrans
                  const existingOrderCode = activeOrderCode;
                  let pendingOrderCode = existingOrderCode;

                  if (!pendingOrderCode) {
                    try {
                      pendingOrderCode = await saveOrderToDb("pending", "qris");
                    } catch {
                      return;
                    }
                  }

                  await handleMidtransPayNow(pendingOrderCode);
                }}
              >
                {midtransLoading || orderSaving ? "Processing..." : "Pay Now"}
              </Button>
            </div>
            {orderSaveError && (
              <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">
                {orderSaveError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Midtrans QR Modal */}
      {showMidtransQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-background p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Midtrans QR Payment</h3>
            <div className="mb-4 flex flex-col items-center gap-3">
              {midtransLoading ? (
                <p className="text-sm text-muted-foreground">Generating Midtrans QR...</p>
              ) : midtransError ? (
                <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {midtransError}
                </div>
              ) : midtransRedirectUrl ? (
                <>
                  <div className="w-full overflow-hidden rounded-lg border">
                    <iframe
                      src={midtransRedirectUrl}
                      title="Midtrans Payment"
                      className="h-96 w-full"
                    />
                  </div>
                  <a
                    href={midtransRedirectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 underline"
                  >
                    Open Midtrans in new tab
                  </a>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No QR session found.</p>
              )}
              <p className="text-center text-sm text-muted-foreground">
                Scan QR dari halaman Midtrans lalu lanjutkan setelah pembayaran sukses.
              </p>
              {orderSaveError && (
                <p className="w-full rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">
                  {orderSaveError}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowMidtransQRModal(false);
                  setMidtransRedirectUrl("");
                  setMidtransError("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={orderSaving}
                onClick={async () => {
                  const orderCode = activeOrderCode;
                  if (!orderCode) {
                    setOrderSaveError("Order belum tersimpan");
                    return;
                  }

                  try {
                    await finalizeOrderPayment(orderCode);
                    setShowMidtransQRModal(false);
                    setReceiptOrderId(`#${orderCode.slice(-4)}`);
                    setReceiptData({
                      customerName, orderType, tableNumber, paymentMethod, cashAmount,
                      cart: [...cart], subtotal, discount,
                      taxPb1, taxPb1Amount, taxService, taxServiceAmount, taxPpn, taxPpnAmount,
                      taxes, total, change,
                    });
                    setShowReceiptModal(true);
                    toast.success("Pembayaran berhasil!");
                    resetOrderDetails();
                  } catch {
                    return;
                  }
                }}
              >
                {orderSaving ? "Saving..." : "Payment Complete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-background p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Add New Table</h3>
            <div className="mb-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Table Name
                </label>
                <Input
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="e.g., Table 5A"
                  className="h-9 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Capacity (persons)
                </label>
                <Input
                  type="number"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(e.target.value)}
                  placeholder="e.g., 4"
                  className="h-9 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAddTableModal(false);
                  setNewTableName("");
                  setNewTableCapacity("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  void createTable();
                }}
                disabled={!newTableName.trim() || !newTableCapacity || tableCreateSaving}
              >
                {tableCreateSaving ? "Saving..." : "Add Table"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-background p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Receipt Preview</h3>
            <div className="mx-auto mb-4 max-w-[230px] rounded border border-dashed border-muted-foreground/30 bg-white p-4 font-mono text-[11px] leading-relaxed text-black dark:bg-white dark:text-black">
              <div className="text-center">
                <p className="font-bold">WARUNG KITA</p>
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
                <span>{receiptData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Type</span>
                <span className="capitalize">{receiptData.orderType}</span>
              </div>
              <div className="flex justify-between">
                <span>Table</span>
                <span>{receiptData.tableNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment</span>
                <span className="capitalize">{receiptData.paymentMethod}</span>
              </div>
              {(receiptData.paymentMethod === "qris") && (
                <div className="flex justify-between">
                  <span>PG</span>
                  <span>Midtrans</span>
                </div>
              )}
              <p>--------------------------</p>
              {receiptData.cart.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between">
                    <span>{item.name} x{item.qty}</span>
                    <span>Rp. {(item.price * item.qty).toLocaleString("id-ID")}</span>
                  </div>
                  {item.variant && (
                    <p className="pl-2 text-[10px]">{item.variant}{item.category === "Beverage" && item.sugar && item.sugar !== "-" ? `, ${item.sugar}` : ""}</p>
                  )}
                  {item.note && (
                    <p className="pl-2 text-[10px] italic">Note: {item.note}</p>
                  )}
                </div>
              ))}
              <p>--------------------------</p>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rp. {receiptData.subtotal.toLocaleString("id-ID")}</span>
              </div>
              {receiptData.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span>-Rp. {receiptData.discount.toLocaleString("id-ID")}</span>
              </div>
              )}
              {receiptData.taxPb1 > 0 && (
              <div className="flex justify-between">
                <span>PB1 ({receiptData.taxPb1}%)</span>
                <span>Rp. {receiptData.taxPb1Amount.toLocaleString("id-ID")}</span>
              </div>
              )}
              {receiptData.taxService > 0 && (
              <div className="flex justify-between">
                <span>Service ({receiptData.taxService}%)</span>
                <span>Rp. {receiptData.taxServiceAmount.toLocaleString("id-ID")}</span>
              </div>
              )}
              {receiptData.taxPpn > 0 && (
              <div className="flex justify-between">
                <span>PPN ({receiptData.taxPpn}%)</span>
                <span>Rp. {receiptData.taxPpnAmount.toLocaleString("id-ID")}</span>
              </div>
              )}
              <p>--------------------------</p>
              <div className="flex justify-between font-bold">
                <span>TOTAL</span>
                <span>Rp. {receiptData.total.toLocaleString("id-ID")}</span>
              </div>
              {receiptData.paymentMethod === "cash" && (
                <>
                  <div className="flex justify-between">
                    <span>Cash</span>
                    <span>Rp. {Number(receiptData.cashAmount).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Change</span>
                    <span>Rp. {receiptData.change.toLocaleString("id-ID")}</span>
                  </div>
                </>
              )}
              <p className="mt-2 text-center">*** Thank you ***</p>
              {storeWifiPassword && (
                <p className="mt-1 text-center">WiFi Pass: {storeWifiPassword}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setShowReceiptModal(false); setReceiptData(null); }}
              >
                Close
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setShowReceiptModal(false);
                  setReceiptData(null);
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
