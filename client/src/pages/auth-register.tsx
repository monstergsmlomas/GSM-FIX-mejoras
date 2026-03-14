import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Mail, Lock, User, Building2, Loader2, Eye, EyeOff } from "lucide-react"; // Añadimos Eye y EyeOff
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

// 1. ESQUEMA ACTUALIZADO CON REFINAMIENTO PARA COINCIDENCIA
const registerSchema = z.object({
    email: z.string().email("Ingresa un email válido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Debes confirmar tu contraseña"), // Nuevo campo
    fullName: z.string().min(1, "El nombre es requerido"),
    companyName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"], // El error se mostrará en este campo
});

const RegisterPage = () => {
    const [, setLocation] = useLocation();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    
    // 2. ESTADOS PARA VISIBILIDAD DE CONTRASEÑA
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const searchParams = new URLSearchParams(window.location.search);
    const selectedPlan = searchParams.get("plan");

    useEffect(() => {
        if (user) setLocation("/dashboard");
    }, [user, setLocation]);

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: { email: "", password: "", confirmPassword: "", fullName: "", companyName: "" },
    });

    const onSubmit = async (data: z.infer<typeof registerSchema>) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        full_name: data.fullName,
                        company_name: data.companyName,
                        plan_selected: selectedPlan || "free",
                    },
                },
            });

            if (error) {
                toast.error("Error al registrarse", { description: error.message });
                return;
            }
            toast.success("¡Cuenta creada!", { description: "Por favor verifica tu correo electrónico." });
        } catch (error) {
            toast.error("Error inesperado al crear la cuenta");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="marketing-theme min-h-screen w-full flex flex-col lg:flex-row bg-background text-foreground">
            {/* LEFT SECTION (Igual) */}
            <div className="w-full lg:w-1/2 relative overflow-hidden bg-zinc-950 flex flex-col justify-between p-12 hidden lg:flex border-r border-white/5">
                <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop")' }}>
                    <div className="absolute inset-0 bg-zinc-950/80 bg-gradient-to-br from-indigo-900/40 to-blue-900/40 mix-blend-multiply z-1"></div>
                </div>
                <div className="relative z-10 w-full max-w-2xl px-12 flex flex-col h-full justify-between py-16">
                    <div className="space-y-8 mt-12">
                         <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight drop-shadow-xl">
                            Únete a la <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">Revolución Técnica</span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* RIGHT SECTION */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative z-10 bg-background overflow-y-auto">
                <div className="w-full max-w-md my-auto">
                    <div className="mb-8 pl-1">
                        <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary" onClick={() => setLocation("/")}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
                        </Button>
                    </div>

                    <div className="text-center mb-6">
                        <Badge className="mb-6 bg-gradient-to-r from-indigo-600 to-blue-600">7 Días de Prueba Gratis</Badge>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Crea tu cuenta GSM Fix</h1>
                    </div>

                    <Card className="border-0 shadow-none bg-transparent">
                        <CardContent className="space-y-5 px-0">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                         <FormField control={form.control} name="fullName" render={({ field }) => (
                                                <FormItem><Label>Nombre</Label><FormControl><Input placeholder="Juan" {...field} className="h-11 bg-background/50" /></FormControl><FormMessage /></FormItem>
                                         )} />
                                         <FormField control={form.control} name="companyName" render={({ field }) => (
                                                <FormItem><Label>Empresa</Label><FormControl><Input placeholder="TecnoFix" {...field} className="h-11 bg-background/50" /></FormControl><FormMessage /></FormItem>
                                         )} />
                                    </div>
                                    <FormField control={form.control} name="email" render={({ field }) => (
                                            <FormItem><Label>Email</Label><FormControl><Input placeholder="tu@email.com" {...field} className="h-11 bg-background/50" /></FormControl><FormMessage /></FormItem>
                                    )} />

                                    {/* CAMPO: CONTRASEÑA */}
                                    <FormField control={form.control} name="password" render={({ field }) => (
                                            <FormItem>
                                                <Label>Contraseña</Label>
                                                <div className="relative">
                                                    <FormControl>
                                                        <Input 
                                                            type={showPassword ? "text" : "password"} 
                                                            {...field} 
                                                            className="h-11 bg-background/50 pr-10" 
                                                        />
                                                    </FormControl>
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
                                    )} />

                                    {/* CAMPO: COMPROBAR CONTRASEÑA */}
                                    <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                                            <FormItem>
                                                <Label>Comprobar Contraseña</Label>
                                                <div className="relative">
                                                    <FormControl>
                                                        <Input 
                                                            type={showConfirmPassword ? "text" : "password"} 
                                                            {...field} 
                                                            className="h-11 bg-background/50 pr-10" 
                                                        />
                                                    </FormControl>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    >
                                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                    )} />

                                    <Button type="submit" disabled={isLoading} className="w-full h-12 mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-md">
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Comenzar Prueba Gratuita"}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-5 pt-2 px-0">
                            <Separator className="bg-border/50" />
                            <p className="text-center text-sm text-muted-foreground">
                                ¿Ya tienes una cuenta? <Link href="/login"><span className="text-indigo-500 hover:underline cursor-pointer font-bold">Iniciar Sesión</span></Link>
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;