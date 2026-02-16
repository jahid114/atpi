import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useFinancial } from "@/contexts/FinancialContext";

interface Props {
  categories: string[];
  onAddCategory: (name: string) => void;
  onEditCategory: (oldName: string, newName: string) => void;
  onDeleteCategory: (name: string) => void;
  selectedYear: number;
}

export function ExpenseCategoryTab({ categories, onAddCategory, onEditCategory, onDeleteCategory, selectedYear }: Props) {
  const { expenses } = useFinancial();
  const yearExpenses = useMemo(() => expenses.filter((e) => e.date.startsWith(String(selectedYear))), [expenses, selectedYear]);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteName, setDeleteName] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editOriginal, setEditOriginal] = useState("");

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("Category name is required.");
      return;
    }
    if (categories.includes(trimmed)) {
      toast.error("Category already exists.");
      return;
    }
    onAddCategory(trimmed);
    setNewName("");
    setAddOpen(false);
    toast.success(`Category "${trimmed}" added.`);
  };

  const openEdit = (name: string) => {
    setEditOriginal(name);
    setEditingName(name);
    setEditOpen(true);
  };

  const handleEdit = () => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      toast.error("Category name is required.");
      return;
    }
    if (trimmed !== editOriginal && categories.includes(trimmed)) {
      toast.error("Category already exists.");
      return;
    }
    onEditCategory(editOriginal, trimmed);
    setEditOpen(false);
    toast.success(`Category renamed to "${trimmed}".`);
  };

  const handleDelete = () => {
    if (!deleteName) return;
    onDeleteCategory(deleteName);
    setDeleteName(null);
    toast.success(`Category "${deleteName}" deleted.`);
  };

  const getCategoryCount = (cat: string) => yearExpenses.filter((e) => e.category === cat).length;
  const getCategoryTotal = (cat: string) => yearExpenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{categories.length} categor{categories.length !== 1 ? "ies" : "y"}</p>
        <Button size="sm" onClick={() => { setNewName(""); setAddOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const count = getCategoryCount(cat);
          const total = getCategoryTotal(cat);
          return (
            <div key={cat} className="bg-card border border-border rounded-lg p-4 kpi-shadow flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Tag className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{cat}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {count} expense{count !== 1 ? "s" : ""} · ${total.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(cat)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteName(cat)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
        {categories.length === 0 && (
          <div className="col-span-full border border-border rounded-lg p-8 text-center">
            <Tag className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No categories yet. Add one to get started.</p>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a new expense category.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Category Name *</Label>
              <Input placeholder="e.g. Insurance" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleAdd}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Rename this expense category. Existing expenses will be updated.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Category Name *</Label>
              <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteName} onOpenChange={(open) => !open && setDeleteName(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteName}"? Expenses in this category will keep their current label but the category will no longer appear in filters.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
