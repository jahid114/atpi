import { useState, useMemo } from "react";
import { Plus, Eye, CheckCircle, XCircle, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type ProjectStatus = "active" | "completed" | "cancelled";
type ContributionStatus = "pending" | "approved" | "rejected";

interface Contribution {
  id: number;
  investorName: string;
  email: string;
  amount: number;
  date: string;
  status: ContributionStatus;
}

interface ShortTermProject {
  id: number;
  name: string;
  description: string;
  targetAmount: number;
  startDate: string;
  endDate: string;
  expectedReturn: number; // percentage
  status: ProjectStatus;
  contributions: Contribution[];
}

const fmt = (n: number) => "$" + n.toLocaleString("en-US");

const statusConfig: Record<ProjectStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Active", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const contribStatusConfig: Record<ContributionStatus, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  approved: { label: "Approved", icon: CheckCircle, variant: "default" },
  rejected: { label: "Rejected", icon: XCircle, variant: "destructive" },
};

const initialProjects: ShortTermProject[] = [
  {
    id: 1,
    name: "Commercial Property Flip",
    description: "Short-term investment in a commercial property renovation and resale in downtown area.",
    targetAmount: 500000,
    startDate: "2026-01-15",
    endDate: "2026-06-15",
    expectedReturn: 18,
    status: "active",
    contributions: [
      { id: 101, investorName: "Alice Johnson", email: "alice@example.com", amount: 100000, date: "2026-01-20", status: "approved" },
      { id: 102, investorName: "Bob Smith", email: "bob@example.com", amount: 75000, date: "2026-01-22", status: "approved" },
      { id: 103, investorName: "David Lee", email: "david@example.com", amount: 50000, date: "2026-02-01", status: "pending" },
    ],
  },
  {
    id: 2,
    name: "Equipment Leasing Round",
    description: "Fund industrial equipment purchase for 6-month lease contract with guaranteed buyback.",
    targetAmount: 200000,
    startDate: "2026-02-01",
    endDate: "2026-08-01",
    expectedReturn: 12,
    status: "active",
    contributions: [
      { id: 201, investorName: "Carol Williams", email: "carol@example.com", amount: 80000, date: "2026-02-05", status: "approved" },
    ],
  },
];

export default function ShortTermInvestment() {
  const [projects, setProjects] = useState<ShortTermProject[]>(initialProjects);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailProject, setDetailProject] = useState<ShortTermProject | null>(null);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", description: "", targetAmount: "", startDate: "", endDate: "", expectedReturn: "" });
  const [contribForm, setContribForm] = useState({ investorName: "", email: "", amount: "" });

  const handleCreateProject = () => {
    if (!projectForm.name || !projectForm.targetAmount || !projectForm.startDate || !projectForm.endDate) {
      toast.error("Please fill all required fields.");
      return;
    }
    const newProject: ShortTermProject = {
      id: Date.now(),
      name: projectForm.name,
      description: projectForm.description,
      targetAmount: Number(projectForm.targetAmount),
      startDate: projectForm.startDate,
      endDate: projectForm.endDate,
      expectedReturn: Number(projectForm.expectedReturn) || 0,
      status: "active",
      contributions: [],
    };
    setProjects((prev) => [...prev, newProject]);
    setProjectForm({ name: "", description: "", targetAmount: "", startDate: "", endDate: "", expectedReturn: "" });
    setCreateOpen(false);
    toast.success(`Project "${newProject.name}" created.`);
  };

  const handleContribute = () => {
    if (!detailProject || !contribForm.investorName || !contribForm.amount) {
      toast.error("Please fill all required fields.");
      return;
    }
    const newContrib: Contribution = {
      id: Date.now(),
      investorName: contribForm.investorName,
      email: contribForm.email,
      amount: Number(contribForm.amount),
      date: new Date().toISOString().split("T")[0],
      status: "pending",
    };
    setProjects((prev) =>
      prev.map((p) => (p.id === detailProject.id ? { ...p, contributions: [...p.contributions, newContrib] } : p))
    );
    setDetailProject((prev) => prev ? { ...prev, contributions: [...prev.contributions, newContrib] } : null);
    setContribForm({ investorName: "", email: "", amount: "" });
    setContributeOpen(false);
    toast.success("Contribution submitted for review.");
  };

  const handleContribStatus = (projectId: number, contribId: number, status: ContributionStatus) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, contributions: p.contributions.map((c) => (c.id === contribId ? { ...c, status } : c)) }
          : p
      )
    );
    setDetailProject((prev) =>
      prev && prev.id === projectId
        ? { ...prev, contributions: prev.contributions.map((c) => (c.id === contribId ? { ...c, status } : c)) }
        : prev
    );
    toast.success(`Contribution ${status}.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Short-Term Investment</h1>
          <p className="text-sm text-muted-foreground mt-1">Project-based investment opportunities</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Project
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4 xl:gap-6">
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Projects</p>
          <p className="text-2xl xl:text-3xl font-bold text-foreground mt-1">{projects.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Projects</p>
          <p className="text-2xl xl:text-3xl font-bold text-foreground mt-1">{projects.filter((p) => p.status === "active").length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 xl:p-6 kpi-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Funded</p>
          <p className="text-2xl xl:text-3xl font-bold text-profit mt-1">
            {fmt(projects.reduce((s, p) => s + p.contributions.filter((c) => c.status === "approved").reduce((a, c) => a + c.amount, 0), 0))}
          </p>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto kpi-shadow">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Project Name</th>
              <th className="text-right px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Target</th>
              <th className="text-right px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Funded</th>
              <th className="text-center px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Return %</th>
              <th className="text-left px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Duration</th>
              <th className="text-center px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Status</th>
              <th className="text-center px-4 xl:px-6 py-3 xl:py-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const funded = project.contributions.filter((c) => c.status === "approved").reduce((s, c) => s + c.amount, 0);
              const sc = statusConfig[project.status];
              return (
                <tr key={project.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 xl:px-6 py-3 xl:py-4">
                    <p className="font-medium text-foreground">{project.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-xs xl:max-w-md">{project.description}</p>
                  </td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4 text-right text-foreground">{fmt(project.targetAmount)}</td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4 text-right font-semibold text-profit">{fmt(funded)}</td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4 text-center text-foreground">{project.expectedReturn}%</td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4 text-muted-foreground text-xs">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {project.startDate} → {project.endDate}</span>
                  </td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4 text-center">
                    <Badge variant={sc.variant} className="text-[11px]">{sc.label}</Badge>
                  </td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4 text-center">
                    <Button variant="ghost" size="sm" onClick={() => setDetailProject(project)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Project Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Short-Term Project</DialogTitle>
            <DialogDescription>Define a new project-based investment opportunity.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Project Name *</Label>
              <Input placeholder="e.g. Commercial Property Flip" value={projectForm.name} onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Brief description of the project…" value={projectForm.description} onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Target Amount *</Label>
                <Input type="number" placeholder="500000" value={projectForm.targetAmount} onChange={(e) => setProjectForm((f) => ({ ...f, targetAmount: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Expected Return %</Label>
                <Input type="number" placeholder="15" value={projectForm.expectedReturn} onChange={(e) => setProjectForm((f) => ({ ...f, expectedReturn: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date *</Label>
                <Input type="date" value={projectForm.startDate} onChange={(e) => setProjectForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date *</Label>
                <Input type="date" value={projectForm.endDate} onChange={(e) => setProjectForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleCreateProject}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Detail Dialog */}
      <Dialog open={!!detailProject} onOpenChange={(open) => !open && setDetailProject(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailProject && (() => {
            const current = projects.find((p) => p.id === detailProject.id) || detailProject;
            const funded = current.contributions.filter((c) => c.status === "approved").reduce((s, c) => s + c.amount, 0);
            const progress = Math.min(100, (funded / current.targetAmount) * 100);
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{current.name}</DialogTitle>
                  <DialogDescription>{current.description}</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="font-bold text-foreground">{fmt(current.targetAmount)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Funded</p>
                    <p className="font-bold text-profit">{fmt(funded)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <p className="font-bold text-foreground">{progress.toFixed(1)}%</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Return</p>
                    <p className="font-bold text-foreground">{current.expectedReturn}%</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <h3 className="text-sm font-semibold text-foreground">Contributions</h3>
                  <Button size="sm" onClick={() => setContributeOpen(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Contribution
                  </Button>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Investor</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                        <th className="text-center px-3 py-2 font-medium text-muted-foreground">Status</th>
                        <th className="text-center px-3 py-2 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {current.contributions.map((c) => {
                        const cs = contribStatusConfig[c.status];
                        const StatusIcon = cs.icon;
                        return (
                          <tr key={c.id} className="border-b border-border last:border-0">
                            <td className="px-3 py-2 font-medium text-foreground">{c.investorName}</td>
                            <td className="px-3 py-2 text-right text-foreground">{fmt(c.amount)}</td>
                            <td className="px-3 py-2 text-muted-foreground">{c.date}</td>
                            <td className="px-3 py-2 text-center">
                              <Badge variant={cs.variant} className="text-[11px] gap-1">
                                <StatusIcon className="h-3 w-3" /> {cs.label}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-center space-x-1">
                              {c.status === "pending" && (
                                <>
                                  <Button variant="ghost" size="sm" className="text-profit hover:text-profit" onClick={() => handleContribStatus(current.id, c.id, "approved")}>
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleContribStatus(current.id, c.id, "rejected")}>
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {current.contributions.length === 0 && (
                        <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No contributions yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Add Contribution Dialog */}
      <Dialog open={contributeOpen} onOpenChange={setContributeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
            <DialogDescription>Submit an investment contribution to this project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Investor Name *</Label>
              <Input placeholder="e.g. John Doe" value={contribForm.investorName} onChange={(e) => setContribForm((f) => ({ ...f, investorName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="john@example.com" value={contribForm.email} onChange={(e) => setContribForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input type="number" placeholder="50000" value={contribForm.amount} onChange={(e) => setContribForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleContribute}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
