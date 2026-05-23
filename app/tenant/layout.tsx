import AppShell from "@/components/layout/AppShell";

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
