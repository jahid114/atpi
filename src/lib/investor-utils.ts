import type { Investor } from "@/types/investor";

export const YEAR_START = new Date("2026-01-01");
export const TODAY = new Date("2026-02-14");
export const YEAR_TOTAL_DAYS = 365;
export const yearDaysElapsed = Math.ceil((TODAY.getTime() - YEAR_START.getTime()) / (1000 * 60 * 60 * 24));

export const calcDaysActive = (dateStr: string): number => {
  const d = new Date(dateStr);
  const start = d > YEAR_START ? d : YEAR_START;
  return Math.max(0, Math.ceil((TODAY.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
};

/**
 * Calculate time-weighted balance for an investor,
 * accounting for deposits and withdrawals at different dates.
 */
export const calcTimeWeightedBalance = (investor: Investor): number => {
  const events = investor.history
    .filter((h) => (h.type === "deposit" || h.type === "withdrawal") && h.status === "approved")
    .map((h) => ({
      date: new Date(h.date),
      delta: h.type === "deposit" ? h.amount : -h.amount,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (events.length === 0) return 0;

  let weight = 0;
  let balance = 0;

  for (let i = 0; i < events.length; i++) {
    const eventDate = events[i].date;
    const effectiveStart = eventDate > YEAR_START ? eventDate : YEAR_START;
    const nextDate = i < events.length - 1
      ? (events[i + 1].date > YEAR_START ? events[i + 1].date : YEAR_START)
      : TODAY;

    balance += events[i].delta;
    const days = Math.max(0, Math.ceil((nextDate.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)));

    // Only count days from this event to the next event (or today)
    if (i < events.length - 1) {
      const segmentStart = effectiveStart;
      const segmentEnd = events[i + 1].date > YEAR_START ? events[i + 1].date : YEAR_START;
      const segmentDays = Math.max(0, Math.ceil((segmentEnd.getTime() - segmentStart.getTime()) / (1000 * 60 * 60 * 24)));
      weight += balance * segmentDays;
    } else {
      // Last event to today
      const segmentDays = Math.max(0, Math.ceil((TODAY.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)));
      weight += balance * segmentDays;
    }
  }

  return Math.max(0, weight);
};

export const calculateProRata = (
  amount: number,
  joinDate: string,
  _periodTotalDays: number,
  totalProfit: number,
  allInvestors: Investor[]
): number => {
  const approved = allInvestors.filter((i) => i.status === "approved");
  const investor = approved.find((i) => i.invested === amount && i.investmentDate === joinDate);
  
  // For per-deposit share calculation, use simple amount × days
  const daysActive = calcDaysActive(joinDate);
  const weight = amount * daysActive;

  // Total weight uses time-weighted balances for all investors
  const totalWeight = approved.reduce((s, inv) => s + calcTimeWeightedBalance(inv), 0);
  return totalWeight > 0 ? (weight / totalWeight) * totalProfit : 0;
};

/**
 * Calculate total pro-rata share for an investor using time-weighted balance.
 */
export const calculateInvestorShare = (
  investor: Investor,
  totalProfit: number,
  allInvestors: Investor[]
): number => {
  const approved = allInvestors.filter((i) => i.status === "approved");
  const weight = calcTimeWeightedBalance(investor);
  const totalWeight = approved.reduce((s, inv) => s + calcTimeWeightedBalance(inv), 0);
  return totalWeight > 0 ? (weight / totalWeight) * totalProfit : 0;
};

export const getPeriodBadge = (dateStr: string): "Early-Period" | "Mid-Period" => {
  const daysActive = calcDaysActive(dateStr);
  const elapsed = Math.ceil((TODAY.getTime() - YEAR_START.getTime()) / (1000 * 60 * 60 * 24));
  return daysActive >= elapsed * 0.75 ? "Early-Period" : "Mid-Period";
};

export const fmt = (n: number) => "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

export const initialInvestors: Investor[] = [
  { id: 1, name: "Sarah Mitchell", email: "sarah@example.com", phone: "+1 555-0101", invested: 200000, investmentDate: "2024-06-15", status: "approved", shares: 20, bloodGroup: "O+", nidNumber: "1234567890", jerseySize: "M", nominee: { name: "Tom Mitchell", relationship: "Spouse", phone: "+1 555-0111", nidNumber: "9876543210" }, history: [{ id: 1, date: "2024-06-15", amount: 200000, type: "deposit", status: "approved" }, { id: 2, date: "2025-12-31", amount: 18400, type: "payout", status: "approved" }] },
  { id: 2, name: "James Chen", email: "james@example.com", phone: "+1 555-0202", invested: 500000, investmentDate: "2025-03-01", status: "approved", shares: 50, bloodGroup: "A+", nidNumber: "2345678901", jerseySize: "L", nominee: { name: "Lisa Chen", relationship: "Spouse", phone: "+1 555-0222", nidNumber: "8765432109" }, history: [{ id: 3, date: "2025-03-01", amount: 500000, type: "deposit", status: "approved" }] },
  { id: 3, name: "Olivia Nakamura", email: "olivia@example.com", phone: "+1 555-0303", invested: 150000, investmentDate: "2025-11-20", status: "approved", shares: 15, bloodGroup: "B+", nidNumber: "3456789012", jerseySize: "S", nominee: { name: "Ken Nakamura", relationship: "Brother", phone: "+1 555-0333", nidNumber: "7654321098" }, history: [{ id: 4, date: "2025-11-20", amount: 150000, type: "deposit", status: "approved" }] },
  { id: 4, name: "Marcus Williams", email: "marcus@example.com", phone: "+1 555-0404", invested: 800000, investmentDate: "2026-01-10", status: "approved", shares: 80, bloodGroup: "AB+", nidNumber: "4567890123", jerseySize: "XL", nominee: { name: "Diana Williams", relationship: "Wife", phone: "+1 555-0444", nidNumber: "6543210987" }, history: [{ id: 5, date: "2026-01-10", amount: 800000, type: "deposit", status: "approved" }] },
  { id: 5, name: "Elena Rodriguez", email: "elena@example.com", phone: "+1 555-0505", invested: 350000, investmentDate: "2025-08-05", status: "pending", shares: 35, bloodGroup: "O-", nidNumber: "5678901234", jerseySize: "M", nominee: { name: "Carlos Rodriguez", relationship: "Father", phone: "+1 555-0555", nidNumber: "5432109876" }, history: [{ id: 6, date: "2025-08-05", amount: 350000, type: "deposit", status: "pending" }] },
  { id: 6, name: "Fatima Al-Hassan", email: "fatima@example.com", phone: "+1 555-0606", invested: 420000, investmentDate: "2025-09-12", status: "approved", shares: 42, bloodGroup: "A-", nidNumber: "6789012345", jerseySize: "S", nominee: { name: "Ahmed Al-Hassan", relationship: "Brother", phone: "+1 555-0666", nidNumber: "4321098765" }, history: [{ id: 7, date: "2025-09-12", amount: 420000, type: "deposit", status: "approved" }] },
  { id: 7, name: "Raj Patel", email: "raj@example.com", phone: "+1 555-0707", invested: 600000, investmentDate: "2025-07-20", status: "approved", shares: 60, bloodGroup: "B-", nidNumber: "7890123456", jerseySize: "L", nominee: { name: "Priya Patel", relationship: "Wife", phone: "+1 555-0777", nidNumber: "3210987654" }, history: [{ id: 8, date: "2025-07-20", amount: 600000, type: "deposit", status: "approved" }] },
  { id: 8, name: "Sophie Laurent", email: "sophie@example.com", phone: "+1 555-0808", invested: 275000, investmentDate: "2025-10-05", status: "approved", shares: 28, bloodGroup: "AB-", nidNumber: "8901234567", jerseySize: "M", nominee: { name: "Pierre Laurent", relationship: "Father", phone: "+1 555-0888", nidNumber: "2109876543" }, history: [{ id: 9, date: "2025-10-05", amount: 275000, type: "deposit", status: "approved" }] },
  { id: 9, name: "Daniel Kim", email: "daniel@example.com", phone: "+1 555-0909", invested: 180000, investmentDate: "2026-01-25", status: "pending", shares: 18, bloodGroup: "O+", nidNumber: "9012345678", jerseySize: "XL", nominee: { name: "Yuna Kim", relationship: "Sister", phone: "+1 555-0999", nidNumber: "1098765432" }, history: [{ id: 10, date: "2026-01-25", amount: 180000, type: "deposit", status: "pending" }] },
  { id: 10, name: "Maria Santos", email: "maria@example.com", phone: "+1 555-1010", invested: 450000, investmentDate: "2025-06-18", status: "approved", shares: 45, bloodGroup: "A+", nidNumber: "0123456789", jerseySize: "S", nominee: { name: "Jorge Santos", relationship: "Husband", phone: "+1 555-1011", nidNumber: "0987654321" }, history: [{ id: 11, date: "2025-06-18", amount: 450000, type: "deposit", status: "approved" }] },
  { id: 11, name: "Alex Thompson", email: "alex@example.com", phone: "+1 555-1100", invested: 320000, investmentDate: "2025-12-01", status: "approved", shares: 32, bloodGroup: "B+", nidNumber: "1122334455", jerseySize: "L", nominee: { name: "Jordan Thompson", relationship: "Spouse", phone: "+1 555-1111", nidNumber: "5544332211" }, history: [{ id: 12, date: "2025-12-01", amount: 320000, type: "deposit", status: "approved" }] },
  { id: 12, name: "Aisha Okonkwo", email: "aisha@example.com", phone: "+1 555-1200", invested: 550000, investmentDate: "2025-04-22", status: "approved", shares: 55, bloodGroup: "O-", nidNumber: "2233445566", jerseySize: "M", nominee: { name: "Chidi Okonkwo", relationship: "Brother", phone: "+1 555-1222", nidNumber: "6655443322" }, history: [{ id: 13, date: "2025-04-22", amount: 550000, type: "deposit", status: "approved" }] },
];
