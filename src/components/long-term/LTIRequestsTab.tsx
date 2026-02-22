import { useMemo, useState } from "react";
import { CheckCircle, XCircle, Clock, UserPlus, Eye, Wallet, User, Mail, Phone, Calendar, DollarSign, Heart, CreditCard, Shirt, Users, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Investor, InvestorStatus, NomineeInfo } from "@/types/investor";
import { fmt } from "@/lib/investor-utils";
import { useWallet } from "@/contexts/WalletContext";
import { fmtWallet } from "@/types/wallet";

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  invested: number;
  investmentDate: string;
  shares: number;
  bloodGroup: string;
  nidNumber: string;
  jerseySize: string;
  nominee: NomineeInfo;
}

interface Props {
  investors: Investor[];
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onRegister: (data: RegisterData) => void;
}

const emptyForm = {
  name: "", email: "", phone: "", invested: "", investmentDate: "",
  shares: "", bloodGroup: "", nidNumber: "", jerseySize: "",
  nomineeName: "", nomineeRelationship: "", nomineePhone: "", nomineeNid: "",
};

export function LTIRequestsTab({ investors, onApprove, onReject, onRegister }: Props) {
  const { investFromWallet, getWalletBalance } = useWallet();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [fundingSource, setFundingSource] = useState<"direct" | "wallet">("direct");
  const [reviewInvestor, setReviewInvestor] = useState<Investor | null>(null);

  const pendingInvestors = useMemo(() => investors.filter((i) => i.status === "pending"), [investors]);
  const rejectedInvestors = useMemo(() => investors.filter((i) => i.status === "rejected"), [investors]);

  const walletBalance = form.email ? getWalletBalance(form.email) : 0;
  const reviewWalletBalance = reviewInvestor ? getWalletBalance(reviewInvestor.email) : 0;

  const handleRegister = () => {
    if (!form.name || !form.email || !form.invested || !form.investmentDate || !form.shares || !form.nidNumber) {
      toast.error("Please fill all required fields.");
      return;
    }
    const amount = Number(form.invested);
    if (fundingSource === "wallet") {
      const success = investFromWallet(form.name, form.email, amount, "invest_lti", "Long-term investment from wallet");
      if (!success) return;
    }
    onRegister({
      name: form.name,
      email: form.email,
      phone: form.phone,
      invested: amount,
      investmentDate: form.investmentDate,
      shares: Number(form.shares),
      bloodGroup: form.bloodGroup,
      nidNumber: form.nidNumber,
      jerseySize: form.jerseySize,
      nominee: {
        name: form.nomineeName,
        relationship: form.nomineeRelationship,
        phone: form.nomineePhone,
        nidNumber: form.nomineeNid,
      },
    });
    setForm(emptyForm);
    setFundingSource("direct");
    setRegisterOpen(false);
  };

  const handleReviewApprove = () => {
    if (!reviewInvestor) return;
    onApprove(reviewInvestor.id);
    setReviewInvestor(null);
  };

  const handleReviewReject = () => {
    if (!reviewInvestor) return;
    onReject(reviewInvestor.id);
    setReviewInvestor(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{pendingInvestors.length} pending request{pendingInvestors.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setRegisterOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Register Investor
        </Button>
      </div>

      {/* Pending requests */}
      {pendingInvestors.length > 0 ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden kpi-shadow">
          <div className="px-4 py-3 border-b border-border bg-muted/50">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" /> Pending Requests
            </p>
          </div>
          <div className="divide-y divide-border">
            {pendingInvestors.map((inv) => (
              <div key={inv.id} className="px-4 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{inv.name}</p>
                  <p className="text-xs text-muted-foreground">{inv.email} · {inv.phone || "No phone"}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Shares: <span className="font-medium text-foreground">{inv.shares || 0}</span></span>
                    <span>Amount: <span className="font-medium text-foreground">{fmt(inv.invested)}</span></span>
                    <span>Date: <span className="font-medium text-foreground">{inv.investmentDate}</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setReviewInvestor(inv)}>
                    <Eye className="h-4 w-4 mr-1" /> Review
                  </Button>
                  <Button size="sm" variant="outline" className="text-profit border-profit/30 hover:bg-profit/10 hover:text-profit" onClick={() => onApprove(inv.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive" onClick={() => onReject(inv.id)}>
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-8 text-center kpi-shadow">
          <CheckCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No pending requests. All caught up!</p>
        </div>
      )}

      {/* Rejected */}
      {rejectedInvestors.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden kpi-shadow">
          <div className="px-4 py-3 border-b border-border bg-muted/50">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" /> Rejected ({rejectedInvestors.length})
            </p>
          </div>
          <div className="divide-y divide-border">
            {rejectedInvestors.map((inv) => (
              <div key={inv.id} className="px-4 py-3 flex items-center justify-between opacity-60">
                <div>
                  <p className="font-medium text-foreground">{inv.name}</p>
                  <p className="text-xs text-muted-foreground">{inv.email} · {fmt(inv.invested)}</p>
                </div>
                <Badge variant="destructive" className="text-[11px]">Rejected</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Register Dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Investor</DialogTitle>
            <DialogDescription>Submit investor details for review. They will remain in "Pending" status until approved.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Personal Info */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Personal Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-name">Full Name *</Label>
                  <Input id="reg-name" placeholder="e.g. John Doe" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email">Email *</Label>
                  <Input id="reg-email" type="email" placeholder="john@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-phone">Phone</Label>
                  <Input id="reg-phone" placeholder="+1 555-0000" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-nid">NID Number *</Label>
                  <Input id="reg-nid" placeholder="e.g. 1234567890" value={form.nidNumber} onChange={(e) => setForm((f) => ({ ...f, nidNumber: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-blood">Blood Group</Label>
                  <Select value={form.bloodGroup} onValueChange={(v) => setForm((f) => ({ ...f, bloodGroup: v }))}>
                    <SelectTrigger id="reg-blood"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-jersey">Jersey Size</Label>
                  <Select value={form.jerseySize} onValueChange={(v) => setForm((f) => ({ ...f, jerseySize: v }))}>
                    <SelectTrigger id="reg-jersey"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Investment Info */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Investment Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-shares">Number of Shares *</Label>
                  <Input id="reg-shares" type="number" placeholder="e.g. 10" value={form.shares} onChange={(e) => setForm((f) => ({ ...f, shares: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-amount">Investment Amount *</Label>
                  <Input id="reg-amount" type="number" placeholder="100000" value={form.invested} onChange={(e) => setForm((f) => ({ ...f, invested: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-date">Investment Date *</Label>
                  <Input id="reg-date" type="date" value={form.investmentDate} onChange={(e) => setForm((f) => ({ ...f, investmentDate: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Funding Source</Label>
                  <Select value={fundingSource} onValueChange={(v) => setFundingSource(v as "direct" | "wallet")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct Investment</SelectItem>
                      <SelectItem value="wallet">From Wallet {walletBalance > 0 ? `(${fmtWallet(walletBalance)} available)` : "(No balance)"}</SelectItem>
                    </SelectContent>
                  </Select>
                  {fundingSource === "wallet" && walletBalance > 0 && Number(form.invested) > walletBalance && (
                    <p className="text-xs text-destructive">Amount exceeds wallet balance of {fmtWallet(walletBalance)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Nominee Info */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Nominee Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-nominee-name">Nominee Name</Label>
                  <Input id="reg-nominee-name" placeholder="e.g. Jane Doe" value={form.nomineeName} onChange={(e) => setForm((f) => ({ ...f, nomineeName: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-nominee-rel">Relationship</Label>
                  <Input id="reg-nominee-rel" placeholder="e.g. Spouse, Parent" value={form.nomineeRelationship} onChange={(e) => setForm((f) => ({ ...f, nomineeRelationship: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-nominee-phone">Nominee Phone</Label>
                  <Input id="reg-nominee-phone" placeholder="+1 555-0000" value={form.nomineePhone} onChange={(e) => setForm((f) => ({ ...f, nomineePhone: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-nominee-nid">Nominee NID</Label>
                  <Input id="reg-nominee-nid" placeholder="e.g. 9876543210" value={form.nomineeNid} onChange={(e) => setForm((f) => ({ ...f, nomineeNid: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleRegister}>Submit for Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Detail Dialog */}
      <Dialog open={!!reviewInvestor} onOpenChange={(open) => !open && setReviewInvestor(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          {reviewInvestor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" /> Review Investment Request
                </DialogTitle>
                <DialogDescription>Review all details before approving or rejecting this request.</DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Investor Profile */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Investor Profile</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2.5">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Name</p>
                        <p className="text-sm font-medium text-foreground">{reviewInvestor.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</p>
                        <p className="text-sm font-medium text-foreground">{reviewInvestor.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium text-foreground">{reviewInvestor.phone || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">NID Number</p>
                        <p className="text-sm font-medium text-foreground">{reviewInvestor.nidNumber || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Heart className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Blood Group</p>
                        <p className="text-sm font-medium text-foreground">{reviewInvestor.bloodGroup || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Shirt className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Jersey Size</p>
                        <p className="text-sm font-medium text-foreground">{reviewInvestor.jerseySize || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investment Details */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Investment Details</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-card border border-border rounded-lg p-3 text-center">
                      <Hash className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Shares</p>
                      <p className="text-lg font-bold text-foreground mt-0.5">{reviewInvestor.shares || 0}</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-3 text-center">
                      <DollarSign className="h-5 w-5 text-profit mx-auto mb-1" />
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Requested Amount</p>
                      <p className="text-lg font-bold text-foreground mt-0.5">{fmt(reviewInvestor.invested)}</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-3 text-center">
                      <Wallet className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Wallet Balance</p>
                      <p className="text-lg font-bold text-foreground mt-0.5">{fmtWallet(reviewWalletBalance)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 mt-2">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Investment Date</p>
                      <p className="text-sm font-medium text-foreground">{reviewInvestor.investmentDate}</p>
                    </div>
                  </div>
                </div>

                {/* Nominee Information */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nominee Information</p>
                  {reviewInvestor.nominee?.name ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2.5">
                        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Name</p>
                          <p className="text-sm font-medium text-foreground">{reviewInvestor.nominee.name}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Relationship</p>
                        <p className="text-sm font-medium text-foreground">{reviewInvestor.nominee.relationship || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium text-foreground">{reviewInvestor.nominee.phone || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">NID</p>
                        <p className="text-sm font-medium text-foreground">{reviewInvestor.nominee.nidNumber || "N/A"}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No nominee information provided.</p>
                  )}
                </div>

                {/* Existing History */}
                {reviewInvestor.history.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Previous History</p>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border">
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Date</th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Type</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">Amount</th>
                            <th className="text-center px-3 py-2 font-medium text-muted-foreground text-xs">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reviewInvestor.history.map((h) => (
                            <tr key={h.id} className="border-b border-border last:border-0">
                              <td className="px-3 py-2 text-xs text-muted-foreground">{h.date}</td>
                              <td className="px-3 py-2 text-xs text-foreground capitalize">{h.type}</td>
                              <td className={`px-3 py-2 text-right text-xs font-medium ${h.type === "withdrawal" ? "text-destructive" : "text-profit"}`}>
                                {h.type === "withdrawal" ? "-" : "+"}{fmt(h.amount)}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <Badge variant={h.status === "approved" ? "default" : h.status === "rejected" ? "destructive" : "secondary"} className="text-[10px]">
                                  {h.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center gap-2 px-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Current Status:</span>
                  <Badge variant="secondary" className="text-xs">Pending</Badge>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
                <Button
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleReviewReject}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button
                  className="bg-profit text-white hover:bg-profit/90"
                  onClick={handleReviewApprove}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
