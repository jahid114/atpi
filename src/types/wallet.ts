export type WalletTransactionType = "top_up" | "withdraw" | "invest_lti" | "invest_sti";
export type WalletTransactionStatus = "pending" | "approved" | "rejected";
export type TransferMedium = "cash" | "check" | "bank_transfer";

export interface WalletTransaction {
  id: number;
  investorName: string;
  email: string;
  type: WalletTransactionType;
  amount: number;
  date: string;
  status: WalletTransactionStatus;
  description: string;
  transferMedium?: TransferMedium;
  attachment?: string; // filename
}

export interface InvestorWallet {
  id: number;
  investorName: string;
  email: string;
  phone: string;
  balance: number;
  totalTopUps: number;
  totalWithdrawals: number;
  totalSpent: number;
  transactions: WalletTransaction[];
}

export const walletTxTypeConfig: Record<WalletTransactionType, { label: string; color: string }> = {
  top_up: { label: "Top Up", color: "text-profit" },
  withdraw: { label: "Withdraw", color: "text-destructive" },
  invest_lti: { label: "Invest (LTI)", color: "text-primary" },
  invest_sti: { label: "Invest (STI)", color: "text-primary" },
};

export const walletTxStatusConfig: Record<WalletTransactionStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export const transferMediumConfig: Record<TransferMedium, string> = {
  cash: "Cash",
  check: "Check",
  bank_transfer: "Bank Transfer",
};

export const fmtWallet = (n: number) => "৳" + n.toLocaleString("en-US");
