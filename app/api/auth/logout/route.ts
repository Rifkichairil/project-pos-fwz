import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (token) {
      await db.query(`DELETE FROM auth_sessions WHERE session_token = $1`, [token]);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("session_token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });
    response.cookies.set("user_role", "", {
      httpOnly: false,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Logout gagal" }, { status: 500 });
  }
}
