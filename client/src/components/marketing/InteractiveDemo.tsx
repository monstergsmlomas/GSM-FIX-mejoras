import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CreditCard,
  Package,
  BarChart3,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  CheckCircle,
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Printer,
  Trash2,
  Pencil,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type DemoView = "dashboard" | "ordenes" | "clientes" | "cobros" | "stock" | "reportes";

const InteractiveDemo = () => {
  const [activeView, setActiveView] = useState<DemoView>("dashboard");
  const [ordersFilter, setOrdersFilter] = useState("todas");

  const navItems = [
    { id: "dashboard" as DemoView, label: "Dashboard", icon: LayoutDashboard },
    { id: "ordenes" as DemoView, label: "Órdenes", icon: ClipboardList },
    { id: "clientes" as DemoView, label: "Clientes", icon: Users },
    { id: "cobros" as DemoView, label: "Cobros", icon: CreditCard },
    { id: "stock" as DemoView, label: "Stock", icon: Package },
    { id: "reportes" as DemoView, label: "Reportes", icon: BarChart3 },
  ];

  return (
    <section id="dashboard" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4 bg-secondary text-foreground border-border">
            Demo Interactiva
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Explora el sistema completo
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Navega por las diferentes secciones y descubre todo lo que GSM FIX puede hacer por tu taller
          </p>

          {/* Disclaimer */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
            <Info className="w-4 h-4" />
            <span>Esta es una <strong>demostración simplificada</strong>. La aplicación real tiene un diseño más completo y profesional.</span>
          </div>
        </div>

        {/* Demo Container */}
        <div className="max-w-6xl mx-auto">
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xl">
            <div className="flex min-h-[600px]">
              {/* Sidebar */}
              <div className="w-16 md:w-52 bg-[hsl(0_0%_9%)] border-r border-border flex flex-col">
                {/* Logo */}
                <div className="p-3 md:p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    <div className="hidden md:block">
                      <span className="text-sm font-bold text-primary">GSM FIX</span>
                      <p className="text-[10px] text-muted-foreground">SISTEMA DE GESTIÓN</p>
                    </div>
                  </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 p-2 space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveView(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                        activeView === item.id
                          ? "bg-primary/20 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="hidden md:block text-sm font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>

                {/* User */}
                <div className="p-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                      TL
                    </div>
                    <div className="hidden md:block">
                      <p className="text-xs font-medium text-foreground">Mi Taller</p>
                      <p className="text-[10px] text-muted-foreground">Técnico Admin</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-4 md:p-6 overflow-auto bg-background">
                {activeView === "dashboard" && <DashboardView />}
                {activeView === "ordenes" && <OrdenesView filter={ordersFilter} setFilter={setOrdersFilter} />}
                {activeView === "clientes" && <ClientesView />}
                {activeView === "cobros" && <CobrosView />}
                {activeView === "stock" && <StockView />}
                {activeView === "reportes" && <ReportesView />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Dashboard View
const DashboardView = () => {
  const financialCards = [
    { title: "Caja Actual (Efectivo)", value: "$347.250", icon: Wallet, borderClass: "stat-card-cyan", textColor: "text-cyan-400" },
    { title: "Ingresos (Hoy)", value: "$89.500", icon: TrendingUp, borderClass: "stat-card-green", textColor: "text-green-500" },
    { title: "Gastos (Hoy)", value: "$23.800", icon: TrendingDown, borderClass: "stat-card-red", textColor: "text-red-500" },
    { title: "Balance Neto (Hoy)", value: "$65.700", icon: DollarSign, borderClass: "stat-card-emerald", textColor: "text-emerald-500" },
  ];

  const orders = [
    { device: "iPhone 13 Pro Max", client: "Martín González", issue: "pantalla rota", date: "04/02", status: "RECIBIDO", statusColor: "bg-gray-500", payment: "Pendiente", paymentColor: "text-muted-foreground" },
    { device: "Samsung Galaxy S23", client: "Laura Fernández", issue: "no enciende", date: "04/02", status: "LISTO", statusColor: "bg-green-500", payment: "Pagado", paymentColor: "text-green-500" },
    { device: "Xiaomi Redmi Note 12", client: "Carlos Méndez", issue: "batería agotada", date: "03/02", status: "EN CURSO", statusColor: "bg-orange-500", payment: "Parcial", paymentColor: "text-orange-500" },
    { device: "Motorola Edge 40", client: "Ana Ruiz", issue: "puerto de carga", date: "03/02", status: "RECIBIDO", statusColor: "bg-gray-500", payment: "Pagado", paymentColor: "text-green-500" },
  ];

  const statusCards = [
    { title: "Órdenes Activas", value: "18", icon: ClipboardList, iconBg: "bg-blue-500/20", iconColor: "text-blue-400" },
    { title: "Recibidos (Pend.)", value: "6", icon: Package, iconBg: "bg-yellow-500/20", iconColor: "text-yellow-400" },
    { title: "Para Entregar", value: "9", icon: CheckCircle, iconBg: "bg-green-500/20", iconColor: "text-green-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            Panel de Control
          </h3>
          <p className="text-sm text-muted-foreground">Resumen financiero y operativo en tiempo real.</p>
        </div>
        <Button
          className="w-fit"
          onClick={() => toast.info("Esta funcionalidad está disponible en la versión completa")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* Financial Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {financialCards.map((card, index) => (
          <Card key={index} className={cn("bg-card border border-border", card.borderClass)}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-xs md:text-sm", card.textColor)}>{card.title}</span>
                <card.icon className={cn("w-4 h-4", card.textColor)} />
              </div>
              <div className="text-lg md:text-2xl font-bold text-foreground">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Últimas Órdenes Activas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {orders.map((order, index) => (
              <Card key={index} className="bg-card border border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm text-foreground">{order.device}</span>
                    </div>
                    <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0.5", order.statusColor, "text-white")}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      <span>{order.client}</span>
                      <MessageCircle className="w-3 h-3 ml-auto text-green-500" />
                    </div>
                    <p className="pl-5 text-muted-foreground/70">| {order.issue}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {order.date}
                    </div>
                    <span className={cn("text-xs font-medium", order.paymentColor)}>{order.payment}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Cards */}
      <div>
        <h4 className="text-base md:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Estado Operativo
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {statusCards.map((card, index) => (
            <Card key={index} className="bg-card border border-border">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", card.iconBg)}>
                  <card.icon className={cn("w-5 h-5", card.iconColor)} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                  <p className="text-xl font-bold text-foreground">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// Ordenes View
const OrdenesView = ({ filter, setFilter }: { filter: string; setFilter: (f: string) => void }) => {
  const filters = ["Todas", "Recibidas", "En Curso", "Listas", "Entregadas"];

  const orders = [
    { device: "iPhone 13 Pro Max", client: "Martín González", issue: "pantalla rota", date: "04/02", status: "RECIBIDO", statusColor: "bg-gray-500", payment: "Pendiente" },
    { device: "Samsung Galaxy S23", client: "Laura Fernández", issue: "no enciende", date: "04/02", status: "LISTO", statusColor: "bg-green-500", payment: "Pagado" },
    { device: "Xiaomi Redmi Note 12", client: "Carlos Méndez", issue: "batería agotada", date: "03/02", status: "EN CURSO", statusColor: "bg-orange-500", payment: "Parcial" },
    { device: "Motorola Edge 40", client: "Ana Ruiz", issue: "puerto de carga", date: "03/02", status: "RECIBIDO", statusColor: "bg-gray-500", payment: "Pagado" },
    { device: "iPhone 14", client: "Diego Torres", issue: "botón power", date: "02/02", status: "ENTREGADO", statusColor: "bg-blue-500", payment: "Pagado" },
    { device: "Samsung A54", client: "Sofía Herrera", issue: "cambio de módulo", date: "02/02", status: "LISTO", statusColor: "bg-green-500", payment: "Pendiente" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-foreground">Órdenes de Reparación</h3>
          <p className="text-sm text-muted-foreground">Gestiona y actualiza el estado de los equipos.</p>
        </div>
        <Button
          className="w-fit"
          onClick={() => toast.info("Esta funcionalidad está disponible en la versión completa")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Orden
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, IMEI, marca..."
          className="pl-10 bg-card border-border"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f}
            variant={filter.toLowerCase() === f.toLowerCase() ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.toLowerCase())}
            className={filter.toLowerCase() === f.toLowerCase() ? "px-4" : ""}
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {orders.map((order, index) => (
          <Card key={index} className="bg-card border border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{order.device}</span>
                </div>
                <Badge className={cn("text-[10px]", order.statusColor, "text-white border-0")}>
                  {order.status}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{order.client}</span>
                  <MessageCircle className="w-4 h-4 ml-auto text-green-500 cursor-pointer hover:scale-110 transition-transform" />
                </div>
                <p className="text-muted-foreground/70 pl-5">| {order.issue}</p>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {order.date}
                </div>
                <Badge variant="outline" className={cn(
                  "text-xs",
                  order.payment === "Pagado" ? "border-green-500 text-green-500" :
                    order.payment === "Parcial" ? "border-orange-500 text-orange-500" :
                      "border-muted-foreground text-muted-foreground"
                )}>
                  {order.payment}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Clientes View
const ClientesView = () => {
  const clients = [
    { name: "Martín González", phone: "11 4532-8876", email: "martin.gonzalez@gmail.com" },
    { name: "Laura Fernández", phone: "11 6789-4523", email: "laura.fernandez@hotmail.com" },
    { name: "Carlos Méndez", phone: "11 2345-7890", email: "carlos.mendez@yahoo.com" },
    { name: "Ana Ruiz", phone: "11 8901-2345", email: "ana.ruiz@outlook.com" },
    { name: "Diego Torres", phone: "+54 9 2257 45-6789", email: null },
    { name: "Sofía Herrera", phone: "11 3456-7812", email: null },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6" />
            Clientes
          </h3>
          <p className="text-sm text-muted-foreground">Gestiona tu base de clientes y su historial.</p>
        </div>
        <Button
          className="w-fit"
          onClick={() => toast.info("Esta funcionalidad está disponible en la versión completa")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground">Directorio de Clientes</h4>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o email..."
            className="pl-10 bg-card border-border text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {clients.map((client, index) => (
          <Card key={index} className="bg-card border border-border hover:border-primary/30 transition-colors group">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-foreground">{client.name}</h4>
                <MessageCircle className="w-5 h-5 text-green-500 cursor-pointer hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{client.phone}</span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Cobros View
const CobrosView = () => {
  const summaryCards = [
    { title: "Ingresos Totales", value: "$1.245.800", icon: TrendingUp, color: "text-green-500", bgIcon: "text-green-500/20" },
    { title: "Gastos Totales", value: "$89.500", icon: TrendingDown, color: "text-red-500", bgIcon: "text-red-500/20" },
    { title: "Balance Neto", value: "$1.156.300", icon: DollarSign, color: "text-emerald-500", bgIcon: "text-emerald-500/20" },
  ];

  const movements = [
    { date: "04/02/2026 15:32", type: ["Reparación"], detail: "Reparación iPhone 13 Pro Max - Martín González\nCambio de pantalla original", category: "Efectivo", amount: "+ $85.000", amountColor: "text-green-500" },
    { date: "04/02/2026 11:15", type: ["Reparación", "Venta"], detail: "Reparación Samsung S23 - Laura Fernández\nFunda protectora incluida", category: "Transferencia", amount: "+ $67.500", amountColor: "text-green-500" },
    { date: "03/02/2026 18:45", type: ["Venta"], detail: "Cargador rápido USB-C 25W", category: "Efectivo", amount: "+ $12.500", amountColor: "text-green-500" },
    { date: "03/02/2026 14:20", type: ["Gasto"], detail: "Pantallas Samsung A54 (x3 unidades)", category: "Insumos", amount: "- $45.000", amountColor: "text-red-500" },
    { date: "02/02/2026 16:30", type: ["Reparación"], detail: "Cambio batería Xiaomi Note 12 - Carlos Méndez\nRecargo Tarjeta (10%)", category: "Tarjeta", amount: "+ $28.600", amountColor: "text-green-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            Cobros y Caja
          </h3>
          <p className="text-sm text-muted-foreground">Gestiona ingresos, gastos y el flujo de caja diario.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10">
            <TrendingDown className="w-4 h-4 mr-2" />
            Registrar Gasto
          </Button>
          <Button
            onClick={() => toast.info("Esta funcionalidad está disponible en la versión completa")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Venta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index} className="bg-card border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className={cn("w-4 h-4", card.color)} />
                <span className="text-sm text-muted-foreground">{card.title}</span>
              </div>
              <div className={cn("text-2xl md:text-3xl font-bold", card.color)}>{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-border bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Historial de Movimientos</CardTitle>
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-10 h-8 text-sm bg-background" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-muted-foreground font-medium">Fecha</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Tipo</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Detalle</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Categoría</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Monto</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((mov, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{mov.date}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {mov.type.map((t, i) => (
                          <Badge key={i} variant="secondary" className={cn(
                            "text-[10px]",
                            t === "Reparación" ? "bg-purple-500/20 text-purple-400" :
                              t === "Venta" ? "bg-green-500/20 text-green-400" :
                                "bg-red-500/20 text-red-400"
                          )}>
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-foreground max-w-[200px]">
                      <div className="whitespace-pre-line text-xs">{mov.detail}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">{mov.category}</Badge>
                    </td>
                    <td className={cn("p-3 text-right font-semibold whitespace-nowrap", mov.amountColor)}>{mov.amount}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Printer className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" />
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500 cursor-pointer" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Stock View
const StockView = () => {
  const summaryCards = [
    { title: "Total Productos", value: "48", subtitle: "items", icon: Package, color: "text-cyan-400" },
    { title: "Valor Inventario (Costo)", value: "$892.400", icon: DollarSign, color: "text-green-500" },
    { title: "Alerta Stock Bajo", value: "3", subtitle: "productos", icon: AlertTriangle, color: "text-orange-500" },
  ];

  const products = [
    { sku: "PAN-IP13", brand: "Apple", product: "Pantalla iPhone 13 Pro Max Original", quality: "Original", category: "repuesto", cost: "$45.000", price: "$85.000", stock: "12", alert: false },
    { sku: "BAT-SAM23", brand: "Samsung", product: "Batería Galaxy S23 Original", quality: "Original", category: "repuesto", cost: "$18.000", price: "$35.000", stock: "8", alert: false },
    { sku: "CAR-USC25", brand: "Genérico", product: "Cargador USB-C 25W", quality: "-", category: "accesorio", cost: "$4.500", price: "$12.500", stock: "45", alert: false },
    { sku: "FUN-IP14", brand: "Apple", product: "Funda Silicona iPhone 14", quality: "-", category: "accesorio", cost: "$2.800", price: "$8.500", stock: "32", alert: false },
    { sku: "MOD-A54", brand: "Samsung", product: "Módulo pantalla Galaxy A54", quality: "AAA", category: "repuesto", cost: "$28.000", price: "$55.000", stock: "4", alert: true },
    { sku: "PIN-UNI", brand: "Universal", product: "Pin de carga Tipo C", quality: "-", category: "repuesto", cost: "$1.200", price: "$4.500", stock: "3", alert: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-6 h-6" />
            Inventario
          </h3>
          <p className="text-sm text-muted-foreground">Gestión de stock, productos y precios.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500/10">
            Importar Excel
          </Button>
          <Button
            onClick={() => toast.info("Esta funcionalidad está disponible en la versión completa")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index} className="bg-card border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className={cn("w-4 h-4", card.color)} />
                <span className="text-sm text-muted-foreground">{card.title}</span>
              </div>
              <div className={cn("text-2xl md:text-3xl font-bold", card.color)}>
                {card.value}
                {card.subtitle && <span className="text-sm font-normal text-muted-foreground ml-1">{card.subtitle}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-border bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Listado de Productos</CardTitle>
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, SKU, marca..." className="pl-10 h-8 text-sm bg-background" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-muted-foreground font-medium">SKU</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Marca / Modelo</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Producto</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Categoría</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Costo</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Precio Venta</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Stock</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 text-muted-foreground">{prod.sku}</td>
                    <td className="p-3 text-muted-foreground">{prod.brand}</td>
                    <td className="p-3 text-foreground font-medium">{prod.product}</td>
                    <td className="p-3">
                      {prod.category !== "-" && (
                        <Badge variant="secondary" className={cn(
                          "text-[10px]",
                          prod.category === "accesorio" ? "bg-cyan-500/20 text-cyan-400" : "bg-orange-500/20 text-orange-400"
                        )}>
                          {prod.category}
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-right text-muted-foreground">{prod.cost}</td>
                    <td className="p-3 text-right font-semibold text-foreground">{prod.price}</td>
                    <td className="p-3 text-right">
                      <span className={cn(
                        "font-semibold",
                        prod.alert ? "text-red-500" : "text-foreground"
                      )}>
                        {prod.stock}
                        {prod.alert && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" />
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500 cursor-pointer" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Reportes View
const ReportesView = () => {
  const summaryCards = [
    { title: "Total Ingresos", value: "$1.245.800", icon: TrendingUp, color: "text-green-500" },
    { title: "Total Gastos", value: "$89.500", icon: TrendingDown, color: "text-red-500" },
    { title: "Balance Neto", value: "$1.156.300", icon: DollarSign, color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Reportes
          </h3>
          <p className="text-sm text-muted-foreground">Análisis financiero y métricas de rendimiento.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border">
            <Calendar className="w-4 h-4 mr-2" />
            Hoy (Jornada)
          </Button>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
            CSV
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button>
          <ClipboardList className="w-4 h-4 mr-2" />
          Resumen Financiero
        </Button>
        <Button variant="outline" className="border-border">
          <BarChart3 className="w-4 h-4 mr-2" />
          Métricas y Gráficos
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index} className="bg-card border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className={cn("w-4 h-4", card.color)} />
                <span className="text-sm text-muted-foreground">{card.title}</span>
              </div>
              <div className={cn("text-2xl md:text-3xl font-bold", card.color)}>{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Detalle de Movimientos
          </CardTitle>
          <p className="text-sm text-muted-foreground">Listado detallado de ingresos y egresos del periodo seleccionado.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-muted-foreground font-medium">Fecha</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Tipo</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Categoría</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Descripción</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Método</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Sin movimientos en este periodo.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveDemo;
