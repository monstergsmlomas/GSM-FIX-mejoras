import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowRight, Shield, ClipboardList, BarChart3, Users, Package } from "lucide-react";
import { Link } from "wouter"; // CAMBIO: wouter

const FreeTrialSection = () => {
  const features = [
    {
      icon: ClipboardList,
      title: "Gestión de Órdenes",
      description: "Control completo de reparaciones con checklist de recepción"
    },
    {
      icon: Package,
      title: "Control de Stock",
      description: "Inventario en tiempo real con alertas de stock bajo"
    },
    {
      icon: Users,
      title: "CRM de Clientes",
      description: "Base de datos completa con historial de equipos"
    },
    {
      icon: BarChart3,
      title: "Reportes Financieros",
      description: "Métricas de ingresos, gastos y balance en tiempo real"
    },
  ];

  const trialBenefits = [
    "Acceso completo a todas las funciones",
    "Sin tarjeta de crédito requerida",
    "Soporte prioritario incluido",
    "Capacitación gratuita incluida",
  ];

  return (
    <section id="prueba-gratis" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6 font-semibold">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-500 uppercase tracking-wider">Sin compromiso de permanencia</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">
            Prueba GSM FIX{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-400">
              7 días sin cargo
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
            Experimenta todas las funcionalidades de nuestro sistema premium sin costo inicial.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-16 items-start max-w-6xl mx-auto">
          {/* Left: Features */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-foreground mb-8 border-l-4 border-primary pl-4">
              Beneficios de tu prueba gratuita
            </h3>
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-neutral-900/40 backdrop-blur-md border border-white/5 hover:border-primary/30 transition-all duration-300"
              >
                <CardContent className="p-5 flex items-start gap-5">
                  <div className="p-3 rounded-xl bg-primary/15 ring-1 ring-primary/20">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-lg mb-1">{feature.title}</h4>
                    <p className="text-sm text-neutral-400 font-medium">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Right: Trial Card Resized */}
          <div className="relative group isolate max-w-md mx-auto w-full">
            {/* Intense Purple Glow - Opacity 0.6 */}
            <div className="absolute -inset-10 bg-gradient-to-br from-violet-600/50 via-purple-600/40 to-fuchsia-600/30 rounded-full blur-[80px] opacity-0 group-hover:opacity-60 transition-opacity duration-700 -z-10" />

            <Card className="relative bg-neutral-950/90 backdrop-blur-2xl border-[1.5px] border-purple-500/20 group-hover:border-purple-500/60 group-hover:scale-110 group-hover:z-30 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) shadow-2xl overflow-hidden rounded-3xl">
              {/* Internal neon ambient light */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.15),transparent_50%)]" />

              <CardContent className="p-8 relative">
                <div className="text-center mb-8">
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400 mb-3 animate-pulse">Acceso Ilimitado</div>
                  <div className="text-6xl font-black text-white mb-1 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] tracking-tighter">7 días</div>
                  <div className="text-neutral-400 font-semibold text-lg italic opacity-80">Prueba Premium</div>
                </div>

                <div className="space-y-4 mb-8">
                  {trialBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3 group/item">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/40 group-hover/item:scale-110 group-hover/item:bg-purple-500/40 transition-all duration-300">
                        <Check className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <span className="text-neutral-300 text-base font-semibold group-hover/item:text-white transition-colors duration-300">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="w-full h-auto py-6 text-xl font-black rounded-xl border border-purple-500/50 bg-purple-600/30 text-white shadow-[0_0_30px_-10px_rgba(139,92,246,0.6)] hover:bg-purple-600/50 hover:border-purple-300 group-hover:scale-105 active:scale-95 transition-all duration-500 backdrop-blur-md cursor-pointer"
                    >
                      COMENZAR AHORA
                      <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                    </Button>
                  </Link>
                </div>

                <p className="text-center text-[10px] text-neutral-500 mt-6 font-bold uppercase tracking-wider">
                  Sin tarjeta • <span className="text-purple-400/80">Cancela en cualquier momento</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreeTrialSection;