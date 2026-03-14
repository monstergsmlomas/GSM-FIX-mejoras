import { useState } from "react";
import { Check, ShieldAlert, LogOut } from "lucide-react";
import { PaymentModal } from "./payment-modal";
import { useAuth } from "@/hooks/use-auth";

export function ExpiredOverlay() {
    const { signOut } = useAuth();
    // Guardamos directamente el string del ID (ej: 'monthly', 'annual')
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

    const plans = [
        {
            id: "monthly",
            title: "Mensual",
            price: "$25.000",
            period: "por mes",
            features: ["Acceso completo", "Sin permanencia", "Soporte básico"],
            recommended: false
        },
        {
            // OJO: Cambiado de 'semester' a 'semi_annual' para coincidir con el Backend
            id: "semi_annual",
            title: "Semestral",
            price: "$160.000",
            period: "cada 6 meses",
            features: ["10% OFF", "Soporte prioritario", "Todas las funciones"],
            recommended: true
        },
        {
            id: "annual",
            title: "Anual",
            price: "$300.000",
            period: "un solo pago anual",
            features: ["20% OFF", "Soporte VIP 24/7", "Auditoría anual"],
            recommended: false
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 p-4 overflow-y-auto">
            <div className="max-w-5xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-300 py-10">

                {/* Cabecera */}
                <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                        Tu suscripción ha finalizado
                    </h1>
                    <p className="text-zinc-400 max-w-xl mx-auto text-lg">
                        ¡No te detengas! Reactiva tu cuenta ahora y sigue gestionando tus reparaciones sin interrupciones.
                    </p>
                </div>

                {/* Grid de Precios */}
                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto px-4">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative rounded-2xl p-6 border flex flex-col transition-all hover:-translate-y-1 ${plan.recommended
                                ? "bg-zinc-900 border-indigo-500 shadow-2xl shadow-indigo-500/10 z-10 scale-105"
                                : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                                }`}
                        >
                            {plan.recommended && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                                    MÁS POPULAR
                                </span>
                            )}

                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-zinc-300">{plan.title}</h3>
                                <div className="mt-2 flex items-baseline justify-center gap-1">
                                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                                </div>
                                <div className="text-sm text-zinc-500 mt-1">{plan.period}</div>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1 text-left px-4">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center text-sm text-zinc-300">
                                        <Check className="w-4 h-4 text-emerald-500 mr-3 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                // CORRECCIÓN AQUÍ: Pasamos el ID real ('monthly', 'annual', etc.)
                                onClick={() => setSelectedPlanId(plan.id)}
                                className={`w-full py-3 rounded-lg font-semibold transition-colors ${plan.recommended
                                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                                    : "bg-zinc-800 hover:bg-zinc-700 text-white"
                                    }`}
                            >
                                Elegir {plan.title}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="pt-8 flex flex-col items-center gap-4">
                    <p className="text-xs text-zinc-600">
                        Pagos procesados de forma segura por Mercado Pago.
                    </p>
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm"
                    >
                        <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                </div>
            </div>

            {/* El Modal que se abre al elegir un plan */}
            {selectedPlanId && (
                <PaymentModal
                    open={true}
                    planId={selectedPlanId} // Ahora enviamos el ID correcto
                    onClose={() => setSelectedPlanId(null)}
                />
            )}
        </div>
    );
}