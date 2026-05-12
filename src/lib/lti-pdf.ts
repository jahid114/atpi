import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Investor, InvestmentEntry } from "@/types/investor";

const BRAND_DARK = [15, 23, 42] as const;
const BRAND_LIGHT = [248, 250, 252] as const;
const BRAND_MID = [241, 245, 249] as const;
const TEXT_PRIMARY = [15, 23, 42] as const;
const TEXT_SECONDARY = [100, 116, 139] as const;
const ACCENT_GREEN = [34, 197, 94] as const;

const fmtUSD = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 0, pw, 42, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, 14, 28);
  return 36;
}

function addFooters(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} · Page ${i} of ${pageCount}`,
      pw / 2, ph - 10, { align: "center" }
    );
  }
}

export interface LTIDistributionInvoiceArgs {
  investor: Investor;
  year: number;
  payout: InvestmentEntry;
  principal: number;
  totalProfit: number;
}

export function generateLTIInvoice({ investor, year, payout, principal, totalProfit }: LTIDistributionInvoiceArgs) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const sharePct = totalProfit > 0 ? (payout.amount / totalProfit) * 100 : 0;

  addHeader(doc, "PROFIT DISTRIBUTION INVOICE", `Invoice #LTI-${year}-${String(payout.id).slice(-5)}`);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`Date: ${payout.date}`, pw - 14, 28, { align: "right" });

  let y = 52;

  // Distribution Period Box
  doc.setFillColor(...BRAND_MID);
  doc.roundedRect(14, y, pw - 28, 30, 3, 3, "F");
  doc.setTextColor(...TEXT_PRIMARY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Distribution Period", 20, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(`Program: Long-Term Investment`, 20, y + 16);
  doc.text(`Distributed On: ${payout.date}`, 20, y + 23);
  doc.text(`Period: Year ${year}`, pw / 2, y + 16);
  doc.text(`Pool Profit: ${fmtUSD(totalProfit)}`, pw / 2, y + 23);
  y += 38;

  // Investor Info Box
  doc.setFillColor(...BRAND_MID);
  doc.roundedRect(14, y, pw - 28, 30, 3, 3, "F");
  doc.setTextColor(...TEXT_PRIMARY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Investor Details", 20, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(`Name: ${investor.name}`, 20, y + 16);
  doc.text(`Phone: ${investor.phone}`, pw / 2, y + 16);
  if (investor.email) doc.text(`Email: ${investor.email}`, 20, y + 23);
  if (investor.shares) doc.text(`Shares: ${investor.shares}`, pw / 2, y + 23);
  y += 38;

  // Amount Table
  autoTable(doc, {
    startY: y,
    head: [["Description", "Amount"]],
    body: [
      ["Principal Invested", fmtUSD(principal)],
      [`Profit Share (${sharePct.toFixed(2)}% of pool)`, fmtUSD(payout.amount)],
    ],
    foot: [["Total Distributed", fmtUSD(payout.amount)]],
    theme: "grid",
    headStyles: { fillColor: [...BRAND_DARK], textColor: 255, fontStyle: "bold", fontSize: 10 },
    footStyles: { fillColor: [...ACCENT_GREEN], textColor: 255, fontStyle: "bold", fontSize: 11 },
    bodyStyles: { fontSize: 10, textColor: [...TEXT_PRIMARY] },
    alternateRowStyles: { fillColor: [...BRAND_LIGHT] },
    columnStyles: { 1: { halign: "right", cellWidth: 60 } },
    margin: { left: 14, right: 14 },
  });

  let yEnd = (doc as any).lastAutoTable.finalY + 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_PRIMARY);
  doc.text("Status:", 14, yEnd);
  doc.setTextColor(...ACCENT_GREEN);
  doc.text("Distributed", 35, yEnd);

  addFooters(doc);
  doc.save(`LTI_Invoice_${investor.name.replace(/\s+/g, "_")}_${year}.pdf`);
}
