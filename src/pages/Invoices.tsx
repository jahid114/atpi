import { useState } from "react";
import { FileText, Download, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Invoice {
  id: string;
  date: string;
  user: string;
  type: "Investment" | "Payout" | "Expense";
  amount: number;
  status: "Generated" | "Sent" | "Viewed";
}

const invoices: Invoice[] = [
  { id: "INV-001", date: "2026-02-14", user: "Sarah Mitchell", type: "Payout", amount: 48000, status: "Generated" },
  { id: "INV-002", date: "2026-02-14", user: "James Chen", type: "Payout", amount: 96000, status: "Sent" },
  { id: "INV-003", date: "2026-02-10", user: "Apex Ventures", type: "Investment", amount: 500000, status: "Viewed" },
  { id: "INV-004", date: "2026-02-08", user: "BlueStone Capital", type: "Investment", amount: 750000, status: "Sent" },
  { id: "INV-005", date: "2026-02-05", user: "Marcus Williams", type: "Payout", amount: 72000, status: "Generated" },
  { id: "INV-006", date: "2026-02-01", user: "Office Lease Co.", type: "Expense", amount: 12000, status: "Viewed" },
  { id: "INV-007", date: "2026-01-28", user: "Elena Rodriguez", type: "Payout", amount: 64000, status: "Sent" },
];

const fmt = (n: number) => "$" + n.toLocaleString();

export default function Invoices() {
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = typeFilter === "all" ? invoices : invoices.filter((i) => i.type === typeFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoice Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">System-generated invoices and documents</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] h-9 text-sm">
              <SelectValue placeholder="Filter by type" />
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

      <div className="bg-card border border-border rounded-lg overflow-hidden kpi-shadow">
        <table className="w-full text-sm">
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
            {filtered.map((inv) => (
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
                <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(inv.amount)}</td>
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
  );
}
