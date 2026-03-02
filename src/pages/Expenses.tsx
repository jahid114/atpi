import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Receipt, Tag, Download } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import { ExpenseOverviewTab } from "@/components/expenses/ExpenseOverviewTab";
import { ExpenseListTab } from "@/components/expenses/ExpenseListTab";
import { ExpenseCategoryTab } from "@/components/expenses/ExpenseCategoryTab";
import { YearSelector } from "@/components/YearSelector";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateMonthlyExpenseReport } from "@/lib/expense-report-pdf";
import { toast } from "sonner";

const defaultCategories = ["Salary", "Rent", "Utilities", "Software", "Legal", "Marketing", "Travel", "Other"];

export default function Expenses() {
  const { expenses, setExpenses } = useFinancial();
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleDownloadReport = () => {
    const month = Number(reportMonth);
    const monthStr = `${selectedYear}-${String(month).padStart(2, "0")}`;
    const hasData = expenses.some((e) => e.date.startsWith(monthStr));
    if (!hasData) {
      toast.error(`No expenses found for ${monthNames[month - 1]} ${selectedYear}`);
      return;
    }
    generateMonthlyExpenseReport(expenses, selectedYear, month);
    toast.success(`Report downloaded for ${monthNames[month - 1]} ${selectedYear}`);
  };

  const handleAddCategory = (name: string) => {
    setCategories((prev) => [...prev, name]);
  };

  const handleEditCategory = (oldName: string, newName: string) => {
    setCategories((prev) => prev.map((c) => (c === oldName ? newName : c)));
    setExpenses((prev) =>
      prev.map((e) => (e.category === oldName ? { ...e, category: newName } : e))
    );
  };

  const handleDeleteCategory = (name: string) => {
    setCategories((prev) => prev.filter((c) => c !== name));
  };

  return (
    <div className="space-y-6 xl:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl xl:text-3xl font-bold text-foreground">Expense Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and categorize all operational expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={reportMonth} onValueChange={setReportMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((name, i) => (
                <SelectItem key={i} value={String(i + 1)}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-1.5" /> Download Report
          </Button>
          <YearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-1.5 text-xs sm:text-sm">
            <Receipt className="h-4 w-4" /> Expenses
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5 text-xs sm:text-sm">
            <Tag className="h-4 w-4" /> Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ExpenseOverviewTab categories={categories} selectedYear={selectedYear} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpenseListTab categories={categories} selectedYear={selectedYear} />
        </TabsContent>
        <TabsContent value="categories">
          <ExpenseCategoryTab
            categories={categories}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            selectedYear={selectedYear}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
