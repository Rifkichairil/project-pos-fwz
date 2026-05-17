"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Store, MapPin, Wifi, Percent, QrCode, Package, Upload, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type SettingsData = {
  storeName: string;
  address: string;
  wifiPassword: string;
  pb1Enabled: boolean;
  pb1Rate: number;
  serviceEnabled: boolean;
  serviceRate: number;
  ppnEnabled: boolean;
  ppnRate: number;
  qrisImageUrl: string;
  inventoryPolicy: string;
  pointValue: number;
  pointPerRupiah: number;
};

export default function SettingsPage() {
  const [storeName, setStoreName] = useState("Warung Kita");
  const [address, setAddress] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");

  const [pb1Enabled, setPb1Enabled] = useState(true);
  const [pb1Rate, setPb1Rate] = useState("10");
  const [serviceEnabled, setServiceEnabled] = useState(true);
  const [serviceRate, setServiceRate] = useState("5");
  const [ppnEnabled, setPpnEnabled] = useState(false);
  const [ppnRate, setPpnRate] = useState("11");

  const [qrisImageUrl, setQrisImageUrl] = useState("");
  const [inventoryPolicy, setInventoryPolicy] = useState("medium");
  const [pointValue, setPointValue] = useState("1");
  const [pointPerRupiah, setPointPerRupiah] = useState("1000");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as SettingsData;
        setStoreName(data.storeName);
        setAddress(data.address);
        setWifiPassword(data.wifiPassword);
        setPb1Enabled(data.pb1Enabled);
        setPb1Rate(String(data.pb1Rate));
        setServiceEnabled(data.serviceEnabled);
        setServiceRate(String(data.serviceRate));
        setPpnEnabled(data.ppnEnabled);
        setPpnRate(String(data.ppnRate));
        setQrisImageUrl(data.qrisImageUrl || "");
        setInventoryPolicy(data.inventoryPolicy || "medium");
        setPointValue(String(data.pointValue || 1));
        setPointPerRupiah(String(data.pointPerRupiah || 1000));
      } catch {
        toast.error("Gagal memuat pengaturan");
      } finally {
        setLoading(false);
      }
    };
    void loadSettings();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setQrisImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          address,
          wifiPassword,
          pb1Enabled,
          pb1Rate: Number(pb1Rate) || 0,
          serviceEnabled,
          serviceRate: Number(serviceRate) || 0,
          ppnEnabled,
          ppnRate: Number(ppnRate) || 0,
          qrisImageUrl,
          inventoryPolicy,
          pointValue: Number(pointValue) || 1,
          pointPerRupiah: Number(pointPerRupiah) || 1000,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Pengaturan berhasil disimpan!");
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Memuat pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
        <h1 className="text-base font-semibold sm:text-lg">Pengaturan</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Store Information */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Store className="size-4" />
                Informasi Toko
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName" className="text-xs">Nama Toko</Label>
                <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Masukkan nama toko" className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs flex items-center gap-2">
                  <MapPin className="size-3.5" /> Alamat
                </Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Masukkan alamat toko" className="text-sm" />
              </div>
            </CardContent>
          </Card>

          {/* WiFi Settings */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Wifi className="size-4" />
                Pengaturan WiFi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wifiPassword" className="text-xs">Password WiFi</Label>
                <Input id="wifiPassword" type="password" value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} placeholder="Masukkan password WiFi" className="text-sm" />
              </div>
            </CardContent>
          </Card>

          {/* QRIS Image */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <QrCode className="size-4" />
                QRIS Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Gambar QRIS</Label>
                <p className="text-[10px] text-muted-foreground">Upload gambar QR Code QRIS untuk pembayaran (maks 2MB)</p>
                <div className="flex items-start gap-4">
                  {qrisImageUrl ? (
                    <div className="relative">
                      <img src={qrisImageUrl} alt="QRIS" className="h-32 w-32 rounded-lg border object-contain bg-white" />
                      <button
                        type="button"
                        onClick={() => setQrisImageUrl("")}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                    >
                      <Upload className="size-6 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Upload QRIS</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {qrisImageUrl && (
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => fileInputRef.current?.click()}>
                      Ganti Gambar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Policy */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Package className="size-4" />
                Inventory Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[10px] text-muted-foreground">
                Mengatur bagaimana stok bahan baku mempengaruhi ketersediaan menu
              </p>
              <div className="flex gap-2">
                {[
                  { value: "strict", label: "Strict", desc: "Menu sold out jika bahan tidak cukup" },
                  { value: "medium", label: "Medium", desc: "Tetap dijual, tampil badge stok menipis" },
                  { value: "off", label: "Off", desc: "Stok tidak mempengaruhi menu" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setInventoryPolicy(opt.value)}
                    className={cn(
                      "flex-1 rounded-lg border p-3 text-left transition-colors",
                      inventoryPolicy === opt.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <span className={cn("block text-xs font-medium", inventoryPolicy === opt.value ? "text-primary" : "text-foreground")}>{opt.label}</span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Point Conversion */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Coins className="size-4" />
                Konversi Point Member
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[10px] text-muted-foreground">
                Atur berapa point yang didapat member per transaksi
              </p>
              <div className="flex items-center gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Point</Label>
                  <Input
                    type="number"
                    value={pointValue}
                    onChange={(e) => setPointValue(e.target.value)}
                    className="h-8 w-24 text-sm text-center"
                    min="1"
                  />
                </div>
                <span className="mt-4 text-sm text-muted-foreground">per</span>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Rupiah</Label>
                  <Input
                    type="number"
                    value={pointPerRupiah}
                    onChange={(e) => setPointPerRupiah(e.target.value)}
                    className="h-8 w-32 text-sm text-center"
                    min="1"
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Contoh: Transaksi Rp. 50.000 → member dapat {Math.floor(50000 / (Number(pointPerRupiah) || 1)) * (Number(pointValue) || 1)} point
              </p>
            </CardContent>
          </Card>

          {/* Tax Settings */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Percent className="size-4" />
                Pengaturan Pajak &amp; Biaya Layanan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* PB1 */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pb1Enabled" className="text-xs font-medium">Pajak Restoran / PB1</Label>
                    <p className="text-[10px] text-muted-foreground">Pajak daerah untuk usaha restoran</p>
                  </div>
                  <Switch id="pb1Enabled" checked={pb1Enabled} onCheckedChange={setPb1Enabled} />
                </div>
                {pb1Enabled && (
                  <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    <Label htmlFor="pb1Rate" className="text-[10px] text-muted-foreground">Tarif (%)</Label>
                    <Input id="pb1Rate" type="number" value={pb1Rate} onChange={(e) => setPb1Rate(e.target.value)} placeholder="10" className="h-8 text-sm w-32" min="0" max="100" />
                  </div>
                )}
              </div>

              {/* Service Charge */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="serviceEnabled" className="text-xs font-medium">Service Charge</Label>
                    <p className="text-[10px] text-muted-foreground">Biaya layanan restoran (umumnya 5% - 10%)</p>
                  </div>
                  <Switch id="serviceEnabled" checked={serviceEnabled} onCheckedChange={setServiceEnabled} />
                </div>
                {serviceEnabled && (
                  <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    <Label htmlFor="serviceRate" className="text-[10px] text-muted-foreground">Tarif (%)</Label>
                    <Input id="serviceRate" type="number" value={serviceRate} onChange={(e) => setServiceRate(e.target.value)} placeholder="5" className="h-8 text-sm w-32" min="0" max="100" />
                  </div>
                )}
              </div>

              {/* PPN */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="ppnEnabled" className="text-xs font-medium">PPN (Pajak Pertambahan Nilai)</Label>
                    <p className="text-[10px] text-muted-foreground">Tidak semua restoran dikenakan PPN</p>
                  </div>
                  <Switch id="ppnEnabled" checked={ppnEnabled} onCheckedChange={setPpnEnabled} />
                </div>
                {ppnEnabled && (
                  <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    <Label htmlFor="ppnRate" className="text-[10px] text-muted-foreground">Tarif (%)</Label>
                    <Input id="ppnRate" type="number" value={ppnRate} onChange={(e) => setPpnRate(e.target.value)} placeholder="11" className="h-8 text-sm w-32" min="0" max="100" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
