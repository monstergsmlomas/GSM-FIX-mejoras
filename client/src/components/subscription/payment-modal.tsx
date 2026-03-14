import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { initMercadoPago } from '@mercadopago/sdk-react';
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
if (publicKey) initMercadoPago(publicKey, { locale: 'es-AR' });

interface PaymentModalProps {
    open: boolean;
    planId: string; // 'monthly', 'semi_annual', 'annual'
    onClose: () => void;
}

export function PaymentModal({ open, planId, onClose }: PaymentModalProps) {
    // 👇 CORRECCIÓN: Traemos 'session' para sacar el token de ahí
    const { user, session } = useAuth();
    const [, setLoading] = useState(false);
    const [, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && planId && user) {
            createPreference();
        }
    }, [open, planId, user]);

    const createPreference = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    // 👇 CORRECCIÓN: Usamos session.access_token
                    'Authorization': `Bearer ${session?.access_token || ''}` 
                },
                body: JSON.stringify({ planId })
            });
            
            const data = await response.json();
            
            // REDIRECCIÓN DIRECTA A MERCADO PAGO
            if (data.init_point) {
                window.location.href = data.init_point;
            } else {
                console.error("No se recibió init_point", data);
                setError("No se pudo generar el enlace de pago.");
            }

        } catch (err) {
            console.error(err);
            setError("Error al conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}> 
            <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white">
                <div className="flex flex-col items-center justify-center p-6 space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    <p>Redirigiendo a Mercado Pago...</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}