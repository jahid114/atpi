import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useFinancial } from "@/contexts/FinancialContext";

const fmt = (n: number) => "$" + n.toLocaleString();

export default function Clients() {
  const { clients, setClients } = useFinancial();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", invested: "", expectedReturn: "" });

  const totalInvested = clients.reduce((s, c) => s + c.invested, 0);
  const totalReturned = clients.reduce((s, c) => s + (c.actualReturn ?? 0), 0);

  const addClient = () => {
    if (!form.name || !form.invested) return;
    setClients((prev) => [
      ...prev,
      { id: Date.now(), name: form.name, invested: Number(form.invested), expectedReturn: form.expectedReturn, actualReturn: null },
    ]);
    setForm({ name: "", invested: "", expectedReturn: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Client Investment Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor deployed capital and expected returns</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus size={16} className="mr-1.5" /> Add Client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Client Deployment</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Client Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Amount Invested" type="number" value={form.invested} onChange={(e) => setForm({ ...form, invested: e.target.value })} />
              <Input placeholder="Expected Return Date" type="date" value={form.expectedReturn} onChange={(e) => setForm({ ...form, expectedReturn: e.target.value })} />
              <Button className="w-full" onClick={addClient}>Add Deployment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Deployed</p>
          <p className="text-2xl font-bold text-foreground mt-1">{fmt(totalInvested)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Returns Received</p>
          <p className="text-2xl font-bold text-profit mt-1">{fmt(totalReturned)}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden kpi-shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Invested</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expected Return</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actual Return</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                <td className="px-4 py-3 text-right text-foreground">{fmt(c.invested)}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.expectedReturn}</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">{c.actualReturn ? fmt(c.actualReturn) : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    c.actualReturn ? "bg-profit/10 text-profit" : "bg-warning/10 text-warning"
                  }`}>
                    {c.actualReturn ? "Returned" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
