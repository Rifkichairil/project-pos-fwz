import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type Transaction = {
  id: string;
  date: string;
  time: string;
  customer: string;
  handledBy?: string;
  type: string;
  total: number;
  method: string;
  paymentStatus: string;
  orderStatus: string;
};

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export function exportTransactionsPDF(transactions: Transaction[], dateLabel: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("BingGo", 14, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Laporan Transaksi", 14, 24);
  doc.setFontSize(9);
  doc.text(`Periode: ${dateLabel}`, 14, 30);
  doc.text(`Total: ${transactions.length} transaksi | ${formatRp(transactions.reduce((s, t) => s + t.total, 0))}`, 14, 36);
  doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, 14, 42);

  doc.setDrawColor(200);
  doc.line(14, 45, pageWidth - 14, 45);

  // Table
  autoTable(doc, {
    startY: 49,
    head: [["ID", "Tanggal", "Jam", "Customer", "Kasir", "Tipe", "Total", "Metode", "Payment", "Status"]],
    body: transactions.map((t) => [
      t.id,
      t.date,
      t.time,
      t.customer,
      t.handledBy || "-",
      t.type,
      formatRp(t.total),
      t.method,
      t.paymentStatus,
      t.orderStatus,
    ]),
    theme: "grid",
    headStyles: { fillColor: [45, 140, 130], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 2 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`BingGo POS — Halaman ${i} dari ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
  }

  doc.save(`Laporan-Transaksi-${dateLabel.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`);
}

export async function exportTransactionsExcel(transactions: Transaction[], dateLabel: string) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BingGo POS";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Transaksi");
  sheet.columns = [
    { header: "ID", key: "id", width: 22 },
    { header: "Tanggal", key: "date", width: 12 },
    { header: "Jam", key: "time", width: 10 },
    { header: "Customer", key: "customer", width: 20 },
    { header: "Kasir", key: "handledBy", width: 18 },
    { header: "Tipe", key: "type", width: 10 },
    { header: "Total", key: "total", width: 15 },
    { header: "Metode", key: "method", width: 10 },
    { header: "Payment", key: "paymentStatus", width: 12 },
    { header: "Status", key: "orderStatus", width: 12 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const t of transactions) {
    sheet.addRow({
      id: t.id,
      date: t.date,
      time: t.time,
      customer: t.customer,
      handledBy: t.handledBy || "-",
      type: t.type,
      total: t.total,
      method: t.method,
      paymentStatus: t.paymentStatus,
      orderStatus: t.orderStatus,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Transaksi-${dateLabel.replace(/[^a-zA-Z0-9]/g, "-")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
