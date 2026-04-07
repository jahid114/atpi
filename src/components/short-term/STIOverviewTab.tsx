import { Calendar, TrendingUp, Users, DollarSign, Download, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ShortTermProject } from "@/types/short-term";
import { fmt, statusConfig } from "@/types/short-term";
import { toast } from "sonner";
import { generateSTIReport } from "@/lib/sti-pdf";

interface Props {
  project: ShortTermProject;
  onDistribute?: () => void;
}

export function STIOverviewTab({ project, onDistribute }: Props) {
  const approved = project.investors.filter((inv) => inv.status === "approved");
  const pending = project.investors.filter((inv) => inv.status === "pending");
  const funded = approved.reduce((s, inv) => s + inv.amount, 0);
  const pendingAmount = pending.reduce((s, inv) => s + inv.amount, 0);
  const progress = Math.min(100, (funded / project.targetAmount) * 100);
  const remaining = Math.max(0, project.targetAmount - funded);

  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);
  const today = new Date();
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const elapsed = Math.max(0, Math.min(totalDays, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))));

  const handleDownloadReport = () => {
    generateSTIReport(project);
    toast.success("Report PDF downloaded.");
  };

    const isEndDatePassed = new Date(project.endDate) <= new Date();
    const canDistribute = project.status === "active" && !project.distributed && approved.length > 0;

    return (
    <div className="space-y-5">
      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        {canDistribute && (
          <Button size="sm" onClick={onDistribute} disabled={!isEndDatePassed} className="gap-2">
            <CheckCircle2 className="h-4 w-4" /> Complete & Distribute
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleDownloadReport} className="gap-2">
          <Download className="h-4 w-4" /> Download Report
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" /> Target Amount
          </div>
          <p className="text-lg font-bold text-foreground">{fmt(project.targetAmount)}</p>
        </div>
        <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" /> Funded
          </div>
          <p className="text-lg font-bold text-profit">{fmt(funded)}</p>
        </div>
        <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" /> Expected Return
          </div>
          <p className="text-lg font-bold text-foreground">{project.expectedReturn}%</p>
        </div>
        <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Total Investors
          </div>
          <p className="text-lg font-bold text-foreground">{project.investors.length}</p>
          {pending.length > 0 && (
            <p className="text-xs text-muted-foreground">{pending.length} pending</p>
          )}
        </div>
      </div>

      {/* Funding progress */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Funding Progress</p>
          <Badge variant={statusConfig[project.status].variant} className={`text-[11px] ${statusConfig[project.status].className || ""}`}>
            {statusConfig[project.status].label}
          </Badge>
        </div>
        <Progress value={progress} className="h-2.5" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{progress.toFixed(1)}% funded</span>
          <span>{fmt(remaining)} remaining</span>
        </div>
        {pendingAmount > 0 && (
          <p className="text-xs text-muted-foreground">{fmt(pendingAmount)} pending approval</p>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">Timeline</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Start Date</p>
            <p className="text-sm font-medium text-foreground">{project.startDate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Days Elapsed</p>
            <p className="text-sm font-medium text-foreground">{elapsed} / {totalDays}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">End Date</p>
            <p className="text-sm font-medium text-foreground">{project.endDate}</p>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (elapsed / totalDays) * 100)}%` }} />
        </div>
      </div>

      {/* Description */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium text-foreground">Description</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
      </div>
    </div>
  );
}
