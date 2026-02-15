import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinancial } from "@/contexts/FinancialContext";

const categories = ["Salary", "Rent", "Utilities", "Software", "Legal", "Marketing", "Travel", "Other"];
const fmt = (n: number) => "$" + n.toLocaleString();

export default function Expenses() {
  const { expenses, setExpenses, totalExpenses } = useFinancial();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: "", description: "", amount: "" });

  const burnRate = Math.round(totalExpenses / 12);

  const addExpense = () => {
    if (!form.category || !form.amount) return;
    setExpenses((prev) => [
      ...prev,
      {
        id: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
      },
    ]);
    setForm({ category: "", description: "", amount: "" });
    setOpen(false);
  };

  const remove = (id: number) => setExpenses((prev) => prev.filter((e) => e.id !== id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expense Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and categorize all operational expenses</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus size={16} className="mr-1.5" /> Add Expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Expense</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Input placeholder="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <Button className="w-full" onClick={addExpense}>Add Expense</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-bold text-foreground mt-1">{fmt(totalExpenses)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Monthly Burn Rate</p>
          <p className="text-2xl font-bold text-loss mt-1">{fmt(burnRate)}/mo</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden kpi-shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-muted-foreground">{e.date}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">{e.category}</span>
                </td>
                <td className="px-4 py-3 text-foreground">{e.description}</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(e.amount)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-loss transition-colors">
                    <Trash2 size={14} />
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
