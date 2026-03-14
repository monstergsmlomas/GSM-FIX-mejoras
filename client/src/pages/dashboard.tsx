import { WhatsNewModal } from "@/components/whats-new-modal";
import { TourGuide } from "@/components/tour-guide";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ClipboardList,
  DollarSign,
  Plus,
  TrendingDown,
  Wallet,
  TrendingUp,
  Inbox,
  LayoutDashboard,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RepairOrderWithDetails, Payment, Expense, Settings } from "@shared/schema";
import { OrderCard } from "@/components/cards/order-card";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();

  // Estados para el Pop-up de Caja
  const [isCashDialogOpen, setIsCashDialogOpen] = useState(false);
  const [initialCashInput, setInitialCashInput] = useState("");

  // 1. DATA FETCHING
  const { data: stats, isLoading: statsLoading } = useQuery<{
    activeOrders: number;
    pendingDiagnosis: number;
    readyForPickup: number;
  }>({
    queryKey: ["/api/stats"],
    refetchInterval: 5000,
  });

  const { data: orders = [] } = useQuery<RepairOrderWithDetails[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 5000,
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
    refetchInterval: 5000,
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    refetchInterval: 5000,
  });

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  // CONSULTA DE CAJA INICIAL DEL DÍA
  const { data: cashData, isLoading: cashLoading } = useQuery<{ amount: number | null }>({
    queryKey: ["/api/cash/today"],
  });

  // DETERMINAR SI ES OBLIGATORIO
  const isForcedOpen = !cashLoading && cashData?.amount === null;

  // 2. EFECTO: ABRIR POP-UP AUTOMÁTICAMENTE
  useEffect(() => {
    if (isForcedOpen) {
      setIsCashDialogOpen(true);
      setInitialCashInput("");
    }
  }, [isForcedOpen]);

  // 3. MUTATION: GUARDAR CAJA
  const saveCashMutation = useMutation({
    mutationFn: async (amount: number) => {
      await apiRequest("POST", "/api/cash", { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash/today"] });
      toast({ title: "Caja inicial establecida", description: "Se ha abierto la caja del día." });
      setIsCashDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  });

  // 4. LÓGICA DE FECHAS Y TOTALES
  const cutoffHour = Number((settings as any)?.dayCutoffHour ?? 0);
  const now = new Date();
  let startOfShift = new Date(now);
  startOfShift.setHours(cutoffHour, 0, 0, 0);

  if (now < startOfShift) {
    startOfShift.setDate(startOfShift.getDate() - 1);
  }

  const todayPayments = payments.filter(p => new Date(p.date) >= startOfShift);
  const todayExpenses = expenses.filter(e => new Date(e.date) >= startOfShift);

  const dailyIncome = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const dailyExpenses = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // CAJA INICIAL FIJA
  const initialCash = Number(cashData?.amount ?? 0);

  // TOTAL REAL EN CAJA
  const totalCashInBox = initialCash + dailyIncome - dailyExpenses;

  // Lógica de Actividad Reciente
  const recentActivity = orders
    .filter(o => o.status !== "entregado")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const getPaymentStatus = (order: RepairOrderWithDetails) => {
    const orderPayments = payments.filter(p => p.orderId === order.id);
    const totalPaid = orderPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const cost = order.finalCost > 0 ? order.finalCost : order.estimatedCost;

    if (cost === 0) return null;
    if (totalPaid >= cost) return "paid";
    if (totalPaid > 0) return "partial";
    return "unpaid";
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background/50 pb-20 space-y-8">
      
      {/* 👇 AQUÍ INSERTAMOS LOS MODALES EXTERNOS 👇 */}
      <WhatsNewModal />
      <TourGuide hasOrders={orders.length > 0} />
        
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-4 transition-all">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              Panel de Control
            </h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Resumen financiero y operativo en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              asChild
              id="tour-new-order"
              variant="outline"
              className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 hover:border-primary/40 shadow-sm backdrop-blur-sm transition-all active:scale-95 flex-1 sm:flex-none"
            >
              <Link href="/ordenes/nueva">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Orden
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full space-y-8">

        {/* --- KPI CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsLoading || cashLoading ? (
            [1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-32"><Skeleton className="h-full w-full" /></Card>
            ))
          ) : (
            <>
              {/* TARJETA 1: CAJA INICIAL */}
              <Card className="border-border/50 bg-gradient-to-br from-card via-card/95 to-blue-500/10 shadow-sm relative overflow-hidden group hover:border-blue-500/20 transition-all">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Wallet className="w-24 h-24 text-blue-500" />
                </div>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-blue-500" /> Caja Inicial
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    onClick={() => {
                      setInitialCashInput(String(initialCash));
                      setIsCashDialogOpen(true);
                    }}
                    title="Corregir Caja Inicial"
                  >
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formatMoney(initialCash)}
                  </div>
                </CardContent>
              </Card>

              {/* Ingresos */}
              <Card className="border-border/50 bg-gradient-to-br from-card via-card/95 to-emerald-500/10 shadow-sm relative overflow-hidden group hover:border-emerald-500/20 transition-all">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="w-24 h-24 text-emerald-500" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" /> Ingresos (Hoy)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatMoney(dailyIncome)}
                  </div>
                </CardContent>
              </Card>

              {/* Gastos */}
              <Card className="border-border/50 bg-gradient-to-br from-card via-card/95 to-red-500/10 shadow-sm relative overflow-hidden group hover:border-red-500/20 transition-all">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingDown className="w-24 h-24 text-red-500" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" /> Gastos (Hoy)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {formatMoney(dailyExpenses)}
                  </div>
                </CardContent>
              </Card>

              {/* Total en Caja */}
              <Card className="border-border/50 bg-gradient-to-br from-card via-card/95 to-indigo-500/10 shadow-sm relative overflow-hidden group hover:border-indigo-500/20 transition-all">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <DollarSign className="w-24 h-24 text-indigo-500" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-indigo-500" /> Total en Caja (Neto)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn("text-3xl font-bold", totalCashInBox >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-500")}>
                    {formatMoney(totalCashInBox)}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* --- POP-UP DE CAJA INICIAL --- */}
        <Dialog
          open={isCashDialogOpen}
          onOpenChange={(open) => {
            if (isForcedOpen && !open) return;
            setIsCashDialogOpen(open);
          }}
        >
          <DialogContent
            className={cn("sm:max-w-[400px]", isForcedOpen && "[&>button]:hidden")}
            onPointerDownOutside={(e) => { if (isForcedOpen) e.preventDefault(); }}
            onEscapeKeyDown={(e) => { if (isForcedOpen) e.preventDefault(); }}
          >
            <DialogHeader>
              <DialogTitle>
                {isForcedOpen ? "⚠️ Apertura de Caja Obligatoria" : "Ajustar Caja Inicial"}
              </DialogTitle>
              <DialogDescription>
                {isForcedOpen
                  ? "Para comenzar a operar, debes definir el monto de efectivo en caja."
                  : "Modifica el monto inicial si hubo un error en la apertura."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right font-medium">
                  Monto
                </Label>
                <div className="col-span-3 relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    value={initialCashInput}
                    onChange={(e) => setInitialCashInput(e.target.value)}
                    className="pl-9"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => saveCashMutation.mutate(parseFloat(initialCashInput) || 0)} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {saveCashMutation.isPending ? "Guardando..." : "Abrir Caja"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* --- ACTIVIDAD RECIENTE --- */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            Últimas Órdenes Activas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentActivity.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                paymentStatus={getPaymentStatus(order)}
              />
            ))}
            {recentActivity.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-muted rounded-xl bg-muted/20 flex flex-col items-center gap-3">
                <Inbox className="h-10 w-10 opacity-20" />
                <p>No hay órdenes activas recientes.</p>
                <Button variant="link" asChild className="text-primary">
                  <Link href="/ordenes/nueva">Crear la primera</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}