import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type IngredientData = {
  name: string;
  unit: string;
  price: number;
  supplier: string;
  stock: number;
  minStock: number;
  in30d: number;
  out30d: number;
};

type PurchaseData = {
  id: string;
  date: string;
  item: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
  supplier: string;
};

type MovementData = {
  id: string;
  date: string;
  item: string;
  type: string;
  qty: number;
  unit: string;
  ref: string;
  user: string;
};

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export function exportInventoryPDF(
  ingredients: IngredientData[],
  purchases: PurchaseData[],
  movements: MovementData[],
  activeTab: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("BingGo", 14, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Laporan Inventory", 14, 24);
  doc.setFontSize(9);
  doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, 14, 30);

  doc.setDrawColor(200);
  doc.line(14, 34, pageWidth - 14, 34);

  if (activeTab === "stock" || activeTab === "all") {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Stock Overview", 14, 42);

    autoTable(doc, {
      startY: 46,
      head: [["Nama", "Unit", "Harga/Unit", "Supplier", "Stok", "Min", "Masuk 30d", "Keluar 30d", "Status"]],
      body: ingredients.map((i) => [
        i.name,
        i.unit,
        formatRp(i.price),
        i.supplier,
        `${i.stock.toLocaleString("id-ID")} ${i.unit}`,
        `${i.minStock.toLocaleString("id-ID")}`,
        `+${i.in30d.toLocaleString("id-ID")}`,
        `-${i.out30d.toLocaleString("id-ID")}`,
        i.stock <= i.minStock ? "LOW" : "OK",
      ]),
      theme: "grid",
      headStyles: { fillColor: [45, 140, 130], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
  }

  if (activeTab === "purchase" || activeTab === "all") {
    const startY = activeTab === "all"
      ? (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
      : 42;

    if (startY > 240) doc.addPage();
    const y = startY > 240 ? 20 : startY;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Purchase History", 14, y);

    autoTable(doc, {
      startY: y + 4,
      head: [["ID PO", "Tanggal", "Item", "Qty", "Harga/Unit", "Total", "Supplier"]],
      body: purchases.map((p) => [
        p.id,
        p.date,
        p.item,
        `${p.qty.toLocaleString("id-ID")} ${p.unit}`,
        formatRp(p.price),
        formatRp(p.total),
        p.supplier,
      ]),
      theme: "grid",
      headStyles: { fillColor: [45, 140, 130], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
  }

  if (activeTab === "movement" || activeTab === "all") {
    const startY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ? (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
      : 42;

    if (startY > 240) doc.addPage();
    const y = startY > 240 ? 20 : startY;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Stock Movement", 14, y);

    autoTable(doc, {
      startY: y + 4,
      head: [["ID", "Tanggal", "Item", "Tipe", "Qty", "Ref", "User"]],
      body: movements.map((m) => [
        m.id,
        m.date,
        m.item,
        m.type === "in" ? "Masuk" : m.type === "out" ? "Keluar" : "Adjustment",
        `${m.type === "in" ? "+" : m.type === "out" ? "-" : "±"}${m.qty.toLocaleString("id-ID")} ${m.unit}`,
        m.ref,
        m.user,
      ]),
      theme: "grid",
      headStyles: { fillColor: [45, 140, 130], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`BingGo POS — Halaman ${i} dari ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
  }

  const tabLabel = activeTab === "stock" ? "Stock" : activeTab === "purchase" ? "Purchase" : activeTab === "movement" ? "Movement" : "All";
  doc.save(`Laporan-Inventory-${tabLabel}-${new Date().toISOString().split("T")[0]}.pdf`);
}

export async function exportInventoryExcel(
  ingredients: IngredientData[],
  purchases: PurchaseData[],
  movements: MovementData[],
  activeTab: string
) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BingGo POS";
  workbook.created = new Date();

  if (activeTab === "stock") {
    const sheet = workbook.addWorksheet("Stock");
    sheet.columns = [
      { header: "Nama", key: "name", width: 20 },
      { header: "Unit", key: "unit", width: 8 },
      { header: "Harga/Unit", key: "price", width: 15 },
      { header: "Supplier", key: "supplier", width: 18 },
      { header: "Stok", key: "stock", width: 12 },
      { header: "Min Stock", key: "minStock", width: 12 },
      { header: "Masuk 30d", key: "in30d", width: 12 },
      { header: "Keluar 30d", key: "out30d", width: 12 },
      { header: "Status", key: "status", width: 8 },
    ];
    sheet.getRow(1).font = { bold: true };
    for (const i of ingredients) {
      sheet.addRow({ name: i.name, unit: i.unit, price: i.price, supplier: i.supplier, stock: i.stock, minStock: i.minStock, in30d: i.in30d, out30d: i.out30d, status: i.stock <= i.minStock ? "LOW" : "OK" });
    }
  } else if (activeTab === "purchase") {
    const sheet = workbook.addWorksheet("Purchase");
    sheet.columns = [
      { header: "ID PO", key: "id", width: 18 },
      { header: "Tanggal", key: "date", width: 14 },
      { header: "Item", key: "item", width: 20 },
      { header: "Qty", key: "qty", width: 10 },
      { header: "Unit", key: "unit", width: 8 },
      { header: "Harga/Unit", key: "price", width: 15 },
      { header: "Total", key: "total", width: 15 },
      { header: "Supplier", key: "supplier", width: 18 },
    ];
    sheet.getRow(1).font = { bold: true };
    for (const p of purchases) {
      sheet.addRow({ id: p.id, date: p.date, item: p.item, qty: p.qty, unit: p.unit, price: p.price, total: p.total, supplier: p.supplier });
    }
  } else {
    const sheet = workbook.addWorksheet("Movement");
    sheet.columns = [
      { header: "ID", key: "id", width: 14 },
      { header: "Tanggal", key: "date", width: 14 },
      { header: "Item", key: "item", width: 20 },
      { header: "Tipe", key: "type", width: 12 },
      { header: "Qty", key: "qty", width: 10 },
      { header: "Unit", key: "unit", width: 8 },
      { header: "Ref", key: "ref", width: 18 },
      { header: "User", key: "user", width: 14 },
    ];
    sheet.getRow(1).font = { bold: true };
    for (const m of movements) {
      sheet.addRow({ id: m.id, date: m.date, item: m.item, type: m.type === "in" ? "Masuk" : m.type === "out" ? "Keluar" : "Adjustment", qty: m.qty, unit: m.unit, ref: m.ref, user: m.user });
    }
  }

  const tabLabel = activeTab === "stock" ? "Stock" : activeTab === "purchase" ? "Purchase" : "Movement";
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Inventory-${tabLabel}-${new Date().toISOString().split("T")[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
