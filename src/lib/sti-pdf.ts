import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ShortTermProject, STInvestorEntry } from "@/types/short-term";
import { fmt, statusConfig } from "@/types/short-term";

const BRAND_DARK = [15, 23, 42] as const;
const BRAND_LIGHT = [248, 250, 252] as const;
const BRAND_MID = [241, 245, 249] as const;
const TEXT_PRIMARY = [15, 23, 42] as const;
const TEXT_SECONDARY = [100, 116, 139] as const;
const ACCENT_GREEN = [34, 197, 94] as const;

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

// ─── Invoice PDF ───────────────────────────────────────────
export function generateSTIInvoice(project: ShortTermProject, entry: STInvestorEntry) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const expectedProfit = Math.round(entry.amount * (project.expectedReturn / 100));

  // Header
  addHeader(doc, "INVESTMENT INVOICE", `Invoice #INV-${String(entry.id).padStart(5, "0")}`);

  // Date line
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`Date: ${entry.date}`, pw - 14, 28, { align: "right" });

  let y = 52;

  // Project Info Box
  doc.setFillColor(...BRAND_MID);
  doc.roundedRect(14, y, pw - 28, 30, 3, 3, "F");
  doc.setTextColor(...TEXT_PRIMARY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Project Details", 20, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(`Name: ${project.name}`, 20, y + 16);
  doc.text(`Duration: ${project.startDate} — ${project.endDate}`, 20, y + 23);
  doc.text(`Expected Return: ${project.expectedReturn}%`, pw / 2, y + 16);
  doc.text(`Status: ${statusConfig[project.status].label}`, pw / 2, y + 23);
  y += 38;

  // Investor Info Box
  doc.setFillColor(...BRAND_MID);
  doc.roundedRect(14, y, pw - 28, 24, 3, 3, "F");
  doc.setTextColor(...TEXT_PRIMARY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Investor Details", 20, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(`Name: ${entry.investorName}`, 20, y + 16);
  doc.text(`Phone: ${entry.phone}`, pw / 2, y + 16);
  if (entry.email) doc.text(`Email: ${entry.email}`, 20, y + 22);
  y += 32;

  // Amount Table
  autoTable(doc, {
    startY: y,
    head: [["Description", "Amount"]],
    body: [
      ["Investment Amount", fmt(entry.amount)],
      [`Expected Profit (${project.expectedReturn}%)`, fmt(expectedProfit)],
      ["Funding Source", (entry.fundingSource || "direct").charAt(0).toUpperCase() + (entry.fundingSource || "direct").slice(1)],
    ],
    foot: [["Total Expected Return", fmt(entry.amount + expectedProfit)]],
    theme: "grid",
    headStyles: { fillColor: [...BRAND_DARK], textColor: 255, fontStyle: "bold", fontSize: 10 },
    footStyles: { fillColor: [...ACCENT_GREEN], textColor: 255, fontStyle: "bold", fontSize: 11 },
    bodyStyles: { fontSize: 10, textColor: [...TEXT_PRIMARY] },
    alternateRowStyles: { fillColor: [...BRAND_LIGHT] },
    columnStyles: { 1: { halign: "right", cellWidth: 60 } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Status Badge
  const statusLabel = entry.status.charAt(0).toUpperCase() + entry.status.slice(1);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_PRIMARY);
  doc.text("Payment Status:", 14, y);
  if (entry.status === "approved") {
    doc.setTextColor(...ACCENT_GREEN);
  } else if (entry.status === "rejected") {
    doc.setTextColor(239, 68, 68);
  } else {
    doc.setTextColor(234, 179, 8);
  }
  doc.text(statusLabel, 55, y);

  addFooters(doc);
  doc.save(`Invoice_${entry.investorName.replace(/\s+/g, "_")}_${entry.date}.pdf`);
}

// ─── Overall Report PDF ───────────────────────────────────
export function generateSTIReport(project: ShortTermProject) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  const approved = project.investors.filter((i) => i.status === "approved");
  const pending = project.investors.filter((i) => i.status === "pending");
  const rejected = project.investors.filter((i) => i.status === "rejected");
  const funded = approved.reduce((s, i) => s + i.amount, 0);
  const progress = Math.min(100, (funded / project.targetAmount) * 100);
  const remaining = Math.max(0, project.targetAmount - funded);

  // Header
  addHeader(doc, "PROJECT REPORT", project.name);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`Status: ${statusConfig[project.status].label}`, pw - 14, 28, { align: "right" });

  let y = 52;

  // Summary KPIs
  const kpis = [
    ["Target Amount", fmt(project.targetAmount)],
    ["Funded Amount", fmt(funded)],
    ["Remaining", fmt(remaining)],
    ["Funding Progress", `${progress.toFixed(1)}%`],
    ["Expected Return", `${project.expectedReturn}%`],
    ["Total Investors", String(project.investors.length)],
    ["Approved", String(approved.length)],
    ["Pending", String(pending.length)],
    ["Rejected", String(rejected.length)],
    ["Start Date", project.startDate],
    ["End Date", project.endDate],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: kpis,
    theme: "grid",
    headStyles: { fillColor: [...BRAND_DARK], textColor: 255, fontStyle: "bold", fontSize: 10 },
    bodyStyles: { fontSize: 10, textColor: [...TEXT_PRIMARY] },
    alternateRowStyles: { fillColor: [...BRAND_LIGHT] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 }, 1: { halign: "right" } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // Approved Investors
  if (approved.length > 0) {
    if (y > doc.internal.pageSize.getHeight() - 50) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_PRIMARY);
    doc.text("Approved Investors", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["#", "Name", "Phone", "Amount", "Date"]],
      body: approved.map((inv, i) => [
        String(i + 1), inv.investorName, inv.phone, fmt(inv.amount), inv.date,
      ]),
      foot: [["", "Total", "", fmt(funded), ""]],
      theme: "grid",
      headStyles: { fillColor: [...ACCENT_GREEN], textColor: 255, fontStyle: "bold", fontSize: 9 },
      footStyles: { fillColor: [...BRAND_MID], textColor: [...TEXT_PRIMARY], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [...TEXT_PRIMARY] },
      alternateRowStyles: { fillColor: [...BRAND_LIGHT] },
      columnStyles: { 0: { cellWidth: 12, halign: "center" }, 3: { halign: "right" } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 14;
  }

  // Pending Investors
  if (pending.length > 0) {
    if (y > doc.internal.pageSize.getHeight() - 50) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_PRIMARY);
    doc.text("Pending Investors", 14, y);
    y += 4;

    const pendingTotal = pending.reduce((s, i) => s + i.amount, 0);
    autoTable(doc, {
      startY: y,
      head: [["#", "Name", "Phone", "Amount", "Date"]],
      body: pending.map((inv, i) => [
        String(i + 1), inv.investorName, inv.phone, fmt(inv.amount), inv.date,
      ]),
      foot: [["", "Total", "", fmt(pendingTotal), ""]],
      theme: "grid",
      headStyles: { fillColor: [234, 179, 8], textColor: 255, fontStyle: "bold", fontSize: 9 },
      footStyles: { fillColor: [...BRAND_MID], textColor: [...TEXT_PRIMARY], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [...TEXT_PRIMARY] },
      alternateRowStyles: { fillColor: [...BRAND_LIGHT] },
      columnStyles: { 0: { cellWidth: 12, halign: "center" }, 3: { halign: "right" } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 14;
  }

  // Description
  if (y > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = 20; }
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_PRIMARY);
  doc.text("Project Description", 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_SECONDARY);
  const descLines = doc.splitTextToSize(project.description, pw - 28);
  doc.text(descLines, 14, y);

  addFooters(doc);
  doc.save(`${project.name.replace(/\s+/g, "_")}_Report.pdf`);
}
