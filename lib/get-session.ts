import { cookies } from "next/headers";
import { db } from "@/lib/db";

export type SessionContext = {
  userId: number;
  tenantId: number | null;
  role: string;
};

export async function getSession(): Promise<SessionContext | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) return null;

    const result = await db.query<{ user_id: number; active_tenant_id: number | null; role: string }>(
      `SELECT s.user_id, s.active_tenant_id, u.role
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.session_token = $1 AND s.expires_at > NOW()
       LIMIT 1`,
      [token]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      userId: row.user_id,
      tenantId: row.active_tenant_id,
      role: row.role,
    };
  } catch {
    return null;
  }
}
