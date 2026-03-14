import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, X } from "lucide-react"; // 👈 Importamos los íconos del banner
import { ExpiredOverlay } from "@/components/subscription/expired-overlay";
import { supabase } from "@/lib/supabaseClient";

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading: authLoading } = useAuth();
    const [checking, setChecking] = useState(true);
    
    // 👈 Cambiamos el booleano por 3 estados claros
    const [subStatus, setSubStatus] = useState<"active" | "grace" | "expired">("active");
    const [graceDaysLeft, setGraceDaysLeft] = useState(0);
    const [dismissBanner, setDismissBanner] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setSubStatus("active"); // Dejar pasar al login
            setChecking(false);
            return;
        }

        // Consultamos tu endpoint LAZY INIT
        const checkSub = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                const res = await fetch("/api/user/subscription", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    
                    // 🧮 LÓGICA DE FECHAS
                    const now = new Date();
                    // Obtenemos la fecha de vencimiento (si no existe, usamos HOY por seguridad)
                    const expiryDate = data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : now;
                    
                    // Calculamos cuántos milisegundos y días pasaron desde que venció
                    const msPastExpiry = now.getTime() - expiryDate.getTime();
                    const daysPastExpiry = msPastExpiry / (1000 * 60 * 60 * 24);

                    if (data.subscriptionStatus === 'active' || data.subscriptionStatus === 'trialing' || msPastExpiry <= 0) {
                        // 🟢 ACTIVO: Todo en orden
                        setSubStatus("active");
                    } else if (daysPastExpiry > 0 && daysPastExpiry <= 3) {
                        // 🟠 PERÍODO DE GRACIA: Venció, pero hace 3 días o menos
                        setSubStatus("grace");
                        // Calculamos cuántos días le quedan de los 3 de regalo (redondeando hacia arriba)
                        setGraceDaysLeft(Math.ceil(3 - daysPastExpiry) || 1);
                    } else {
                        // 🔴 EXPIRADO: Pasaron más de 3 días
                        setSubStatus("expired");
                    }
                } else {
                    // Si falla el endpoint, bloqueamos por seguridad
                    setSubStatus("expired");
                }
            } catch (e) {
                console.error(e);
                setSubStatus("expired");
            } finally {
                setChecking(false);
            }
        };

        checkSub();
    }, [user, authLoading]);

    if (authLoading || checking) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-zinc-950">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    // 🔒 Si ya pasaron los 3 días, cae el bloqueo total
    if (subStatus === "expired") {
        return <ExpiredOverlay />;
    }

    // 🔓 Renderizamos la app, inyectando el banner si está en días de gracia
    return (
        <>
            {subStatus === "grace" && !dismissBanner && (
                <div className="bg-red-500/90 text-white px-4 py-3 mb-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3 text-sm font-medium">
                        <AlertTriangle className="h-5 w-5 animate-pulse" />
                        <p>
                            Tu plan ha vencido. Tienes <strong>{graceDaysLeft} {graceDaysLeft === 1 ? 'día' : 'días'} de cortesía</strong> para renovarlo antes de que se suspenda el acceso.
                        </p>
                    </div>
                    <button
                        onClick={() => setDismissBanner(true)}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        title="Ocultar aviso por ahora"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
            {children}
        </>
    );
}