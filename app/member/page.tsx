"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Star, UtensilsCrossed, Clock, ShoppingCart, Gift, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const members = [
  { id: 1, name: "Budi Santoso", email: "budi.s@email.com", phone: "0812-3456-7890", location: "Jakarta", tier: "Gold", points: 2134, visits: 48, totalSpending: 2847000, lastVisit: "02 Mei 2026", favoriteMenu: "Nasi Goreng",
    transactions: [
      { id: "#TX4491", date: "02 Mei 2026", items: "Nasi Goreng x2, Es Buah", amount: 90000 },
      { id: "#TX4485", date: "28 Apr 2026", items: "Rendang, Sate Ayam", amount: 150000 },
      { id: "#TX4478", date: "20 Apr 2026", items: "Nasi Goreng, Es Teh", amount: 52000 },
    ],
    pointHistory: [
      { date: "02 Mei 2026", type: "earn", desc: "Pembelian #TX4491", amount: 90 },
      { date: "28 Apr 2026", type: "earn", desc: "Pembelian #TX4485", amount: 150 },
      { date: "15 Apr 2026", type: "redeem", desc: "Tukar Free Es Buah", amount: -500 },
    ],
    rewards: ["Free Es Buah (500 pts)", "Diskon 10% (1000 pts)", "Free Nasi Goreng (2000 pts)"],
  },
  { id: 2, name: "Siti Aminah", email: "siti.a@email.com", phone: "0821-9876-5432", location: "Bandung", tier: "Silver", points: 1742, visits: 32, totalSpending: 1850000, lastVisit: "01 Mei 2026", favoriteMenu: "Es Buah",
    transactions: [
      { id: "#TX4490", date: "01 Mei 2026", items: "Es Buah x2, Klepon", amount: 68000 },
      { id: "#TX4482", date: "25 Apr 2026", items: "Gado-Gado, Es Teler", amount: 78000 },
    ],
    pointHistory: [
      { date: "01 Mei 2026", type: "earn", desc: "Pembelian #TX4490", amount: 68 },
      { date: "25 Apr 2026", type: "earn", desc: "Pembelian #TX4482", amount: 78 },
    ],
    rewards: ["Diskon 10% (1000 pts)", "Free Es Buah (500 pts)"],
  },
  { id: 3, name: "Ahmad Hidayat", email: "ahmad.h@email.com", phone: "0856-1234-5678", location: "Jakarta", tier: "Gold", points: 2204, visits: 51, totalSpending: 3200000, lastVisit: "02 Mei 2026", favoriteMenu: "Rendang",
    transactions: [
      { id: "#TX4492", date: "02 Mei 2026", items: "Rendang x3, Es Teh x2", amount: 210000 },
      { id: "#TX4488", date: "30 Apr 2026", items: "Nasi Goreng, Sate Ayam", amount: 95000 },
    ],
    pointHistory: [
      { date: "02 Mei 2026", type: "earn", desc: "Pembelian #TX4492", amount: 210 },
    ],
    rewards: ["Free Rendang (1500 pts)", "Diskon 15% (1200 pts)"],
  },
  { id: 4, name: "Dewi Kusuma", email: "dewi.k@email.com", phone: "0813-5678-9012", location: "Surabaya", tier: "Bronze", points: 730, visits: 15, totalSpending: 850000, lastVisit: "25 Apr 2026", favoriteMenu: "Sate Ayam",
    transactions: [
      { id: "#TX4475", date: "25 Apr 2026", items: "Sate Ayam x2", amount: 80000 },
    ],
    pointHistory: [
      { date: "25 Apr 2026", type: "earn", desc: "Pembelian #TX4475", amount: 80 },
    ],
    rewards: ["Diskon 5% (300 pts)"],
  },
  { id: 5, name: "Rudi Hartono", email: "rudi.h@email.com", phone: "0877-4455-6677", location: "Jakarta", tier: "Silver", points: 1730, visits: 29, totalSpending: 2100000, lastVisit: "29 Apr 2026", favoriteMenu: "Nasi Goreng",
    transactions: [
      { id: "#TX4480", date: "29 Apr 2026", items: "Nasi Goreng, Gado-Gado", amount: 72000 },
    ],
    pointHistory: [
      { date: "29 Apr 2026", type: "earn", desc: "Pembelian #TX4480", amount: 72 },
    ],
    rewards: ["Diskon 10% (1000 pts)"],
  },
  { id: 6, name: "Lina Marlina", email: "lina.m@email.com", phone: "0899-1122-3344", location: "Bandung", tier: "Gold", points: 3420, visits: 62, totalSpending: 4500000, lastVisit: "03 Mei 2026", favoriteMenu: "Es Buah",
    transactions: [
      { id: "#TX4493", date: "03 Mei 2026", items: "Es Buah x3, Nasi Goreng", amount: 130000 },
      { id: "#TX4489", date: "01 Mei 2026", items: "Rendang x2", amount: 180000 },
    ],
    pointHistory: [
      { date: "03 Mei 2026", type: "earn", desc: "Pembelian #TX4493", amount: 130 },
    ],
    rewards: ["Free Es Buah (500 pts)", "Diskon 20% (2000 pts)", "Free Nasi Goreng (2000 pts)"],
  },
];

const tierStyles: Record<string, string> = {
  Gold: "bg-amber-100 text-amber-700 border-amber-200",
  Silver: "bg-slate-100 text-slate-700 border-slate-200",
  Bronze: "bg-orange-100 text-orange-700 border-orange-200",
};

const tierOrder = ["Bronze", "Silver", "Gold", "Platinum"];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function nextTier(current: string) {
  const idx = tierOrder.indexOf(current);
  return idx < tierOrder.length - 1 ? tierOrder[idx + 1] : null;
}

export default function MemberPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<(typeof members)[number] | null>(null);

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
        <h1 className="text-base font-semibold sm:text-lg">Member Management</h1>
        <Button className="h-8 gap-2 rounded-xl bg-blue-600 px-3 text-xs font-medium hover:bg-blue-700 sm:h-9 sm:px-4 sm:text-sm">
          <Plus className="size-3.5 sm:size-4" />
          <span className="hidden sm:inline">Add Member</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search member..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full rounded-lg border-border bg-muted/50 pl-8 text-xs"
                />
              </div>
              <Button size="sm" className="h-8 rounded-lg text-xs">Search</Button>
            </div>
          </div>

          <p className="mb-3 text-xs text-muted-foreground">Showing {filtered.length} results</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <Card
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className={`cursor-pointer border-border/60 transition-colors hover:border-primary/30 hover:shadow-sm ${
                  selectedMember?.id === m.id ? "border-primary bg-primary/5" : ""
                }`}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{getInitials(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold">{m.name}</p>
                      <Badge variant="outline" className={`shrink-0 text-[10px] ${tierStyles[m.tier]}`}>{m.tier}</Badge>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="truncate">{m.email}</span>
                      <span className="shrink-0">{m.location}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center justify-end gap-0.5 text-sm font-bold">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      {m.points.toLocaleString("id-ID")}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{m.visits} visits</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mobile Overlay */}
        {selectedMember && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSelectedMember(null)}
          />
        )}
        <aside
          className={cn(
            "w-[28rem] shrink-0 overflow-y-auto border-l bg-background fixed inset-y-0 right-0 z-50 transition-transform duration-300 lg:static lg:translate-x-0 lg:z-auto",
            selectedMember ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          )}
        >
          {selectedMember ? (
            <div className="p-6">
              {/* 1. Membership Tier — Paling atas */}
              <div className="mb-6 flex items-center gap-3">
                <div className={`flex size-12 items-center justify-center rounded-full ${selectedMember.tier === "Gold" ? "bg-amber-100 text-amber-700" : selectedMember.tier === "Silver" ? "bg-slate-100 text-slate-700" : "bg-orange-100 text-orange-700"}`}>
                  <Star className="size-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold">{selectedMember.tier} Member</p>
                    <Badge variant="outline" className={`text-[10px] ${tierStyles[selectedMember.tier]}`}>{selectedMember.tier}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{selectedMember.visits} visits · Rp. {selectedMember.totalSpending.toLocaleString("id-ID")}</p>
                  {nextTier(selectedMember.tier) && (
                    <>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min((selectedMember.totalSpending / 5000000) * 100, 100)}%` }} />
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Spend <span className="font-semibold text-foreground">Rp. {(5000000 - selectedMember.totalSpending).toLocaleString("id-ID")}</span> more to reach {nextTier(selectedMember.tier)}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* 2. Member Detail + Loyalty Points */}
              <div className="mb-6 flex items-start gap-4">
                <div className="flex flex-1 items-start gap-3">
                  <Avatar className="size-12">
                    <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">{getInitials(selectedMember.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{selectedMember.name}</p>
                    <div className="mt-0.5 space-y-0.5 text-[11px] text-muted-foreground">
                      <p>{selectedMember.phone}</p>
                      <p>{selectedMember.email}</p>
                      <p>{selectedMember.location}</p>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 text-lg font-bold text-amber-600">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    {selectedMember.points.toLocaleString("id-ID")}
                  </div>
                  <p className="text-[10px] text-muted-foreground">points</p>
                </div>
              </div>

              {/* 3. Stats — tanpa Card wrapper */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground">Total Spending</p>
                  <p className="text-sm font-bold">Rp. {selectedMember.totalSpending.toLocaleString("id-ID")}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Transactions</p>
                  <p className="text-sm font-bold">{selectedMember.transactions.length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Last Visit</p>
                  <p className="flex items-center gap-1 text-sm font-bold"><Clock className="size-3" />{selectedMember.lastVisit}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Favorite</p>
                  <p className="flex items-center gap-1 text-sm font-bold"><UtensilsCrossed className="size-3" />{selectedMember.favoriteMenu}</p>
                </div>
              </div>

              {/* 4. Activity History: Transactions + Points + Redeem */}
              <div className="mb-6">
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <ShoppingCart className="size-3.5" /> Activity History
                </h3>
                <div className="space-y-2">
                  {[...selectedMember.transactions.map((tx) => {
                    const earned = selectedMember.pointHistory.find((ph) => ph.type === "earn" && ph.desc.includes(tx.id));
                    return { activityType: "tx" as const, key: tx.id, tx, earned };
                  }), ...selectedMember.pointHistory
                    .filter((ph) => {
                      if (ph.type !== "earn") return true;
                      return !selectedMember.transactions.some((tx) => ph.desc.includes(tx.id));
                    })
                    .map((ph, i) => ({ activityType: "point" as const, key: `ph-${i}`, ph }))]
                    .map((item) => {
                      const isTx = item.activityType === "tx";
                      const isEarn = !isTx && item.ph.type === "earn";
                      return (
                        <div key={item.key} className="flex items-center justify-between rounded-lg border px-3 py-2">
                          <div className="flex items-start gap-2">
                            {isTx ? (
                              <ShoppingCart className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                            ) : isEarn ? (
                              <Star className="mt-0.5 size-3.5 shrink-0 fill-amber-400 text-amber-400" />
                            ) : (
                              <Gift className="mt-0.5 size-3.5 shrink-0 text-primary" />
                            )}
                            <div>
                              <p className="text-xs font-medium">{isTx ? item.tx.id : item.ph.desc}</p>
                              {isTx && <p className="text-[10px] text-muted-foreground">{item.tx.items}</p>}
                              <p className="text-[10px] text-muted-foreground">{isTx ? item.tx.date : item.ph.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {isTx ? (
                              <>
                                <span className="text-xs font-bold">Rp. {item.tx.amount.toLocaleString("id-ID")}</span>
                                {item.earned && (
                                  <p className="text-[10px] font-bold text-emerald-600">+{item.earned.amount} pts</p>
                                )}
                              </>
                            ) : (
                              <span className={`text-xs font-bold ${isEarn ? "text-emerald-600" : "text-red-500"}`}>
                                {isEarn ? "+" : "-"}{Math.abs(item.ph.amount)} pts
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* 5. Available Rewards */}
              <div className="mb-6">
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Gift className="size-3.5 text-primary" /> Available Rewards
                </h3>
                <div className="space-y-2">
                  {selectedMember.rewards.map((r, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
                      <span className="flex items-center gap-1"><Gift className="size-3 text-primary" />{r}</span>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px]">Redeem</Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <Wallet className="mb-2 size-10 opacity-20" />
              <p className="text-sm font-medium">Select a member</p>
              <p className="text-xs">Click a member card to view details</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
