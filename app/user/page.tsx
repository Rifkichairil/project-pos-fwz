"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  tenant: string;
  createdAt: string;
};

type Tenant = {
  id: number;
  name: string;
  slug: string;
  status: string;
};

export default function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", email: "", phone: "", password: "", role: "cashier", tenantId: "" });
  const [saving, setSaving] = useState(false);
  const [currentRole, setCurrentRole] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const [usersRes, tenantsRes, meRes] = await Promise.all([
        fetch("/api/users", { cache: "no-store" }),
        fetch("/api/tenants", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
      ]);
      if (usersRes.ok) {
        const data = (await usersRes.json()) as { users: User[] };
        setUsers(data.users || []);
      }
      if (tenantsRes.ok) {
        const data = (await tenantsRes.json()) as { tenants: Tenant[] };
        setTenants(data.tenants.filter((t) => t.status === "active") || []);
      }
      if (meRes.ok) {
        const data = (await meRes.json()) as { role: string };
        setCurrentRole(data.role || "");
      }
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const handleCreate = async () => {
    if (!form.name || !form.username || !form.email || !form.password) {
      toast.error("Semua field wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { toast.error(data.error || "Gagal membuat user"); return; }
      toast.success("User berhasil dibuat!");
      setShowCreate(false);
      setForm({ name: "", username: "", email: "", phone: "", password: "", role: "cashier", tenantId: "" });
      void loadUsers();
    } catch {
      toast.error("Gagal membuat user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Gagal menghapus user"); return; }
      toast.success("User dihapus");
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      toast.error("Gagal menghapus user");
    }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role: string) => {
    if (role === "admin") return <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-600 text-[10px]">Admin</Badge>;
    if (role === "manager") return <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-600 text-[10px]">Manager</Badge>;
    return <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-600 text-[10px]">Cashier</Badge>;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
        <h1 className="text-base font-semibold sm:text-lg">User Management</h1>
        <Button className="h-8 gap-2 rounded-xl bg-primary px-3 text-xs font-medium hover:bg-primary/90 sm:h-9 sm:px-4 sm:text-sm" onClick={() => setShowCreate(true)}>
          <Plus className="size-3.5 sm:size-4" />
          <span className="hidden sm:inline">Create User</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Search */}
        <div className="mb-4 relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border-border bg-muted/50 pl-8 text-xs"
          />
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Daftar User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 font-medium">Nama</th>
                    <th className="pb-2 font-medium">Username</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Phone</th>
                    <th className="pb-2 font-medium">Role</th>
                    <th className="pb-2 font-medium">Tenant</th>
                    <th className="pb-2 font-medium">Dibuat</th>
                    <th className="pb-2 font-medium text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">Tidak ada user ditemukan</td></tr>
                  ) : (
                    filtered.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/30">
                        <td className="py-2.5 font-medium">{u.name}</td>
                        <td className="py-2.5 text-muted-foreground">{u.username}</td>
                        <td className="py-2.5 text-muted-foreground">{u.email}</td>
                        <td className="py-2.5 text-muted-foreground">{u.phone}</td>
                        <td className="py-2.5">{roleBadge(u.role)}</td>
                        <td className="py-2.5 text-muted-foreground">{u.tenant}</td>
                        <td className="py-2.5 text-muted-foreground">{u.createdAt}</td>
                        <td className="py-2.5 text-center">
                          <button onClick={() => handleDelete(u.id)} className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600" title="Hapus user">
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create User</h3>
              <button onClick={() => { setShowCreate(false); setForm({ name: "", username: "", email: "", phone: "", password: "", role: "cashier", tenantId: "" }); }} className="rounded p-1 hover:bg-muted"><X className="size-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Nama Lengkap</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Username</Label>
                  <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0812-xxxx-xxxx" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Role</Label>
                  <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    {currentRole === "admin" && <option value="admin">Admin</option>}
                  </select>
                </div>
              </div>
              {/* Tenant - only show for admin, manager auto-assigns to own tenant */}
              {currentRole === "admin" && (
              <div className="space-y-1">
                <Label className="text-xs">Tenant</Label>
                <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })}>
                  <option value="">Pilih tenant...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { setShowCreate(false); setForm({ name: "", username: "", email: "", phone: "", password: "", role: "cashier", tenantId: "" }); }}>Batal</Button>
                <Button className="flex-1" onClick={handleCreate} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
