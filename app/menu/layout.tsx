import AppShell from "@/components/layout/AppShell";

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
