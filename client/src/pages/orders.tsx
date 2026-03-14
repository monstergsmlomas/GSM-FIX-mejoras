import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Plus, 
  Search, 
  Filter, 
  ClipboardList, 
  Inbox, 
  CheckCircle2,
  Wrench,
  Archive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RepairOrderWithDetails, OrderStatus, Payment } from "@shared/schema";
import { OrderCard } from "@/components/cards/order-card";

// 👇 TODOS LOS ESTADOS AGREGADOS AL FILTRO 👇
const statusFilters: { value: string; label: string }[] = [
  { value: "activas", label: "Activas" },
  { value: "presupuesto", label: "Presupuestos" },
  { value: "esperando_aprobacion", label: "En Espera" }, 
  { value: "recibido", label: "Recibidas" },
  { value: "en_curso", label: "En Curso" },
  { value: "listo", label: "Listas" },
  { value: "abandonado", label: "Abandonados" }, // 👈 FALTABA ESTE
  { value: "historial", label: "Historial (Archivadas)" },
];

export default function Orders() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("activas");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<RepairOrderWithDetails[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 5000,
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
    refetchInterval: 5000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Estado actualizado correctamente" });
    },
    onError: () => {
      toast({ title: "Error al actualizar el estado", variant: "destructive" });
    }
  });

  // CÁLCULO EN VIVO
  const presupuestoCount = orders.filter(o => o.status === "presupuesto").length;
  const recibidasCount = orders.filter(o => o.status === "recibido").length;
  const enCursoCount = orders.filter(o => o.status === "en_curso").length;
  const listasCount = orders.filter(o => o.status === "listo").length;

  const getPaymentStatus = (order: RepairOrderWithDetails) => {
    const orderPayments = payments.filter(p => p.orderId === order.id);
    const totalPaid = orderPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const cost = order.finalCost > 0 ? order.finalCost : order.estimatedCost;

    if (cost === 0) return null;
    if (totalPaid >= cost) return "paid";
    if (totalPaid > 0) return "partial";
    return "unpaid";
  };

  const filteredOrders = orders.filter((order) => {
    let matchesStatus = false;

    if (statusFilter === "activas") {
      // Activas: Todo menos entregados, irreparables y abandonados
      matchesStatus = ["presupuesto", "esperando_aprobacion", "recibido", "en_curso", "listo"].includes(order.status);
    } else if (statusFilter === "historial") {
      // Historial: Entregados, irreparables y abandonados
      matchesStatus = ["entregado", "irreparable", "abandonado"].includes(order.status);
    } else {
      matchesStatus = order.status === statusFilter;
    }

    const matchesSearch = searchQuery === "" ||
      order.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.device.imei?.includes(searchQuery) ||
      order.device.serialNumber?.includes(searchQuery) ||
      order.device.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.device.model.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // 👇 ACÁ AGREGAMOS LOS COLORES PARA LOS FILTROS NUEVOS 👇
  const getTabStyles = (value: string) => {
    const base = "rounded-full px-4 py-2 transition-all border border-transparent data-[state=active]:shadow-sm data-[state=active]:font-medium text-sm";

    switch (value) {
      case 'activas':
        return `${base} data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/20`;
      case 'presupuesto':
        return `${base} data-[state=active]:bg-pink-500/10 data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-500 data-[state=active]:border-pink-500/20`;
      case 'esperando_aprobacion': 
        return `${base} data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-500 data-[state=active]:border-orange-500/20`;
      case 'recibido':
        return `${base} data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-500 data-[state=active]:border-blue-500/20`;
      case 'en_curso':
        return `${base} data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-500 data-[state=active]:border-amber-500/20`;
      case 'listo':
        return `${base} data-[state=active]:bg-green-500/10 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-500 data-[state=active]:border-green-500/20`;
      case 'abandonado':
        return `${base} data-[state=active]:bg-red-500/10 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-500 data-[state=active]:border-red-500/20`;
      case 'historial':
        return `${base} data-[state=active]:bg-zinc-500/10 data-[state=active]:text-zinc-600 dark:data-[state=active]:text-zinc-400 data-[state=active]:border-zinc-500/20`;
      default:
        return base;
    }
  };

  return (
    <div className="min-h-screen bg-background/50 pb-20 space-y-8">
      <div className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-4 transition-all">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Órdenes de Reparación
            </h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Gestiona y actualiza el estado de los equipos.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              asChild
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoadingOrders ? (
            [1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-32"><Skeleton className="h-full w-full" /></Card>
            ))
          ) : (
            <>
              <Card className="border-border/50 bg-gradient-to-br from-card via-card/95 to-pink-500/10 shadow-sm relative overflow-hidden group hover:border-pink-500/20 transition-all">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ClipboardList className="w-24 h-24 text-pink-500" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-pink-500" /> Presupuestos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                    {presupuestoCount}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-gradient-to-br from-card via-card/95 to-blue-500/10 shadow-sm relative overflow-hidden group hover:border-blue-500/20 transition-all">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Inbox className="w-24 h-24 text-blue-500" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Inbox className="h-4 w-4 text-blue-500" /> Recibidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {recibidasCount}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-gradient-to-br from-card via-card/95 to-amber-500/10 shadow-sm relative overflow-hidden group hover:border-amber-500/20 transition-all">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Wrench className="w-24 h-24 text-amber-500" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-amber-500" /> En Curso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {enCursoCount}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-gradient-to-br from-card via-card/95 to-green-500/10 shadow-sm relative overflow-hidden group hover:border-green-500/20 transition-all">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <CheckCircle2 className="w-24 h-24 text-green-500" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> Para Entregar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {listasCount}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="flex flex-col space-y-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, IMEI, marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
            />
          </div>

          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
            <TabsList className="h-auto p-1 bg-muted/50 backdrop-blur-sm border border-border/50 rounded-full inline-flex flex-wrap gap-1">
              {statusFilters.map((filter) => (
                <TabsTrigger
                  key={filter.value}
                  value={filter.value}
                  className={getTabStyles(filter.value)}
                >
                  {filter.value === "historial" && <Archive className="w-3 h-3 mr-1.5" />}
                  {filter.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {isLoadingOrders ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-border/50 bg-card/50">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-32 mb-4" />
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOrders && filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                paymentStatus={getPaymentStatus(order)}
                onStatusChange={(status) => updateStatusMutation.mutate({ id: order.id, status })}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Filter}
            title={searchQuery ? "Sin resultados" : (statusFilter === "historial" ? "Historial vacío" : "No hay órdenes activas")}
            description={
              searchQuery 
                ? "No se encontraron órdenes con esa búsqueda."
                : (statusFilter === "historial" ? "Aún no has entregado ni archivado ningún equipo." : "Crea tu primera orden de reparación para comenzar.")
            }
            actionLabel={!searchQuery && statusFilter !== "historial" ? "Nueva Orden" : undefined}
            actionHref={!searchQuery && statusFilter !== "historial" ? "/ordenes/nueva" : undefined}
          />
        )}
      </div>
    </div>
  );
}