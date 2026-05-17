import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "./page";

describe("DashboardPage chart tooltip", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.startsWith("/api/dashboard?period=daily")) {
          return {
            ok: true,
            json: async () => ({
              stats: {
                totalRevenue: 100000,
                totalTransactions: 10,
                averageOrderValue: 10000,
                estimatedProfit: 30000,
              },
              revenue: { cash: 70000, qris: 20000, other: 10000 },
              salesChart: [
                { label: "08:00", val: 12000, trx: 3 },
                { label: "09:00", val: 18000, trx: 4 },
              ],
              comparisonChart: [
                { label: "Sen", val: 45000, trx: 7 },
                { label: "Sel", val: 52000, trx: 8 },
              ],
              bestSeller: [],
              leastSeller: [],
            }),
          } as Response;
        }

        return {
          ok: true,
          json: async () => ({
            stats: {
              totalRevenue: 0,
              totalTransactions: 0,
              averageOrderValue: 0,
              estimatedProfit: 0,
            },
            revenue: { cash: 0, qris: 0, other: 0 },
            salesChart: [],
            comparisonChart: [],
            bestSeller: [],
            leastSeller: [],
          }),
        } as Response;
      })
    );
  });

  it("shows tooltip text for sales bars in both daily charts", async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Sales per Jam (Hari Ini)")).toBeInTheDocument();
      expect(screen.getByText("Sales 7 Hari Terakhir")).toBeInTheDocument();
    });

    expect(screen.getByTitle("08:00 • 3 transaksi - 12,000")).toBeInTheDocument();
    expect(screen.getByTitle("Sen • 7 transaksi - 45,000")).toBeInTheDocument();
  });

  it("uses full-height bar wrappers so bar height percentages scale correctly", async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Sales per Jam (Hari Ini)")).toBeInTheDocument();
      expect(screen.getByText("Sales 7 Hari Terakhir")).toBeInTheDocument();
    });

    const leftBar = screen.getByTitle("08:00 • 3 transaksi - 12,000");
    const rightBar = screen.getByTitle("Sen • 7 transaksi - 45,000");

    expect(leftBar.parentElement).toHaveClass("h-full", "justify-end");
    expect(rightBar.parentElement).toHaveClass("h-full", "justify-end");
  });
});
