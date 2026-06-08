import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/get-session";

type SubscriptionRow = {
  id: number;
  fullname: string;
  subscription_end: string;
};

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get subscription - for manager use their own, for cashier get from manager of their tenant
    const result = await db.query<SubscriptionRow>(
      `SELECT u.id, u.fullname, 
              COALESCE(
                CASE WHEN u.role = 'manager' THEN u.subscription_end END,
                m.subscription_end
              )::text AS subscription_end
       FROM users u
       LEFT JOIN LATERAL (
         SELECT um.subscription_end
         FROM user_tenants utm
         JOIN users um ON um.id = utm.user_id AND um.role = 'manager' AND um.is_active = TRUE
         WHERE utm.tenant_id = u.active_tenant_id
         LIMIT 1
       ) m ON u.role = 'cashier'
       WHERE u.id = $1 AND u.is_active = TRUE 
       AND COALESCE(
         CASE WHEN u.role = 'manager' THEN u.subscription_status END,
         m.subscription_status
       ) = 'active'`,
      [session.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].subscription_end) {
      return NextResponse.json({ alert: null });
    }

    const subscriptionEnd = new Date(result.rows[0].subscription_end);
    const now = new Date();
    const daysRemaining = Math.ceil((subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Alert on H-3, H-7, H-10
    const alertDays = [3, 7, 10];
    if (!alertDays.includes(daysRemaining)) {
      return NextResponse.json({ alert: null });
    }

    return NextResponse.json({
      alert: {
        daysRemaining,
        endDate: subscriptionEnd.toLocaleDateString("id-ID"),
        userName: result.rows[0].fullname,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to check subscription" }, { status: 500 });
  }
}
