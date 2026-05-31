import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type DashboardExportData = {
  period: string;
  dateLabel: string;
  tenantName: string;
  stats: {
    totalRevenue: number;
    totalTransactions: number;
    averageOrderValue: number;
    estimatedProfit: number;
  };
  revenue: { cash: number; qris: number; other: number };
  salesChart: Array<{ label: string; val: number; trx: number }>;
  bestSeller: Array<{ name: string; qty: number }>;
  leastSeller: Array<{ name: string; qty: number }>;
};

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export function exportDashboardPDF(data: DashboardExportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("BingGo", 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Laporan Dashboard", 14, 27);

  // Period info
  doc.setFontSize(9);
  doc.text(`Periode: ${data.dateLabel}`, 14, 34);
  doc.text(`Tenant: ${data.tenantName}`, 14, 40);
  doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, 14, 46);

  // Divider
  doc.setDrawColor(200);
  doc.line(14, 50, pageWidth - 14, 50);

  // Summary Stats
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("Ringkasan", 14, 58);

  autoTable(doc, {
    startY: 62,
    head: [["Metrik", "Nilai"]],
    body: [
      ["Total Revenue", formatRp(data.stats.totalRevenue)],
      ["Total Transaksi", `${data.stats.totalTransactions} transaksi`],
      ["Rata-rata Order", formatRp(data.stats.averageOrderValue)],
      ["Estimasi Profit", formatRp(data.stats.estimatedProfit)],
    ],
    theme: "grid",
    headStyles: { fillColor: [45, 140, 130], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: "bold" } },
    margin: { left: 14, right: 14 },
  });

  // Revenue Breakdown
  const revenueY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Revenue by Payment Method", 14, revenueY);

  const totalRevenue = data.revenue.cash + data.revenue.qris + data.revenue.other || 1;
  autoTable(doc, {
    startY: revenueY + 4,
    head: [["Metode", "Nominal", "Persentase"]],
    body: [
      ["Cash", formatRp(data.revenue.cash), `${Math.round((data.revenue.cash / totalRevenue) * 100)}%`],
      ["QRIS", formatRp(data.revenue.qris), `${Math.round((data.revenue.qris / totalRevenue) * 100)}%`],
      ["Lainnya", formatRp(data.revenue.other), `${Math.round((data.revenue.other / totalRevenue) * 100)}%`],
      ["Total", formatRp(data.revenue.cash + data.revenue.qris + data.revenue.other), "100%"],
    ],
    theme: "grid",
    headStyles: { fillColor: [45, 140, 130], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  // Sales Chart Data
  if (data.salesChart.length > 0) {
    const chartY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Detail Sales", 14, chartY);

    autoTable(doc, {
      startY: chartY + 4,
      head: [["Waktu", "Revenue", "Transaksi"]],
      body: data.salesChart.map((row) => [row.label, formatRp(row.val), `${row.trx}`]),
      theme: "grid",
      headStyles: { fillColor: [45, 140, 130], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });
  }

  // Best Seller
  if (data.bestSeller.length > 0) {
    const bestY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Check if we need a new page
    if (bestY > 250) {
      doc.addPage();
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Best Seller", 14, 20);
      autoTable(doc, {
        startY: 24,
        head: [["#", "Menu", "Qty"]],
        body: data.bestSeller.map((item, i) => [`${i + 1}`, item.name, `${item.qty} pcs`]),
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });
    } else {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Best Seller", 14, bestY);
      autoTable(doc, {
        startY: bestY + 4,
        head: [["#", "Menu", "Qty"]],
        body: data.bestSeller.map((item, i) => [`${i + 1}`, item.name, `${item.qty} pcs`]),
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });
    }
  }

  // Least Seller
  if (data.leastSeller.length > 0) {
    const leastY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    if (leastY > 250) {
      doc.addPage();
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Least Selling", 14, 20);
      autoTable(doc, {
        startY: 24,
        head: [["#", "Menu", "Qty"]],
        body: data.leastSeller.map((item, i) => [`${i + 1}`, item.name, `${item.qty} pcs`]),
        theme: "grid",
        headStyles: { fillColor: [239, 68, 68], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });
    } else {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Least Selling", 14, leastY);
      autoTable(doc, {
        startY: leastY + 4,
        head: [["#", "Menu", "Qty"]],
        body: data.leastSeller.map((item, i) => [`${i + 1}`, item.name, `${item.qty} pcs`]),
        theme: "grid",
        headStyles: { fillColor: [239, 68, 68], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`BingGo POS — Halaman ${i} dari ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
  }

  // Save
  const fileName = `Laporan-Dashboard-${data.dateLabel.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
  doc.save(fileName);
}


export async function exportDashboardExcel(data: DashboardExportData) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BingGo POS";
  workbook.created = new Date();

  // Sheet 1: Summary
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Metrik", key: "metric", width: 25 },
    { header: "Nilai", key: "value", width: 30 },
  ];
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.addRow({ metric: "Periode", value: data.dateLabel });
  summarySheet.addRow({ metric: "Total Revenue", value: formatRp(data.stats.totalRevenue) });
  summarySheet.addRow({ metric: "Total Transaksi", value: data.stats.totalTransactions });
  summarySheet.addRow({ metric: "Rata-rata Order", value: formatRp(data.stats.averageOrderValue) });
  summarySheet.addRow({ metric: "Estimasi Profit", value: formatRp(data.stats.estimatedProfit) });
  summarySheet.addRow({});
  summarySheet.addRow({ metric: "REVENUE BY PAYMENT", value: "" });
  const totalRev = data.revenue.cash + data.revenue.qris + data.revenue.other || 1;
  summarySheet.addRow({ metric: "Cash", value: `${formatRp(data.revenue.cash)} (${Math.round((data.revenue.cash / totalRev) * 100)}%)` });
  summarySheet.addRow({ metric: "QRIS", value: `${formatRp(data.revenue.qris)} (${Math.round((data.revenue.qris / totalRev) * 100)}%)` });
  summarySheet.addRow({ metric: "Lainnya", value: `${formatRp(data.revenue.other)} (${Math.round((data.revenue.other / totalRev) * 100)}%)` });

  // Sheet 2: Sales Detail
  if (data.salesChart.length > 0) {
    const salesSheet = workbook.addWorksheet("Sales Detail");
    salesSheet.columns = [
      { header: "Waktu", key: "label", width: 15 },
      { header: "Revenue", key: "revenue", width: 20 },
      { header: "Transaksi", key: "trx", width: 12 },
    ];
    salesSheet.getRow(1).font = { bold: true };
    for (const row of data.salesChart) {
      salesSheet.addRow({ label: row.label, revenue: formatRp(row.val), trx: row.trx });
    }
  }

  // Sheet 3: Best Seller
  if (data.bestSeller.length > 0) {
    const bestSheet = workbook.addWorksheet("Best Seller");
    bestSheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Menu", key: "name", width: 30 },
      { header: "Qty (pcs)", key: "qty", width: 12 },
    ];
    bestSheet.getRow(1).font = { bold: true };
    data.bestSeller.forEach((item, i) => {
      bestSheet.addRow({ no: i + 1, name: item.name, qty: item.qty });
    });
  }

  // Sheet 4: Least Selling
  if (data.leastSeller.length > 0) {
    const leastSheet = workbook.addWorksheet("Least Selling");
    leastSheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Menu", key: "name", width: 30 },
      { header: "Qty (pcs)", key: "qty", width: 12 },
    ];
    leastSheet.getRow(1).font = { bold: true };
    data.leastSeller.forEach((item, i) => {
      leastSheet.addRow({ no: i + 1, name: item.name, qty: item.qty });
    });
  }

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Laporan-Dashboard-${data.dateLabel.replace(/[^a-zA-Z0-9]/g, "-")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
