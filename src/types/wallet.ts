export type WalletTransactionType = "top_up" | "invest_lti" | "invest_sti";
export type WalletTransactionStatus = "pending" | "approved" | "rejected";

export interface WalletTransaction {
  id: number;
  investorName: string;
  email: string;
  type: WalletTransactionType;
  amount: number;
  date: string;
  status: WalletTransactionStatus;
  description: string;
}

export interface InvestorWallet {
  id: number;
  investorName: string;
  email: string;
  balance: number;
  totalTopUps: number;
  totalSpent: number;
  transactions: WalletTransaction[];
}

export const walletTxTypeConfig: Record<WalletTransactionType, { label: string; color: string }> = {
  top_up: { label: "Top Up", color: "text-profit" },
  invest_lti: { label: "Invest (LTI)", color: "text-primary" },
  invest_sti: { label: "Invest (STI)", color: "text-primary" },
};

export const walletTxStatusConfig: Record<WalletTransactionStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export const fmtWallet = (n: number) => "$" + n.toLocaleString("en-US");
