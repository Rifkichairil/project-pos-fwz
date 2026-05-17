import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PosPage from "./page";

describe("PosPage order list", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.startsWith("/api/menu")) {
          return {
            ok: true,
            json: async () => ({ products: [] }),
          } as Response;
        }

        if (url.startsWith("/api/settings")) {
          return {
            ok: true,
            json: async () => ({
              wifiPassword: "",
              qrisImageUrl: "",
              pb1Enabled: false,
              pb1Rate: 0,
              serviceEnabled: false,
              serviceRate: 0,
              ppnEnabled: false,
              ppnRate: 0,
            }),
          } as Response;
        }

        if (url.startsWith("/api/tables")) {
          return {
            ok: true,
            json: async () => ({ tables: [] }),
          } as Response;
        }

        if (url.startsWith("/api/pos?")) {
          return {
            ok: true,
            json: async () => ({
              orders: [
                {
                  id: "TRX-1",
                  orderCode: "TRX-1",
                  name: "Budi",
                  type: "Dine in",
                  tableName: "A1",
                  status: "Queue",
                  time: "16/05/2026 10:00",
                  items: 1,
                  total: 12000,
                  handledBy: "Jennie Doe",
                  menuItems: [],
                },
              ],
            }),
          } as Response;
        }

        return {
          ok: true,
          json: async () => ({}),
        } as Response;
      })
    );
  });

  it("shows table number for dine-in orders in Order List", async () => {
    render(<PosPage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Order List" }));

    await waitFor(() => {
      expect(screen.getByText("Table: A1")).toBeInTheDocument();
    });
  });
});
