import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/KpiCard";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/use-pagination";
import {
  BarChart3, FolderOpen, ArrowLeftRight, DollarSign,
  CheckCircle, Clock, XCircle, TrendingUp, Calendar, Layers
} from "lucide-react";
import type { ShortTermProject, STInvestorEntry } from "@/types/short-term";
import { fmt, statusConfig } from "@/types/short-term";
import projectCommercial from "@/assets/project-commercial.jpg";
import projectEquipment from "@/assets/project-equipment.jpg";

const CURRENT_USER = {
  name: "Alice Johnson",
  email: "alice@example.com",
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
    image: projectCommercial,
    investors: [
      { id: 101, investorName: "Alice Johnson", email: "alice@example.com", amount: 100000, date: "2026-01-20", status: "approved" },
      { id: 102, investorName: "Bob Smith", email: "bob@example.com", amount: 75000, date: "2026-01-22", status: "approved" },
      { id: 103, investorName: "David Lee", email: "david@example.com", amount: 50000, date: "2026-02-01", status: "pending" },
      { id: 104, investorName: "Frank Müller", email: "frank@example.com", amount: 60000, date: "2026-02-05", status: "approved" },
      { id: 105, investorName: "Grace Tanaka", email: "grace@example.com", amount: 45000, date: "2026-02-08", status: "approved" },
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
      { id: 202, investorName: "Liam Foster", email: "liam@example.com", amount: 40000, date: "2026-02-08", status: "approved" },
    ],
  },
  {
    id: 3,
    name: "Solar Farm Phase 1",
    description: "Investment in a solar farm installation with guaranteed government buyback contract.",
    targetAmount: 300000,
    startDate: "2025-09-01",
    endDate: "2026-02-01",
    expectedReturn: 15,
    status: "completed",
    image: projectCommercial,
    distributed: true,
    investors: [
      { id: 301, investorName: "Alice Johnson", email: "alice@example.com", amount: 50000, date: "2025-09-10", status: "approved" },
      { id: 302, investorName: "Bob Smith", email: "bob@example.com", amount: 100000, date: "2025-09-12", status: "approved" },
    ],
  },
];

const entryStatusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export default function InvestorSTI() {
  const [projects, setProjects] = useState<ShortTermProject[]>(initialProjects);
  const [investDialogOpen, setInvestDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ShortTermProject | null>(null);
  const [investAmount, setInvestAmount] = useState("");

  // Derived data
  const myInvestments = useMemo(() => {
    const entries: { project: ShortTermProject; entry: STInvestorEntry }[] = [];
    projects.forEach((p) => {
      p.investors
        .filter((inv) => inv.email === CURRENT_USER.email)
        .forEach((inv) => entries.push({ project: p, entry: inv }));
    });
    return entries.sort((a, b) => new Date(b.entry.date).getTime() - new Date(a.entry.date).getTime());
  }, [projects]);

  const totalInvested = useMemo(
    () => myInvestments.filter((m) => m.entry.status === "approved").reduce((s, m) => s + m.entry.amount, 0),
    [myInvestments]
  );

  const totalExpectedProfit = useMemo(
    () => myInvestments
      .filter((m) => m.entry.status === "approved")
      .reduce((s, m) => s + Math.round(m.entry.amount * (m.project.expectedReturn / 100)), 0),
    [myInvestments]
  );

  const activeProjectCount = useMemo(
    () => new Set(myInvestments.filter((m) => m.project.status === "active" && m.entry.status === "approved").map((m) => m.project.id)).size,
    [myInvestments]
  );

  const distributedProfit = useMemo(
    () => myInvestments
      .filter((m) => m.project.distributed && m.entry.status === "approved")
      .reduce((s, m) => s + Math.round(m.entry.amount * (m.project.expectedReturn / 100)), 0),
    [myInvestments]
  );

  const pagination = usePagination(myInvestments, { pageSize: 5 });

  // Active projects the user can invest in
  const availableProjects = useMemo(() => projects.filter((p) => p.status === "active"), [projects]);

  const getProjectProgress = (p: ShortTermProject) => {
    const raised = p.investors.filter((i) => i.status === "approved").reduce((s, i) => s + i.amount, 0);
    return { raised, pct: Math.min(100, Math.round((raised / p.targetAmount) * 100)) };
  };

  const handleInvest = () => {
    const amount = parseFloat(investAmount);
    if (!selectedProject) return;
    if (!amount || amount <= 0) { toast.error("Enter a valid amount."); return; }

    const { raised } = getProjectProgress(selectedProject);
    const remaining = selectedProject.targetAmount - raised;
    if (amount > remaining) { toast.error(`Maximum investable amount is ${fmt(remaining)}.`); return; }

    const newEntry: STInvestorEntry = {
      id: Date.now(),
      investorName: CURRENT_USER.name,
      email: CURRENT_USER.email,
      amount,
      date: new Date().toISOString().split("T")[0],
      status: "pending",
      fundingSource: "wallet",
    };

    setProjects((prev) =>
      prev.map((p) => p.id === selectedProject.id ? { ...p, investors: [...p.investors, newEntry] } : p)
    );
    setInvestDialogOpen(false);
    setInvestAmount("");
    setSelectedProject(null);
    toast.success("Investment request submitted. Awaiting admin approval.");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-3.5 w-3.5" />;
      case "pending": return <Clock className="h-3.5 w-3.5" />;
      case "rejected": return <XCircle className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 xl:space-y-8">
      <div>
        <h1 className="text-2xl xl:text-3xl font-bold text-foreground">Short-Term Investment</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse projects, invest, and track your returns</p>
      </div>

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="projects" className="gap-1.5 text-xs sm:text-sm">
            <FolderOpen className="h-4 w-4" /> Projects
          </TabsTrigger>
          <TabsTrigger value="my-investments" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" /> My Investments
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm">
            <ArrowLeftRight className="h-4 w-4" /> History
          </TabsTrigger>
          <TabsTrigger value="profit" className="gap-1.5 text-xs sm:text-sm">
            <DollarSign className="h-4 w-4" /> Profit
          </TabsTrigger>
        </TabsList>

        {/* PROJECTS TAB */}
        <TabsContent value="projects">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard title="Active Projects" value={String(availableProjects.length)} icon={<FolderOpen className="h-5 w-5 text-white" />} accentColor="bg-[hsl(var(--kpi-blue))]" />
              <KpiCard title="My Active Investments" value={String(activeProjectCount)} icon={<Layers className="h-5 w-5 text-white" />} accentColor="bg-[hsl(var(--kpi-emerald))]" />
              <KpiCard title="Total Invested" value={fmt(totalInvested)} icon={<TrendingUp className="h-5 w-5 text-white" />} accentColor="bg-[hsl(var(--kpi-amber))]" />
              <KpiCard title="Expected Returns" value={fmt(totalExpectedProfit)} icon={<DollarSign className="h-5 w-5 text-white" />} accentColor="bg-[hsl(var(--kpi-slate))]" />
            </div>

            {/* Project Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {availableProjects.map((project) => {
                const { raised, pct } = getProjectProgress(project);
                const remaining = project.targetAmount - raised;
                const myEntry = project.investors.find((i) => i.email === CURRENT_USER.email && i.status === "approved");
                return (
                  <Card key={project.id} className="overflow-hidden">
                    <div className="h-40 overflow-hidden">
                      <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{project.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{project.description}</p>
                        </div>
                        <Badge className={statusConfig[project.status]?.className}>{statusConfig[project.status]?.label}</Badge>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Raised: {fmt(raised)}</span>
                          <span>Target: {fmt(project.targetAmount)}</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                        <p className="text-xs text-muted-foreground">{pct}% funded · {fmt(remaining)} remaining</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-muted-foreground">Return</p>
                          <p className="font-semibold text-foreground">{project.expectedReturn}%</p>
                        </div>
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-muted-foreground">Start</p>
                          <p className="font-semibold text-foreground">{project.startDate.slice(5)}</p>
                        </div>
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-muted-foreground">End</p>
                          <p className="font-semibold text-foreground">{project.endDate.slice(5)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {myEntry ? (
                          <p className="text-xs text-profit font-medium">✓ Invested {fmt(myEntry.amount)}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Not invested yet</p>
                        )}
                        <Button
                          size="sm"
                          onClick={() => { setSelectedProject(project); setInvestDialogOpen(true); }}
                          disabled={remaining <= 0}
                        >
                          {myEntry ? "Invest More" : "Invest Now"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {availableProjects.length === 0 && (
                <div className="col-span-2 text-center py-12 text-muted-foreground">No active projects available at the moment.</div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* MY INVESTMENTS TAB */}
        <TabsContent value="my-investments">
          <div className="space-y-6">
            {myInvestments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  You haven't invested in any projects yet. Browse the Projects tab to get started.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {Array.from(new Set(myInvestments.map((m) => m.project.id))).map((projectId) => {
                  const project = projects.find((p) => p.id === projectId)!;
                  const entries = myInvestments.filter((m) => m.project.id === projectId);
                  const totalApproved = entries.filter((e) => e.entry.status === "approved").reduce((s, e) => s + e.entry.amount, 0);
                  const expectedProfit = Math.round(totalApproved * (project.expectedReturn / 100));

                  return (
                    <Card key={projectId}>
                      <CardHeader className="flex flex-row items-center gap-4 pb-3">
                        <img src={project.image} alt={project.name} className="w-14 h-14 rounded-lg object-cover" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{project.name}</CardTitle>
                            <Badge className={statusConfig[project.status]?.className}>{statusConfig[project.status]?.label}</Badge>
                            {project.distributed && <Badge variant="outline" className="text-xs">Distributed</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{project.expectedReturn}% expected return · {project.startDate} → {project.endDate}</p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">My Investment</p>
                            <p className="text-lg font-bold text-foreground">{fmt(totalApproved)}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Expected Profit</p>
                            <p className="text-lg font-bold text-profit">{fmt(expectedProfit)}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Total Return</p>
                            <p className="text-lg font-bold text-foreground">{fmt(totalApproved + expectedProfit)}</p>
                          </div>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {entries.map(({ entry }) => (
                              <TableRow key={entry.id}>
                                <TableCell>{entry.date}</TableCell>
                                <TableCell className="text-right font-medium">{fmt(entry.amount)}</TableCell>
                                <TableCell>
                                  <Badge variant={entryStatusBadge[entry.status]?.variant} className="gap-1 text-xs">
                                    {getStatusIcon(entry.status)}
                                    {entryStatusBadge[entry.status]?.label}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Investment History</CardTitle>
              <p className="text-sm text-muted-foreground">{myInvestments.length} transaction(s)</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Return %</TableHead>
                      <TableHead>Project Status</TableHead>
                      <TableHead>Investment Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.paginatedItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No investment history found.</TableCell>
                      </TableRow>
                    ) : (
                      pagination.paginatedItems.map(({ project, entry }) => (
                        <TableRow key={entry.id}>
                          <TableCell className="whitespace-nowrap">{entry.date}</TableCell>
                          <TableCell className="font-medium text-foreground">{project.name}</TableCell>
                          <TableCell className="text-right font-medium">{fmt(entry.amount)}</TableCell>
                          <TableCell>{project.expectedReturn}%</TableCell>
                          <TableCell>
                            <Badge className={statusConfig[project.status]?.className}>{statusConfig[project.status]?.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={entryStatusBadge[entry.status]?.variant} className="gap-1 text-xs">
                              {getStatusIcon(entry.status)}
                              {entryStatusBadge[entry.status]?.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.goToPage}
                totalItems={myInvestments.length}
                hasNextPage={pagination.hasNextPage}
                hasPrevPage={pagination.hasPrevPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROFIT TAB */}
        <TabsContent value="profit">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Expected Profit</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{fmt(totalExpectedProfit)}</p>
                  <p className="text-xs text-muted-foreground mt-1">From all approved investments</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Distributed Profit</p>
                  <p className="text-2xl font-bold text-profit mt-1">{fmt(distributedProfit)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Credited to your wallet</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending Profit</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{fmt(totalExpectedProfit - distributedProfit)}</p>
                  <p className="text-xs text-muted-foreground mt-1">From active projects</p>
                </CardContent>
              </Card>
            </div>

            {/* Per-project profit breakdown */}
            <Card>
              <CardHeader><CardTitle className="text-base">Profit by Project</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead className="text-right">Invested</TableHead>
                      <TableHead>Return %</TableHead>
                      <TableHead className="text-right">Expected Profit</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(new Set(myInvestments.filter((m) => m.entry.status === "approved").map((m) => m.project.id))).map((pid) => {
                      const project = projects.find((p) => p.id === pid)!;
                      const invested = myInvestments
                        .filter((m) => m.project.id === pid && m.entry.status === "approved")
                        .reduce((s, m) => s + m.entry.amount, 0);
                      const profit = Math.round(invested * (project.expectedReturn / 100));
                      return (
                        <TableRow key={pid}>
                          <TableCell className="font-medium text-foreground">{project.name}</TableCell>
                          <TableCell className="text-right">{fmt(invested)}</TableCell>
                          <TableCell>{project.expectedReturn}%</TableCell>
                          <TableCell className="text-right font-medium text-profit">{fmt(profit)}</TableCell>
                          <TableCell>
                            {project.distributed ? (
                              <Badge variant="outline" className="gap-1 text-xs text-profit"><CheckCircle className="h-3 w-3" /> Distributed</Badge>
                            ) : (
                              <Badge className={statusConfig[project.status]?.className}>{statusConfig[project.status]?.label}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {myInvestments.filter((m) => m.entry.status === "approved").length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No approved investments yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground">
                <strong>How STI profit works:</strong> Each project has a fixed expected return percentage. When the project completes and admin distributes returns,
                your principal + profit is credited to your wallet automatically.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Invest Dialog */}
      <Dialog open={investDialogOpen} onOpenChange={setInvestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invest in {selectedProject?.name}</DialogTitle>
          </DialogHeader>
          {selectedProject && (() => {
            const { raised } = getProjectProgress(selectedProject);
            const remaining = selectedProject.targetAmount - raised;
            return (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Target</span><span className="font-medium text-foreground">{fmt(selectedProject.targetAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Raised</span><span className="font-medium text-foreground">{fmt(raised)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Remaining</span><span className="font-semibold text-foreground">{fmt(remaining)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Expected Return</span><span className="font-semibold text-profit">{selectedProject.expectedReturn}%</span></div>
                </div>
                <div className="space-y-2">
                  <Label>Investment Amount</Label>
                  <Input type="number" placeholder="Enter amount" value={investAmount} onChange={(e) => setInvestAmount(e.target.value)} />
                  {investAmount && parseFloat(investAmount) > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Expected profit: <span className="font-semibold text-profit">{fmt(Math.round(parseFloat(investAmount) * (selectedProject.expectedReturn / 100)))}</span>
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Funds will be deducted from your wallet upon admin approval.</p>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvestDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleInvest}>Submit Investment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
