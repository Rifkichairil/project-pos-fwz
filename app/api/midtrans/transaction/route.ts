import { NextResponse } from "next/server";
import { createTransaction, type ItemDetails } from "@/lib/payment";

interface MidtransTransactionPayload {
  orderId: string;
  total: number;
  customerName: string;
  items: ItemDetails[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MidtransTransactionPayload;

    if (!body.orderId || !body.total || body.total <= 0 || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid transaction payload" },
        { status: 400 }
      );
    }

    const result = await createTransaction({
      transaction_details: {
        order_id: body.orderId,
        gross_amount: body.total,
      },
      customer_details: {
        first_name: body.customerName || "Guest",
        email: "guest@example.com",
      },
      item_details: body.items,
      enabled_payments: ["qris"],
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to create Midtrans transaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      redirect_url: result.redirect_url,
      order_id: body.orderId,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
