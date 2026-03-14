import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Lock, Timer } from "lucide-react"; // Añadimos Timer
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

type BillingPeriod = 'monthly' | 'semester' | 'annual';

interface Plan {
    id: string;
    name: string;
    description: string;
    prices: {
        monthly: number; // Cambiamos a number para manejar lógica
        semester: number;
        annual: number;
    };
    features: string[];
    cta: string;
    popular: boolean; 
    isUpcoming?: boolean;
    extraInfo?: string;
    colorTheme: 'emerald' | 'purple';
}

const PricingSection = () => {
    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
    const { user } = useAuth();
    const [, setLocation] = useLocation();

    // 👇 LÓGICA DE LANZAMIENTO
    const now = new Date();
    const promoDeadline = new Date("2026-03-18T23:59:59");
    const isPromoActive = now <= promoDeadline;

    const plans: any[] = [ // Usamos any temporalmente por los strings de "Próximamente"
        {
            id: "standard",
            name: "Estándar",
            description: "Para talleres que necesitan organización total.",
            prices: {
                monthly: isPromoActive ? 25000 : 30000, // Precio dinámico
                semester: 160000,
                annual: 300000,
            },
            oldPrices: { // Para el efecto tachado
                monthly: 30000
            },
            features: [
                "Órdenes ilimitadas",
                "Gestión de clientes",
                "Inventario y Stock",
                "Caja y Finanzas",
                "1 Usuario técnico",
                "Soporte"
            ],
            cta: "Comenzar Gratis",
            popular: true, 
            isUpcoming: false,
            colorTheme: 'emerald'
        },
        {
            id: "multisede",
            name: "Multisede",
            description: "La opción ideal para talleres con varias sucursales.",
            prices: {
                monthly: 30000,
                semester: 160000,
                annual: 300000,
            },
            extraInfo: "+ $10.000 por sucursal extra",
            features: [
                "Todo lo del plan Estándar",
                "Múltiples sucursales",
                "Stock independiente",
                "Reportes por sede",
                "Comparaciones entre sucursales",
                "Soporte prioritario"
            ],
            cta: "Próximamente",
            popular: false,
            isUpcoming: true,
            colorTheme: 'purple'
        },
        {
            id: "premium",
            name: "Premium AI",
            description: "Inteligencia Artificial aplicada a tu servicio técnico.",
            prices: {
                monthly: "Próximamente",
                semester: "Próximamente",
                annual: "Próximamente",
            },
            features: [
                "Todo lo del plan Multisede",
                "Chatbot de WhatsApp IA",
                "Respuestas 24/7",
                "Agendamiento automático",
                "Stock de proveedores",
                "Soporte 24/7"
            ],
            cta: "Lista de Espera",
            popular: false,
            isUpcoming: true,
            colorTheme: 'purple'
        }
    ];

    const formatPrice = (price: any) => {
        if (typeof price === 'string') return price;
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0
        }).format(price);
    };

    const getPeriodLabel = () => {
        switch (billingPeriod) {
            case 'monthly': return '/mes';
            case 'semester': return '/semestre';
            case 'annual': return '/año';
            default: return '';
        }
    };

    const handlePlanSelect = (planId: string) => {
        if (user) {
            setLocation("/configuracion?tab=subscription");
        } else {
            setLocation(`/register?plan=${planId}&period=${billingPeriod}`);
        }
    };

    return (
        <section id="pricing" className="py-20 bg-card/50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <Badge variant="secondary" className="mb-4 bg-secondary text-foreground border-border uppercase tracking-widest">
                        Lanzamiento 2026
                    </Badge>
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                        Elige el plan ideal para tu taller
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                        Sin costos ocultos. Prueba gratis por 7 días.
                    </p>

                    {/* MOSTRAR AVISO DE OFERTA SI ESTÁ ACTIVA */}
                    {isPromoActive && (
                        <div className="flex items-center justify-center gap-2 mb-6 text-emerald-400 font-bold animate-pulse">
                            <Timer className="w-5 h-5" />
                            <span>¡Oferta de lanzamiento disponible hasta el 18 de Marzo!</span>
                        </div>
                    )}

                    <div className="relative inline-flex group mt-4">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/30 via-blue-500/30 to-purple-600/30 rounded-xl blur opacity-20 transition duration-500"></div>
                        <Tabs defaultValue="monthly" className="relative w-full max-w-[500px] mx-auto" onValueChange={(v) => setBillingPeriod(v as BillingPeriod)}>
                            <TabsList className="grid w-full grid-cols-3 bg-neutral-900/90 backdrop-blur-xl border border-white/10 p-1.5 h-auto rounded-xl shadow-lg">
                                <TabsTrigger value="monthly" className="text-sm md:text-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-blue-600 data-[state=active]:text-white py-3 transition-all">Mensual</TabsTrigger>
                                <TabsTrigger value="semester" className="text-sm md:text-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-blue-600 data-[state=active]:text-white py-3 transition-all">Semestral</TabsTrigger>
                                <TabsTrigger value="annual" className="text-sm md:text-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-blue-600 data-[state=active]:text-white py-3 transition-all">Anual</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-8 max-w-7xl mx-auto items-stretch py-10">
                    {plans.map((plan) => {
                        const isStandardPromo = plan.id === 'standard' && billingPeriod === 'monthly' && isPromoActive;
                        let cardStyles = plan.colorTheme === 'emerald' 
                            ? "bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-emerald-500/30 via-card/80 to-card border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20"
                            : "bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-500/15 via-card/90 to-card border border-purple-500/50 hover:shadow-purple-500/20";

                        return (
                            <Card key={plan.id} className={`w-full max-w-sm relative flex flex-col transition-all duration-300 ease-out rounded-xl hover:scale-105 hover:z-10 ${cardStyles}`}>
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                                        <Badge className="bg-emerald-500 hover:bg-emerald-600 border-0 text-black px-4 py-1 font-bold shadow-lg">
                                            <Star className="w-3 h-3 mr-1 fill-black" />
                                            Más Popular
                                        </Badge>
                                    </div>
                                )}

                                <CardHeader className="text-center pb-4 pt-8">
                                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                    <CardDescription className="mt-2 min-h-[40px]">{plan.description}</CardDescription>

                                    <div className="mt-6 flex flex-col items-center justify-center min-h-[100px]">
                                        {/* PRECIO TACHADO SI HAY PROMO */}
                                        {isStandardPromo && (
                                            <span className="text-lg text-red-500 line-through opacity-80 font-medium">
                                                {formatPrice(plan.oldPrices.monthly)}
                                            </span>
                                        )}
                                        
                                        <div className="flex items-baseline justify-center">
                                            <span className={`text-4xl font-extrabold tracking-tight ${plan.isUpcoming ? 'text-muted-foreground' : 'text-foreground'}`}>
                                                {formatPrice(plan.prices[billingPeriod])}
                                            </span>
                                            {!plan.isUpcoming && (
                                                <span className="text-muted-foreground ml-1 font-medium">{getPeriodLabel()}</span>
                                            )}
                                        </div>

                                        {isStandardPromo && (
                                            <Badge variant="outline" className="mt-2 border-emerald-500 text-emerald-500 text-[10px] uppercase">
                                                Ahorra {formatPrice(plan.oldPrices.monthly - plan.prices.monthly)} este mes
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1 flex flex-col p-6">
                                    <div className="flex-1">
                                        <ul className="space-y-3 mb-8 mt-2">
                                            {plan.features.map((feature: string, i: number) => (
                                                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                                                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.colorTheme === 'emerald' ? 'text-emerald-500' : 'text-purple-500'}`} />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <Button
                                        disabled={plan.isUpcoming}
                                        onClick={() => handlePlanSelect(plan.id)}
                                        className={`w-full text-base py-6 font-bold transition-all duration-300 ${plan.isUpcoming 
                                            ? 'bg-primary/5 border border-primary/20 text-muted-foreground opacity-70' 
                                            : plan.popular 
                                                ? 'bg-emerald-500 hover:bg-emerald-600 border-0 text-black shadow-lg shadow-emerald-500/25' 
                                                : 'bg-primary/5 border border-primary/20 text-foreground hover:bg-primary/10'
                                        }`}
                                    >
                                        {plan.isUpcoming && <Lock className="w-4 h-4 mr-2" />}
                                        {plan.cta}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <p className="text-center text-sm text-muted-foreground mt-12 opacity-70">
                    Precios en pesos argentinos. Incluye IVA. Facturación electrónica disponible.
                </p>
            </div>
        </section>
    );
};

export default PricingSection;