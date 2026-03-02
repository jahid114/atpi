export type InvestorStatus = "pending" | "approved" | "rejected";
export type InvestmentStatus = "pending" | "approved" | "rejected";

export interface NomineeInfo {
  name: string;
  relationship: string;
  phone: string;
  nidNumber: string;
}

export type TransferMedium = "cash" | "check" | "bank_transfer";

export interface InvestmentEntry {
  id: number;
  date: string;
  amount: number;
  type: "deposit" | "withdrawal" | "payout";
  status: InvestmentStatus;
  transferMedium?: TransferMedium;
  description?: string;
  attachment?: { name: string; url: string };
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
  shares?: number;
  bloodGroup?: string;
  nidNumber?: string;
  jerseySize?: string;
  nominee?: NomineeInfo;
}
