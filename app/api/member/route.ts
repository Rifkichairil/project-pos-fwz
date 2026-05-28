import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireTenantScope } from "@/lib/tenant-scope";

type MemberRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  points_balance: number;
  visit_count: number;
  total_spending: string;
  last_visit_at: string | null;
  favorite_menu: string | null;
};

type TransactionRow = {
  member_id: number;
  transaction_code: string;
  transaction_date: string;
  item_summary: string;
  amount: string;
};

type PointHistoryRow = {
  member_id: number;
  entry_type: "earn" | "redeem" | "adjust";
  description: string;
  points_delta: number;
  created_at: string;
};

type RewardRow = {
  reward_name: string;
  points_cost: number;
};

const formatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

function formatDate(value: string | null) {
  if (!value) return "-";
  return formatter.format(new Date(value));
}

export async function GET() {
  const tenant = await requireTenantScope();
  if ("error" in tenant) return tenant.error;

  try {
    const [membersResult, transactionsResult, pointHistoryResult, rewardsResult] = await Promise.all([
      db.query<MemberRow>(`
        SELECT
          m.id,
          m.name,
          m.email,
          m.phone,
          m.location,
          m.tier,
          m.points_balance,
          m.visit_count,
          m.total_spending,
          m.last_visit_at,
          menu.name AS favorite_menu
        FROM members m
        LEFT JOIN menus menu ON menu.id = m.favorite_menu_id
        WHERE m.is_active = TRUE
        ORDER BY m.id
      `),
      db.query<TransactionRow>(`
        SELECT
          member_id,
          transaction_code,
          transaction_date,
          item_summary,
          amount
        FROM member_transactions
        ORDER BY transaction_date DESC, id DESC
      `),
      db.query<PointHistoryRow>(`
        SELECT
          member_id,
          entry_type,
          description,
          points_delta,
          created_at
        FROM member_point_ledger
        ORDER BY created_at DESC, id DESC
      `),
      db.query<RewardRow>(`
        SELECT reward_name, points_cost
        FROM rewards
        WHERE is_active = TRUE
        ORDER BY points_cost ASC
      `),
    ]);

    const transactionsByMember = new Map<number, TransactionRow[]>();
    for (const row of transactionsResult.rows) {
      if (!transactionsByMember.has(row.member_id)) {
        transactionsByMember.set(row.member_id, []);
      }
      transactionsByMember.get(row.member_id)!.push(row);
    }

    const pointsByMember = new Map<number, PointHistoryRow[]>();
    for (const row of pointHistoryResult.rows) {
      if (!pointsByMember.has(row.member_id)) {
        pointsByMember.set(row.member_id, []);
      }
      pointsByMember.get(row.member_id)!.push(row);
    }

    const members = membersResult.rows.map((member) => {
      const transactions = (transactionsByMember.get(member.id) || []).map((tx) => ({
        id: tx.transaction_code,
        date: formatDate(tx.transaction_date),
        items: tx.item_summary,
        amount: Number(tx.amount),
      }));

      const pointHistory = (pointsByMember.get(member.id) || []).map((entry) => ({
        date: formatDate(entry.created_at),
        type: entry.entry_type,
        desc: entry.description,
        amount: entry.points_delta,
      }));

      const rewards = rewardsResult.rows
        .filter((reward) => member.points_balance >= reward.points_cost)
        .map((reward) => `${reward.reward_name} (${reward.points_cost} pts)`);

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        location: member.location,
        tier: member.tier,
        points: member.points_balance,
        visits: member.visit_count,
        totalSpending: Number(member.total_spending),
        lastVisit: formatDate(member.last_visit_at),
        favoriteMenu: member.favorite_menu || "-",
        transactions,
        pointHistory,
        rewards,
      };
    });

    return NextResponse.json({ members });
  } catch {
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }
}
