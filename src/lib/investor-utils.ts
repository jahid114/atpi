import type { Investor } from "@/types/investor";

export const QUARTER_START = new Date("2026-01-01");
export const TODAY = new Date("2026-02-14");
export const QUARTER_TOTAL_DAYS = 90;
export const quarterDaysElapsed = Math.ceil((TODAY.getTime() - QUARTER_START.getTime()) / (1000 * 60 * 60 * 24));

export const calcDaysActive = (dateStr: string): number => {
  const d = new Date(dateStr);
  const start = d > QUARTER_START ? d : QUARTER_START;
  return Math.max(0, Math.ceil((TODAY.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
};

export const calculateProRata = (
  amount: number,
  joinDate: string,
  _periodTotalDays: number,
  totalProfit: number,
  allInvestors: Investor[]
): number => {
  const approved = allInvestors.filter((i) => i.status === "approved");
  const daysActive = calcDaysActive(joinDate);
  const weight = amount * daysActive;
  const totalWeight = approved.reduce((s, inv) => s + inv.invested * calcDaysActive(inv.investmentDate), 0);
  return totalWeight > 0 ? (weight / totalWeight) * totalProfit : 0;
};

export const getPeriodBadge = (dateStr: string): "Early-Period" | "Mid-Period" => {
  const daysActive = calcDaysActive(dateStr);
  const quarterElapsed = Math.ceil((TODAY.getTime() - QUARTER_START.getTime()) / (1000 * 60 * 60 * 24));
  return daysActive >= quarterElapsed * 0.75 ? "Early-Period" : "Mid-Period";
};

export const fmt = (n: number) => "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

export const initialInvestors: Investor[] = [
  { id: 1, name: "Sarah Mitchell", email: "sarah@example.com", phone: "+1 555-0101", invested: 200000, investmentDate: "2024-06-15", status: "approved", history: [{ id: 1, date: "2024-06-15", amount: 200000, type: "deposit", status: "approved" }, { id: 2, date: "2025-12-31", amount: 18400, type: "payout", status: "approved" }] },
  { id: 2, name: "James Chen", email: "james@example.com", phone: "+1 555-0202", invested: 500000, investmentDate: "2025-03-01", status: "approved", history: [{ id: 3, date: "2025-03-01", amount: 500000, type: "deposit", status: "approved" }] },
  { id: 3, name: "Olivia Nakamura", email: "olivia@example.com", phone: "+1 555-0303", invested: 150000, investmentDate: "2025-11-20", status: "approved", history: [{ id: 4, date: "2025-11-20", amount: 150000, type: "deposit", status: "approved" }] },
  { id: 4, name: "Marcus Williams", email: "marcus@example.com", phone: "+1 555-0404", invested: 800000, investmentDate: "2026-01-10", status: "approved", history: [{ id: 5, date: "2026-01-10", amount: 800000, type: "deposit", status: "approved" }] },
  { id: 5, name: "Elena Rodriguez", email: "elena@example.com", phone: "+1 555-0505", invested: 350000, investmentDate: "2025-08-05", status: "pending", history: [{ id: 6, date: "2025-08-05", amount: 350000, type: "deposit", status: "pending" }] },
];
