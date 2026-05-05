"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  Clock,
  Table,
  Users,
  Settings,
  HelpCircle,
  ChevronDown,
  BookOpen,
  X,
  Menu,
  Receipt,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: UtensilsCrossed, label: "Menu Order", href: "/pos" },
  { icon: Package, label: "Inventory", href: "/inventory" },
  { icon: Receipt, label: "Transactions", href: "/transactions" },
  { icon: Users, label: "Member", href: "/member" },
  { icon: BookOpen, label: "Menu & Recipe", href: "/menu" },
  { icon: Table, label: "Manage Table", href: "#", hasSubmenu: true },
  { icon: Clock, label: "History", href: "#" },
];

const bottomNav = [
  { icon: Settings, label: "Settings", href: "#" },
  { icon: HelpCircle, label: "Help Center", href: "#" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">R</span>
          </div>
          <span className="text-lg font-bold">Rasa Nusa</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto flex size-7 items-center justify-center rounded-md border lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

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
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex size-9 items-center justify-center rounded-md border"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">R</span>
            </div>
            <span className="text-lg font-bold">Rasa Nusa</span>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
