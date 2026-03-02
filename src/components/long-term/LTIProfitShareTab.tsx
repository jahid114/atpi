import { useState, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, FileText, Download, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Investor } from "@/types/investor";
import { calculateInvestorShare, fmt } from "@/lib/investor-utils";

interface Invoice {
  id: string;
  date: string;
  user: string;
  type: "Investment" | "Payout" | "Expense";
  amount: number;
  status: "Generated" | "Sent" | "Viewed";
}

const staticInvoices: Invoice[] = [
  { id: "INV-001", date: "2026-02-14", user: "Sarah Mitchell", type: "Payout", amount: 48000, status: "Generated" },
  { id: "INV-002", date: "2026-02-14", user: "James Chen", type: "Payout", amount: 96000, status: "Sent" },
  { id: "INV-003", date: "2026-02-10", user: "Apex Ventures", type: "Investment", amount: 500000, status: "Viewed" },
  { id: "INV-004", date: "2026-02-08", user: "BlueStone Capital", type: "Investment", amount: 750000, status: "Sent" },
  { id: "INV-005", date: "2026-02-05", user: "Marcus Williams", type: "Payout", amount: 72000, status: "Generated" },
  { id: "INV-006", date: "2026-02-01", user: "Office Lease Co.", type: "Expense", amount: 12000, status: "Viewed" },
  { id: "INV-007", date: "2026-01-28", user: "Elena Rodriguez", type: "Payout", amount: 64000, status: "Sent" },
];

const fmtCurrency = (n: number) => "$" + n.toLocaleString();

interface Props {
  investors: Investor[];
  profit: number;
  selectedYear: number;
}

export function LTIProfitShareTab({ investors, profit, selectedYear }: Props) {
  const [profitVisible, setProfitVisible] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const approved = useMemo(() => investors.filter((i) => i.status === "approved"), [investors]);
  const totalToDistribute = useMemo(
    () => approved.reduce((s, inv) => s + Math.round(calculateInvestorShare(inv, profit, investors)), 0),
    [approved, profit, investors]
  );

  const filteredInvoices = typeFilter === "all" ? staticInvoices : staticInvoices.filter((i) => i.type === typeFilter);

  return (
    <div className="space-y-6">
      {/* Visibility Toggle */}
      <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow space-y-3">
        <div className="flex items-center gap-3">
          {profitVisible ? <Eye size={20} className="text-profit" /> : <EyeOff size={20} className="text-muted-foreground" />}
          <h2 className="text-sm font-semibold text-foreground">Profit Visibility</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Toggle whether investors can see profit figures on their dashboards.
        </p>
        <div className="flex items-center gap-3">
          <Switch checked={profitVisible} onCheckedChange={setProfitVisible} />
          <span className="text-xs font-medium text-foreground">
            {profitVisible ? "Published — Investors can see profits" : "Hidden — Profits are private"}
          </span>
        </div>
      </div>

      {/* Distribution Summary */}
      <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
        <h2 className="text-sm font-semibold text-foreground mb-3">Distribution Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total to Distribute</p>
            <p className="text-lg font-bold text-foreground mt-1">{fmt(totalToDistribute)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Eligible Investors</p>
            <p className="text-lg font-bold text-foreground mt-1">{approved.length}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg. Share</p>
            <p className="text-lg font-bold text-foreground mt-1">{fmt(approved.length > 0 ? Math.round(totalToDistribute / approved.length) : 0)}</p>
          </div>
        </div>
      </div>

      {/* Invoices Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Invoice Vault</h2>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Investment">Investment</SelectItem>
                <SelectItem value="Payout">Payout</SelectItem>
                <SelectItem value="Expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-muted-foreground" />
                      <span className="font-medium text-foreground">{inv.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.date}</td>
                  <td className="px-4 py-3 text-foreground">{inv.user}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      inv.type === "Payout" ? "bg-profit/10 text-profit" :
                      inv.type === "Investment" ? "bg-primary/10 text-primary" :
                      "bg-warning/10 text-warning"
                    }`}>
                      {inv.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">{fmtCurrency(inv.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${
                      inv.status === "Viewed" ? "text-profit" : inv.status === "Sent" ? "text-primary" : "text-muted-foreground"
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Download size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
