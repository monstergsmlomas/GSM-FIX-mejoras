import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Package,
  Users,
  BarChart3,
  Wallet,
  Settings,
  // ArrowRight // No se usaba en el original, lo dejo comentado o se puede quitar
} from "lucide-react";
import { Link } from "wouter"; // CAMBIO: Usamos wouter

const FeaturesGrid = () => {
  const features = [
    {
      icon: ClipboardList,
      title: "Órdenes",
      description: "Crea, rastrea y administra todas las reparaciones con un flujo de trabajo intuitivo.",
      benefits: ["Seguimiento en tiempo real", "Checklist de recepción", "Historial completo"],
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
      link: "/ordenes",
    },
    {
      icon: Users,
      title: "Clientes",
      description: "Base de datos completa con historial de reparaciones y comunicación centralizada.",
      benefits: ["Historial de equipos", "Datos de contacto", "Notas personalizadas"],
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
      link: "/clientes",
    },
    {
      icon: Wallet,
      title: "Cobros",
      description: "Gestiona ventas, pagos y caja con múltiples métodos de pago y facturación.",
      benefits: ["Efectivo y tarjeta", "Recargos automáticos", "Historial de transacciones"],
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
      link: "/cobros", // Ajustado ruta a la real de tu app (/cobros)
    },
    {
      icon: Package,
      title: "Stock",
      description: "Control total de inventario con alertas de stock bajo y gestión de proveedores.",
      benefits: ["Alertas automáticas", "Categorías", "Costos y precios"],
      iconBg: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
      link: "/inventory", // Ajustado ruta a la real de tu app (/inventory)
    },
    {
      icon: BarChart3,
      title: "Reportes",
      description: "Análisis detallado de ingresos, gastos y rentabilidad con gráficos interactivos.",
      benefits: ["Métricas en tiempo real", "Exportar CSV", "Filtros por fecha"],
      iconBg: "bg-cyan-500/20",
      iconColor: "text-cyan-400",
      link: "/reportes", // Ajustado ruta a la real de tu app (/reportes)
    },
    {
      icon: Settings,
      title: "Configuración",
      description: "Personaliza el sistema según las necesidades de tu taller.",
      benefits: ["Usuarios y permisos", "Datos del negocio", "Preferencias"],
      iconBg: "bg-gray-500/20",
      iconColor: "text-gray-400",
      link: "/configuracion", // Ajustado ruta a la real de tu app (/configuracion)
    },
  ];

  return (
    <section id="features" className="py-20 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 bg-secondary text-foreground border-border">
            Funcionalidades
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Todo lo que necesitas para crecer
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Herramientas poderosas diseñadas específicamente para talleres de reparación
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl mx-auto py-10">
          {features.map((feature, index) => {
            const isEmerald = feature.iconColor.includes("green") || feature.iconColor.includes("cyan") || feature.iconColor.includes("blue");
            const shadowColor = isEmerald ? "rgba(34,197,94,0.3)" : "rgba(139,92,246,0.3)";
            const glowGradient = isEmerald ? "from-emerald-500/40 to-emerald-600/20" : "from-purple-500/40 to-purple-600/20";

            return (
              <Link href={feature.link} key={index}>
                <div className="relative group isolate h-full">
                  {/* Background Glow Effect - Intensified Opacity 0.6 */}
                  <div className={`absolute -inset-4 bg-gradient-to-r ${glowGradient} rounded-3xl blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 -z-10`} />

                  <Card
                    style={{ '--hover-shadow': shadowColor } as React.CSSProperties}
                    className="relative h-full bg-neutral-900/80 backdrop-blur-xl border border-white/5 group-hover:border-primary/50 group-hover:scale-105 group-hover:z-30 transition-all duration-500 ease-out cursor-pointer overflow-hidden z-20 hover:shadow-[0_20px_50px_var(--hover-shadow)]"
                  >
                    {/* Internal accent light */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${isEmerald ? 'from-emerald-500/10' : 'from-purple-500/10'} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                    <CardHeader className="relative pb-3">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-2xl ${feature.iconBg} flex items-center justify-center ring-1 ring-white/10 group-hover:ring-primary/40 transition-all duration-300 shadow-inner group-hover:scale-110`}>
                          <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                        </div>
                        <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                          {feature.title}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-muted-foreground text-sm leading-relaxed group-hover:text-neutral-300 transition-colors duration-300">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative pt-0">
                      <ul className="space-y-3 mb-4">
                        {feature.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-neutral-400 group-hover:text-neutral-200 transition-colors duration-300">
                            <div className={`w-2 h-2 rounded-full ${isEmerald ? 'bg-emerald-500' : 'bg-purple-500'} group-hover:animate-pulse`} />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;