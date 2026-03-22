import { useMemo, useState, useCallback } from "react";
import { format } from "date-fns";
import { Search, CheckCircle, XCircle, Clock, CalendarIcon, FilterX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/use-pagination";
import type { ShortTermProject, InvestorEntryStatus, STInvestorEntry } from "@/types/short-term";
import { fmt } from "@/types/short-term";

interface Props {
  project: ShortTermProject;
  onUpdateStatus: (entryId: number, status: InvestorEntryStatus) => void;
}

const statusBadge: Record<InvestorEntryStatus, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  approved: { label: "Approved", icon: CheckCircle, variant: "default" },
  rejected: { label: "Rejected", icon: XCircle, variant: "destructive" },
};

export function STITransactionsTab({ project, onUpdateStatus }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const sorted = useMemo(() => {
    return [...project.investors].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [project.investors]);

  const filtered = useMemo(() => {
    return sorted.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (dateFrom && new Date(t.date) < dateFrom) return false;
      if (dateTo && new Date(t.date) > dateTo) return false;
      if (search && !t.investorName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [sorted, statusFilter, dateFrom, dateTo, search]);

  const { paginatedItems, currentPage, totalPages, totalItems, goToPage, hasNextPage, hasPrevPage } = usePagination(filtered);

  const hasActiveFilters = search !== "" || statusFilter !== "all" || !!dateFrom || !!dateTo;

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  }, []);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-9 text-xs", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {dateFrom ? format(dateFrom, "MMM d") : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-9 text-xs", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {dateTo ? format(dateTo, "MMM d") : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-9 px-2 text-xs text-muted-foreground" onClick={clearFilters}>
            <FilterX className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Investor</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Amount</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground">Status</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No transactions found.</td></tr>
            ) : (
              paginatedItems.map((t) => {
                const sb = statusBadge[t.status];
                const SIcon = sb.icon;
                return (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 text-muted-foreground text-xs">{t.date}</td>
                    <td className="px-3 py-2 font-medium text-foreground">{t.investorName}</td>
                    <td className="px-3 py-2 text-right font-medium text-profit">{fmt(t.amount)}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant={sb.variant} className="text-[11px] gap-1">
                        <SIcon className="h-3 w-3" /> {sb.label}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {t.status === "pending" ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-profit hover:text-profit" onClick={() => onUpdateStatus(t.id, "approved")}>
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => onUpdateStatus(t.id, "rejected")}>
                            <XCircle className="h-3.5 w-3.5" />
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

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={goToPage}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
      />
    </div>
  );
}
