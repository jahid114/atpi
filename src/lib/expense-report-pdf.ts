import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Expense } from "@/contexts/FinancialContext";

const fmt = (n: number) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function generateMonthlyExpenseReport(expenses: Expense[], year: number, month: number) {
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const monthExpenses = expenses
    .filter((e) => e.date.startsWith(monthStr))
    .sort((a, b) => a.date.localeCompare(b.date));

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const title = `Monthly Expense Report`;
  const subtitle = `${monthNames[month - 1]} ${year}`;

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 18);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, 14, 28);

  const totalAmount = monthExpenses.reduce((s, e) => s + e.amount, 0);
  doc.setFontSize(11);
  doc.text(`Total: ${fmt(totalAmount)}  |  Entries: ${monthExpenses.length}`, 14, 36);

  let yPos = 50;

  // ── Section 1: Category Breakdown Summary ──
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Category Breakdown", 14, yPos);
  yPos += 4;

  const categoryMap: Record<string, { total: number; count: number }> = {};
  monthExpenses.forEach((e) => {
    if (!categoryMap[e.category]) categoryMap[e.category] = { total: 0, count: 0 };
    categoryMap[e.category].total += e.amount;
    categoryMap[e.category].count += 1;
  });

  const categoryRows = Object.entries(categoryMap)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([cat, data]) => [
      cat,
      String(data.count),
      fmt(data.total),
      totalAmount > 0 ? `${((data.total / totalAmount) * 100).toFixed(1)}%` : "0%",
    ]);

  if (categoryRows.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [["Category", "Entries", "Amount", "% of Total"]],
      body: categoryRows,
      foot: [["Total", String(monthExpenses.length), fmt(totalAmount), "100%"]],
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 10 },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold", fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 50 },
        2: { halign: "right" },
        3: { halign: "right" },
      },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 12;
  } else {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("No expenses recorded for this month.", 14, yPos + 6);
    yPos += 16;
  }

  // ── Section 2: Date-wise Grouped Details ──
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);

  if (yPos > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    yPos = 20;
  }
  doc.text("Date-wise Expense Details", 14, yPos);
  yPos += 4;

  // Group by date
  const dateGroups: Record<string, Expense[]> = {};
  monthExpenses.forEach((e) => {
    if (!dateGroups[e.date]) dateGroups[e.date] = [];
    dateGroups[e.date].push(e);
  });

  const sortedDates = Object.keys(dateGroups).sort();

  sortedDates.forEach((date) => {
    const group = dateGroups[date];
    const dateTotal = group.reduce((s, e) => s + e.amount, 0);

    if (yPos > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      yPos = 20;
    }

    // Date subheader
    doc.setFillColor(241, 245, 249);
    doc.rect(14, yPos - 1, pageWidth - 28, 8, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(date, 16, yPos + 5);
    doc.text(`Subtotal: ${fmt(dateTotal)}`, pageWidth - 14, yPos + 5, { align: "right" });
    yPos += 10;

    autoTable(doc, {
      startY: yPos,
      head: [["Category", "Description", "Amount"]],
      body: group.map((e) => [e.category, e.description || "—", fmt(e.amount)]),
      theme: "plain",
      headStyles: { fillColor: false, textColor: [100, 116, 139], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
      columnStyles: {
        2: { halign: "right" },
      },
      margin: { left: 16, right: 14 },
      tableLineWidth: 0,
    });
    yPos = (doc as any).lastAutoTable.finalY + 8;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} · Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`Expense_Report_${monthNames[month - 1]}_${year}.pdf`);
}
