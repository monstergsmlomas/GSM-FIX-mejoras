import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer, LayoutTemplate, FileText, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// 👇 Importamos el tipo Branch
import type { RepairOrderWithDetails, Settings, Branch } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
// 👇 Importamos queryClient para leer las sucursales
import { queryClient } from "@/lib/queryClient";

// --- HELPERS ---
const getFinancials = (order: RepairOrderWithDetails) => {
  const totalCost = order.finalCost > 0 ? order.finalCost : order.estimatedCost;

  const totalPaid = order.payments?.reduce((sum, p) => {
    if (p.items && p.items.length > 0) {
      const repairPayment = p.items
        .filter((i: any) => i.type === 'repair' || (!i.type && !i.name.toLowerCase().includes('recargo')))
        .reduce((s: number, i: any) => s + Number(i.price || 0), 0);
      return sum + repairPayment;
    }
    return sum + Number(p.amount);
  }, 0) || 0;

  const balance = Math.max(0, totalCost - totalPaid);
  return { totalCost, totalPaid, balance };
};

const getCheckValue = (checklist: any, key: string) => {
  const val = checklist?.[key];
  if (val === "yes") return "SI";
  if (val === "no") return "NO";
  return "-";
};

const cleanLabel = (text: string) => {
  return text.replace(/[¿?]/g, "").substring(0, 10);
};

// ==========================================
// 1. COPIA DEL TÉCNICO
// ==========================================
const TechnicianCopy = ({ order, settings, isFullPage = false }: { order: RepairOrderWithDetails, settings?: Settings, isFullPage?: boolean }) => {
  const { totalCost, totalPaid, balance } = getFinancials(order);
  const isBudget = order.status === "presupuesto";

  const checklistItems = settings?.checklistOptions && settings.checklistOptions.length > 0
    ? settings.checklistOptions
    : Object.keys(order.intakeChecklist || {});

  return (
    <div className={cn(
      "flex flex-col text-[10px] font-sans text-black leading-tight",
      isFullPage ? "h-[280mm] pt-4" : "h-full border-b-2 border-dashed border-gray-400 pb-2"
    )}>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-1 border-b-2 border-black pb-1">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 font-bold text-xs ${isBudget ? 'bg-black text-white' : 'bg-black text-white'}`}>
            {isBudget ? "PRESUPUESTO" : "COPIA TALLER"}
          </span>
          <span className="font-bold text-lg">#{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="text-[9px]">
          Ingreso: <b>{format(new Date(order.createdAt), "dd/MM HH:mm")}</b> | Impreso: {format(new Date(), "dd/MM HH:mm")}
        </div>
      </div>

      {/* DATOS */}
      <div className="flex border border-black mb-1">
        <div className="w-1/2 border-r border-black p-1">
          <div className="font-bold bg-gray-200 px-1 mb-1 text-[9px]">DATOS DEL CLIENTE</div>
          <div className="grid grid-cols-[45px_1fr] gap-y-0.5">
            <span className="font-bold">Nombre:</span> <span className="uppercase truncate">{order.client.name}</span>
            <span className="font-bold">Tel:</span> <span>{order.client.phone}</span>
            <span className="font-bold">DNI:</span> <span>{order.client.dni || "-"}</span>
          </div>
        </div>
        <div className="w-1/2 p-1">
          <div className="font-bold bg-gray-200 px-1 mb-1 text-[9px]">DATOS DEL EQUIPO</div>
          <div className="grid grid-cols-[50px_1fr] gap-y-0.5">
            <span className="font-bold">Modelo:</span> <span className="uppercase truncate">{order.device.brand} {order.device.model}</span>
            <span className="font-bold">Pass/Pin:</span> <span className="font-mono font-bold text-xs">{order.device.lockValue || "NO"} ({order.device.lockType})</span>
            <span className="font-bold">IMEI:</span> <span className="font-mono truncate">{order.device.imei || "-"}</span>
          </div>
        </div>
      </div>

      {/* DETALLES */}
      <div className="flex gap-1 flex-1 min-h-0 mb-1">
        <div className="w-1/3 border border-black text-[9px]">
          <div className="bg-gray-200 font-bold text-center border-b border-black py-0.5">CHECKLIST</div>
          <div className="grid grid-cols-2 p-1 gap-x-2 gap-y-0.5">
            {checklistItems.length > 0 ? (
              checklistItems.map((item, idx) => (
                <div key={idx} className="flex justify-between border-b border-dotted border-gray-300 overflow-hidden">
                  <span className="truncate mr-1" title={item}>{cleanLabel(item)}:</span>
                  <b>{getCheckValue(order.intakeChecklist, item)}</b>
                </div>
              ))
            ) : (
              <span className="col-span-2 text-center italic text-gray-500">Sin checklist</span>
            )}
          </div>
        </div>

        <div className="w-2/3 flex flex-col gap-1">
          <div className="border border-black flex-1 p-1 overflow-hidden">
            <span className="font-bold underline text-[9px]">REPARACIÓN SOLICITADA:</span>
            <p className="italic ml-1 leading-snug">"{order.problem}"</p>
          </div>
          <div className="border border-black flex-1 p-1 overflow-hidden">
            <span className="font-bold underline text-[9px]">OBSERVACIONES TÉCNICAS:</span>
            <p className="ml-1 leading-snug">{order.notes || "-"}</p>
          </div>
        </div>
      </div>

      {/* PIE */}
      <div className={cn("flex items-end gap-2", isFullPage ? "mt-auto h-16" : "h-10")}>
        <div className="w-3/5 border border-black flex text-xs h-full">
          <div className="flex-1 border-r border-black flex flex-col justify-center items-center bg-gray-50">
            <span className="text-[8px] text-gray-500">TOTAL ESTIMADO</span>
            <span className="font-bold">${totalCost}</span>
          </div>
          <div className="flex-1 border-r border-black flex flex-col justify-center items-center bg-gray-50">
            <span className="text-[8px] text-gray-500">ADELANTO</span>
            <span className="font-bold">${totalPaid}</span>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center bg-gray-200">
            <span className="text-[8px] text-gray-600 font-bold">RESTA</span>
            <span className="font-bold text-sm">${balance}</span>
          </div>
        </div>
        {isBudget ? (
          <div className="w-2/5 border border-black border-dashed flex items-center justify-center text-center pb-0.5 bg-gray-100 h-full">
            <span className="text-[9px] font-bold uppercase">PRESUPUESTO - NO VÁLIDO COMO ORDEN</span>
          </div>
        ) : (
          <div className="w-2/5 border-b border-black text-center pb-0.5 h-full flex items-end justify-center">
            <span className="text-[7px] font-bold uppercase">Firma Conformidad Cliente</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 2. COPIA DEL CLIENTE
// ==========================================
const ClientCopy = ({ order, settings, isFullPage = false }: { order: RepairOrderWithDetails, settings?: Settings, isFullPage?: boolean }) => {
  const { totalCost, totalPaid, balance } = getFinancials(order);
  const isBudget = order.status === "presupuesto";
  const terminos = settings?.receiptDisclaimer || "Sin términos configurados. Configurelos en Ajustes.";

  // 🔥 MAGIA DE SUCURSALES 🔥
  // Leemos las sucursales cacheadas. Si no hay sucursal en la orden, leemos la activa.
  const branches = queryClient.getQueryData<Branch[]>(["/api/branches"]) || [];
  const activeBranchId = localStorage.getItem('activeBranchId');
  const branchIdToUse = order.branchId || activeBranchId; 
  const currentBranch = branches.find(b => b.id === branchIdToUse);

  // Armamos los datos cruzados (Sucursal > Config General)
  const printName = currentBranch?.name || settings?.shopName || "MI TALLER";
  const printAddress = currentBranch?.address || settings?.address || "Dirección no configurada";
  const printPhone = currentBranch?.phone || settings?.phone || "Teléfono no configurado";
  const printEmail = settings?.email || ""; // Usamos el email global porque la sucursal no suele tener uno propio

  return (
    <div className={cn(
      "flex flex-col text-[11px] font-sans text-black leading-snug",
      isFullPage ? "h-[280mm] pt-4" : "h-full pt-2"
    )}>
      {/* HEADER NEGOCIO */}
      <div className="flex justify-between items-start mb-2 border-b-2 border-black pb-2">
        <div className="flex gap-3 items-center">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
          ) : (
            <div className="w-12 h-12 bg-black text-white rounded-md flex items-center justify-center text-xl font-bold">GSM</div>
          )}
          <div>
            <h2 className="font-bold text-lg uppercase leading-none mb-1">{printName}</h2>
            <div className="text-[9px] space-y-0.5 text-gray-700">
              <p>📍 {printAddress}</p>
              <p>📱 {printPhone}</p>
              {printEmail && <p>📧 {printEmail}</p>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="border border-black px-2 py-1 bg-gray-100 mb-1 inline-block">
            <span className="block text-[8px] text-gray-500 text-center">{isBudget ? "PRESUPUESTO" : "ORDEN N°"}</span>
            <span className="font-bold text-xl block leading-none">#{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <p className="text-[10px] mt-1">Fecha: <b>{format(new Date(order.createdAt), "dd/MM/yyyy")}</b></p>
        </div>
      </div>

      {/* CUERPO */}
      <div className="flex gap-3 mb-2 flex-1 min-h-0">
        <div className="w-2/3 flex flex-col gap-2">
          <div className="border border-black p-1.5 rounded-sm">
            <div className="font-bold bg-gray-200 px-1 -mx-1.5 -mt-1.5 mb-1.5 border-b border-black text-[9px] py-0.5">
              DATOS DEL EQUIPO
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <div><span className="font-bold">Equipo:</span> <span className="uppercase">{order.device.brand} {order.device.model}</span></div>
              <div><span className="font-bold">Color:</span> <span className="uppercase">{order.device.color || "-"}</span></div>
              <div className="col-span-2"><span className="font-bold">IMEI/SN:</span> <span className="font-mono text-[10px]">{order.device.imei || "-"}</span></div>
              <div className="col-span-2 border-t border-dotted border-gray-400 mt-1 pt-1"><span className="font-bold">Cliente:</span> {order.client.name}</div>
            </div>
          </div>

          <div className="border border-black p-1.5 rounded-sm flex-1">
            <div className="font-bold text-[9px] underline mb-1">REPARACIÓN SOLICITADA:</div>
            <p className="italic font-medium">{order.problem}</p>
          </div>
        </div>

        <div className="w-1/3">
          <div className="border border-black rounded-sm overflow-hidden h-full flex flex-col">
            <div className="bg-black text-white font-bold text-center py-1 text-[10px]">
              {isBudget ? "COSTOS ESTIMADOS" : "RESUMEN DE PAGO"}
            </div>
            <div className="p-2 flex-1 flex flex-col justify-center space-y-2 text-right">
              <div className="flex justify-between border-b border-dashed border-gray-400 pb-1">
                <span>Total:</span>
                <span className="font-bold">${totalCost}</span>
              </div>
              <div className="flex justify-between text-green-700 border-b border-dashed border-gray-400 pb-1">
                <span>Adelanto:</span>
                <span className="font-bold">- ${totalPaid}</span>
              </div>
              <div className="flex justify-between text-lg font-bold bg-gray-200 p-1 -mx-2 -mb-2 mt-auto">
                <span>RESTA:</span>
                <span>${balance}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TÉRMINOS */}
      <div className="flex-1 border-t-2 border-black pt-1 min-h-0 overflow-hidden flex flex-col">
        <h3 className="font-bold text-[9px] mb-1 underline">TÉRMINOS Y CONDICIONES:</h3>
        <div className="text-[9px] text-justify leading-snug text-gray-700 whitespace-pre-wrap h-full overflow-hidden">
          {terminos}
        </div>
      </div>

      {/* FIRMA */}
      <div className={cn("flex justify-end", isFullPage ? "mt-auto h-16 pt-4" : "mt-2")}>
        {isBudget ? (
          <div className="w-1/3 border border-black border-dashed text-center pt-1 bg-gray-100 h-full flex items-center justify-center">
            <span className="text-[8px] font-bold">VÁLIDO POR 7 DÍAS</span>
          </div>
        ) : (
          <div className="w-1/3 border-t border-black text-center pt-1 h-full">
            <span className="text-[8px] font-bold">FIRMA Y ACLARACIÓN RESPONSABLE</span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---
export default function OrderPrint() {
  const [, params] = useRoute("/ordenes/:id/print");
  const orderId = params?.id;

  // ESTADO DEL MODO DE IMPRESIÓN
  const [printMode, setPrintMode] = useState<"split" | "client_only" | "tech_only">("split");

  const { data: order, isLoading } = useQuery<RepairOrderWithDetails>({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId,
  });

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  // Auto-imprimir
  useEffect(() => {
    if (order && settings !== undefined) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [order, settings]);

  if (isLoading || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Skeleton className="h-[297mm] w-[210mm]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white font-sans print:overflow-hidden">
      
      {/* BOTONES (No salen en impresión) */}
      <div className="max-w-[210mm] mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
        <div className="flex items-center gap-3">
          {/* TU BOTÓN VOLVER INTACTO CON LA ESTÉTICA ORIGINAL */}
          <Button asChild className="bg-slate-900 text-white hover:bg-slate-800 border-none">
            <Link href={`/ordenes/${orderId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la Orden
            </Link>
          </Button>
          
          {order.status === "presupuesto" && (
            <div className="bg-amber-100 text-amber-800 px-3 py-2 rounded text-sm font-bold border border-amber-300 flex items-center">
              MODO PRESUPUESTO
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* SELECTOR DE FORMATO (DISEÑO ROBUSTO) */}
          <div className="flex items-center gap-2 bg-slate-900 text-white rounded-md p-1 px-3 shadow-md border border-slate-700">
            <span className="text-sm font-bold text-blue-600 hidden md:inline-block">Formato:</span>
            <Select value={printMode} onValueChange={(v: any) => setPrintMode(v)}>
              {/* Acá está el truco: forzamos el texto a blanco y font-bold para que nunca desaparezca */}
              <SelectTrigger className="w-[200px] border-none shadow-none focus:ring-0 text-white font-bold p-0 h-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="split" className="text-white hover:bg-slate-800">
                  <div className="flex items-center gap-2"><LayoutTemplate className="w-4 h-4 text-blue-500" /> 1 Hoja (Mitad y Mitad)</div>
                </SelectItem>
                <SelectItem value="client_only" className="text-white hover:bg-slate-800">
                  <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-violet-500" /> Solo Copia Cliente</div>
                </SelectItem>
                <SelectItem value="tech_only" className="text-white hover:bg-slate-800">
                  <div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-emerald-500" /> Solo Copia Técnico</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* ÁREA DE IMPRESIÓN DINÁMICA */}
      <div id="print-area" className="bg-white w-[210mm] h-[296mm] mx-auto p-[8mm] shadow-lg print:shadow-none print:w-full print:h-[296mm] print:absolute print:top-0 print:left-0 print:m-0 flex flex-col justify-between overflow-hidden box-border">
        
        {/* MODO 1: HOJA DIVIDIDA CLÁSICA (Mitad y Mitad) */}
        {printMode === "split" && (
          <>
            <div className="h-[42%]">
              <TechnicianCopy order={order} settings={settings} />
            </div>
            <div className="relative py-1 flex items-center justify-center print:py-1 h-[5%]">
              <div className="absolute w-full border-b-2 border-dashed border-gray-400"></div>
              <span className="relative bg-white px-2 text-[8px] text-gray-500 font-bold tracking-widest uppercase">Cortar por aquí</span>
            </div>
            <div className="h-[53%]">
              <ClientCopy order={order} settings={settings} />
            </div>
          </>
        )}

        {/* MODO 2: SOLO CLIENTE */}
        {printMode === "client_only" && (
          <div className="h-full w-full">
            <ClientCopy order={order} settings={settings} isFullPage={true} />
          </div>
        )}

        {/* MODO 3: SOLO TÉCNICO */}
        {printMode === "tech_only" && (
          <div className="h-full w-full">
            <TechnicianCopy order={order} settings={settings} isFullPage={true} />
          </div>
        )}

      </div>

      <style>{`
        @media print {
          @page { margin: 0; size: A4; }
          html, body { height: 100%; overflow: hidden; }
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; height: 296mm; margin: 0; padding: 8mm; }
        }
      `}</style>
    </div>
  );
}