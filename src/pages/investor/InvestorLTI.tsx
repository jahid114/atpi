import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/KpiCard";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/use-pagination";
import {
  BarChart3, ShoppingCart, ArrowLeftRight, DollarSign, TrendingUp,
  CheckCircle, Clock, XCircle, ArrowDownCircle, UserPlus, Layers
} from "lucide-react";
import type { Investor, InvestmentEntry, InvestmentStatus, NomineeInfo } from "@/types/investor";
import { calculateInvestorShare, fmt } from "@/lib/investor-utils";
import { useLTI } from "@/contexts/LTIContext";

const SHARE_PRICE = 10000;

const CURRENT_USER = {
  name: "Alice Johnson",
  email: "alice@example.com",
  phone: "+8801711111111",
};

type InvestorLTIStatus = "not_registered" | "pending" | "approved" | "rejected";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

const txTypeLabels: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  payout: "Profit Payout",
};

export default function InvestorLTI() {
  const { investors, profit, handleSelfRegister, handleBuyShares, handleWithdraw: ctxWithdraw } = useLTI();

  // Find investor from shared context by email
  const investor = useMemo(
    () => investors.find((i) => i.email === CURRENT_USER.email) || null,
    [investors]
  );

  const [regDialogOpen, setRegDialogOpen] = useState(false);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);

  // Registration form
  const [regShares, setRegShares] = useState("");
  const [regBloodGroup, setRegBloodGroup] = useState("");
  const [regNidNumber, setRegNidNumber] = useState("");
  const [regJerseySize, setRegJerseySize] = useState("");
  const [regNomineeName, setRegNomineeName] = useState("");
  const [regNomineeRelation, setRegNomineeRelation] = useState("");
  const [regNomineePhone, setRegNomineePhone] = useState("");
  const [regNomineeNid, setRegNomineeNid] = useState("");

  // Buy shares
  const [buyShares, setBuyShares] = useState("");

  // Withdraw
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Transaction filter
  const [txFilter, setTxFilter] = useState<"all" | InvestmentStatus>("all");

  const myStatus: InvestorLTIStatus = investor ? investor.status : "not_registered";
  const isApproved = myStatus === "approved";

  const profitShare = useMemo(() => {
    if (!investor || !isApproved) return 0;
    return Math.round(calculateInvestorShare(investor, profit, investors));
  }, [investor, isApproved, profit, investors]);

  const totalPayouts = useMemo(() => {
    if (!investor) return 0;
    return investor.history
      .filter((h) => h.type === "payout" && h.status === "approved")
      .reduce((s, h) => s + h.amount, 0);
  }, [investor]);

  const transactions = useMemo(() => {
    if (!investor) return [];
    let txs = [...investor.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (txFilter !== "all") txs = txs.filter((t) => t.status === txFilter);
    return txs;
  }, [investor, txFilter]);

  const pagination = usePagination(transactions, { pageSize: 8 });

  const handleRegister = () => {
    const shares = parseInt(regShares);
    if (!shares || shares < 1) { toast.error("Enter at least 1 share."); return; }
    if (!regNidNumber.trim()) { toast.error("NID number is required."); return; }
    if (!regNomineeName.trim()) { toast.error("Nominee name is required."); return; }

    const newInvestor: Investor = {
      id: Date.now(),
      name: CURRENT_USER.name,
      email: CURRENT_USER.email,
      phone: CURRENT_USER.phone,
      invested: shares * SHARE_PRICE,
      investmentDate: new Date().toISOString().split("T")[0],
      status: "pending",
      shares,
      bloodGroup: regBloodGroup,
      nidNumber: regNidNumber,
      jerseySize: regJerseySize,
      nominee: { name: regNomineeName, relationship: regNomineeRelation, phone: regNomineePhone, nidNumber: regNomineeNid },
      fundingSource: "wallet",
      history: [{ id: Date.now() + 1, date: new Date().toISOString().split("T")[0], amount: shares * SHARE_PRICE, type: "deposit", status: "pending" }],
    };
    handleSelfRegister(newInvestor);
    setRegDialogOpen(false);
    toast.success("Registration submitted! Awaiting admin approval.");
  };

  const handleBuySharesSubmit = () => {
    const shares = parseInt(buyShares);
    if (!shares || shares < 1) { toast.error("Enter at least 1 share."); return; }
    if (!investor) return;

    handleBuyShares(investor.id, shares, shares * SHARE_PRICE);
    setBuyDialogOpen(false);
    setBuyShares("");
    toast.success(`Request to buy ${shares} share(s) submitted. Awaiting approval.`);
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount."); return; }
    if (!investor) return;
    if (amount > investor.invested) { toast.error("Amount exceeds your invested principal."); return; }

    ctxWithdraw(investor.id, amount);
    setWithdrawDialogOpen(false);
    setWithdrawAmount("");
    toast.success("Withdrawal request submitted. Funds will be returned to your wallet upon approval.");
  };

  const getStatusIcon = (status: InvestmentStatus) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-3.5 w-3.5" />;
      case "pending": return <Clock className="h-3.5 w-3.5" />;
      case "rejected": return <XCircle className="h-3.5 w-3.5" />;
    }
  };

  // ---- NOT REGISTERED STATE ----
  if (myStatus === "not_registered") {
    return (
      <div className="space-y-6 xl:space-y-8">
        <div>
          <h1 className="text-2xl xl:text-3xl font-bold text-foreground">Long-Term Investment</h1>
          <p className="text-sm text-muted-foreground mt-1">Invest in long-term shares and earn pro-rata profit</p>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <UserPlus className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-xl">Register as an LTI Investor</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              You haven't registered for long-term investment yet. Register to start buying shares and earning profit.
            </p>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => setRegDialogOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" /> Register Now
            </Button>
          </CardContent>
        </Card>

        <RegistrationDialog
          open={regDialogOpen}
          onOpenChange={setRegDialogOpen}
          sharePrice={SHARE_PRICE}
          shares={regShares} setShares={setRegShares}
          bloodGroup={regBloodGroup} setBloodGroup={setRegBloodGroup}
          nidNumber={regNidNumber} setNidNumber={setRegNidNumber}
          jerseySize={regJerseySize} setJerseySize={setRegJerseySize}
          nomineeName={regNomineeName} setNomineeName={setRegNomineeName}
          nomineeRelation={regNomineeRelation} setNomineeRelation={setRegNomineeRelation}
          nomineePhone={regNomineePhone} setNomineePhone={setRegNomineePhone}
          nomineeNid={regNomineeNid} setNomineeNid={setRegNomineeNid}
          onSubmit={handleRegister}
        />
      </div>
    );
  }

  // ---- PENDING / REJECTED STATE ----
  if (myStatus === "pending" || myStatus === "rejected") {
    const conf = statusConfig[myStatus];
    return (
      <div className="space-y-6 xl:space-y-8">
        <div>
          <h1 className="text-2xl xl:text-3xl font-bold text-foreground">Long-Term Investment</h1>
          <p className="text-sm text-muted-foreground mt-1">Invest in long-term shares and earn pro-rata profit</p>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
              {myStatus === "pending" ? <Clock className="h-7 w-7 text-muted-foreground" /> : <XCircle className="h-7 w-7 text-destructive" />}
            </div>
            <CardTitle className="text-xl">
              {myStatus === "pending" ? "Registration Pending" : "Registration Rejected"}
            </CardTitle>
            <Badge variant={conf.variant} className="mx-auto mt-2">{conf.label}</Badge>
            <p className="text-sm text-muted-foreground mt-3">
              {myStatus === "pending"
                ? "Your registration is being reviewed by admin. You'll be notified once approved."
                : "Your registration was not approved. Please contact admin for more information."}
            </p>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Shares Requested</span><span className="font-medium text-foreground">{investor?.shares}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-medium text-foreground">{fmt(investor?.invested || 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium text-foreground">{investor?.investmentDate}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- APPROVED STATE (full dashboard) ----
  return (
    <div className="space-y-6 xl:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl xl:text-3xl font-bold text-foreground">Long-Term Investment</h1>
          <p className="text-sm text-muted-foreground mt-1">Your investment portfolio · Pro-rata profit sharing</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setBuyDialogOpen(true)} className="gap-2">
            <ShoppingCart className="h-4 w-4" /> Buy More Shares
          </Button>
          <Button variant="outline" onClick={() => setWithdrawDialogOpen(true)} className="gap-2">
            <ArrowDownCircle className="h-4 w-4" /> Withdraw to Wallet
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1.5 text-xs sm:text-sm">
            <ArrowLeftRight className="h-4 w-4" /> Transactions
          </TabsTrigger>
          <TabsTrigger value="profit" className="gap-1.5 text-xs sm:text-sm">
            <DollarSign className="h-4 w-4" /> Profit Share
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard title="My Shares" value={String(investor?.shares || 0)} icon={<Layers className="h-5 w-5 text-white" />} accentColor="bg-[hsl(var(--kpi-blue))]" />
              <KpiCard title="Total Invested" value={fmt(investor?.invested || 0)} icon={<TrendingUp className="h-5 w-5 text-white" />} accentColor="bg-[hsl(var(--kpi-emerald))]" />
              <KpiCard title="Projected Profit" value={fmt(profitShare)} icon={<DollarSign className="h-5 w-5 text-white" />} accentColor="bg-[hsl(var(--kpi-amber))]" />
              <KpiCard title="Total Payouts" value={fmt(totalPayouts)} icon={<CheckCircle className="h-5 w-5 text-white" />} accentColor="bg-[hsl(var(--kpi-slate))]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Investment Details</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><Badge variant="default">Approved</Badge></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shares Held</span><span className="font-medium text-foreground">{investor?.shares}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Share Price</span><span className="font-medium text-foreground">{fmt(SHARE_PRICE)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Principal Invested</span><span className="font-medium text-foreground">{fmt(investor?.invested || 0)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Investment Date</span><span className="font-medium text-foreground">{investor?.investmentDate}</span></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Nominee Information</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Name</span><span className="font-medium text-foreground">{investor?.nominee?.name || "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Relationship</span><span className="font-medium text-foreground">{investor?.nominee?.relationship || "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Phone</span><span className="font-medium text-foreground">{investor?.nominee?.phone || "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">NID</span><span className="font-medium text-foreground">{investor?.nominee?.nidNumber || "—"}</span></div>
                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>

        {/* TRANSACTIONS TAB */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Transaction History</CardTitle>
              <Select value={txFilter} onValueChange={(v) => setTxFilter(v as typeof txFilter)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.paginatedItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No transactions found.</TableCell>
                      </TableRow>
                    ) : (
                      pagination.paginatedItems.map((tx) => {
                        const isInflow = tx.type === "payout";
                        const isOutflow = tx.type === "withdrawal";
                        return (
                          <TableRow key={tx.id}>
                            <TableCell className="whitespace-nowrap">{tx.date}</TableCell>
                            <TableCell className="font-medium">{txTypeLabels[tx.type] || tx.type}</TableCell>
                            <TableCell className={`text-right font-medium ${isInflow ? "text-profit" : isOutflow ? "text-destructive" : "text-foreground"}`}>
                              {isInflow ? "+" : isOutflow ? "-" : ""}{fmt(tx.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusConfig[tx.status]?.variant || "outline"} className="gap-1 text-xs">
                                {getStatusIcon(tx.status)}
                                {statusConfig[tx.status]?.label || tx.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.goToPage}
                totalItems={transactions.length}
                hasNextPage={pagination.hasNextPage}
                hasPrevPage={pagination.hasPrevPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROFIT SHARE TAB */}
        <TabsContent value="profit">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Projected Profit Share</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{fmt(profitShare)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Based on time-weighted pro-rata calculation</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Payouts Received</p>
                  <p className="text-2xl font-bold text-profit mt-1">{fmt(totalPayouts)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Credited to your wallet</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your Weight</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{investor?.shares} shares</p>
                  <p className="text-xs text-muted-foreground mt-1">Principal: {fmt(investor?.invested || 0)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Payout History</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investor?.history.filter((h) => h.type === "payout").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No payouts yet. Profit will be distributed by admin.</TableCell>
                      </TableRow>
                    ) : (
                      investor?.history.filter((h) => h.type === "payout").map((h) => (
                        <TableRow key={h.id}>
                          <TableCell>{h.date}</TableCell>
                          <TableCell className="text-right font-medium text-profit">+{fmt(h.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={statusConfig[h.status]?.variant || "outline"} className="gap-1 text-xs">
                              {getStatusIcon(h.status)}
                              {statusConfig[h.status]?.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground">
                <strong>How profit sharing works:</strong> Your share of the profit is calculated using a time-weighted pro-rata method.
                The longer your capital is invested and the more shares you hold, the larger your share. Profit is distributed by admin at the end of each period.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Buy Shares Dialog */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Buy More Shares</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Share price: <span className="font-semibold text-foreground">{fmt(SHARE_PRICE)}</span></p>
            <div className="space-y-2">
              <Label>Number of Shares</Label>
              <Input type="number" min={1} placeholder="Enter shares" value={buyShares} onChange={(e) => setBuyShares(e.target.value)} />
              {buyShares && parseInt(buyShares) > 0 && (
                <p className="text-sm text-muted-foreground">Total cost: <span className="font-semibold text-foreground">{fmt(parseInt(buyShares) * SHARE_PRICE)}</span></p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleBuySharesSubmit}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Withdraw to Wallet</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Current principal: <span className="font-semibold text-foreground">{fmt(investor?.invested || 0)}</span>
            </p>
            <div className="space-y-2">
              <Label>Amount to Withdraw</Label>
              <Input type="number" placeholder="Enter amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">Withdrawn amount will be returned to your wallet upon admin approval.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleWithdraw}>Submit Withdrawal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Registration Dialog Component ----
function RegistrationDialog({
  open, onOpenChange, sharePrice, shares, setShares,
  bloodGroup, setBloodGroup, nidNumber, setNidNumber, jerseySize, setJerseySize,
  nomineeName, setNomineeName, nomineeRelation, setNomineeRelation,
  nomineePhone, setNomineePhone, nomineeNid, setNomineeNid, onSubmit,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; sharePrice: number;
  shares: string; setShares: (v: string) => void;
  bloodGroup: string; setBloodGroup: (v: string) => void;
  nidNumber: string; setNidNumber: (v: string) => void;
  jerseySize: string; setJerseySize: (v: string) => void;
  nomineeName: string; setNomineeName: (v: string) => void;
  nomineeRelation: string; setNomineeRelation: (v: string) => void;
  nomineePhone: string; setNomineePhone: (v: string) => void;
  nomineeNid: string; setNomineeNid: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register as LTI Investor</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Investment</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Number of Shares <span className="text-destructive">*</span></Label>
                <Input type="number" min={1} placeholder="e.g. 10" value={shares} onChange={(e) => setShares(e.target.value)} />
                {shares && parseInt(shares) > 0 && (
                  <p className="text-sm text-muted-foreground">Investment amount: <span className="font-semibold text-foreground">{fmt(parseInt(shares) * sharePrice)}</span> ({fmt(sharePrice)}/share)</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Personal Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>NID Number <span className="text-destructive">*</span></Label>
                <Input placeholder="National ID" value={nidNumber} onChange={(e) => setNidNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Select value={bloodGroup} onValueChange={setBloodGroup}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jersey Size</Label>
                <Select value={jerseySize} onValueChange={setJerseySize}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Nominee Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nominee Name <span className="text-destructive">*</span></Label>
                <Input placeholder="Full name" value={nomineeName} onChange={(e) => setNomineeName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Input placeholder="e.g. Spouse" value={nomineeRelation} onChange={(e) => setNomineeRelation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="Phone number" value={nomineePhone} onChange={(e) => setNomineePhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>NID Number</Label>
                <Input placeholder="Nominee NID" value={nomineeNid} onChange={(e) => setNomineeNid(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit}>Submit Registration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
