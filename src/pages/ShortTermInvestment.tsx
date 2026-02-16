import { useState } from "react";
import { Plus, Calendar, TrendingUp, Users, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import projectCommercial from "@/assets/project-commercial.jpg";
import projectEquipment from "@/assets/project-equipment.jpg";
import type { ShortTermProject, STInvestorEntry, InvestorEntryStatus } from "@/types/short-term";
import { fmt, statusConfig } from "@/types/short-term";
import { STIOverviewTab } from "@/components/short-term/STIOverviewTab";
import { STIInvestorsTab } from "@/components/short-term/STIInvestorsTab";
import { STIRequestsTab } from "@/components/short-term/STIRequestsTab";
import { STITransactionsTab } from "@/components/short-term/STITransactionsTab";

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
  const [detailProjectId, setDetailProjectId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", description: "", targetAmount: "", startDate: "", endDate: "", expectedReturn: "" });

  const detailProject = detailProjectId ? projects.find((p) => p.id === detailProjectId) || null : null;

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

  const handleAddInvestor = (projectId: number, data: { investorName: string; email: string; amount: number }) => {
    const newEntry: STInvestorEntry = {
      id: Date.now(),
      investorName: data.investorName,
      email: data.email,
      amount: data.amount,
      date: new Date().toISOString().split("T")[0],
      status: "pending",
    };
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, investors: [...p.investors, newEntry] } : p))
    );
    toast.success("Investor added for review.");
  };

  const handleUpdateStatus = (projectId: number, entryId: number, status: InvestorEntryStatus) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, investors: p.investors.map((inv) => (inv.id === entryId ? { ...inv, status } : inv)) }
          : p
      )
    );
    toast.success(`Investor ${status}.`);
  };

  const closeDetail = () => {
    setDetailProjectId(null);
    setExpanded(false);
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
              onClick={() => { setDetailProjectId(project.id); setExpanded(false); }}
            >
              <div className="relative h-40 overflow-hidden bg-muted">
                <img src={project.image} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <Badge variant={sc.variant} className="absolute top-3 right-3 text-[11px]">{sc.label}</Badge>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground text-base">{project.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{project.description}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Funded</span>
                    <span className="font-medium text-foreground">{fmt(funded)} / {fmt(project.targetAmount)}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
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

      {/* Project Detail - Right Sidebar with Tabs */}
      <Sheet open={!!detailProject} onOpenChange={(open) => !open && closeDetail()}>
        <SheetContent
          side="right"
          className={`p-0 overflow-y-auto transition-all duration-300 ${
            expanded ? "sm:max-w-full w-full" : "sm:max-w-xl w-full"
          }`}
        >
          {detailProject && (
            <div className="flex flex-col h-full">
              {/* Header image */}
              <div className="relative h-40 overflow-hidden bg-muted shrink-0">
                <img src={detailProject.image} alt={detailProject.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-3 left-3 h-8 w-8 bg-background/70 backdrop-blur-sm hover:bg-background/90"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <div className="absolute bottom-3 left-4 right-12">
                  <h2 className="text-lg font-bold text-foreground">{detailProject.name}</h2>
                  <p className="text-xs text-muted-foreground line-clamp-1">{detailProject.description}</p>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4 h-11 shrink-0">
                  <TabsTrigger value="overview" className="text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Overview</TabsTrigger>
                  <TabsTrigger value="investors" className="text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Investors</TabsTrigger>
                  <TabsTrigger value="requests" className="text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Requests</TabsTrigger>
                  <TabsTrigger value="transactions" className="text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Transactions</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto p-4">
                  <TabsContent value="overview" className="mt-0">
                    <STIOverviewTab project={detailProject} />
                  </TabsContent>
                  <TabsContent value="investors" className="mt-0">
                    <STIInvestorsTab project={detailProject} />
                  </TabsContent>
                  <TabsContent value="requests" className="mt-0">
                    <STIRequestsTab
                      project={detailProject}
                      onAddInvestor={(data) => handleAddInvestor(detailProject.id, data)}
                      onUpdateStatus={(entryId, status) => handleUpdateStatus(detailProject.id, entryId, status)}
                    />
                  </TabsContent>
                  <TabsContent value="transactions" className="mt-0">
                    <STITransactionsTab
                      project={detailProject}
                      onUpdateStatus={(entryId, status) => handleUpdateStatus(detailProject.id, entryId, status)}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
