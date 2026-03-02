import { useMemo, useState, useRef } from "react";
import { Eye, Send, Search, Landmark, Paperclip, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { InvestorDetailDialog } from "@/components/InvestorDetailDialog";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/use-pagination";
import type { Investor, InvestorStatus, InvestmentStatus } from "@/types/investor";
import { calcDaysActive, calculateInvestorShare, fmt, YEAR_TOTAL_DAYS, yearDaysElapsed } from "@/lib/investor-utils";
import { useFinancial } from "@/contexts/FinancialContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";

interface Props {
  investors: Investor[];
  profit: number;
  onRelease: (id: number) => void;
  onUpdateInvestment: (investorId: number, entryId: number, status: InvestmentStatus) => void;
  onWithdraw: (investorId: number, amount: number) => void;
  selectedYear: number;
}

export function LTIOverviewTab({ investors, profit, onRelease, onUpdateInvestment, onWithdraw, selectedYear }: Props) {
  const { grossProfit, totalExpenses } = useFinancial();
  const [search, setSearch] = useState("");
  const [detailInvestor, setDetailInvestor] = useState<Investor | null>(null);
  const [releaseInvestor, setReleaseInvestor] = useState<Investor | null>(null);
  const [releaseAttachment, setReleaseAttachment] = useState<string>("");
  const [releaseNote, setReleaseNote] = useState("");
  const releaseFileRef = useRef<HTMLInputElement>(null);

  const approved = useMemo(() => investors.filter((i) => i.status === "approved"), [investors]);
  const totalInvested = approved.reduce((s, i) => s + i.invested, 0);
  const totalShares = approved.reduce((s, i) => s + (i.shares || 0), 0);
  const shareValue = totalShares > 0 ? Math.round(totalInvested / totalShares) : 0;
  const investmentableAmount = profit > 0 ? profit : 0;

  const rows = useMemo(() => {
    return approved
      .filter((inv) => inv.name.toLowerCase().includes(search.toLowerCase()) || inv.email.toLowerCase().includes(search.toLowerCase()))
      .map((inv) => {
        const share = calculateInvestorShare(inv, profit, investors);
        return { ...inv, share };
      });
  }, [approved, profit, investors, search]);

  const { paginatedItems, currentPage, totalPages, totalItems, goToPage, hasNextPage, hasPrevPage } = usePagination(rows);

  const currentDetailInvestor = detailInvestor ? investors.find((i) => i.id === detailInvestor.id) || null : null;

  const handleReleaseAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setReleaseAttachment(file.name);
  };

  const handleReleaseConfirm = () => {
    if (!releaseInvestor) return;
    onRelease(releaseInvestor.id);
    setReleaseInvestor(null);
    setReleaseAttachment("");
    setReleaseNote("");
  };

  return (
    <div className="space-y-6 xl:space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 xl:gap-5">
        <div className="bg-card border border-border rounded-lg p-4 xl:p-5 kpi-shadow">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">No of Investors</p>
          <p className="text-xl xl:text-2xl font-bold text-foreground mt-1">{approved.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 xl:p-5 kpi-shadow">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">No of Shares</p>
          <p className="text-xl xl:text-2xl font-bold text-foreground mt-1">{totalShares}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 xl:p-5 kpi-shadow">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Share Value</p>
          <p className="text-xl xl:text-2xl font-bold text-foreground mt-1">{fmt(shareValue)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 xl:p-5 kpi-shadow">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Invested</p>
          <p className="text-xl xl:text-2xl font-bold text-foreground mt-1">{fmt(totalInvested)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 xl:p-5 kpi-shadow">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Year Progress</p>
          <p className="text-xl xl:text-2xl font-bold text-foreground mt-1">{yearDaysElapsed} / {YEAR_TOTAL_DAYS}</p>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (yearDaysElapsed / YEAR_TOTAL_DAYS) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Profit Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 xl:gap-5">
        <div className="bg-card border border-border rounded-lg p-4 xl:p-5 kpi-shadow">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Profit from Client</p>
          <p className="text-xl xl:text-2xl font-bold text-profit mt-1">{fmt(grossProfit)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 xl:p-5 kpi-shadow">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Expense</p>
          <p className="text-xl xl:text-2xl font-bold text-destructive mt-1">{fmt(totalExpenses)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 xl:p-5 kpi-shadow">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Net Profit</p>
          <p className={`text-xl xl:text-2xl font-bold mt-1 ${profit >= 0 ? "text-profit" : "text-destructive"}`}>{fmt(profit)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 xl:p-5 kpi-shadow">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Investmentable Amount</p>
          <p className="text-xl xl:text-2xl font-bold text-foreground mt-1">{fmt(investmentableAmount)}</p>
        </div>
      </div>

      {/* Investor Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search investors..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <p className="text-sm text-muted-foreground">{rows.length} active investor{rows.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Investor Name</th>
                <th className="text-right px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Total Principal</th>
                <th className="text-center px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">No of Shares</th>
                <th className="text-right px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Projected Share</th>
                <th className="text-center px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 xl:px-6 py-3 xl:py-4">
                    <p className="font-medium text-foreground">{inv.name}</p>
                    <p className="text-xs text-muted-foreground">{inv.email}</p>
                  </td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4 text-right text-foreground">{fmt(inv.invested)}</td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4 text-center text-foreground">{inv.shares || 0}</td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4 text-right font-semibold text-profit">{fmt(Math.round(inv.share))}</td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4 text-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => setDetailInvestor(inv)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-profit hover:text-profit" title="Release profit" onClick={() => setReleaseInvestor(inv)}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/30">
                <td className="px-4 xl:px-6 py-3 xl:py-4 font-semibold text-foreground">Total</td>
                <td className="px-4 xl:px-6 py-3 xl:py-4 text-right font-semibold text-foreground">{fmt(totalInvested)}</td>
                <td className="px-4 xl:px-6 py-3 xl:py-4 text-center font-semibold text-foreground">{totalShares}</td>
                <td className="px-4 xl:px-6 py-3 xl:py-4 text-right font-bold text-profit">{fmt(profit)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} onPageChange={goToPage} hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} />
      </div>

      {/* Investor Detail Dialog */}
      <InvestorDetailDialog
        investor={currentDetailInvestor}
        allInvestors={investors}
        profit={profit}
        onClose={() => setDetailInvestor(null)}
        onWithdraw={onWithdraw}
      />

      {/* Release Profit Dialog */}
      <Dialog open={!!releaseInvestor} onOpenChange={(o) => { if (!o) { setReleaseInvestor(null); setReleaseAttachment(""); setReleaseNote(""); } }}>
        <DialogContent className="sm:max-w-lg">
          {releaseInvestor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-profit" /> Release Profit
                </DialogTitle>
                <DialogDescription>
                  Release profit share to {releaseInvestor.name}. Attach payment proof before confirming.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Bank Details */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bank Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2.5">
                      <Landmark className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Account Holder</p>
                        <p className="text-sm font-medium text-foreground">{releaseInvestor.name}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Bank Name</p>
                      <p className="text-sm font-medium text-foreground">National Bank</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Account Number</p>
                      <p className="text-sm font-medium text-foreground font-mono">••••••{String(releaseInvestor.id).slice(-4).padStart(4, '0')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Routing Number</p>
                      <p className="text-sm font-medium text-foreground font-mono">••••1234</p>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="bg-card border border-border rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Profit Amount</p>
                  <p className="text-2xl font-bold text-profit mt-1">{fmt(Math.round(calculateInvestorShare(releaseInvestor, profit, investors)))}</p>
                </div>

                {/* Attachment */}
                <div className="space-y-1.5">
                  <Label>Payment Proof / Attachment</Label>
                  <div
                    onClick={() => releaseFileRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  >
                    {releaseAttachment ? (
                      <div className="flex items-center justify-center gap-2 text-foreground">
                        <Paperclip className="h-4 w-4" />
                        <span className="text-sm font-medium">{releaseAttachment}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <p className="text-sm">Click to upload payment proof</p>
                        <p className="text-xs">PDF, Image, or Document</p>
                      </div>
                    )}
                  </div>
                  <input ref={releaseFileRef} type="file" className="hidden" onChange={handleReleaseAttachment} />
                </div>

                {/* Note */}
                <div className="space-y-1.5">
                  <Label>Note (optional)</Label>
                  <Textarea placeholder="Add a note about this payment..." value={releaseNote} onChange={(e) => setReleaseNote(e.target.value)} />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button className="bg-profit text-white hover:bg-profit/90" onClick={handleReleaseConfirm}>
                  <Send className="h-4 w-4 mr-1.5" /> Confirm & Send
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
