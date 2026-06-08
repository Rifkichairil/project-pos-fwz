"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  Users,
  Settings,
  HelpCircle,
  ChevronDown,
  BookOpen,
  X,
  Menu,
  Receipt,
  UserCog,
  Building2,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import SubscriptionAlert from "@/components/SubscriptionAlert";

const allNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", roles: ["admin", "manager"] },
  { icon: UtensilsCrossed, label: "Menu Order", href: "/pos", roles: ["admin", "manager", "cashier"] },
  { icon: Package, label: "Inventory", href: "/inventory", roles: ["admin", "manager"] },
  { icon: Receipt, label: "Transactions", href: "/transactions", roles: ["admin", "manager"] },
  { icon: Users, label: "Member", href: "/member", roles: ["admin", "manager"] },
  { icon: BookOpen, label: "Menu & Recipe", href: "/menu", roles: ["admin", "manager"] },
  { icon: UserCog, label: "User", href: "/user", roles: ["admin", "manager"] },
  { icon: Building2, label: "Tenant", href: "/tenant", roles: ["admin"] },
];

const bottomNav = [
  { icon: Settings, label: "Settings", href: "/settings", roles: ["admin", "manager"] },
  { icon: HelpCircle, label: "Help Center", href: "#", roles: ["admin", "manager", "cashier"] },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string; tenantId: number | null; tenantName: string | null } | null>(null);
  const [tenants, setTenants] = useState<{ id: number; name: string }[]>([]);
  const [showTenantSwitcher, setShowTenantSwitcher] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.name) setCurrentUser({ name: data.name, email: data.email, role: data.role, tenantId: data.tenantId ?? null, tenantName: data.tenantName ?? null }); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUser?.role === "admin" || currentUser?.role === "manager") {
      fetch("/api/tenants")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => { if (data?.tenants) setTenants(data.tenants.map((t: { id: number; name: string }) => ({ id: t.id, name: t.name }))); })
        .catch(() => {});
    }
  }, [currentUser?.role]);

  const handleSwitchTenant = async (tenantId: number) => {
    try {
      const res = await fetch("/api/auth/switch-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      if (res.ok) {
        setShowTenantSwitcher(false);
        window.location.reload();
      }
    } catch {}
  };

  const userRole = currentUser?.role || "cashier";
  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));
  const visibleBottomNav = bottomNav.filter((item) => item.roles.includes(userRole));

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };
  return (
    <div className="flex h-screen w-full bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[240px] shrink-0 flex-col border-r bg-background transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-5">
          <img src="/favicon-32x32.png" alt="BingGo" className="size-8 rounded-lg" />
          <span className="text-lg font-bold">BingGo</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto flex size-7 items-center justify-center rounded-md border lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tenant Switcher (Admin or users with multiple tenants) */}
        {tenants.length > 1 && (
          <div className="relative mx-3 mb-2">
            <button
              onClick={() => setShowTenantSwitcher(!showTenantSwitcher)}
              className="flex w-full items-center justify-between rounded-lg border bg-muted/50 px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <Building2 className="size-3.5 text-muted-foreground" />
                <span className="truncate">{currentUser?.tenantName || "No Tenant"}</span>
              </div>
              <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", showTenantSwitcher && "rotate-180")} />
            </button>
            {showTenantSwitcher && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-background py-1 shadow-lg">
                {tenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSwitchTenant(t.id)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-muted",
                      currentUser?.tenantId === t.id && "bg-primary/10 font-medium text-primary"
                    )}
                  >
                    <Building2 className="size-3 text-muted-foreground" />
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "#" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="space-y-0.5 px-3 py-2">
          {visibleBottomNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* User */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback>{currentUser?.name?.slice(0, 2).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{currentUser?.name || "User"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {currentUser?.email || ""}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex size-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Logout"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Subscription Alert */}
        <SubscriptionAlert />
        {/* Mobile Header */}
        <div className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex size-9 items-center justify-center rounded-md border"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/favicon-32x32.png" alt="BingGo" className="size-8 rounded-lg" />
            <span className="text-lg font-bold">BingGo</span>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
