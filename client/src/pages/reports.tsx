import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Printer,
  Trash2,
  Loader2,
  Eye,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isSameDay, isSameMonth, subMonths, subDays } from "date-fns";
import { es } from "date-fns/locale";
import type { Payment, Expense, RepairOrderWithDetails, Settings } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { cn } from "@/lib/utils";

import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { printTicket } from "@/lib/printer";
import { generateMonthlyReportPDF } from "@/lib/pdf-generator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Transaction = {
  id: string;
  date: Date;
  logicalDate: Date;
  type: "income" | "expense";
  category: string;
  description: string;
  method: string;
  amount: number;
};

type SummaryRow = {
  id: string;
  label: string;
  dateObj?: Date; 
  income: number;
  expense: number;
  balance: number;
  ordersCount: number;
};

export default function Reports() {
  const [filterPeriod, setFilterPeriod] = useState<"all" | "month" | "today" | "specific" | "specific_month">("today");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMonthStr, setSelectedMonthStr] = useState<string | null>(null);
  const [loadingPdfMonth, setLoadingPdfMonth] = useState<string | null>(null);
  
  const { toast } = useToast();

  const { data: settings } = useQuery<Settings>({ queryKey: ["/api/settings"] });
  const { data: payments = [], isLoading: loadingPayments } = useQuery<(Payment & { order?: RepairOrderWithDetails })[]>({ queryKey: ["/api/payments"] });
  const { data: expenses = [], isLoading: loadingExpenses } = useQuery<Expense[]>({ queryKey: ["/api/expenses"] });
  const { data: orders = [], isLoading: loadingOrders } = useQuery<RepairOrderWithDetails[]>({ queryKey: ["/api/orders"] });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/payments/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Transacción eliminada", description: "Se ha descontado de la caja." });
    },
    onError: () => toast({ title: "Error al eliminar", variant: "destructive" }),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/expenses/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Gasto eliminado", description: "El monto ha vuelto a la caja." });
    },
    onError: () => toast({ title: "Error al eliminar", variant: "destructive" }),
  });

  const handlePrintTicket = (transactionId: string) => {
    const payment = payments.find(p => p.id === transactionId);
    if (payment) printTicket(payment, settings);
    else toast({ title: "Error", description: "No se encontró el ticket", variant: "destructive" });
  };

  const handlePrintMonthlyReport = (monthStr: string) => {
    setLoadingPdfMonth(monthStr);
    try {
      const monthTransactions = transactions.filter(t => format(t.logicalDate, "yyyy-MM") === monthStr);
      
      const incomeByMethod: Record<string, number> = {};
      let totalIncome = 0;
      let totalExpenses = 0;

      monthTransactions.forEach(t => {
        if (t.type === "income") {
          const method = t.method || "Otros";
          incomeByMethod[method] = (incomeByMethod[method] || 0) + t.amount;
          totalIncome += t.amount;
        } else {
          totalExpenses += t.amount;
        }
      });

      const [year, month] = monthStr.split("-");
      const reportData = {
        period: {
          month: parseInt(month, 10),
          year: parseInt(year, 10),
          startDate: new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1).toISOString(),
          endDate: new Date(parseInt(year, 10), parseInt(month, 10), 0).toISOString()
        },
        incomeByMethod: Object.entries(incomeByMethod).map(([method, total]) => ({ method, total })),
        totals: {
          income: totalIncome,
          expenses: totalExpenses,
          balance: totalIncome - totalExpenses
        }
      };

      const customFilename = `Reporte Mensual ${monthStr}`;
      generateMonthlyReportPDF(reportData, settings, customFilename);
      toast({ title: "Reporte Mensual descargado" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "No se pudo generar el reporte.", variant: "destructive" });
    } finally {
      setLoadingPdfMonth(null);
    }
  };

  const handlePrintMonthViewA4 = (monthStr: string) => {
    setSelectedMonthStr(monthStr);
    setFilterPeriod("specific_month");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handlePrintDailyReport = (dayDate: Date) => {
    try {
      const dayTransactions = transactions.filter(t => isSameDay(t.logicalDate, dayDate));
      const incomeByMethod: Record<string, number> = {};
      let totalIncome = 0;
      let totalExpenses = 0;

      dayTransactions.forEach(t => {
        if (t.type === "income") {
          const method = t.method || "Otros";
          incomeByMethod[method] = (incomeByMethod[method] || 0) + t.amount;
          totalIncome += t.amount;
        } else {
          totalExpenses += t.amount;
        }
      });

      const reportData = {
        period: {
          month: dayDate.getMonth() + 1,
          year: dayDate.getFullYear(),
          startDate: dayDate.toISOString(),
          endDate: dayDate.toISOString() 
        },
        incomeByMethod: Object.entries(incomeByMethod).map(([method, total]) => ({ method, total })),
        totals: {
          income: totalIncome,
          expenses: totalExpenses,
          balance: totalIncome - totalExpenses
        }
      };

      const dateStr = format(dayDate, "dd-MM-yyyy");
      const customFilename = `Caja del dia ${dateStr}`;

      generateMonthlyReportPDF(reportData, settings, customFilename);
      toast({ title: "Reporte Diario descargado" });

    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Error al generar reporte diario", variant: "destructive" });
    }
  };

  const getLogicalDate = (date: Date, cutoffHour: number = 0): Date => {
    const d = new Date(date);
    if (d.getHours() < cutoffHour) return subDays(d, 1);
    return d;
  };
  const cutoffHour = settings?.dayCutoffHour || 0;

  const transactions: Transaction[] = useMemo(() => {
    const income: Transaction[] = payments.map(p => {
      const date = new Date(p.date);
      return {
        id: p.id, date, logicalDate: getLogicalDate(date, cutoffHour),
        type: "income", category: p.orderId ? "Reparación" : "Venta",
        description: p.notes || (p.orderId ? `Cobro Orden #${p.orderId.slice(0, 4)}` : "Venta General"),
        method: p.method, amount: Number(p.amount)
      };
    });
    const outflow: Transaction[] = expenses.map(e => {
      const date = new Date(e.date);
      return {
        id: e.id, date, logicalDate: getLogicalDate(date, cutoffHour),
        type: "expense", category: e.category, description: e.description,
        method: "Efectivo", amount: Number(e.amount)
      };
    });
    return [...income, ...outflow].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [payments, expenses, cutoffHour]);

  const filteredData = useMemo(() => {
    const nowReal = new Date();
    const nowLogical = getLogicalDate(nowReal, cutoffHour);
    if (filterPeriod === "all") return transactions;
    return transactions.filter(t => {
      if (filterPeriod === "today") return isSameDay(t.logicalDate, nowLogical);
      if (filterPeriod === "month") return isSameMonth(t.logicalDate, nowLogical);
      if (filterPeriod === "specific" && selectedDate) return isSameDay(t.logicalDate, selectedDate);
      if (filterPeriod === "specific_month" && selectedMonthStr) return format(t.logicalDate, "yyyy-MM") === selectedMonthStr;
      return true;
    });
  }, [transactions, filterPeriod, cutoffHour, selectedDate, selectedMonthStr]);

  const monthlyTableData = useMemo(() => {
    if (filterPeriod !== "all") return [];
    const groups: Record<string, SummaryRow> = {};
    transactions.forEach(t => {
      const key = format(t.logicalDate, "yyyy-MM");
      if (!groups[key]) {
        groups[key] = {
          id: key, label: format(t.logicalDate, "MMMM yyyy", { locale: es }),
          income: 0, expense: 0, balance: 0, ordersCount: 0
        };
      }
      if (t.type === "income") groups[key].income += t.amount;
      else groups[key].expense += t.amount;
      groups[key].balance = groups[key].income - groups[key].expense;
    });
    return Object.values(groups).sort((a, b) => b.id.localeCompare(a.id));
  }, [transactions, filterPeriod]);

  const dailyTableData = useMemo(() => {
    if (filterPeriod !== "month" && filterPeriod !== "specific_month") return [];
    const groups: Record<string, SummaryRow> = {};

    filteredData.forEach(t => {
      const key = format(t.logicalDate, "yyyy-MM-dd");
      if (!groups[key]) {
        groups[key] = {
          id: key,
          label: format(t.logicalDate, "dd 'de' MMMM", { locale: es }),
          dateObj: t.logicalDate,
          income: 0, expense: 0, balance: 0, ordersCount: 0
        };
      }
      if (t.type === "income") groups[key].income += t.amount;
      else groups[key].expense += t.amount;
      groups[key].balance = groups[key].income - groups[key].expense;
    });
    return Object.values(groups).sort((a, b) => b.id.localeCompare(a.id));
  }, [filteredData, filterPeriod]);

  const totalIncome = filteredData.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredData.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  const formatMoney = (amount: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount);

  const handleExportCSV = () => {
    const headers = ["Fecha Real", "Fecha Contable", "Tipo", "Categoría", "Descripción", "Método", "Monto"];
    const rows = filteredData.map(t => [
      format(t.date, "dd/MM/yyyy HH:mm"), format(t.logicalDate, "dd/MM/yyyy"),
      t.type === "income" ? "Ingreso" : "Gasto", t.category, `"${t.description.replace(/"/g, '""')}"`, t.method,
      t.type === "income" ? t.amount : -t.amount
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_${filterPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLoading = loadingPayments || loadingExpenses || loadingOrders;
  const tabTriggerBase = "rounded-full px-6 py-2.5 transition-all flex gap-2 items-center border border-transparent data-[state=active]:shadow-sm data-[state=active]:font-medium";

  const chartsData = useMemo(() => {
    const data: SummaryRow[] = [];
    const nowReal = new Date();
    const nowLogical = getLogicalDate(nowReal, cutoffHour);
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(nowLogical, i);
      const monthKey = format(date, "yyyy-MM");
      const monthLabel = format(date, "MMM", { locale: es }).toUpperCase();
      
      const monthTransactions = transactions.filter(t => format(t.logicalDate, "yyyy-MM") === monthKey);
      const income = monthTransactions.filter(t => t.type === "income").reduce((acc, curr) => acc + curr.amount, 0);
      const expense = monthTransactions.filter(t => t.type === "expense").reduce((acc, curr) => acc + curr.amount, 0);
      
      // 👇 ACÁ ESTÁ LA MAGIA: Contamos las órdenes reales de la base de datos para ese mes 👇
      const monthOrdersCount = orders.filter(o => {
        if (!o.createdAt) return false;
        const orderDate = getLogicalDate(new Date(o.createdAt), cutoffHour);
        return format(orderDate, "yyyy-MM") === monthKey;
      }).length;

      data.push({ 
        id: monthKey, 
        label: monthLabel, 
        income, 
        expense, 
        balance: income - expense, 
        ordersCount: monthOrdersCount // <--- Ahora pasamos el número real
      });
    }
    return data;
  }, [transactions, orders, cutoffHour]); // <--- Agregamos 'orders' a las dependencias

  // SOLUCIÓN AL ERROR TS: Le ponemos 'any' a settings para que no se queje por los campos extra
  const settingsData = settings as any;
  const shopName = settingsData?.shopName || "MI TALLER";
  const contactInfo = [settingsData?.shopAddress, settingsData?.shopPhone, settingsData?.shopEmail].filter(Boolean).join(" | ");

  return (
    <div className="min-h-screen bg-background/50 pb-20 space-y-8 print:bg-white print:m-0 print:p-0 print:min-h-0 print:space-y-4">
      
      {/* --------------------------------------------------------------------------------- */}
      {/* ENCABEZADO EXCLUSIVO PARA IMPRESIÓN (Solo visible al tocar Imprimir) */}
      {/* --------------------------------------------------------------------------------- */}
      <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-3xl font-bold uppercase text-black m-0 p-0 tracking-tight">
          {shopName}
        </h1>
        {contactInfo && (
          <p className="text-sm text-gray-600 mt-1 mb-0">
            {contactInfo}
          </p>
        )}
        <h2 className="text-xl font-semibold uppercase mt-4 mb-1 text-black">
          Reporte de Caja
        </h2>
        <p className="text-sm font-medium text-gray-800">
          {filterPeriod === "all" ? "Historial Consolidado" : 
           filterPeriod === "month" ? "Resumen del Mes Actual" : 
           filterPeriod === "specific_month" && selectedMonthStr ? (() => {
             const [y, m] = selectedMonthStr.split("-");
             return `Periodo: ${format(new Date(parseInt(y), parseInt(m)-1), "MMMM yyyy", { locale: es }).toUpperCase()}`;
           })() : 
           filterPeriod === "specific" && selectedDate ? `Fecha: ${format(selectedDate, "dd/MM/yyyy")}` : "Movimientos del Día"}
        </p>
      </div>
      {/* --------------------------------------------------------------------------------- */}

      {/* HEADER DE LA PANTALLA (Se oculta al imprimir) */}
      <div className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-4 transition-all print:hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" /> Reportes
            </h1>
            <p className="text-sm text-muted-foreground hidden sm:block">Análisis financiero y métricas.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap justify-end">
            
            {filterPeriod === "specific" && (
              <Button variant="ghost" onClick={() => setFilterPeriod("month")} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Mes
              </Button>
            )}
            
            {filterPeriod === "specific_month" && (
              <Button variant="ghost" onClick={() => setFilterPeriod("all")} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Historial
              </Button>
            )}

            <Select value={filterPeriod} onValueChange={(v: any) => { setFilterPeriod(v); if(v !== "specific") setSelectedDate(null); if(v !== "specific_month") setSelectedMonthStr(null); }}>
              <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur-sm border-border/50">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy (Detalle)</SelectItem>
                <SelectItem value="month">Este Mes (Diario)</SelectItem>
                <SelectItem value="all">Historial (Mensual)</SelectItem>
                {filterPeriod === "specific" && <SelectItem value="specific">Día Específico</SelectItem>}
                {filterPeriod === "specific_month" && <SelectItem value="specific_month">Mes Específico</SelectItem>}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => window.print()} className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 shadow-sm backdrop-blur-sm">
              <Printer className="h-4 w-4 mr-2" /> Imprimir
            </Button>

            <Button variant="outline" onClick={handleExportCSV} disabled={transactions.length === 0} className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 shadow-sm backdrop-blur-sm">
              <Download className="h-4 w-4 mr-2" /> CSV
            </Button>
            
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full space-y-8 print:w-full print:max-w-none print:px-0 print:space-y-4">
        <Tabs defaultValue="financial" className="w-full space-y-8 print:space-y-4">
          
          <div className="flex justify-center print:hidden">
            <TabsList className="h-auto p-1 bg-muted/50 backdrop-blur-sm border border-border/50 rounded-full inline-flex flex-wrap justify-center gap-1">
              <TabsTrigger value="financial" className={`${tabTriggerBase} data-[state=active]:bg-primary/10 data-[state=active]:text-primary`}>
                <FileText className="h-4 w-4" /> Resumen Financiero
              </TabsTrigger>
              <TabsTrigger value="metrics" className={`${tabTriggerBase} data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-500`}>
                <PieChart className="h-4 w-4" /> Métricas y Gráficos
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="financial" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300 print:space-y-4 print:animate-none">
            
            {/* KPI CARDS - Optimizadas para impresión */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
              {isLoading ? [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />) : (
                <>
                  <Card className="border-border/50 bg-gradient-to-br from-card via-card/95 to-emerald-500/10 shadow-sm relative overflow-hidden print:shadow-none print:border print:border-gray-300 print:bg-white">
                    <div className="absolute right-0 top-0 p-3 opacity-10"><TrendingUp className="w-24 h-24 text-emerald-500 print:hidden" /></div>
                    <CardHeader className="pb-2 print:pb-1"><CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2 print:text-black">Total Ingresos</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-emerald-600 print:text-black print:text-2xl">{formatMoney(totalIncome)}</div></CardContent>
                  </Card>
                  <Card className="border-border/50 bg-gradient-to-br from-card via-card/95 to-red-500/10 shadow-sm relative overflow-hidden print:shadow-none print:border print:border-gray-300 print:bg-white">
                    <div className="absolute right-0 top-0 p-3 opacity-10"><TrendingDown className="w-24 h-24 text-red-500 print:hidden" /></div>
                    <CardHeader className="pb-2 print:pb-1"><CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2 print:text-black">Total Gastos</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-red-600 print:text-black print:text-2xl">{formatMoney(totalExpenses)}</div></CardContent>
                  </Card>
                  <Card className="border-border/50 bg-gradient-to-br from-card via-card/95 to-blue-500/10 shadow-sm relative overflow-hidden print:shadow-none print:border print:border-gray-300 print:bg-gray-100">
                    <div className="absolute right-0 top-0 p-3 opacity-10"><DollarSign className="w-24 h-24 text-blue-500 print:hidden" /></div>
                    <CardHeader className="pb-2 print:pb-1"><CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2 print:text-black">Balance Neto</CardTitle></CardHeader>
                    <CardContent><div className={cn("text-3xl font-bold", netBalance >= 0 ? "text-blue-600 print:text-black print:text-2xl" : "text-red-500 print:text-red-600 print:text-2xl")}>{formatMoney(netBalance)}</div></CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* TABLA PRINCIPAL - Optimizada para no romper la impresión */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm print:shadow-none print:border print:border-gray-300 print:bg-white">
              <CardHeader className="print:hidden">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  {filterPeriod === "all" ? "Historial Mensual" : 
                   filterPeriod === "month" ? "Cierres Diarios" : 
                   filterPeriod === "specific_month" && selectedMonthStr ? (() => {
                     const [y, m] = selectedMonthStr.split("-");
                     return `Desglose de ${format(new Date(parseInt(y), parseInt(m)-1), "MMMM yyyy", { locale: es })}`;
                   })() : 
                   filterPeriod === "specific" && selectedDate ? `Movimientos del ${format(selectedDate, "dd/MM/yyyy")}` : "Detalle de Movimientos"}
                </CardTitle>
                <CardDescription>
                  {filterPeriod === "all" ? "Resumen consolidado mes a mes." : filterPeriod === "month" || filterPeriod === "specific_month" ? "Resumen día por día de este mes." : "Listado detallado de transacciones."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 print:p-2">
                <div className="overflow-x-auto print:overflow-visible">
                  <Table className="print:text-sm">
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30 print:bg-gray-200">
                        {filterPeriod === "today" || filterPeriod === "specific" ? (
                          <>
                            <TableHead className="w-[180px] print:w-auto print:text-black print:font-bold">Fecha</TableHead>
                            <TableHead className="w-[120px] print:w-auto print:text-black print:font-bold">Tipo</TableHead>
                            <TableHead className="w-[150px] print:text-black print:font-bold">Categoría</TableHead>
                            <TableHead className="print:text-black print:font-bold">Descripción</TableHead>
                            <TableHead className="print:text-black print:font-bold">Método</TableHead>
                            <TableHead className="text-right w-[150px] print:text-black print:font-bold">Monto</TableHead>
                            <TableHead className="text-right w-[100px] print:hidden">Acciones</TableHead>
                          </>
                        ) : (
                          <>
                            <TableHead className="print:text-black print:font-bold">Periodo</TableHead>
                            <TableHead className="text-right text-emerald-600 print:text-black print:font-bold">Ingresos</TableHead>
                            <TableHead className="text-right text-red-600 print:text-black print:font-bold">Egresos</TableHead>
                            <TableHead className="text-right font-bold print:text-black print:font-bold">Balance</TableHead>
                            <TableHead className="text-center w-[120px] print:hidden">Acciones</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow><TableCell colSpan={7} className="text-center h-24">Cargando...</TableCell></TableRow>
                      ) : (
                        <>
                          {filterPeriod === "all" && monthlyTableData.map((row) => (
                            <TableRow key={row.id} className="hover:bg-muted/30 transition-colors print:border-b print:border-gray-200">
                              <TableCell className="font-bold capitalize print:text-black">{row.label}</TableCell>
                              <TableCell className="text-right text-emerald-600 font-medium tabular-nums print:text-black">+ {formatMoney(row.income)}</TableCell>
                              <TableCell className="text-right text-red-600 font-medium tabular-nums print:text-black">- {formatMoney(row.expense)}</TableCell>
                              <TableCell className={cn("text-right font-bold tabular-nums print:text-black")}>{formatMoney(row.balance)}</TableCell>
                              <TableCell className="text-center print:hidden">
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handlePrintMonthViewA4(row.id)} title="Imprimir Desglose (A4)" className="text-muted-foreground hover:text-primary">
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handlePrintMonthlyReport(row.id)} disabled={loadingPdfMonth === row.id} title="Descargar PDF Mensual" className="text-muted-foreground hover:text-primary">
                                    {loadingPdfMonth === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}

                          {(filterPeriod === "month" || filterPeriod === "specific_month") && dailyTableData.map((row) => (
                            <TableRow key={row.id} className="hover:bg-muted/30 transition-colors print:border-b print:border-gray-200">
                              <TableCell className="font-medium capitalize flex items-center gap-2 print:text-black">
                                <Calendar className="h-4 w-4 text-muted-foreground opacity-50 print:hidden" />
                                {row.label}
                              </TableCell>
                              <TableCell className="text-right text-emerald-600 font-medium tabular-nums print:text-black">+ {formatMoney(row.income)}</TableCell>
                              <TableCell className="text-right text-red-600 font-medium tabular-nums print:text-black">- {formatMoney(row.expense)}</TableCell>
                              <TableCell className={cn("text-right font-bold tabular-nums print:text-black")}>{formatMoney(row.balance)}</TableCell>
                              <TableCell className="text-center print:hidden">
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => { setSelectedDate(row.dateObj || null); setFilterPeriod("specific"); }} title="Ver transacciones del día" className="text-muted-foreground hover:text-primary">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => row.dateObj && handlePrintDailyReport(row.dateObj)} title="Descargar PDF Diario" className="text-muted-foreground hover:text-primary">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}

                          {(filterPeriod === "today" || filterPeriod === "specific") && (
                            filteredData.length === 0 ? (
                              <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Sin movimientos para esta fecha.</TableCell></TableRow>
                            ) : (
                              filteredData.map((t) => (
                                <TableRow key={t.id} className="hover:bg-muted/30 transition-colors print:border-b print:border-gray-200">
                                  <TableCell className="font-mono text-xs text-muted-foreground print:text-black">
                                    {format(t.date, "dd/MM/yyyy HH:mm")}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 print:border-none print:px-0 print:text-black", t.type === "income" ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-red-500/10 text-red-600 border-red-200")}>
                                      {t.type === "income" ? "Ingreso" : "Gasto"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell><Badge variant="secondary" className="font-normal text-xs bg-muted/50 print:bg-transparent print:border-none print:p-0 print:text-black">{t.category}</Badge></TableCell>
                                  <TableCell className="max-w-[300px] truncate text-sm print:whitespace-normal print:text-black" title={t.description}>{t.description}</TableCell>
                                  <TableCell className="capitalize text-sm text-muted-foreground print:text-black">{t.method}</TableCell>
                                  <TableCell className={cn("text-right font-bold tabular-nums print:text-black")}>
                                    {t.type === "income" ? "+" : "-"} {formatMoney(t.amount)}
                                  </TableCell>
                                  <TableCell className="text-right print:hidden">
                                    <div className="flex items-center justify-end gap-1">
                                      {t.type === "income" && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handlePrintTicket(t.id)} title="Imprimir Ticket (Térmica)">
                                          <Printer className="h-4 w-4" />
                                        </Button>
                                      )}
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader><AlertDialogTitle>¿Eliminar?</AlertDialogTitle><AlertDialogDescription>Se ajustará la caja.</AlertDialogDescription></AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-white" onClick={() => t.type === "income" ? deletePaymentMutation.mutate(t.id) : deleteExpenseMutation.mutate(t.id)}>Eliminar</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )
                          )}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6 mt-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300 print:hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                <CardHeader><CardTitle className="text-lg">Evolución Financiera</CardTitle></CardHeader>
                <CardContent><div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartsData}><CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} /><XAxis dataKey="label" fontSize={12} axisLine={false} tickLine={false} /><YAxis fontSize={12} axisLine={false} tickLine={false} tickFormatter={(v) => (`$${v / 1000}k`)} /><Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.2 }} formatter={(v: number) => formatMoney(v)} /><Legend iconType="circle" /><Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} /><Bar dataKey="expense" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} /></BarChart></ResponsiveContainer></div></CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                <CardHeader><CardTitle className="text-lg">Equipos Ingresados</CardTitle></CardHeader>
                <CardContent><div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartsData}><CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} /><XAxis dataKey="label" fontSize={12} axisLine={false} tickLine={false} /><YAxis fontSize={12} allowDecimals={false} axisLine={false} tickLine={false} /><Tooltip /><Legend iconType="circle" /><Line type="monotone" dataKey="ordersCount" name="Equipos" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div></CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}