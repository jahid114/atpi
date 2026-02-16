import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Receipt, Tag } from "lucide-react";
import { useFinancial } from "@/contexts/FinancialContext";
import { ExpenseOverviewTab } from "@/components/expenses/ExpenseOverviewTab";
import { ExpenseListTab } from "@/components/expenses/ExpenseListTab";
import { ExpenseCategoryTab } from "@/components/expenses/ExpenseCategoryTab";

const defaultCategories = ["Salary", "Rent", "Utilities", "Software", "Legal", "Marketing", "Travel", "Other"];

export default function Expenses() {
  const { setExpenses } = useFinancial();
  const [categories, setCategories] = useState<string[]>(defaultCategories);

  const handleAddCategory = (name: string) => {
    setCategories((prev) => [...prev, name]);
  };

  const handleEditCategory = (oldName: string, newName: string) => {
    setCategories((prev) => prev.map((c) => (c === oldName ? newName : c)));
    // Update existing expenses with the old category name
    setExpenses((prev) =>
      prev.map((e) => (e.category === oldName ? { ...e, category: newName } : e))
    );
  };

  const handleDeleteCategory = (name: string) => {
    setCategories((prev) => prev.filter((c) => c !== name));
  };

  return (
    <div className="space-y-6 xl:space-y-8">
      <div>
        <h1 className="text-2xl xl:text-3xl font-bold text-foreground">Expense Ledger</h1>
        <p className="text-sm text-muted-foreground mt-1">Track and categorize all operational expenses</p>
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
          <ExpenseOverviewTab categories={categories} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpenseListTab categories={categories} />
        </TabsContent>
        <TabsContent value="categories">
          <ExpenseCategoryTab
            categories={categories}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
