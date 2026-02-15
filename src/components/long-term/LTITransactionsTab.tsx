import { useMemo, useState, useCallback } from "react";
import { format } from "date-fns";
import { Search, CheckCircle, XCircle, Clock, CalendarIcon, FilterX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
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
  onUpdateInvestment?: (investorId: number, entryId: number, status: InvestmentStatus) => void;
}

export function LTITransactionsTab({ investors, onUpdateInvestment }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

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
      if (dateFrom && new Date(t.date) < dateFrom) return false;
      if (dateTo && new Date(t.date) > dateTo) return false;
      if (search && !t.investorName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [allTransactions, typeFilter, statusFilter, dateFrom, dateTo, search]);

  const hasActiveFilters = search !== "" || typeFilter !== "all" || statusFilter !== "all" || !!dateFrom || !!dateTo;

  const clearFilters = useCallback(() => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  }, []);


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
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[150px] justify-start text-left text-sm font-normal", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[150px] justify-start text-left text-sm font-normal", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground" onClick={clearFilters}>
            <FilterX className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
        <p className="text-xs text-muted-foreground ml-auto">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
        <table className="w-full text-sm min-w-[750px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Investor</th>
              <th className="text-left px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Type</th>
              <th className="text-right px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Amount</th>
              <th className="text-center px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Status</th>
              <th className="text-center px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No transactions found.</td>
              </tr>
            ) : (
              filtered.map((t) => {
                const sb = statusBadge[t.status];
                const SIcon = sb.icon;
                return (
                  <tr key={`${t.investorId}-${t.id}`} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 xl:px-6 py-3 xl:py-4 text-muted-foreground">{t.date}</td>
                    <td className="px-4 xl:px-6 py-3 xl:py-4 font-medium text-foreground">{t.investorName}</td>
                    <td className="px-4 xl:px-6 py-3 xl:py-4">
                      <Badge variant="secondary" className="text-[11px]">{typeLabels[t.type] || t.type}</Badge>
                    </td>
                    <td className={`px-4 xl:px-6 py-3 xl:py-4 text-right font-medium ${t.type === "withdrawal" ? "text-destructive" : "text-profit"}`}>
                      {t.type === "withdrawal" ? "-" : "+"}{fmt(t.amount)}
                    </td>
                    <td className="px-4 xl:px-6 py-3 xl:py-4 text-center">
                      <Badge variant={sb.variant} className="text-[11px] gap-1">
                        <SIcon className="h-3 w-3" /> {sb.label}
                      </Badge>
                    </td>
                    <td className="px-4 xl:px-6 py-3 xl:py-4 text-center">
                      {t.status === "pending" && onUpdateInvestment ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-profit hover:text-profit" onClick={() => onUpdateInvestment(t.investorId, t.id, "approved")}>
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => onUpdateInvestment(t.investorId, t.id, "rejected")}>
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
