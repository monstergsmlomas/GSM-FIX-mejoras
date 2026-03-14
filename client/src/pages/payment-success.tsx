import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function PaymentSuccess() {
    const [, setLocation] = useLocation();
    const { user } = useAuth();
    const [countdown, setCountdown] = useState(5);

    // Efecto de cuenta regresiva para redirigir automático
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setLocation("/dashboard");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [setLocation]);

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 p-4">
            <Card className="max-w-md w-full bg-zinc-900 border-zinc-800 animate-in zoom-in duration-500">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-white">
                        ¡Pago Exitoso!
                    </CardTitle>
                </CardHeader>

                <CardContent className="text-center space-y-4">
                    <p className="text-zinc-400 text-lg">
                        Tu suscripción ha sido activada correctamente.
                        <br />
                        Gracias por confiar en <strong>GSM FIX</strong>.
                    </p>

                    <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800">
                        <p className="text-sm text-zinc-500">ID de Transacción</p>
                        <p className="font-mono text-emerald-400">
                            {new URLSearchParams(window.location.search).get('payment_id') || 'PROCESADO'}
                        </p>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-lg"
                        onClick={() => setLocation("/dashboard")}
                    >
                        Ir al Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <p className="text-xs text-zinc-600 animate-pulse">
                        Redirigiendo en {countdown} segundos...
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}