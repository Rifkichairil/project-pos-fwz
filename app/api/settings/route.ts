import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type SettingsRow = {
  store_name: string;
  address: string;
  wifi_password: string;
  pb1_enabled: boolean;
  pb1_rate: string;
  service_enabled: boolean;
  service_rate: string;
  ppn_enabled: boolean;
  ppn_rate: string;
};

type UpdatePayload = {
  storeName?: string;
  address?: string;
  wifiPassword?: string;
  pb1Enabled?: boolean;
  pb1Rate?: number | string;
  serviceEnabled?: boolean;
  serviceRate?: number | string;
  ppnEnabled?: boolean;
  ppnRate?: number | string;
};

export async function GET() {
  try {
    const result = await db.query<SettingsRow>(
      `SELECT store_name, address, wifi_password, pb1_enabled, pb1_rate, service_enabled, service_rate, ppn_enabled, ppn_rate FROM settings WHERE id = 1`
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        storeName: "Warung Kita",
        address: "",
        wifiPassword: "",
        pb1Enabled: true,
        pb1Rate: 10,
        serviceEnabled: true,
        serviceRate: 5,
        ppnEnabled: false,
        ppnRate: 11,
      });
    }

    const row = result.rows[0];
    return NextResponse.json({
      storeName: row.store_name,
      address: row.address,
      wifiPassword: row.wifi_password,
      pb1Enabled: row.pb1_enabled,
      pb1Rate: Number(row.pb1_rate),
      serviceEnabled: row.service_enabled,
      serviceRate: Number(row.service_rate),
      ppnEnabled: row.ppn_enabled,
      ppnRate: Number(row.ppn_rate),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as UpdatePayload;

    const storeName = body.storeName?.trim() ?? "Warung Kita";
    const address = body.address?.trim() ?? "";
    const wifiPassword = body.wifiPassword ?? "";
    const pb1Enabled = body.pb1Enabled ?? true;
    const pb1Rate = Number(body.pb1Rate) || 0;
    const serviceEnabled = body.serviceEnabled ?? true;
    const serviceRate = Number(body.serviceRate) || 0;
    const ppnEnabled = body.ppnEnabled ?? false;
    const ppnRate = Number(body.ppnRate) || 0;

    await db.query(
      `UPDATE settings SET
        store_name = $1,
        address = $2,
        wifi_password = $3,
        pb1_enabled = $4,
        pb1_rate = $5,
        service_enabled = $6,
        service_rate = $7,
        ppn_enabled = $8,
        ppn_rate = $9,
        updated_at = NOW()
      WHERE id = 1`,
      [storeName, address, wifiPassword, pb1Enabled, pb1Rate, serviceEnabled, serviceRate, ppnEnabled, ppnRate]
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
