import { useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Filter, Search, CheckCircle2, Clock, Send, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/use-pagination";
import { toast } from "sonner";
import type { Investor } from "@/types/investor";
import {
  calculateInvestorShare,
  calcTimeWeightedBalance,
  calcWeightSegments,
  fmt,
  TODAY,
} from "@/lib/investor-utils";
import { generateLTIInvoice } from "@/lib/lti-pdf";
import { useLTI } from "@/contexts/LTIContext";

interface Props {
  investors: Investor[];
  profit: number;
  selectedYear: number;
}

export function LTIProfitShareTab({ investors, profit, selectedYear }: Props) {
  const { handleRelease } = useLTI();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [confirmInvestorId, setConfirmInvestorId] = useState<number | null>(null);

  const approved = useMemo(() => investors.filter((i) => i.status === "approved"), [investors]);

  const isDistributedForYear = useCallback((inv: Investor) => {
    return inv.history.some(
      (h) => h.type === "payout" && h.status === "approved" && new Date(h.date).getFullYear() === selectedYear
    );
  }, [selectedYear]);

  const getYearPayout = useCallback((inv: Investor) => {
    return inv.history.find(
      (h) => h.type === "payout" && h.status === "approved" && new Date(h.date).getFullYear() === selectedYear
    );
  }, [selectedYear]);

  const rows = useMemo(() => {
    return approved
      .map((inv) => {
        const distributed = isDistributedForYear(inv);
        const payout = getYearPayout(inv);
        const projectedShare = Math.round(calculateInvestorShare(inv, profit, investors));
        const principal = calcTimeWeightedBalance(inv) > 0 ? inv.invested : inv.invested;
        return {
          investor: inv,
          principal,
          projectedShare,
          distributedAmount: payout?.amount ?? 0,
          distributedOn: payout?.date,
          distributed,
        };
      })
      .filter((r) => {
        if (statusFilter === "pending" && r.distributed) return false;
        if (statusFilter === "distributed" && !r.distributed) return false;
        if (search && !r.investor.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      });
  }, [approved, profit, investors, isDistributedForYear, getYearPayout, statusFilter, search]);

  const pendingRows = rows.filter((r) => !r.distributed);
  const distributedRows = rows.filter((r) => r.distributed);

  const totalPendingAmount = pendingRows.reduce((s, r) => s + r.projectedShare, 0);
  const totalDistributedAmount = distributedRows.reduce((s, r) => s + r.distributedAmount, 0);

  const { paginatedItems, currentPage, totalPages, totalItems, goToPage, hasNextPage, hasPrevPage } =
    usePagination(rows);

  const performDistribute = useCallback((row: typeof rows[number]) => {
    if (row.distributed) return;
    if (row.projectedShare <= 0) {
      toast.error("No profit to distribute for this investor.");
      return;
    }
    handleRelease(row.investor.id);
    // Build synthetic payout entry for invoice (mirrors what handleRelease creates)
    generateLTIInvoice({
      investor: row.investor,
      year: selectedYear,
      payout: {
        id: Date.now(),
        date: TODAY.toISOString().split("T")[0],
        amount: row.projectedShare,
        type: "payout",
        status: "approved",
      },
      principal: row.principal,
      totalProfit: profit,
    });
    toast.success(`Distributed ${fmt(row.projectedShare)} to ${row.investor.name}.`);
  }, [handleRelease, selectedYear, profit]);

  const handleReDownload = useCallback((row: typeof rows[number]) => {
    const payout = getYearPayout(row.investor);
    if (!payout) return;
    generateLTIInvoice({
      investor: row.investor,
      year: selectedYear,
      payout,
      principal: row.principal,
      totalProfit: profit,
    });
  }, [getYearPayout, selectedYear, profit]);

  const confirmRow = useMemo(
    () => rows.find((r) => r.investor.id === confirmInvestorId) ?? null,
    [rows, confirmInvestorId]
  );

  const totalPoolWeight = useMemo(
    () => approved.reduce((s, inv) => s + calcTimeWeightedBalance(inv), 0),
    [approved]
  );

  const segmentBreakdown = useMemo(() => {
    if (!confirmRow) return [];
    const segs = calcWeightSegments(confirmRow.investor);
    return segs.map((s) => ({
      ...s,
      share: totalPoolWeight > 0 ? (s.weight / totalPoolWeight) * profit : 0,
    }));
  }, [confirmRow, totalPoolWeight, profit]);

  const totalSegWeight = segmentBreakdown.reduce((s, x) => s + x.weight, 0);
  const totalSegShare = segmentBreakdown.reduce((s, x) => s + x.share, 0);

  return (
    <div className="space-y-6">
      {/* Distribution Summary */}
      <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Distribution Summary · {selectedYear}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Profit Pool</p>
            <p className="text-lg font-bold text-foreground mt-1">{fmt(profit)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending</p>
            <p className="text-lg font-bold text-warning mt-1">{fmt(totalPendingAmount)}</p>
            <p className="text-xs text-muted-foreground">{pendingRows.length} investor{pendingRows.length !== 1 ? "s" : ""}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Distributed</p>
            <p className="text-lg font-bold text-profit mt-1">{fmt(totalDistributedAmount)}</p>
            <p className="text-xs text-muted-foreground">{distributedRows.length} investor{distributedRows.length !== 1 ? "s" : ""}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Eligible Total</p>
            <p className="text-lg font-bold text-foreground mt-1">{approved.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search investor..."
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="distributed">Distributed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{rows.length} investor{rows.length !== 1 ? "s" : ""}</p>

      {/* Distribution Table */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground w-10">#</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Investor</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Principal</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Projected Share</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Distributed On</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  No investors found.
                </td>
              </tr>
            ) : (
              paginatedItems.map((r, idx) => (
                <tr key={r.investor.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 text-muted-foreground text-xs">{(currentPage - 1) * 5 + idx + 1}</td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-foreground">{r.investor.name}</p>
                    <p className="text-xs text-muted-foreground">{r.investor.phone}</p>
                  </td>
                  <td className="px-3 py-2 text-right text-foreground">{fmt(r.principal)}</td>
                  <td className="px-3 py-2 text-right font-medium text-profit">
                    {fmt(r.distributed ? r.distributedAmount : r.projectedShare)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {r.distributed ? (
                      <Badge variant="default" className="text-[11px] gap-1 bg-profit text-white border-profit">
                        <CheckCircle2 className="h-3 w-3" /> Distributed
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[11px] gap-1">
                        <Clock className="h-3 w-3" /> Pending
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.distributedOn || "—"}</td>
                  <td className="px-3 py-2 text-center">
                    {r.distributed ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => handleReDownload(r)}
                      >
                        <Download className="h-3.5 w-3.5" /> Invoice
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => setConfirmInvestorId(r.investor.id)}
                        disabled={r.projectedShare <= 0}
                      >
                        <Send className="h-3.5 w-3.5" /> Distribute
                      </Button>
                    )}
                  </td>
                </tr>
              ))
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

      {/* Distribution Confirmation Dialog with segment breakdown */}
      <Dialog open={!!confirmRow} onOpenChange={(o) => !o && setConfirmInvestorId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {confirmRow && (
            <>
              <DialogHeader>
                <DialogTitle>Distribute Profit · {confirmRow.investor.name}</DialogTitle>
                <DialogDescription>
                  Segment-wise time-weighted breakdown for {selectedYear}. Each segment runs from one balance change to the next.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-3 py-2">
                <div className="bg-muted/40 rounded-md p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Profit Pool</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{fmt(profit)}</p>
                </div>
                <div className="bg-muted/40 rounded-md p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pool Weight</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{fmt(totalPoolWeight)}</p>
                  <p className="text-[10px] text-muted-foreground">$·days</p>
                </div>
                <div className="bg-muted/40 rounded-md p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Investor Weight</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{fmt(totalSegWeight)}</p>
                  <p className="text-[10px] text-muted-foreground">$·days</p>
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-x-auto">
                <table className="w-full text-xs min-w-[640px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Event</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Period</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Days</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Balance</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Weight</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segmentBreakdown.length === 0 ? (
                      <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">No active segments in {selectedYear}.</td></tr>
                    ) : segmentBreakdown.map((s, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            {s.eventType === "deposit"
                              ? <ArrowDownCircle className="h-3.5 w-3.5 text-profit" />
                              : <ArrowUpCircle className="h-3.5 w-3.5 text-destructive" />}
                            <span className="text-foreground">{s.eventLabel}</span>
                            <span className="text-muted-foreground">{fmt(s.eventAmount)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{s.startDate} → {s.endDate}</td>
                        <td className="px-3 py-2 text-right text-foreground">{s.days}</td>
                        <td className="px-3 py-2 text-right text-foreground">{fmt(s.balance)}</td>
                        <td className="px-3 py-2 text-right text-foreground">{fmt(s.weight)}</td>
                        <td className="px-3 py-2 text-right font-medium text-profit">{fmt(s.share)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/40 font-medium">
                      <td colSpan={4} className="px-3 py-2 text-right text-muted-foreground">Total</td>
                      <td className="px-3 py-2 text-right text-foreground">{fmt(totalSegWeight)}</td>
                      <td className="px-3 py-2 text-right text-profit">{fmt(totalSegShare)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Formula per segment: <span className="font-mono">balance × days ÷ pool weight × profit pool</span>.
              </p>

              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmInvestorId(null)}>Cancel</Button>
                <Button
                  className="gap-1.5"
                  onClick={() => {
                    performDistribute(confirmRow);
                    setConfirmInvestorId(null);
                  }}
                  disabled={confirmRow.projectedShare <= 0}
                >
                  <Send className="h-3.5 w-3.5" /> Confirm Distribution · {fmt(confirmRow.projectedShare)}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
