import { useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Investor, InvestmentEntry, InvestmentStatus } from "@/types/investor";
import { fmt } from "@/lib/investor-utils";

interface FlatTransaction extends InvestmentEntry {
  investorName: string;
  investorId: number;
}

const statusBadge: Record<InvestmentStatus, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  approved: { label: "Approved", icon: CheckCircle, variant: "default" },
  rejected: { label: "Rejected", icon: XCircle, variant: "destructive" },
};

const typeLabels: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  payout: "Profit Share",
};

interface Props {
  investors: Investor[];
}

export function LTITransactionsTab({ investors }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [investorFilter, setInvestorFilter] = useState("all");

  const allTransactions = useMemo<FlatTransaction[]>(() => {
    return investors
      .flatMap((inv) =>
        inv.history.map((h) => ({
          ...h,
          investorName: inv.name,
          investorId: inv.id,
        }))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [investors]);

  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (investorFilter !== "all" && String(t.investorId) !== investorFilter) return false;
      if (search && !t.investorName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [allTransactions, typeFilter, statusFilter, investorFilter, search]);

  const uniqueInvestors = useMemo(() => {
    const map = new Map<number, string>();
    investors.forEach((i) => map.set(i.id, i.name));
    return Array.from(map.entries());
  }, [investors]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by investor..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="withdrawal">Withdrawal</SelectItem>
            <SelectItem value="payout">Profit Share</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={investorFilter} onValueChange={setInvestorFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Investor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Investors</SelectItem>
            {uniqueInvestors.map(([id, name]) => (
              <SelectItem key={id} value={String(id)}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground ml-auto">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden kpi-shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Investor</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No transactions found.</td>
              </tr>
            ) : (
              filtered.map((t) => {
                const sb = statusBadge[t.status];
                const SIcon = sb.icon;
                return (
                  <tr key={`${t.investorId}-${t.id}`} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{t.date}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{t.investorName}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-[11px]">{typeLabels[t.type] || t.type}</Badge>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${t.type === "withdrawal" ? "text-destructive" : "text-profit"}`}>
                      {t.type === "withdrawal" ? "-" : "+"}{fmt(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={sb.variant} className="text-[11px] gap-1">
                        <SIcon className="h-3 w-3" /> {sb.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
