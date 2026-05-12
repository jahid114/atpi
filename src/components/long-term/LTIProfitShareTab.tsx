import { useState, useMemo, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Filter, Search, CheckCircle2, Clock, Send, ArrowDownCircle, ArrowUpCircle, Wallet, Landmark, Smartphone, Paperclip, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { BankAccount, MobileBankingAccount } from "@/types/accounts";
import {
  calculateInvestorShare,
  calcTimeWeightedBalance,
  calcWeightSegments,
  fmt,
  TODAY,
} from "@/lib/investor-utils";
import { generateLTIInvoice } from "@/lib/lti-pdf";
import { useLTI } from "@/contexts/LTIContext";
import { useWallet } from "@/contexts/WalletContext";

// Mock bank/mobile accounts per investor (until real backend wires them up)
const MOBILE_PROVIDERS: MobileBankingAccount["provider"][] = ["bKash", "Nagad", "Rocket"];
const BANKS = ["Dutch-Bangla Bank", "BRAC Bank", "City Bank", "Eastern Bank"];
function getInvestorAccounts(inv: Investor): { bank: BankAccount | null; mobiles: MobileBankingAccount[] } {
  const bank: BankAccount = {
    id: inv.id,
    bankName: BANKS[inv.id % BANKS.length],
    accountName: inv.name,
    accountNumber: String(1000000000000 + inv.id * 12345).slice(0, 13),
    branchName: "Main Branch",
    routingNumber: String(90000000 + inv.id * 31).slice(0, 9),
  };
  const mobiles: MobileBankingAccount[] = [
    {
      id: inv.id * 10 + 1,
      provider: MOBILE_PROVIDERS[inv.id % MOBILE_PROVIDERS.length],
      accountNumber: "017" + String(10000000 + inv.id * 9173).slice(0, 8),
      accountName: inv.name,
    },
  ];
  if (inv.id % 2 === 0) {
    mobiles.push({
      id: inv.id * 10 + 2,
      provider: MOBILE_PROVIDERS[(inv.id + 1) % MOBILE_PROVIDERS.length],
      accountNumber: "018" + String(10000000 + inv.id * 4719).slice(0, 8),
      accountName: inv.name,
    });
  }
  return { bank, mobiles };
}

interface Props {
  investors: Investor[];
  profit: number;
  selectedYear: number;
}

export function LTIProfitShareTab({ investors, profit, selectedYear }: Props) {
  const { handleRelease } = useLTI();
  const { returnToWallet } = useWallet();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [confirmInvestorId, setConfirmInvestorId] = useState<number | null>(null);
  const [destination, setDestination] = useState<string>("wallet");
  const [attachment, setAttachment] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

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

  const performDistribute = useCallback((row: typeof rows[number], dest: string) => {
    if (row.distributed) return;
    if (row.projectedShare <= 0) {
      toast.error("No profit to distribute for this investor.");
      return;
    }
    handleRelease(row.investor.id);
    if (dest === "wallet") {
      returnToWallet(
        row.investor.name,
        row.investor.email,
        row.projectedShare,
        `LTI profit payout · ${selectedYear}`
      );
    }
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
  }, [handleRelease, returnToWallet, selectedYear, profit]);

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

  const accounts = useMemo(
    () => (confirmRow ? getInvestorAccounts(confirmRow.investor) : { bank: null, mobiles: [] }),
    [confirmRow]
  );

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAttachment(file.name);
  };

  const resetModal = () => {
    setConfirmInvestorId(null);
    setDestination("wallet");
    setAttachment("");
    setNote("");
  };

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
                    <p className="text-xs text-muted-foreground">{r.investor.email}</p>
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
      <Dialog open={!!confirmRow} onOpenChange={(o) => !o && resetModal()}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl w-fit max-w-[95vw]">
          {confirmRow && (
            <>
              <DialogHeader>
                <DialogTitle>Distribute Profit · {confirmRow.investor.name}</DialogTitle>
              </DialogHeader>

              <div className="border border-border rounded-lg mt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Event</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Period</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Days</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Balance</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segmentBreakdown.length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">No active segments in {selectedYear}.</td></tr>
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
                        <td className="px-3 py-2 text-right font-medium text-profit">{fmt(s.share)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/40 font-medium">
                      <td colSpan={4} className="px-3 py-2 text-right text-muted-foreground">Total Share</td>
                      <td className="px-3 py-2 text-right text-profit">{fmt(totalSegShare)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payout destination */}
              <div className="space-y-2">
                <Label>Payout Destination</Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wallet">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-primary" />
                        <span>Wallet</span>
                      </div>
                    </SelectItem>
                    {accounts.bank && (
                      <SelectItem value={`bank-${accounts.bank.id}`}>
                        <div className="flex items-center gap-2">
                          <Landmark className="h-4 w-4 text-primary" />
                          <span>{accounts.bank.bankName} · ••••{accounts.bank.accountNumber.slice(-4)}</span>
                        </div>
                      </SelectItem>
                    )}
                    {accounts.mobiles.map((m) => (
                      <SelectItem key={m.id} value={`mobile-${m.id}`}>
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-primary" />
                          <span>{m.provider} · {m.accountNumber}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Selected account details */}
                {destination === "wallet" && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                    Profit will be credited to <span className="font-medium text-foreground">{confirmRow.investor.name}</span>'s wallet balance.
                  </div>
                )}
                {destination.startsWith("bank-") && accounts.bank && (
                  <div className="bg-muted/50 rounded-lg p-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Account Holder</p>
                      <p className="text-sm font-medium text-foreground">{accounts.bank.accountName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Bank</p>
                      <p className="text-sm font-medium text-foreground">{accounts.bank.bankName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Account Number</p>
                      <p className="text-sm font-medium text-foreground font-mono">{accounts.bank.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Routing</p>
                      <p className="text-sm font-medium text-foreground font-mono">{accounts.bank.routingNumber}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Branch</p>
                      <p className="text-sm font-medium text-foreground">{accounts.bank.branchName}</p>
                    </div>
                  </div>
                )}
                {destination.startsWith("mobile-") && (() => {
                  const m = accounts.mobiles.find((x) => `mobile-${x.id}` === destination);
                  if (!m) return null;
                  return (
                    <div className="bg-muted/50 rounded-lg p-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Provider</p>
                        <p className="text-sm font-medium text-foreground">{m.provider}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Account Holder</p>
                        <p className="text-sm font-medium text-foreground">{m.accountName}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Account Number</p>
                        <p className="text-sm font-medium text-foreground font-mono">{m.accountNumber}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Attachment — only for bank / mobile banking payouts */}
              {destination !== "wallet" && (
              <div className="space-y-1.5">
                <Label>Payment Proof / Attachment <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                  {attachment ? (
                    <div className="flex items-center justify-center gap-2 text-foreground">
                      <Paperclip className="h-4 w-4" />
                      <span className="text-sm font-medium">{attachment}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Upload className="h-5 w-5" />
                      <p className="text-sm">Click to upload payment proof</p>
                      <p className="text-xs">PDF, Image, or Document</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" className="hidden" onChange={handleAttachment} />
              </div>
              )}

              {/* Note */}
              <div className="space-y-1.5">
                <Label>Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  placeholder="Add a note about this payment..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={resetModal}>Cancel</Button>
                <Button
                  className="gap-1.5"
                  onClick={() => {
                    performDistribute(confirmRow, destination);
                    resetModal();
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
