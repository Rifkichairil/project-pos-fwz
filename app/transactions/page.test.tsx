import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TransactionsPage from "./page";

describe("TransactionsPage filters", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ transactions: [] }),
      })
    );
  });

  it("renders date and payment status as dropdown filters", async () => {
    render(<TransactionsPage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(screen.getAllByRole("combobox").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole("button", { name: "Today" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Success" })).not.toBeInTheDocument();
  });
});
