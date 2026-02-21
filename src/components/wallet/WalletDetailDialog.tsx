import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, WalletIcon, TrendingUp, TrendingDown, Activity } from "lucide-react";
import type { InvestorWallet } from "@/types/wallet";
import { fmtWallet, walletTxTypeConfig, walletTxStatusConfig } from "@/types/wallet";

interface WalletDetailDialogProps {
  wallet: InvestorWallet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WalletDetailDialog({ wallet, open, onOpenChange }: WalletDetailDialogProps) {
  const analytics = useMemo(() => {
    if (!wallet) return { topUps: [], investments: [], pending: [], rejected: [], ltiSpent: 0, stiSpent: 0 };
    const txs = wallet.transactions;
    const approved = txs.filter((t) => t.status === "approved");
    const topUps = approved.filter((t) => t.type === "top_up");
    const investments = approved.filter((t) => t.type !== "top_up");
    const pending = txs.filter((t) => t.status === "pending");
    const rejected = txs.filter((t) => t.status === "rejected");
    const ltiSpent = investments.filter((t) => t.type === "invest_lti").reduce((s, t) => s + t.amount, 0);
    const stiSpent = investments.filter((t) => t.type === "invest_sti").reduce((s, t) => s + t.amount, 0);
    return { topUps, investments, pending, rejected, ltiSpent, stiSpent };
  }, [wallet]);

  const sortedTxs = useMemo(() => wallet ? [...wallet.transactions].sort((a, b) => b.date.localeCompare(a.date)) : [], [wallet]);

  if (!wallet) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5 text-primary" />
            {wallet.investorName}
          </DialogTitle>
          <DialogDescription>{wallet.email}</DialogDescription>
        </DialogHeader>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto text-profit mb-1" />
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Balance</p>
            <p className="text-lg font-bold text-profit">{fmtWallet(wallet.balance)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <ArrowUpCircle className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Top-Ups</p>
            <p className="text-lg font-bold text-foreground">{fmtWallet(wallet.totalTopUps)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <TrendingDown className="h-4 w-4 mx-auto text-destructive mb-1" />
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Spent</p>
            <p className="text-lg font-bold text-foreground">{fmtWallet(wallet.totalSpent)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Activity className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pending</p>
            <p className="text-lg font-bold text-foreground">{analytics.pending.length}</p>
          </div>
        </div>

        {/* Investment Breakdown */}
        {(analytics.ltiSpent > 0 || analytics.stiSpent > 0) && (
          <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Investment Breakdown</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Long-Term (LTI)</span>
              <span className="font-medium text-foreground">{fmtWallet(analytics.ltiSpent)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Short-Term (STI)</span>
              <span className="font-medium text-foreground">{fmtWallet(analytics.stiSpent)}</span>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Transaction History ({wallet.transactions.length})
          </p>
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
              {sortedTxs.map((tx) => {
                const typeConf = walletTxTypeConfig[tx.type];
                const statusConf = walletTxStatusConfig[tx.status];
                return (
                  <div key={tx.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`shrink-0 ${typeConf.color}`}>
                        {tx.type === "top_up" ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{tx.date} · {typeConf.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-sm font-semibold ${tx.type === "top_up" ? "text-profit" : "text-foreground"}`}>
                        {tx.type === "top_up" ? "+" : "-"}{fmtWallet(tx.amount)}
                      </span>
                      <Badge variant={statusConf.variant} className="text-[11px]">{statusConf.label}</Badge>
                    </div>
                  </div>
                );
              })}
              {sortedTxs.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">No transactions yet.</div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
