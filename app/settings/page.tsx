"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Store, MapPin, Wifi, Percent } from "lucide-react";
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      } catch {
        toast.error("Gagal memuat pengaturan");
      } finally {
        setLoading(false);
      }
    };
    void loadSettings();
  }, []);

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
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
        <h1 className="text-base font-semibold sm:text-lg">Pengaturan</h1>
      </header>

      {/* Content */}
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
                <Label htmlFor="storeName" className="text-xs">
                  Nama Toko
                </Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Masukkan nama toko"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs flex items-center gap-2">
                  <MapPin className="size-3.5" />
                  Alamat
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Masukkan alamat toko"
                  className="text-sm"
                />
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
                <Label htmlFor="wifiPassword" className="text-xs">
                  Password WiFi
                </Label>
                <Input
                  id="wifiPassword"
                  type="password"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="Masukkan password WiFi"
                  className="text-sm"
                />
              </div>
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
                    <Label htmlFor="pb1Enabled" className="text-xs font-medium">
                      Pajak Restoran / PB1
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Pajak daerah untuk usaha restoran
                    </p>
                  </div>
                  <Switch
                    id="pb1Enabled"
                    checked={pb1Enabled}
                    onCheckedChange={setPb1Enabled}
                  />
                </div>
                {pb1Enabled && (
                  <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    <Label htmlFor="pb1Rate" className="text-[10px] text-muted-foreground">
                      Tarif (%)
                    </Label>
                    <Input
                      id="pb1Rate"
                      type="number"
                      value={pb1Rate}
                      onChange={(e) => setPb1Rate(e.target.value)}
                      placeholder="10"
                      className="h-8 text-sm w-32"
                      min="0"
                      max="100"
                    />
                  </div>
                )}
              </div>

              {/* Service Charge */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="serviceEnabled" className="text-xs font-medium">
                      Service Charge
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Biaya layanan restoran (umumnya 5% - 10%)
                    </p>
                  </div>
                  <Switch
                    id="serviceEnabled"
                    checked={serviceEnabled}
                    onCheckedChange={setServiceEnabled}
                  />
                </div>
                {serviceEnabled && (
                  <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    <Label htmlFor="serviceRate" className="text-[10px] text-muted-foreground">
                      Tarif (%)
                    </Label>
                    <Input
                      id="serviceRate"
                      type="number"
                      value={serviceRate}
                      onChange={(e) => setServiceRate(e.target.value)}
                      placeholder="5"
                      className="h-8 text-sm w-32"
                      min="0"
                      max="100"
                    />
                  </div>
                )}
              </div>

              {/* PPN */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="ppnEnabled" className="text-xs font-medium">
                      PPN (Pajak Pertambahan Nilai)
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Tidak semua restoran dikenakan PPN
                    </p>
                  </div>
                  <Switch
                    id="ppnEnabled"
                    checked={ppnEnabled}
                    onCheckedChange={setPpnEnabled}
                  />
                </div>
                {ppnEnabled && (
                  <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    <Label htmlFor="ppnRate" className="text-[10px] text-muted-foreground">
                      Tarif (%)
                    </Label>
                    <Input
                      id="ppnRate"
                      type="number"
                      value={ppnRate}
                      onChange={(e) => setPpnRate(e.target.value)}
                      placeholder="11"
                      className="h-8 text-sm w-32"
                      min="0"
                      max="100"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-w-[120px]"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
