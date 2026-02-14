import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function Distribution() {
  const [profitVisible, setProfitVisible] = useState(false);
  const [payoutConfirmed, setPayoutConfirmed] = useState(false);

  const handlePayout = () => {
    setPayoutConfirmed(true);
    toast.success("Payout confirmed. Invoices are being generated.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Distribution Control Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Control profit visibility and trigger payouts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visibility Toggle */}
        <div className="bg-card border border-border rounded-lg p-6 kpi-shadow space-y-4">
          <div className="flex items-center gap-3">
            {profitVisible ? <Eye size={20} className="text-profit" /> : <EyeOff size={20} className="text-muted-foreground" />}
            <h2 className="text-lg font-semibold text-foreground">Profit Visibility</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Toggle whether investors can see profit figures on their dashboards. This does not affect internal reports.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Switch checked={profitVisible} onCheckedChange={setProfitVisible} />
            <span className="text-sm font-medium text-foreground">
              {profitVisible ? "Published — Investors can see profits" : "Hidden — Profits are private"}
            </span>
          </div>
        </div>

        {/* Payout Confirmation */}
        <div className="bg-card border border-border rounded-lg p-6 kpi-shadow space-y-4">
          <div className="flex items-center gap-3">
            {payoutConfirmed ? (
              <CheckCircle size={20} className="text-profit" />
            ) : (
              <Send size={20} className="text-muted-foreground" />
            )}
            <h2 className="text-lg font-semibold text-foreground">Confirm Payout</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Trigger automated invoice generation and initiate payout distribution to all eligible investors.
          </p>
          <div className="pt-2">
            {payoutConfirmed ? (
              <div className="flex items-center gap-2 text-sm font-medium text-profit">
                <CheckCircle size={16} /> Payout confirmed & invoices generated
              </div>
            ) : (
              <Button onClick={handlePayout} variant="default">
                <Send size={16} className="mr-1.5" /> Confirm Payout
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-card border border-border rounded-lg p-6 kpi-shadow">
        <h2 className="text-sm font-semibold text-foreground mb-3">Distribution Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total to Distribute", value: "$280,000" },
            { label: "Eligible Investors", value: "5" },
            { label: "Avg. Share", value: "$56,000" },
            { label: "Status", value: payoutConfirmed ? "Completed" : "Pending" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p>
              <p className="text-lg font-bold text-foreground mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
