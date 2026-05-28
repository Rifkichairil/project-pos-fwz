"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

type Tenant = {
  id: number;
  slug: string;
  name: string;
  status: string;
  createdAt: string;
};

export default function TenantPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "" });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 20;

  const loadTenants = useCallback(async () => {
    try {
      const res = await fetch("/api/tenants", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { tenants: Tenant[] };
      setTenants(data.tenants || []);
    } catch {
      toast.error("Gagal memuat data tenant");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadTenants(); }, [loadTenants]);

  const handleCreate = async () => {
    if (!form.name || !form.slug) {
      toast.error("Nama dan slug harus diisi");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { toast.error(data.error || "Gagal membuat tenant"); return; }
      toast.success("Tenant berhasil dibuat!");
      setShowCreate(false);
      setForm({ name: "", slug: "" });
      void loadTenants();
    } catch {
      toast.error("Gagal membuat tenant");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/tenants?id=${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Gagal menghapus tenant"); return; }
      toast.success("Tenant diarsipkan");
      void loadTenants();
    } catch {
      toast.error("Gagal menghapus tenant");
    }
  };

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const statusBadge = (status: string) => {
    if (status === "active") return <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-600 text-[10px]">Active</Badge>;
    if (status === "suspended") return <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-600 text-[10px]">Suspended</Badge>;
    return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-[10px]">Archived</Badge>;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
        <h1 className="text-base font-semibold sm:text-lg">Tenant Management</h1>
        <Button className="h-8 gap-2 rounded-xl bg-primary px-3 text-xs font-medium hover:bg-primary/90 sm:h-9 sm:px-4 sm:text-sm" onClick={() => setShowCreate(true)}>
          <Plus className="size-3.5 sm:size-4" />
          <span className="hidden sm:inline">Add Tenant</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mb-4 relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tenant..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-9 w-full rounded-lg border-border bg-muted/50 pl-8 text-xs" />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Daftar Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 font-medium">Nama</th>
                    <th className="pb-2 font-medium">Slug</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Dibuat</th>
                    <th className="pb-2 font-medium text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Tidak ada tenant ditemukan</td></tr>
                  ) : (
                    paginated.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/30">
                        <td className="py-2.5 font-medium">{t.name}</td>
                        <td className="py-2.5 text-muted-foreground">{t.slug}</td>
                        <td className="py-2.5">{statusBadge(t.status)}</td>
                        <td className="py-2.5 text-muted-foreground">{t.createdAt}</td>
                        <td className="py-2.5 text-center">
                          <button onClick={() => handleDelete(t.id)} className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600" title="Arsipkan tenant">
                            <Trash2 className="size-3.5" />
                          </button>
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

      {/* Create Tenant Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Tenant</h3>
              <button onClick={() => { setShowCreate(false); setForm({ name: "", slug: "" }); }} className="rounded p-1 hover:bg-muted"><X className="size-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Nama Tenant</Label>
                <Input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") }); }} placeholder="e.g. Warung Barokah" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Slug (URL identifier)</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="e.g. warung-barokah" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { setShowCreate(false); setForm({ name: "", slug: "" }); }}>Batal</Button>
                <Button className="flex-1" onClick={handleCreate} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
