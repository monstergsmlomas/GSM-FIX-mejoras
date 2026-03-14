import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Payment, Settings, RepairOrderWithDetails, Branch } from "@shared/schema";
// 👇 IMPORTAMOS LA CACHÉ PARA LEER LA SUCURSAL SIN ROMPER OTROS ARCHIVOS 👇
import { queryClient } from "@/lib/queryClient"; 

export function printTicket(payment: Payment & { order?: RepairOrderWithDetails }, settings?: Settings) {
  
  // 🔥 MAGIA: Buscamos qué sucursal hizo este pago o en qué sucursal estamos parados
  const branches = queryClient.getQueryData<Branch[]>(["/api/branches"]);
  const activeBranchId = localStorage.getItem('activeBranchId');
  
  // Priorizamos la sucursal donde se hizo el pago, y si no, la sucursal activa en pantalla
  const branchIdToUse = payment.branchId || activeBranchId;
  const currentBranch = branches?.find(b => b.id === branchIdToUse);

  // 1. Preparar datos básicos (Priorizando los datos de la SUCURSAL sobre los globales)
  const date = format(new Date(payment.date), "dd/MM/yyyy HH:mm", { locale: es });
  
  // Si la sucursal tiene nombre/dirección/teléfono, usamos esos. Si están vacíos, usamos los generales.
  const businessName = currentBranch?.name || settings?.shopName || "GSM FIX";
  const address = currentBranch?.address || settings?.address || "";
  const phone = currentBranch?.phone || settings?.phone || "";
  
  const footerText = settings?.ticketFooter || "Gracias por su compra.\nConserve este ticket para garantía.";
  const logoUrl = settings?.logoUrl; // El logo se mantiene global para conservar la marca matriz

  // DETECTAR FORMATO (Default a ticket si no está definido)
  const isA4 = settings?.printFormat === 'a4';

  // 2. Detectar cliente
  let clientName = "Consumidor Final";
  let clientDni = "";
  let clientPhone = "";

  if (payment.order?.client) {
    clientName = payment.order.client.name;
    clientDni = payment.order.client.dni || "";
    clientPhone = payment.order.client.phone || "";
  }

  // 3. Generar filas de items (HTML)
  let itemsHtml = "";

  if (payment.items && Array.isArray(payment.items) && payment.items.length > 0) {
    itemsHtml = payment.items.map((item: any) => `
      <tr>
        <td class="qty">${item.quantity}</td>
        <td class="desc">${item.name}</td>
        <td class="price">$${Number(item.price * item.quantity).toLocaleString("es-AR")}</td>
      </tr>
    `).join("");
  } else {
    const desc = payment.orderId
      ? `Reparación ${payment.order?.device?.brand || ""} ${payment.order?.device?.model || ""}`
      : (payment.notes || "Venta general");

    itemsHtml = `
      <tr>
        <td class="qty">1</td>
        <td class="desc">${desc}</td>
        <td class="price">$${Number(payment.amount).toLocaleString("es-AR")}</td>
      </tr>
    `;
  }

  // 4. Estilos según formato
  const styles = isA4
    ? `
      /* ESTILOS A4 */
      @page { size: A4; margin: 2cm; }
      body { font-family: sans-serif; font-size: 14px; color: #333; line-height: 1.4; max-width: 210mm; margin: 0 auto; }
      .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
      .company-info h2 { margin: 0 0 5px 0; font-size: 24px; text-transform: uppercase; }
      .company-info p { margin: 0; font-size: 12px; color: #666; }
      .ticket-info { text-align: right; }
      .ticket-info h3 { margin: 0 0 10px 0; font-size: 18px; color: #333; }
      
      .client-section { margin-bottom: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 4px; border: 1px solid #eee; }
      .client-section strong { display: inline-block; width: 80px; }
      
      table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      th { text-align: left; padding: 10px; background-color: #333; color: white; text-transform: uppercase; font-size: 12px; }
      td { padding: 10px; border-bottom: 1px solid #eee; }
      .qty { width: 10%; text-align: center; }
      .desc { width: 70%; }
      .price { width: 20%; text-align: right; font-family: monospace; font-size: 14px; }
      
      .total-section { display: flex; justify-content: flex-end; }
      .total-box { width: 300px; text-align: right; }
      .total-row { font-size: 24px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
      .method { font-size: 12px; color: #666; margin-top: 5px; text-transform: uppercase; }
      
      .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; white-space: pre-wrap; }
      .logo-img { max-height: 80px; max-width: 150px; margin-bottom: 10px; object-fit: contain; }
    `
    : `
      /* ESTILOS TÉRMICOS (72mm/80mm) */
      body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 72mm; margin: 0; padding: 5px; color: #000; }
      .header { text-align: center; margin-bottom: 15px; }
      .header h2 { margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }
      .header p { margin: 2px 0; font-size: 11px; }
      .logo-img { max-height: 60px; max-width: 80%; margin: 0 auto 5px auto; display: block; }
      
      .divider { border-top: 1px dashed #000; margin: 8px 0; }
      .info { margin-bottom: 8px; font-size: 11px; }
      
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th { text-align: left; border-bottom: 1px solid #000; padding-bottom: 2px; }
      td { padding: 2px 0; vertical-align: top; }
      .qty { width: 10%; }
      .desc { width: 60%; }
      .price { width: 30%; text-align: right; }
      
      .total-section { margin-top: 10px; text-align: right; }
      .total-row { font-size: 16px; font-weight: bold; margin-top: 5px; }
      .method { font-size: 10px; margin-top: 2px; text-transform: uppercase; }
      
      .footer { text-align: center; margin-top: 20px; font-size: 10px; white-space: pre-wrap; }
    `;

  // 5. Crear ventana de impresión
  const printWindow = window.open("", "PRINT", "height=600,width=800");

  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo #${payment.id.slice(0, 4)}</title>
          <style>
            ${styles}
            
            /* BOTONES DE UI */
            .no-print {
              background: #f0f0f0;
              padding: 10px;
              text-align: center;
              border-bottom: 1px dashed #ccc;
              margin-bottom: 10px;
              position: sticky;
              top: 0;
              left: 0;
              right: 0;
              z-index: 100;
            }
            .btn {
              cursor: pointer;
              background: #000;
              color: #fff;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              font-family: sans-serif;
              font-size: 14px;
              margin: 0 5px;
            }
            .btn-close { background: #cc0000; }

            @media print {
              .no-print { display: none !important; }
              body { padding: 0; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button class="btn" onclick="window.print()">🖨️ Imprimir (${isA4 ? 'A4' : 'Ticket'})</button>
            <button class="btn btn-close" onclick="window.close()">❌ Cerrar</button>
          </div>

          <div class="content">
            
            ${isA4 ? `
              <div class="header">
                <div class="company-info">
                  ${logoUrl ? `<img src="${logoUrl}" class="logo-img" />` : ''}
                  <h2>${businessName}</h2>
                  ${address ? `<p>📍 ${address}</p>` : ''}
                  ${phone ? `<p>📞 ${phone}</p>` : ''}
                </div>
                <div class="ticket-info">
                  <h3>RECIBO DE PAGO</h3>
                  <p><strong>Nº:</strong> #${payment.id.slice(0, 8).toUpperCase()}</p>
                  <p><strong>Fecha:</strong> ${date}</p>
                </div>
              </div>

              <div class="client-section">
                <p><strong>Cliente:</strong> ${clientName}</p>
                ${clientDni ? `<p><strong>DNI:</strong> ${clientDni}</p>` : ''}
                ${clientPhone ? `<p><strong>Teléfono:</strong> ${clientPhone}</p>` : ''}
              </div>
            ` : `
              <div class="header">
                ${logoUrl ? `<img src="${logoUrl}" class="logo-img" />` : ''}
                <h2>${businessName}</h2>
                ${address ? `<p>${address}</p>` : ''}
                ${phone ? `<p>Tel: ${phone}</p>` : ''}
              </div>
              
              <div class="info">
                <strong>Fecha:</strong> ${date}<br>
                <strong>Ticket:</strong> #${payment.id.slice(0, 8).toUpperCase()}<br>
                <strong>Cliente:</strong> ${clientName}
              </div>
              <div class="divider"></div>
            `}

            <table>
              <thead>
                <tr>
                  <th class="qty">Cant</th>
                  <th class="desc">Descripción</th>
                  <th class="price">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            ${!isA4 ? '<div class="divider"></div>' : ''}

            <div class="total-section">
              <div class="total-box">
                <div class="total-row">TOTAL: $${Number(payment.amount).toLocaleString("es-AR")}</div>
                <div class="method">Método de Pago: ${payment.method.toUpperCase()}</div>
              </div>
            </div>
            
            <div class="footer">
              ${footerText}
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
  }
}