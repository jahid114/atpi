import { useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/use-pagination";
import type { ShortTermProject } from "@/types/short-term";
import { fmt } from "@/types/short-term";

interface Props {
  project: ShortTermProject;
}

export function STIInvestorsTab({ project }: Props) {
  const [search, setSearch] = useState("");

  const approved = useMemo(() => {
    return project.investors
      .filter((inv) => inv.status === "approved")
      .filter((inv) => inv.investorName.toLowerCase().includes(search.toLowerCase()) || inv.email.toLowerCase().includes(search.toLowerCase()));
  }, [project.investors, search]);

  const { paginatedItems, currentPage, totalPages, totalItems, goToPage, hasNextPage, hasPrevPage } = usePagination(approved);

  const totalFunded = approved.reduce((s, inv) => s + inv.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search investors..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <p className="text-xs text-muted-foreground whitespace-nowrap">{approved.length} investor{approved.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Investor</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2">
                  <p className="font-medium text-foreground">{inv.investorName}</p>
                  <p className="text-xs text-muted-foreground">{inv.email}</p>
                </td>
                <td className="px-3 py-2 text-right font-medium text-foreground">{fmt(inv.amount)}</td>
                <td className="px-3 py-2 text-muted-foreground text-xs">{inv.date}</td>
              </tr>
            ))}
            {paginatedItems.length === 0 && (
              <tr><td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">No approved investors yet.</td></tr>
            )}
          </tbody>
          {approved.length > 0 && (
            <tfoot>
              <tr className="border-t border-border bg-muted/30">
                <td className="px-3 py-2 font-semibold text-foreground">Total</td>
                <td className="px-3 py-2 text-right font-bold text-profit">{fmt(totalFunded)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={goToPage}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
      />
    </div>
  );
}
