import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";

type TenantScopeSuccess = {
  context: {
    userId: number;
    tenantId: number;
    role: string;
  };
};

type TenantScopeError = {
  error: NextResponse;
};

export async function requireTenantScope(): Promise<TenantScopeSuccess | TenantScopeError> {
  const session = await getSession();

  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (session.tenantId === null) {
    return { error: NextResponse.json({ error: "No active tenant selected" }, { status: 403 }) };
  }

  return {
    context: {
      userId: session.userId,
      tenantId: session.tenantId,
      role: session.role,
    },
  };
}
