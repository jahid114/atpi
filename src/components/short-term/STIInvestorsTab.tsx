import { useMemo, useState, useRef } from "react";
import { Search, PlusCircle, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/use-pagination";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";
import { fmtWallet } from "@/types/wallet";
import type { ShortTermProject, STInvestorEntry } from "@/types/short-term";
import { fmt } from "@/types/short-term";

interface Props {
  project: ShortTermProject;
  onAddInvestor?: (data: { investorName: string; phone: string; email: string; amount: number; fundingSource: "direct" | "wallet"; date: string; attachment?: { name: string; url: string } }) => void;
}

export function STIInvestorsTab({ project, onAddInvestor }: Props) {
  const { investFromWallet, getWalletBalance } = useWallet();
  const [search, setSearch] = useState("");
  const [investMoreOpen, setInvestMoreOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<STInvestorEntry | null>(null);
  const [form, setForm] = useState({ amount: "", date: "" });
  const [fundingSource, setFundingSource] = useState<"direct" | "wallet">("direct");
  const [attachment, setAttachment] = useState<{ name: string; url: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const approved = useMemo(() => {
    return project.investors
      .filter((inv) => inv.status === "approved")
      .filter((inv) =>
        inv.investorName.toLowerCase().includes(search.toLowerCase()) ||
        inv.phone.toLowerCase().includes(search.toLowerCase()) ||
        inv.email.toLowerCase().includes(search.toLowerCase())
      );
  }, [project.investors, search]);

  const { paginatedItems, currentPage, totalPages, totalItems, goToPage, hasNextPage, hasPrevPage } = usePagination(approved);

  const totalFunded = approved.reduce((s, inv) => s + inv.amount, 0);

  const walletBalance = selectedInvestor ? getWalletBalance(selectedInvestor.email) : 0;

  const openInvestMore = (inv: STInvestorEntry) => {
    setSelectedInvestor(inv);
    setForm({ amount: "", date: "" });
    setFundingSource("direct");
    setAttachment(null);
    setInvestMoreOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachment({ name: file.name, url: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!selectedInvestor || !form.amount) {
      toast.error("Please fill all required fields.");
      return;
    }
    const amount = Number(form.amount);
    if (fundingSource === "wallet") {
      if (walletBalance < amount) {
        toast.error("Insufficient wallet balance.");
        return;
      }
      const success = investFromWallet(selectedInvestor.investorName, selectedInvestor.email, amount, "invest_sti", `Additional investment in ${project.name}`);
      if (!success) return;
    }
    onAddInvestor?.({
      investorName: selectedInvestor.investorName,
      phone: selectedInvestor.phone,
      email: selectedInvestor.email,
      amount,
      fundingSource,
      date: form.date || new Date().toISOString().split("T")[0],
      attachment: fundingSource === "direct" ? attachment || undefined : undefined,
    });
    setInvestMoreOpen(false);
    setSelectedInvestor(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search investors..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <p className="text-xs text-muted-foreground whitespace-nowrap">{approved.length} investor{approved.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm table-fixed min-w-[520px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-2 py-2 font-medium text-muted-foreground w-[30%]">Investor</th>
              <th className="text-left px-2 py-2 font-medium text-muted-foreground w-[20%]">Phone</th>
              <th className="text-right px-2 py-2 font-medium text-muted-foreground w-[18%]">Amount</th>
              <th className="text-left px-2 py-2 font-medium text-muted-foreground w-[14%]">Date</th>
              <th className="text-center px-2 py-2 font-medium text-muted-foreground w-[18%]">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-2 py-2">
                  <p className="font-medium text-foreground truncate">{inv.investorName}</p>
                  <p className="text-xs text-muted-foreground truncate">{inv.email}</p>
                </td>
                <td className="px-2 py-2 text-muted-foreground text-xs truncate">{inv.phone}</td>
                <td className="px-2 py-2 text-right font-medium text-foreground text-xs">{fmt(inv.amount)}</td>
                <td className="px-2 py-2 text-muted-foreground text-xs">{inv.date}</td>
                <td className="px-2 py-2 text-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-1.5 text-xs gap-1 text-primary hover:text-primary"
                    onClick={() => openInvestMore(inv)}
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Invest More
                  </Button>
                </td>
              </tr>
            ))}
            {paginatedItems.length === 0 && (
              <tr><td colSpan={5} className="px-2 py-6 text-center text-muted-foreground">No approved investors yet.</td></tr>
            )}
          </tbody>
          {approved.length > 0 && (
            <tfoot>
              <tr className="border-t border-border bg-muted/30">
                <td className="px-2 py-2 font-semibold text-foreground">Total</td>
                <td />
                <td className="px-2 py-2 text-right font-bold text-profit text-xs">{fmt(totalFunded)}</td>
                <td />
                <td />
              </tr>
            </tfoot>
          )}
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

      {/* Invest More Dialog */}
      <Dialog open={investMoreOpen} onOpenChange={setInvestMoreOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invest More</DialogTitle>
            <DialogDescription>Add additional investment for this investor.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Investor Name</Label>
              <Input value={selectedInvestor?.investorName || ""} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input value={selectedInvestor?.phone || ""} readOnly className="bg-muted/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount *</Label>
                <Input type="number" placeholder="50000" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Funding Source</Label>
              <Select value={fundingSource} onValueChange={(v) => setFundingSource(v as "direct" | "wallet")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct Investment</SelectItem>
                  <SelectItem value="wallet">From Wallet {walletBalance > 0 ? `(${fmtWallet(walletBalance)} available)` : "(No balance)"}</SelectItem>
                </SelectContent>
              </Select>
              {fundingSource === "wallet" && walletBalance > 0 && Number(form.amount) > walletBalance && (
                <p className="text-xs text-destructive">Amount exceeds wallet balance of {fmtWallet(walletBalance)}</p>
              )}
            </div>
            {fundingSource === "direct" && (
              <div className="space-y-1.5">
                <Label>Attachment</Label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                  {attachment ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                      <Paperclip className="h-4 w-4" />
                      {attachment.name}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Paperclip className="h-5 w-5" />
                      <p className="text-xs">Click to attach a file</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
