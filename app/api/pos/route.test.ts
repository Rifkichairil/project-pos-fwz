import { beforeEach, describe, expect, it, vi } from "vitest";

const connectMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    connect: connectMock,
  },
}));

describe("PATCH /api/pos payment update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates payment to paid without reusing $1 across mixed SQL contexts", async () => {
    const queryMock = vi.fn(async (sql: string, params?: unknown[]) => {
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
        return { rows: [] };
      }

      if (sql.includes("SELECT id, status FROM sales_orders")) {
        return { rows: [{ id: 101, status: "open" }] };
      }

      if (sql.includes("UPDATE order_payments")) {
        if (sql.includes("CASE WHEN $1")) {
          throw new Error("inconsistent types deduced for parameter $1");
        }

        expect(params).toEqual([101, "paid"]);
        return { rows: [] };
      }

      if (sql.includes("UPDATE sales_orders SET status = $1")) {
        expect(params).toEqual(["paid", 101]);
        return { rows: [] };
      }

      if (sql.includes("INSERT INTO order_status_history")) {
        return { rows: [] };
      }

      return { rows: [] };
    });

    connectMock.mockResolvedValue({
      query: queryMock,
      release: vi.fn(),
    });

    const { PATCH } = await import("./route");

    const response = await PATCH(
      new Request("http://localhost/api/pos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode: "ORD-0001",
          paymentStatus: "paid",
          handledBy: "Kasir",
        }),
      })
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
  });
});
