import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Lock, Mail, Star, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const loginSchema = z.object({
    email: z.string().email("Ingresa un email válido"),
    password: z.string().min(1, "La contraseña es requerida"),
});

const reviews = [
    { name: "Carlos R.", stars: 5, text: "Desde que usamos GSM FIX, los tiempos de entrega bajaron un 40%. ¡Imprescindible para el taller!" },
    { name: "TecnoSolutions MDQ", stars: 5, text: "El control de stock y las órdenes de reparación son una maravilla. Muy intuitivo." },
    { name: "Julián M.", stars: 4, text: "Excelente soporte y actualizaciones constantes. Se nota que escuchan a los técnicos." },
    { name: "FixIt Lab", stars: 5, text: "La mejor inversión para organizar el caos del día a día. Súper recomendado." },
];

const LoginPage = () => {
    const [, setLocation] = useLocation();
    const { user } = useAuth();
    const [currentReview, setCurrentReview] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    // 1. ESTADO PARA MOSTRAR/OCULTAR CONTRASEÑA
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user) setLocation("/dashboard");
    }, [user, setLocation]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentReview((prev) => (prev + 1) % reviews.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (data: z.infer<typeof loginSchema>) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) {
                toast.error("Error al iniciar sesión", { description: error.message });
                return;
            }

            toast.success("¡Bienvenido de nuevo!");
            setLocation("/dashboard");
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    // 2. FUNCIÓN PARA RECUPERAR CONTRASEÑA
    const handleForgotPassword = async () => {
        const email = form.getValues("email");
        if (!email || !z.string().email().safeParse(email).success) {
            toast.error("Ingresa un email válido", {
                description: "Necesitamos tu email para enviarte el enlace de recuperación."
            });
            return;
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            toast.success("Enlace enviado", {
                description: "Revisa tu correo electrónico para restablecer tu contraseña."
            });
        } catch (error: any) {
            toast.error("Error al enviar el enlace", { description: error.message });
        }
    };

    return (
        <div className="marketing-theme min-h-screen lg:flex bg-background text-foreground">
            {/* LEFT SECTION (Igual) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-zinc-950 justify-center items-center border-r border-white/5">
                <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop")' }}>
                    <div className="absolute inset-0 bg-zinc-950/80 bg-gradient-to-br from-indigo-900/40 to-blue-900/40 mix-blend-overlay"></div>
                </div>
                <div className="relative z-10 w-full max-w-2xl px-12 flex flex-col h-full justify-between py-16">
                    <div className="space-y-8 mt-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white/90 text-sm font-medium shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Sistema #1 para Servicio Técnico</span>
                        </div>
                        <h1 className="text-5xl font-extrabold text-white leading-tight drop-shadow-2xl">
                            Potencia tu Taller con <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400 text-6xl">GSM FIX</span>
                        </h1>
                        <p className="text-xl text-gray-200 max-w-lg leading-relaxed drop-shadow-md">
                            La herramienta definitiva para expertos en microsoldadura. Precisión, control y eficiencia en un solo lugar.
                        </p>
                    </div>
                    <div className="relative group">
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl relative shadow-2xl transition-all duration-500">
                            <p className="text-gray-100 text-lg italic">"{reviews[currentReview].text}"</p>
                            <p className="text-sm font-bold text-white/90 mt-4">- {reviews[currentReview].name}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SECTION (Form) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12 relative z-10 bg-background">
                <div className="w-full max-w-md relative z-10">
                    <div className="mb-6 lg:mb-8">
                        <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary" onClick={() => setLocation("/")}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
                        </Button>
                    </div>
                    <Card className="border-border bg-card/40 backdrop-blur-xl shadow-xl lg:shadow-none lg:bg-transparent lg:border-0">
                        <CardHeader className="text-center pb-6 lg:px-0">
                            <CardTitle className="text-3xl font-bold text-foreground">Iniciar Sesión</CardTitle>
                            <CardDescription className="text-base mt-2 text-muted-foreground">Ingresa tus credenciales para acceder al panel</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 lg:px-0">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Label>Email</Label>
                                                <FormControl><Input placeholder="admin@taller.com" {...field} className="h-11 bg-background/50" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex justify-between items-center">
                                                    <Label>Contraseña</Label>
                                                    {/* 3. BOTÓN DE RECUPERACIÓN */}
                                                    <Button
                                                        type="button"
                                                        variant="link"
                                                        className="px-0 font-bold text-xs text-indigo-500 hover:text-indigo-400 h-auto"
                                                        onClick={handleForgotPassword}
                                                    >
                                                        ¿Olvidaste tu contraseña?
                                                    </Button>
                                                </div>
                                                <div className="relative">
                                                    <FormControl>
                                                        <Input
                                                            type={showPassword ? "text" : "password"}
                                                            {...field}
                                                            className="h-11 bg-background/50 pr-10"
                                                        />
                                                    </FormControl>
                                                    {/* 4. BOTÓN DEL OJO */}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={isLoading} className="w-full h-12 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-md">
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Ingresar al Sistema"}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-5 pt-2 lg:px-0">
                            <Separator className="bg-border/50" />
                            <p className="text-center text-sm text-muted-foreground mt-2">
                                ¿Aún no tienes cuenta? <Link href="/register"><span className="text-indigo-500 hover:underline cursor-pointer font-bold">Solicitar Acceso</span></Link>
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;