export type InvestorStatus = "pending" | "approved" | "rejected";
export type InvestmentStatus = "pending" | "approved" | "rejected";

export interface InvestmentEntry {
  id: number;
  date: string;
  amount: number;
  type: "deposit" | "withdrawal" | "payout";
  status: InvestmentStatus;
}

export interface Investor {
  id: number;
  name: string;
  email: string;
  phone: string;
  invested: number;
  investmentDate: string;
  status: InvestorStatus;
  history: InvestmentEntry[];
}
