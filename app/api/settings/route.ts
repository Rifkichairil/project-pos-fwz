import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireTenantScope } from "@/lib/tenant-scope";

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
  qris_image_url: string;
  inventory_policy: string;
  point_enabled: boolean;
  point_value: string;
  point_per_rupiah: string;
  require_customer_info: boolean;
  simple_mode: boolean;
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
  qrisImageUrl?: string;
  inventoryPolicy?: string;
  pointEnabled?: boolean;
  pointValue?: number | string;
  pointPerRupiah?: number | string;
  requireCustomerInfo?: boolean;
  simpleMode?: boolean;
};

export async function GET() {
  const tenant = await requireTenantScope();
  if ("error" in tenant) return tenant.error;

  try {
    const result = await db.query<SettingsRow>(
      `SELECT store_name, address, wifi_password, pb1_enabled, pb1_rate, service_enabled, service_rate, ppn_enabled, ppn_rate, qris_image_url, inventory_policy, COALESCE(point_enabled, true) as point_enabled, point_value, point_per_rupiah, COALESCE(require_customer_info, true) as require_customer_info, COALESCE(simple_mode, false) as simple_mode FROM settings WHERE tenant_id = $1`,
      [tenant.context.tenantId]
    );

    if (result.rows.length === 0) {
      // Fallback: use tenant name as store name
      const tenantResult = await db.query<{ name: string }>(
        `SELECT name FROM tenants WHERE id = $1`,
        [tenant.context.tenantId]
      );
      const tenantName = tenantResult.rows[0]?.name || "";

      return NextResponse.json({
        storeName: tenantName,
        address: "",
        wifiPassword: "",
        pb1Enabled: true,
        pb1Rate: 10,
        serviceEnabled: true,
        serviceRate: 5,
        ppnEnabled: false,
        ppnRate: 11,
        qrisImageUrl: "",
        inventoryPolicy: "medium",
        pointEnabled: true,
        pointValue: 1,
        pointPerRupiah: 1000,
        requireCustomerInfo: true,
        simpleMode: false,
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
      qrisImageUrl: row.qris_image_url,
      inventoryPolicy: row.inventory_policy,
      pointEnabled: row.point_enabled,
      pointValue: Number(row.point_value),
      pointPerRupiah: Number(row.point_per_rupiah),
      requireCustomerInfo: row.require_customer_info,
      simpleMode: row.simple_mode,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const tenant = await requireTenantScope();
  if ("error" in tenant) return tenant.error;

  try {
    const body = (await request.json()) as UpdatePayload;

    const storeName = body.storeName?.trim() ?? "BingGo";
    const address = body.address?.trim() ?? "";
    const wifiPassword = body.wifiPassword ?? "";
    const pb1Enabled = body.pb1Enabled ?? true;
    const pb1Rate = Number(body.pb1Rate) || 0;
    const serviceEnabled = body.serviceEnabled ?? true;
    const serviceRate = Number(body.serviceRate) || 0;
    const ppnEnabled = body.ppnEnabled ?? false;
    const ppnRate = Number(body.ppnRate) || 0;
    const qrisImageUrl = body.qrisImageUrl ?? "";
    const inventoryPolicy = ["strict", "medium", "off"].includes(body.inventoryPolicy || "") ? body.inventoryPolicy : "medium";
    const pointEnabled = body.pointEnabled ?? true;
    const pointValue = Number(body.pointValue) || 1;
    const pointPerRupiah = Number(body.pointPerRupiah) || 1000;
    const requireCustomerInfo = body.requireCustomerInfo ?? true;
    const simpleMode = body.simpleMode ?? false;

    await db.query(
      `
        INSERT INTO settings (
          tenant_id,
          store_name,
          address,
          wifi_password,
          pb1_enabled,
          pb1_rate,
          service_enabled,
          service_rate,
          ppn_enabled,
          ppn_rate,
          qris_image_url,
          inventory_policy,
          point_enabled,
          point_value,
          point_per_rupiah,
          require_customer_info,
          simple_mode
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (tenant_id) DO UPDATE SET
          store_name = EXCLUDED.store_name,
          address = EXCLUDED.address,
          wifi_password = EXCLUDED.wifi_password,
          pb1_enabled = EXCLUDED.pb1_enabled,
          pb1_rate = EXCLUDED.pb1_rate,
          service_enabled = EXCLUDED.service_enabled,
          service_rate = EXCLUDED.service_rate,
          ppn_enabled = EXCLUDED.ppn_enabled,
          ppn_rate = EXCLUDED.ppn_rate,
          qris_image_url = EXCLUDED.qris_image_url,
          inventory_policy = EXCLUDED.inventory_policy,
          point_enabled = EXCLUDED.point_enabled,
          point_value = EXCLUDED.point_value,
          point_per_rupiah = EXCLUDED.point_per_rupiah,
          require_customer_info = EXCLUDED.require_customer_info,
          simple_mode = EXCLUDED.simple_mode,
          updated_at = NOW()
      `,
      [tenant.context.tenantId, storeName, address, wifiPassword, pb1Enabled, pb1Rate, serviceEnabled, serviceRate, ppnEnabled, ppnRate, qrisImageUrl, inventoryPolicy, pointEnabled, pointValue, pointPerRupiah, requireCustomerInfo, simpleMode]
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
