export type ProjectStatus = "active" | "completed" | "cancelled";
export type InvestorEntryStatus = "pending" | "approved" | "rejected";

export interface STInvestorEntry {
  id: number;
  investorName: string;
  email: string;
  amount: number;
  date: string;
  status: InvestorEntryStatus;
  fundingSource?: "direct" | "wallet";
}

export interface ShortTermProject {
  id: number;
  name: string;
  description: string;
  targetAmount: number;
  startDate: string;
  endDate: string;
  expectedReturn: number;
  status: ProjectStatus;
  image: string;
  investors: STInvestorEntry[];
  distributed?: boolean;
}

export const fmt = (n: number) => "$" + n.toLocaleString("en-US");

export const statusConfig: Record<ProjectStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Active", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export const entryStatusConfig: Record<InvestorEntryStatus, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", icon: () => null, variant: "secondary" },
  approved: { label: "Approved", icon: () => null, variant: "default" },
  rejected: { label: "Rejected", icon: () => null, variant: "destructive" },
};
