"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  Clock,
  BarChart3,
  Wallet,
  Table,
  CreditCard,
  Settings,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: UtensilsCrossed, label: "Menu Order", href: "/dashboard/pos" },
  { icon: Package, label: "Inventory", href: "#" },
  { icon: Clock, label: "History", href: "#" },
  { icon: BarChart3, label: "Analytic", href: "#" },
  { icon: Wallet, label: "Withdraw", href: "#" },
  { icon: Table, label: "Manage Table", href: "#", hasSubmenu: true },
  { icon: CreditCard, label: "Payment", href: "#" },
];

const bottomNav = [
  { icon: Settings, label: "Settings", href: "#" },
  { icon: HelpCircle, label: "Help Center", href: "#" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="flex w-[240px] shrink-0 flex-col border-r bg-background">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">R</span>
          </div>
          <span className="text-lg font-bold">Rasa Nusa</span>
          <div className="ml-auto flex size-7 items-center justify-center rounded-md border">
            <span className="text-xs">☰</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "#" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
                {item.hasSubmenu && (
                  <ChevronDown className="ml-auto size-4" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="space-y-0.5 px-3 py-2">
          {bottomNav.map((item) => (
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
              <AvatarImage src="https://i.pravatar.cc/150?img=5" alt="Jennie Doe" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">Jennie Doe</p>
              <p className="truncate text-xs text-muted-foreground">
                jenniedoe@gmail.com
              </p>
            </div>
            <ChevronDown className="size-4 text-muted-foreground" />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
