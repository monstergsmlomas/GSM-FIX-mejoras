import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { Branch } from "@shared/schema";
// 👇 IMPORTAMOS LA CACHÉ PARA LEER LA SUCURSAL 👇
import { queryClient } from "@/lib/queryClient"; 

export const generateMonthlyReportPDF = (
  reportData: any,
  settings: any, 
  customFilename: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 🔥 MAGIA: Buscamos en qué sucursal estamos parados
  const branches = queryClient.getQueryData<Branch[]>(["/api/branches"]);
  const activeBranchId = localStorage.getItem('activeBranchId');
  const currentBranch = branches?.find(b => b.id === activeBranchId);

  // ---------------------------------------------------------
  // 1. ENCABEZADO PREMIUM (Priorizamos datos de la Sucursal Activa)
  // ---------------------------------------------------------
  const shopName = currentBranch?.name || settings?.shopName || "MI TALLER";
  
  // OJO: En tu código original decía 'settings?.shopAddress', 
  // pero el schema general se llama 'address', 'phone' y 'email'. 
  // Lo corrijo acá para que no te dé undefined.
  const shopAddress = currentBranch?.address || settings?.address || "";
  const shopPhone = currentBranch?.phone || settings?.phone || "";
  const shopEmail = settings?.email || ""; // El email suele ser global

  // Nombre del local
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text(shopName.toUpperCase(), pageWidth / 2, 20, { align: "center" });

  // Subtítulos con la información de contacto
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  
  let currentY = 26;
  if (shopAddress) {
    doc.text(shopAddress, pageWidth / 2, currentY, { align: "center" });
    currentY += 5;
  }
  
  if (shopPhone || shopEmail) {
    const contactInfo = [shopPhone, shopEmail].filter(Boolean).join("  |  ");
    doc.text(contactInfo, pageWidth / 2, currentY, { align: "center" });
    currentY += 5;
  }

  // Línea separadora elegante
  currentY += 2;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 10;

  // Título del Documento
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("REPORTE DE CAJA", pageWidth / 2, currentY, { align: "center" });
  currentY += 12;

  // ---------------------------------------------------------
  // 2. FECHAS DEL PERIODO
  // ---------------------------------------------------------
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const startDate = format(new Date(reportData.period.startDate), "dd/MM/yyyy");
  const endDate = format(new Date(reportData.period.endDate), "dd/MM/yyyy");
  
  doc.text(`Desde: ${startDate}`, 14, currentY);
  doc.text(`Hasta: ${endDate}`, pageWidth - 14, currentY, { align: "right" });
  currentY += 10;

  // ---------------------------------------------------------
  // 3. TABLA 1: INGRESOS POR FORMA DE PAGO
  // ---------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Ingresos por Forma de Pago", 14, currentY);

  const incomeBody = reportData.incomeByMethod.map((item: any) => [
    item.method.toUpperCase(),
    formatMoney(item.total)
  ]);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Forma de Pago", "Monto"]],
    body: incomeBody,
    foot: [["Total Ingresos", formatMoney(reportData.totals.income)]],
    theme: "plain",
    headStyles: { fillColor: [235, 235, 235], textColor: [0, 0, 0], fontStyle: "bold" },
    footStyles: { fillColor: [235, 235, 235], textColor: [0, 0, 0], fontStyle: "bold" },
    bodyStyles: { textColor: [50, 50, 50] },
    styles: { fontSize: 10, cellPadding: 5, lineColor: [220, 220, 220], lineWidth: { bottom: 0.1 } },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "right" }
    },
    willDrawCell: (data) => {
      if (data.section === 'foot' && data.column.index === 0) {
        data.cell.styles.halign = 'right';
      }
    }
  });

  // ---------------------------------------------------------
  // 4. TABLA 2: RESUMEN FINANCIERO
  // ---------------------------------------------------------
  const finalY = (doc as any).lastAutoTable.finalY + 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Resumen Financiero", 14, finalY);

  autoTable(doc, {
    startY: finalY + 5,
    body: [
      ["Total Cobrado (Ingresos):", formatMoney(reportData.totals.income)],
      ["Total en Gastos (Egresos):", formatMoney(reportData.totals.expenses)],
      ["Balance Neto en Caja:", formatMoney(reportData.totals.balance)]
    ],
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 6 },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold", textColor: [80, 80, 80] },
      1: { halign: "right", fontStyle: "bold", textColor: [0, 0, 0] }
    },
    willDrawCell: (data) => {
      if (data.row.index === 2) {
        doc.setFillColor(235, 235, 235);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        if (reportData.totals.balance < 0 && data.column.index === 1) {
             doc.setTextColor(220, 38, 38);
        } else {
             doc.setTextColor(0, 0, 0);
        }
      }
    }
  });

  // ---------------------------------------------------------
  // 5. GUARDAR EL ARCHIVO
  // ---------------------------------------------------------
  doc.save(`${customFilename}.pdf`);
};