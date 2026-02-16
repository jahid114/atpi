import { useState } from "react";
import { Plus, Eye, CheckCircle, XCircle, Clock, Calendar, TrendingUp, Users, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import projectCommercial from "@/assets/project-commercial.jpg";
import projectEquipment from "@/assets/project-equipment.jpg";

type ProjectStatus = "active" | "completed" | "cancelled";
type InvestorEntryStatus = "pending" | "approved" | "rejected";

interface InvestorEntry {
  id: number;
  investorName: string;
  email: string;
  amount: number;
  date: string;
  status: InvestorEntryStatus;
}

interface ShortTermProject {
  id: number;
  name: string;
  description: string;
  targetAmount: number;
  startDate: string;
  endDate: string;
  expectedReturn: number;
  status: ProjectStatus;
  image: string;
  investors: InvestorEntry[];
}

const fmt = (n: number) => "$" + n.toLocaleString("en-US");

const statusConfig: Record<ProjectStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Active", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const entryStatusConfig: Record<InvestorEntryStatus, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  approved: { label: "Approved", icon: CheckCircle, variant: "default" },
  rejected: { label: "Rejected", icon: XCircle, variant: "destructive" },
};

const defaultImages = [projectCommercial, projectEquipment];

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
    image: projectCommercial,
    investors: [
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
    image: projectEquipment,
    investors: [
      { id: 201, investorName: "Carol Williams", email: "carol@example.com", amount: 80000, date: "2026-02-05", status: "approved" },
    ],
  },
];

export default function ShortTermInvestment() {
  const [projects, setProjects] = useState<ShortTermProject[]>(initialProjects);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailProject, setDetailProject] = useState<ShortTermProject | null>(null);
  const [addInvestorOpen, setAddInvestorOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", description: "", targetAmount: "", startDate: "", endDate: "", expectedReturn: "" });
  const [investorForm, setInvestorForm] = useState({ investorName: "", email: "", amount: "" });

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
      image: defaultImages[projects.length % defaultImages.length],
      investors: [],
    };
    setProjects((prev) => [...prev, newProject]);
    setProjectForm({ name: "", description: "", targetAmount: "", startDate: "", endDate: "", expectedReturn: "" });
    setCreateOpen(false);
    toast.success(`Project "${newProject.name}" created.`);
  };

  const handleAddInvestor = () => {
    if (!detailProject || !investorForm.investorName || !investorForm.amount) {
      toast.error("Please fill all required fields.");
      return;
    }
    const newEntry: InvestorEntry = {
      id: Date.now(),
      investorName: investorForm.investorName,
      email: investorForm.email,
      amount: Number(investorForm.amount),
      date: new Date().toISOString().split("T")[0],
      status: "pending",
    };
    setProjects((prev) =>
      prev.map((p) => (p.id === detailProject.id ? { ...p, investors: [...p.investors, newEntry] } : p))
    );
    setDetailProject((prev) => prev ? { ...prev, investors: [...prev.investors, newEntry] } : null);
    setInvestorForm({ investorName: "", email: "", amount: "" });
    setAddInvestorOpen(false);
    toast.success("Investor added for review.");
  };

  const handleInvestorStatus = (projectId: number, entryId: number, status: InvestorEntryStatus) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, investors: p.investors.map((inv) => (inv.id === entryId ? { ...inv, status } : inv)) }
          : p
      )
    );
    setDetailProject((prev) =>
      prev && prev.id === projectId
        ? { ...prev, investors: prev.investors.map((inv) => (inv.id === entryId ? { ...inv, status } : inv)) }
        : prev
    );
    toast.success(`Investor ${status}.`);
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 xl:gap-6">
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
            {fmt(projects.reduce((s, p) => s + p.investors.filter((inv) => inv.status === "approved").reduce((a, inv) => a + inv.amount, 0), 0))}
          </p>
        </div>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((project) => {
          const funded = project.investors.filter((inv) => inv.status === "approved").reduce((s, inv) => s + inv.amount, 0);
          const progress = Math.min(100, (funded / project.targetAmount) * 100);
          const sc = statusConfig[project.status];
          return (
            <div
              key={project.id}
              className="bg-card border border-border rounded-xl overflow-hidden kpi-shadow hover:shadow-md transition-shadow group cursor-pointer"
              onClick={() => setDetailProject(project)}
            >
              {/* Image */}
              <div className="relative h-40 overflow-hidden bg-muted">
                <img
                  src={project.image}
                  alt={project.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge variant={sc.variant} className="absolute top-3 right-3 text-[11px]">
                  {sc.label}
                </Badge>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground text-base">{project.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{project.description}</p>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Funded</span>
                    <span className="font-medium text-foreground">{fmt(funded)} / {fmt(project.targetAmount)}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-profit" />
                    <span className="font-medium text-foreground">{project.expectedReturn}%</span> return
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {project.investors.length} investor{project.investors.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {project.endDate}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
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
            const funded = current.investors.filter((inv) => inv.status === "approved").reduce((s, inv) => s + inv.amount, 0);
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
                  <h3 className="text-sm font-semibold text-foreground">Investors</h3>
                  <Button size="sm" onClick={() => setAddInvestorOpen(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Investor
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
                      {current.investors.map((inv) => {
                        const es = entryStatusConfig[inv.status];
                        const StatusIcon = es.icon;
                        return (
                          <tr key={inv.id} className="border-b border-border last:border-0">
                            <td className="px-3 py-2 font-medium text-foreground">{inv.investorName}</td>
                            <td className="px-3 py-2 text-right text-foreground">{fmt(inv.amount)}</td>
                            <td className="px-3 py-2 text-muted-foreground">{inv.date}</td>
                            <td className="px-3 py-2 text-center">
                              <Badge variant={es.variant} className="text-[11px] gap-1">
                                <StatusIcon className="h-3 w-3" /> {es.label}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-center space-x-1">
                              {inv.status === "pending" && (
                                <>
                                  <Button variant="ghost" size="sm" className="text-profit hover:text-profit" onClick={() => handleInvestorStatus(current.id, inv.id, "approved")}>
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleInvestorStatus(current.id, inv.id, "rejected")}>
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {current.investors.length === 0 && (
                        <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No investors yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Add Investor Dialog */}
      <Dialog open={addInvestorOpen} onOpenChange={setAddInvestorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Investor</DialogTitle>
            <DialogDescription>Add an investor to this project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Investor Name *</Label>
              <Input placeholder="e.g. John Doe" value={investorForm.investorName} onChange={(e) => setInvestorForm((f) => ({ ...f, investorName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="john@example.com" value={investorForm.email} onChange={(e) => setInvestorForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input type="number" placeholder="50000" value={investorForm.amount} onChange={(e) => setInvestorForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleAddInvestor}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
