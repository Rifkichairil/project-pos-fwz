"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Trash2, X, Building2, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import toast from "react-hot-toast";

type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  tenant: string;
  tenants?: { tenantId: number; tenantName: string; role: string }[];
  subscription: {
    status: string;
    start: string | null;
    end: string | null;
  };
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
  const [subsStart, setSubsStart] = useState<Date | undefined>(undefined);
  const [subsEnd, setSubsEnd] = useState<Date | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [currentRole, setCurrentRole] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [assignModal, setAssignModal] = useState<{ userId: number; userName: string; userTenants: { tenantId: number; tenantName: string; role: string }[] } | null>(null);
  const [assignForm, setAssignForm] = useState({ tenantId: "", role: "manager" });
  const [assignSaving, setAssignSaving] = useState(false);
  const [subscriptionModal, setSubscriptionModal] = useState<{ userId: number; userName: string; start: Date | undefined; end: Date | undefined } | null>(null);
  const [subscriptionSaving, setSubscriptionSaving] = useState(false);

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
    if (form.role === "manager" && subsStart && subsEnd && subsEnd < subsStart) {
      toast.error("End date tidak boleh lebih kecil dari start date");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          subscriptionStart: subsStart?.toISOString() || null,
          subscriptionEnd: subsEnd?.toISOString() || null,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { toast.error(data.error || "Gagal membuat user"); return; }
      toast.success("User berhasil dibuat!");
      setShowCreate(false);
      setForm({ name: "", username: "", email: "", phone: "", password: "", role: "cashier", tenantId: "" });
      setSubsStart(undefined);
      setSubsEnd(undefined);
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

  const handleAssignTenant = async () => {
    if (!assignModal || !assignForm.tenantId) {
      toast.error("Pilih tenant terlebih dahulu");
      return;
    }
    setAssignSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: assignModal.userId,
          tenantId: Number(assignForm.tenantId),
          role: assignForm.role,
          action: "assign",
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { toast.error(data.error || "Gagal assign tenant"); return; }
      toast.success("Tenant berhasil di-assign!");
      // Refresh user list and update modal with new data
      const usersRes = await fetch("/api/users", { cache: "no-store" });
      if (usersRes.ok) {
        const usersData = (await usersRes.json()) as { users: User[] };
        setUsers(usersData.users || []);
        const updatedUser = usersData.users.find((u) => u.id === assignModal.userId);
        if (updatedUser) {
          setAssignModal({ ...assignModal, userTenants: updatedUser.tenants || [] });
        }
      }
      setAssignForm({ tenantId: "", role: "manager" });
    } catch {
      toast.error("Gagal assign tenant");
    } finally {
      setAssignSaving(false);
    }
  };

  const handleRemoveTenant = async (userId: number, tenantId: number) => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, tenantId, action: "remove" }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { toast.error(data.error || "Gagal remove tenant"); return; }
      toast.success("Tenant berhasil di-remove");
      // Refresh user list and update modal
      const usersRes = await fetch("/api/users", { cache: "no-store" });
      if (usersRes.ok) {
        const usersData = (await usersRes.json()) as { users: User[] };
        setUsers(usersData.users || []);
        if (assignModal) {
          const updatedUser = usersData.users.find((u) => u.id === userId);
          if (updatedUser) {
            setAssignModal({ ...assignModal, userTenants: updatedUser.tenants || [] });
          }
        }
      }
    } catch {
      toast.error("Gagal remove tenant");
    }
  };

  const handleUpdateSubscription = async () => {
    if (!subscriptionModal) return;
    if (subscriptionModal.start && subscriptionModal.end && subscriptionModal.end < subscriptionModal.start) {
      toast.error("End date tidak boleh lebih kecil dari start date");
      return;
    }
    setSubscriptionSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: subscriptionModal.userId,
          subscriptionStart: subscriptionModal.start?.toISOString() || null,
          subscriptionEnd: subscriptionModal.end?.toISOString() || null,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { toast.error(data.error || "Gagal update subscription"); return; }
      toast.success("Subscription berhasil diupdate!");
      setSubscriptionModal(null);
      void loadUsers();
    } catch {
      toast.error("Gagal update subscription");
    } finally {
      setSubscriptionSaving(false);
    }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const roleBadge = (role: string) => {
    if (role === "admin") return <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-600 text-[10px]">Admin</Badge>;
    if (role === "manager") return <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-600 text-[10px]">Manager</Badge>;
    return <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-600 text-[10px]">Cashier</Badge>;
  };

  const subscriptionBadge = (status: string) => {
    if (status === "active") return <Badge variant="outline" className="border-green-200 bg-green-50 text-green-600 text-[10px]">Active</Badge>;
    if (status === "expired") return <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-600 text-[10px]">Expired</Badge>;
    if (status === "cancelled") return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-[10px]">Cancelled</Badge>;
    return <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600 text-[10px]">Inactive</Badge>;
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
            type="search"
            placeholder="Search user..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            autoComplete="off"
            className="h-9 w-full rounded-lg border-border bg-muted/50 pl-8 text-xs"
          />
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Daftar User</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mobile card view */}
            <div className="space-y-3 md:hidden">
              {loading ? (
                <p className="py-6 text-center text-xs text-muted-foreground">Loading...</p>
              ) : filtered.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">Tidak ada user ditemukan</p>
              ) : (
                paginated.map((u) => (
                  <div key={u.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{u.name}</p>
                        <p className="text-[11px] text-muted-foreground">@{u.username}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {currentRole === "admin" && subscriptionBadge(u.subscription.status)}
                        {roleBadge(u.role)}
                        {currentRole === "admin" && u.role === "manager" && (
                          <button 
                            onClick={() => setSubscriptionModal({ 
                              userId: u.id, 
                              userName: u.name, 
                              start: undefined, 
                              end: undefined 
                            })} 
                            className="rounded p-1 text-amber-400 hover:bg-amber-50 hover:text-amber-600" 
                            title="Edit Subscription"
                          >
                            <Calendar className="size-3.5" />
                          </button>
                        )}
                        {currentRole === "admin" && (
                          <button onClick={() => setAssignModal({ userId: u.id, userName: u.name, userTenants: u.tenants || [] })} className="rounded p-1 text-blue-400 hover:bg-blue-50 hover:text-blue-600" title="Assign Tenant">
                            <Building2 className="size-3.5" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(u.id)} className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600" title="Hapus user">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{u.email}</span></div>
                      <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{u.phone}</span></div>
                      <div><span className="text-muted-foreground">Tenant:</span> <span className="font-medium">{u.tenant}</span></div>
                      {currentRole === "admin" && <div><span className="text-muted-foreground">Subs:</span> <span className="font-medium">{u.subscription.end || "-"}</span></div>}
                      <div><span className="text-muted-foreground">Dibuat:</span> <span className="font-medium">{u.createdAt}</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 font-medium">Nama</th>
                    <th className="pb-2 font-medium">Username</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Phone</th>
                    <th className="pb-2 font-medium">Role</th>
                    <th className="pb-2 font-medium">Tenant</th>
                    {currentRole === "admin" && <th className="pb-2 font-medium">Subscription</th>}
                    <th className="pb-2 font-medium">Dibuat</th>
                    <th className="pb-2 font-medium text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan={currentRole === "admin" ? 9 : 8} className="py-6 text-center text-muted-foreground">Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={currentRole === "admin" ? 9 : 8} className="py-6 text-center text-muted-foreground">Tidak ada user ditemukan</td></tr>
                  ) : (
                    paginated.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/30">
                        <td className="py-2.5 font-medium">{u.name}</td>
                        <td className="py-2.5 text-muted-foreground">{u.username}</td>
                        <td className="py-2.5 text-muted-foreground">{u.email}</td>
                        <td className="py-2.5 text-muted-foreground">{u.phone}</td>
                        <td className="py-2.5">{roleBadge(u.role)}</td>
                        <td className="py-2.5 text-muted-foreground">{u.tenant}</td>
                        {currentRole === "admin" && (
                          <td className="py-2.5">
                            <div className="flex flex-col gap-0.5">
                              {subscriptionBadge(u.subscription.status)}
                              {u.subscription.end && <span className="text-[10px] text-muted-foreground">until {u.subscription.end}</span>}
                            </div>
                          </td>
                        )}
                        <td className="py-2.5 text-muted-foreground">{u.createdAt}</td>
                        <td className="py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {currentRole === "admin" && u.role === "manager" && (
                              <button 
                                onClick={() => setSubscriptionModal({ 
                                  userId: u.id, 
                                  userName: u.name, 
                                  start: undefined, 
                                  end: undefined 
                                })} 
                                className="rounded p-1 text-amber-400 hover:bg-amber-50 hover:text-amber-600" 
                                title="Edit Subscription"
                              >
                                <Calendar className="size-3.5" />
                              </button>
                            )}
                            {currentRole === "admin" && (
                              <button onClick={() => setAssignModal({ userId: u.id, userName: u.name, userTenants: u.tenants || [] })} className="rounded p-1 text-blue-400 hover:bg-blue-50 hover:text-blue-600" title="Assign Tenant">
                                <Building2 className="size-3.5" />
                              </button>
                            )}
                            <button onClick={() => handleDelete(u.id)} className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600" title="Hapus user">
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filtered.length > perPage && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Showing {(safePage - 1) * perPage + 1}&ndash;{Math.min(safePage * perPage, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                    <ChevronLeft className="size-3.5" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={safePage === p ? "default" : "outline"}
                      size="sm"
                      className={`h-7 min-w-[28px] px-1.5 text-xs ${safePage === p ? "bg-slate-600 hover:bg-slate-700" : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create User</h3>
              <button onClick={() => { setShowCreate(false); setForm({ name: "", username: "", email: "", phone: "", password: "", role: "cashier", tenantId: "" }); setSubsStart(undefined); setSubsEnd(undefined); }} className="rounded p-1 hover:bg-muted"><X className="size-4" /></button>
            </div>
            <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Nama Lengkap</Label>
                <Input autoComplete="off" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Username</Label>
                  <Input autoComplete="off" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input autoComplete="off" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input autoComplete="off" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0812-xxxx-xxxx" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Role</Label>
                  <Select value={form.role} onValueChange={(val) => setForm({ ...form, role: val ?? "" })}>
                    <SelectTrigger className="h-8 w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cashier">Cashier</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      {currentRole === "admin" && <SelectItem value="admin">Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Tenant - show for admin, or manager with multiple tenants */}
              {(currentRole === "admin" || tenants.length > 1) && (
              <div className="space-y-1">
                <Label className="text-xs">Tenant</Label>
                <Select value={form.tenantId} onValueChange={(val) => setForm({ ...form, tenantId: val ?? "" })}>
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue placeholder="Pilih tenant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Password</Label>
                <Input autoComplete="new-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" />
              </div>
              {/* Subscription dates - only for manager role */}
              {form.role === "manager" && currentRole === "admin" && (
              <div className="space-y-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/50 p-3">
                <p className="text-xs font-medium text-amber-700">Subscription Period</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Start Date</Label>
                    <DatePicker
                      value={subsStart}
                      onChange={(date) => {
                        setSubsStart(date);
                        if (subsEnd && date && subsEnd < date) setSubsEnd(undefined);
                      }}
                      placeholder="Pilih tanggal"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">End Date</Label>
                    <DatePicker
                      value={subsEnd}
                      onChange={setSubsEnd}
                      placeholder="Pilih tanggal"
                      minDate={subsStart}
                      disabled={!subsStart}
                    />
                  </div>
                </div>
              </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowCreate(false); setForm({ name: "", username: "", email: "", phone: "", password: "", role: "cashier", tenantId: "" }); setSubsStart(undefined); setSubsEnd(undefined); }}>Batal</Button>
                <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
              </div>
            </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Tenant Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Assign Tenant</h3>
              <button onClick={() => { setAssignModal(null); setAssignForm({ tenantId: "", role: "manager" }); }} className="rounded p-1 hover:bg-muted"><X className="size-4" /></button>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              Assign tenant untuk <span className="font-medium text-foreground">{assignModal.userName}</span>
            </p>

            {/* Current tenants */}
            {assignModal.userTenants.length > 0 && (
              <div className="mb-4">
                <Label className="text-xs text-muted-foreground">Tenant saat ini:</Label>
                <div className="mt-1 space-y-1">
                  {assignModal.userTenants.map((ut) => (
                    <div key={ut.tenantId} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">{ut.tenantName}</span>
                        <Badge variant="outline" className="text-[10px]">{ut.role}</Badge>
                      </div>
                      {assignModal.userTenants.length > 1 && (
                        <button
                          onClick={() => handleRemoveTenant(assignModal.userId, ut.tenantId)}
                          className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                          title="Remove tenant"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add new tenant */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Tambah Tenant</Label>
                <Select value={assignForm.tenantId} onValueChange={(val) => setAssignForm({ ...assignForm, tenantId: val ?? "" })}>
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue placeholder="Pilih tenant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants
                      .filter((t) => !assignModal.userTenants.some((ut) => ut.tenantId === t.id))
                      .map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Role di tenant ini</Label>
                <Select value={assignForm.role} onValueChange={(val) => setAssignForm({ ...assignForm, role: val ?? "" })}>
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { setAssignModal(null); setAssignForm({ tenantId: "", role: "manager" }); }}>Tutup</Button>
                <Button className="flex-1" onClick={handleAssignTenant} disabled={assignSaving || !assignForm.tenantId}>{assignSaving ? "Menyimpan..." : "Assign"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {subscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Subscription</h3>
              <button onClick={() => setSubscriptionModal(null)} className="rounded p-1 hover:bg-muted"><X className="size-4" /></button>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              Subscription untuk <span className="font-medium text-foreground">{subscriptionModal.userName}</span>
            </p>
            <div className="space-y-3">
              <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/50 p-3 space-y-3">
                <p className="text-xs font-medium text-amber-700">Subscription Period</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Start Date</Label>
                    <DatePicker
                      value={subscriptionModal.start}
                      onChange={(date) => {
                        setSubscriptionModal({ ...subscriptionModal, start: date, end: subscriptionModal.end && date && subscriptionModal.end < date ? undefined : subscriptionModal.end });
                      }}
                      placeholder="Pilih tanggal"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">End Date</Label>
                    <DatePicker
                      value={subscriptionModal.end}
                      onChange={(date) => setSubscriptionModal({ ...subscriptionModal, end: date })}
                      placeholder="Pilih tanggal"
                      minDate={subscriptionModal.start}
                      disabled={!subscriptionModal.start}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setSubscriptionModal(null)}>Batal</Button>
                <Button className="flex-1" onClick={handleUpdateSubscription} disabled={subscriptionSaving || !subscriptionModal.end}>
                  {subscriptionSaving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
