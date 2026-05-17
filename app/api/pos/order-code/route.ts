import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    // Atomic increment: insert or update the daily sequence and return next value
    const result = await db.query<{ last_seq: number }>(
      `INSERT INTO daily_order_sequence (order_date, last_seq)
       VALUES (CURRENT_DATE, 1)
       ON CONFLICT (order_date)
       DO UPDATE SET last_seq = daily_order_sequence.last_seq + 1
       RETURNING last_seq`
    );

    const seq = result.rows[0].last_seq;
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const orderCode = `TRX-${year}${month}${day}-${String(seq).padStart(4, "0")}`;

    return NextResponse.json({ orderCode });
  } catch {
    return NextResponse.json({ error: "Failed to generate order code" }, { status: 500 });
  }
}
