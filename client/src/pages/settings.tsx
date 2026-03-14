import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSettingsSchema, type InsertSettings, type Settings, type User, type Branch } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import {
    Loader2,
    Save,
    Upload,
    Image as ImageIcon,
    LogOut,
    Plus,
    X,
    Printer,
    FileText,
    ScrollText,
    Store,
    Settings2,
    ClipboardCheck,
    Scale,
    CreditCard,
    Wrench,
    Mail,
    MapPin,
    Phone,
    Zap,
    ShieldCheck,
    Check,
    Lock,
    Home,
    Smartphone,
    Timer,
    Key,
    Users,
    Trash2,
    Building2, 
    Map        
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useLocation } from "wouter";

type BillingPeriod = 'monthly' | 'semester' | 'annual';

// --- ESQUEMAS DE VALIDACIÓN ---
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Debes confirmar la contraseña")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas nuevas no coinciden",
  path: ["confirmPassword"],
});

const techSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  branchId: z.string().min(1, "Debes asignar una sucursal") 
});

const branchSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  address: z.string().optional(),
  phone: z.string().optional()
});

export default function SettingsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [, setLocation] = useLocation();

    const searchParams = new URLSearchParams(window.location.search);
    const initialTab = searchParams.get("tab") || "general";
    const [activeTab, setActiveTab] = useState(initialTab);

    let urlPeriod = searchParams.get("period");
    if (urlPeriod === 'semi_annual') urlPeriod = 'semester';

    const initialPeriod = (urlPeriod as BillingPeriod) || "monthly";

    const { session, signOut } = useAuth();

    const [subData, setSubData] = useState<any>(null);
    const [loadingCheckout, setLoadingCheckout] = useState(false);
    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(initialPeriod);
    const [isAddTechOpen, setIsAddTechOpen] = useState(false);
    const [techError, setTechError] = useState("");
    
    const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
    const [isBuyBranchOpen, setIsBuyBranchOpen] = useState(false);
    
    const [isEditBranchOpen, setIsEditBranchOpen] = useState(false);
    const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
    const [isPasswordSuccessOpen, setIsPasswordSuccessOpen] = useState(false);

    const now = new Date();
    const promoDeadline = new Date("2026-03-18T23:59:59");
    const isPromoActive = now <= promoDeadline;

    const { data: settings, isLoading } = useQuery<Settings>({
        queryKey: ["/api/settings"],
    });

    const { data: teamMembers, isLoading: isLoadingTeam } = useQuery<User[]>({
        queryKey: ["/api/team"],
        queryFn: async () => {
            const token = session?.access_token;
            if (!token) return [];
            const res = await fetch("/api/team", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Error loading team");
            return res.json();
        },
        enabled: !!session?.access_token
    });

    const { data: branches = [], isLoading: isLoadingBranches } = useQuery<Branch[]>({
        queryKey: ["/api/branches"]
    });

    const form = useForm<InsertSettings>({
        resolver: zodResolver(insertSettingsSchema),
        defaultValues: {
            shopName: "", address: "", phone: "", email: "", whatsapp: "", landline: "",
            logoUrl: "", cardSurcharge: 0, transferSurcharge: 0,
            receiptDisclaimer: "", ticketFooter: "", checklistOptions: [],
            printFormat: "a4", dayCutoffHour: 0,
        },
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
      resolver: zodResolver(passwordSchema),
      defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
    });

    const techForm = useForm<z.infer<typeof techSchema>>({
      resolver: zodResolver(techSchema),
      defaultValues: { name: "", email: "", password: "", branchId: "" }
    });

    const branchForm = useForm<z.infer<typeof branchSchema>>({
        resolver: zodResolver(branchSchema),
        defaultValues: { name: "", address: "", phone: "" }
    });

    const [checklistItems, setChecklistItems] = useState<string[]>([]);

    useEffect(() => {
        if (settings) {
            form.reset({
                shopName: settings.shopName || "",
                address: settings.address || "",
                phone: settings.phone || "",
                email: settings.email || "",
                whatsapp: settings.whatsapp || "",
                landline: settings.landline || "",
                logoUrl: settings.logoUrl || "",
                cardSurcharge: Number(settings.cardSurcharge) || 0,
                transferSurcharge: Number(settings.transferSurcharge) || 0,
                receiptDisclaimer: settings.receiptDisclaimer || "",
                ticketFooter: settings.ticketFooter || "",
                checklistOptions: settings.checklistOptions || [],
                printFormat: settings.printFormat || "a4",
                dayCutoffHour: settings.dayCutoffHour || 0,
            });
            setChecklistItems(settings.checklistOptions || []);
        }

        const fetchSub = async () => {
            try {
                const token = session?.access_token;
                if (!token) return;

                const res = await fetch("/api/user/subscription", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) setSubData(await res.json());
            } catch (e) { console.error("Error fetching sub:", e); }
        };
        fetchSub();

    }, [settings, form, session]);

    const mutation = useMutation({
        mutationFn: async (data: InsertSettings) => {
            const finalData = { ...data, checklistOptions: checklistItems };
            const res = await apiRequest("POST", "/api/settings", finalData);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
            toast({ title: "Éxito", description: "Configuración guardada correctamente." });
        },
        onError: () => {
            toast({ title: "Error", description: "No se pudo guardar la configuración.", variant: "destructive" });
        },
    });

    const createTechMutation = useMutation({
        mutationFn: async (data: z.infer<typeof techSchema>) => {
            setTechError(""); 
            const token = session?.access_token;
            const res = await fetch("/api/team", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: "Error de conexión con el servidor." }));
                throw new Error(err.error || "Error al crear técnico.");
            }
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/team"] });
            toast({ title: "Técnico creado", description: "El acceso se ha generado correctamente." });
            setIsAddTechOpen(false);
            techForm.reset();
        },
        onError: (err: any) => {
            setTechError(err.message);
        }
    });

    const deleteTechMutation = useMutation({
        mutationFn: async (id: string) => {
            const token = session?.access_token;
            const res = await fetch(`/api/team/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error("Error al eliminar");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/team"] });
            toast({ title: "Técnico eliminado", description: "El acceso ha sido revocado." });
        },
        onError: () => {
            toast({ title: "Error", description: "No se pudo eliminar al técnico.", variant: "destructive" });
        }
    });

    const createBranchMutation = useMutation({
        mutationFn: async (data: z.infer<typeof branchSchema>) => {
            const res = await apiRequest("POST", "/api/branches", data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
            toast({ title: "Sucursal creada", description: "La nueva sede está lista para operar." });
            setIsAddBranchOpen(false);
            branchForm.reset();
            window.location.reload(); 
        },
        onError: () => toast({ title: "Error", description: "No se pudo crear la sucursal.", variant: "destructive" })
    });

    const updateBranchMutation = useMutation({
        mutationFn: async (variables: { id: string; data: z.infer<typeof branchSchema> }) => {
            const res = await apiRequest("PATCH", `/api/branches/${variables.id}`, variables.data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
            toast({ title: "Sucursal actualizada", description: "Los cambios se han guardado." });
            setIsEditBranchOpen(false);
            setEditingBranchId(null);
            branchForm.reset();
            window.location.reload();
        },
        onError: () => toast({ title: "Error", description: "No se pudo actualizar la sucursal.", variant: "destructive" })
    });

    // 👇 NUEVA MUTACIÓN PARA ELIMINAR SUCURSAL 👇
    const deleteBranchMutation = useMutation({
        mutationFn: async (id: string) => {
            const token = session?.access_token;
            const res = await fetch(`/api/branches/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "No se pudo eliminar. Verifica que no tenga órdenes activas.");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
            toast({ title: "Sucursal eliminada", description: "La sucursal fue borrada exitosamente del sistema." });
            window.location.reload();
        },
        onError: (err: any) => toast({ title: "Acción Denegada", description: err.message, variant: "destructive" })
    });

    const handleEditBranch = (branch: Branch) => {
        setEditingBranchId(branch.id);
        branchForm.reset({ name: branch.name, address: branch.address || "", phone: branch.phone || "" });
        setIsEditBranchOpen(true);
    };

    const passwordMutation = useMutation({
        mutationFn: async (data: z.infer<typeof passwordSchema>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) throw new Error("No se pudo identificar tu sesión.");

            const { error: verifyError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: data.currentPassword,
            });

            if (verifyError) {
                throw new Error("La contraseña actual es incorrecta.");
            }

            const { error: updateError } = await supabase.auth.updateUser({
                password: data.newPassword
            });

            if (updateError) {
                throw new Error(updateError.message);
            }
            
            return true;
        },
        onSuccess: () => {
          toast({ title: "Seguridad", description: "Contraseña actualizada exitosamente." });
          passwordForm.reset();
          setIsPasswordSuccessOpen(true); 
        },
        onError: (error: any) => {
          toast({ title: "Error de Seguridad", description: error.message, variant: "destructive" });
        }
    });

    const onSubmit = (data: InsertSettings) => mutation.mutate(data);
    const onSubmitTech = (data: z.infer<typeof techSchema>) => createTechMutation.mutate(data);
    const onSubmitBranch = (data: z.infer<typeof branchSchema>) => createBranchMutation.mutate(data);

    const addChecklistItem = () => {
        if (checklistItems.length >= 12) {
            toast({ title: "Máximo 12 ítems permitidos", variant: "destructive" });
            return;
        }
        setChecklistItems([...checklistItems, ""]);
    };

    const updateChecklistItem = (index: number, value: string) => {
        const newItems = [...checklistItems];
        newItems[index] = value;
        setChecklistItems(newItems);
        form.setValue("checklistOptions", newItems);
    };

    const removeChecklistItem = (index: number) => {
        const newItems = checklistItems.filter((_, i) => i !== index);
        setChecklistItems(newItems);
        form.setValue("checklistOptions", newItems);
    };

    const handleLogout = async () => {
        try {
            await signOut();
            toast({ title: "Sesión cerrada correctamente" });
        } catch (error: any) {
            toast({ title: "Error al cerrar sesión", description: error.message, variant: "destructive" });
        }
    };

    const handleCheckout = async (planType: string) => {
        let backendPlanId = "";

        if (planType === "standard") {
            if (billingPeriod === "monthly") backendPlanId = "monthly";
            if (billingPeriod === "semester") backendPlanId = "semi_annual";
            if (billingPeriod === "annual") backendPlanId = "annual";
        } else if (planType === "multisede") {
            if (billingPeriod === "monthly") backendPlanId = "multi_monthly";
            if (billingPeriod === "semester") backendPlanId = "multi_semi_annual";
            if (billingPeriod === "annual") backendPlanId = "multi_annual";
        } else if (planType === "extra_branch") {
            backendPlanId = "extra_branch";
        } else {
            return;
        }

        try {
            setLoadingCheckout(true);
            const token = session?.access_token;

            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ planId: backendPlanId })
            });

            const data = await res.json();

            if (data.init_point) {
                window.location.href = data.init_point;
            } else {
                toast({ title: "Error", description: "No se pudo generar el pago.", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Problema de conexión.", variant: "destructive" });
        } finally {
            setLoadingCheckout(false);
        }
    };

    
    const isTrialing = subData?.subscriptionStatus === 'trialing';
    const currentPlanId = subData?.billingInterval?.includes('multi') ? 'multisede' : 'standard'; 
    
    // Convertimos estrictamente a Número para evitar bugs en la suma y agregamos extra_branches (snake_case)
    const extraBranches = Number(subData?.extraBranches) || Number(subData?.extra_branches) || 0; 
    
    const baseBranchesAllowed = currentPlanId === 'multisede' ? 3 : 1;
    const maxBranchesAllowed = baseBranchesAllowed + extraBranches; 

    const handleAddBranchClick = () => {
        if (!subData) {
            toast({ title: "Sincronizando...", description: "Espera un momento mientras validamos tu cupo." });
            return;
        }
        
        if (branches.length >= maxBranchesAllowed) {
            setIsBuyBranchOpen(true); 
        } else {
            setIsAddBranchOpen(true); 
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const getPricingDisplay = (type: 'standard' | 'multisede' | 'ai') => {
        if (type === 'standard') {
            if (billingPeriod === 'monthly') {
                return isPromoActive 
                    ? { price: "$25.000", original: "$30.000" } 
                    : { price: "$30.000", original: null };
            }
            if (billingPeriod === 'semester') return { price: "$160.000", original: "$180.000" };
            if (billingPeriod === 'annual') return { price: "$300.000", original: "$360.000" };
        }
        if (type === 'multisede') {
            if (billingPeriod === 'monthly') return { price: "$45.000", original: null };
            if (billingPeriod === 'semester') return { price: "$250.000", original: "$270.000" };
            if (billingPeriod === 'annual') return { price: "$480.000", original: "$540.000" };
        }
        return { price: "Consultar", original: null };
    };

    const getIntervalLabel = () => {
        if (billingPeriod === 'monthly') return "/mes";
        if (billingPeriod === 'semester') return "/semestre";
        if (billingPeriod === 'annual') return "/año";
        return "";
    };

    const standardPricing = getPricingDisplay('standard');
    const multiPricing = getPricingDisplay('multisede');

    const plans = [
        {
            id: "standard",
            name: "Estándar",
            price: standardPricing.price,
            originalPrice: standardPricing.original,
            interval: getIntervalLabel(),
            desc: "Gestión completa para un taller.",
            features: ["Órdenes ilimitadas", "Gestión de clientes", "Inventario y Stock", "Caja y Finanzas", "Soporte", "1 Sede Base"],
            color: "emerald",
            comingSoon: false
        },
        {
            id: "multisede", 
            name: "Multisede",
            price: multiPricing.price,
            originalPrice: multiPricing.original,
            interval: getIntervalLabel(),
            desc: "Cadenas y múltiples sucursales.",
            features: ["Todo lo del plan Estándar", "Hasta 3 sucursales", "Stock independiente", "Reportes por sede", "Comparaciones entre sucursales", "Soporte prioritario"],
            color: "violet",
            comingSoon: false 
        },
        {
            id: "ai_locked",
            name: "Premium AI",
            price: "Próximamente",
            interval: "",
            desc: "Potencia tu negocio con inteligencia artificial.",
            features: ["Todo lo del plan Multisede", "Chatbot de WhatsApp IA", "Respuestas 24/7", "Agendamiento automático", "Stock de proveedores", "Soporte 24/7"],
            color: "indigo",
            comingSoon: true
        }
    ];

    const tabTriggerBase = "rounded-full px-6 py-2.5 transition-all flex gap-2 items-center border border-transparent data-[state=active]:shadow-sm data-[state=active]:font-medium";

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background/50 pb-20 relative">
            
            <Dialog open={isPasswordSuccessOpen} onOpenChange={setIsPasswordSuccessOpen}>
                <DialogContent className="sm:max-w-[400px] border-green-500/20 bg-background/95 backdrop-blur-xl text-center">
                    <div className="flex flex-col items-center justify-center p-4 space-y-4">
                        <div className="h-16 w-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center border border-green-500/20 mb-2">
                            <Check className="h-8 w-8" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-foreground">¡Contraseña Actualizada!</DialogTitle>
                        <DialogDescription className="text-center text-base text-muted-foreground">
                            Tu nueva contraseña ha sido guardada correctamente en la base de datos de seguridad.
                        </DialogDescription>
                        <Button 
                            onClick={() => setIsPasswordSuccessOpen(false)} 
                            className="w-full mt-4 bg-green-600 hover:bg-green-500 text-white font-bold"
                        >
                            Entendido
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddTechOpen} onOpenChange={setIsAddTechOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Agregar Nuevo Técnico</DialogTitle>
                        <DialogDescription>Esta cuenta solo tendrá acceso a Órdenes y Clientes.</DialogDescription>
                    </DialogHeader>
                    {techError && (
                        <div className="p-3 mb-4 rounded-md bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-medium">
                            <strong>Error del Servidor:</strong> {techError}
                        </div>
                    )}
                    <Form {...techForm}>
                        <form onSubmit={techForm.handleSubmit(onSubmitTech)} className="space-y-4">
                            <FormField control={techForm.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Empleado</FormLabel>
                                    <FormControl><Input placeholder="Ej. Martín" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={techForm.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Correo Electrónico (Para iniciar sesión)</FormLabel>
                                    <FormControl><Input type="email" placeholder="martin@mitaller.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={techForm.control} name="password" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contraseña (Mín. 6 caracteres)</FormLabel>
                                    <FormControl><Input type="password" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={techForm.control} name="branchId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Asignar a Sucursal</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecciona la sucursal..." /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {branches.map(b => (
                                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => { setIsAddTechOpen(false); setTechError(""); }}>Cancelar</Button>
                                <Button type="submit" disabled={createTechMutation.isPending}>
                                    {createTechMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                                    Crear Cuenta
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddBranchOpen} onOpenChange={setIsAddBranchOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Crear Nueva Sucursal</DialogTitle>
                        <DialogDescription>Define los datos básicos del nuevo local.</DialogDescription>
                    </DialogHeader>
                    <Form {...branchForm}>
                        <form onSubmit={branchForm.handleSubmit(onSubmitBranch)} className="space-y-4">
                            <FormField control={branchForm.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Local</FormLabel>
                                    <FormControl><Input placeholder="Ej. Sucursal Banfield" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={branchForm.control} name="address" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dirección</FormLabel>
                                    <FormControl><Input placeholder="Av. Maipú 123" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={branchForm.control} name="phone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teléfono de Contacto</FormLabel>
                                    <FormControl><Input placeholder="11 5555-5555" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsAddBranchOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={createBranchMutation.isPending}>
                                    {createBranchMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null} Crear Sucursal
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditBranchOpen} onOpenChange={setIsEditBranchOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Editar Sucursal</DialogTitle>
                        <DialogDescription>Modifica los datos de este local.</DialogDescription>
                    </DialogHeader>
                    <Form {...branchForm}>
                        <form onSubmit={branchForm.handleSubmit((data) => updateBranchMutation.mutate({ id: editingBranchId!, data }))} className="space-y-4">
                            <FormField control={branchForm.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Local</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={branchForm.control} name="address" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dirección</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={branchForm.control} name="phone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teléfono</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsEditBranchOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={updateBranchMutation.isPending}>
                                    {updateBranchMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null} Guardar Cambios
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isBuyBranchOpen} onOpenChange={setIsBuyBranchOpen}>
                <DialogContent className="sm:max-w-[425px] border-emerald-500/20 bg-background/95 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-500">
                            <Store className="w-5 h-5" /> Ampliar Límite de Sucursales
                        </DialogTitle>
                        <DialogDescription className="text-base pt-2">
                            Has alcanzado el límite de <strong>{maxBranchesAllowed} sucursal/es</strong> de tu plan actual.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 my-4 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-emerald-400">1x Sucursal Adicional</p>
                            <p className="text-xs text-emerald-500/70">Mantenimiento y base de datos</p>
                        </div>
                        <p className="text-xl font-black text-emerald-500">$15.000<span className="text-xs font-normal">/mes</span></p>
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                        <Button type="button" variant="outline" onClick={() => setIsBuyBranchOpen(false)}>Cancelar</Button>
                        <Button 
                            type="button"
                            onClick={() => handleCheckout('extra_branch')} 
                            disabled={loadingCheckout}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        >
                            {loadingCheckout ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <CreditCard className="w-4 h-4 mr-2" />} 
                            Pagar con MercadoPago
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-4 transition-all">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full">
                            <div className="flex flex-col gap-1 w-full sm:w-auto">
                                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                    <Settings2 className="h-6 w-6 text-primary" /> Configuración
                                </h1>
                                <p className="text-sm text-muted-foreground hidden sm:block">Administra la identidad, operaciones y reglas del sistema.</p>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Button type="button" variant="outline" onClick={() => setLocation("/")} className="border-indigo-500/30 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 hover:text-indigo-300 hover:border-indigo-500/50 transition-all shadow-sm">
                                    <Home className="mr-2 h-4 w-4" /> Ver Landing
                                </Button>
                                <Button type="button" variant="outline" onClick={handleLogout} className="border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-900/50 hover:bg-red-900/10 transition-all">
                                    <LogOut className="mr-2 h-4 w-4" /> Salir
                                </Button>
                                <Button type="submit" variant="outline" disabled={mutation.isPending} className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 hover:border-primary/40 shadow-sm backdrop-blur-sm transition-all active:scale-95 flex-1 sm:flex-none">
                                    {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Guardar Cambios
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
                            <div className="flex justify-center">
                                <TabsList className="h-auto p-1 bg-muted/50 backdrop-blur-sm border border-border/50 rounded-full inline-flex flex-wrap justify-center gap-1">
                                    <TabsTrigger value="general" className={`${tabTriggerBase} data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-500 data-[state=active]:border-violet-500/20`}><Store className="h-4 w-4" /> General</TabsTrigger>
                                    
                                    <TabsTrigger value="branches" className={`${tabTriggerBase} data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-500 data-[state=active]:border-indigo-500/20`}><Building2 className="h-4 w-4" /> Sucursales</TabsTrigger>

                                    <TabsTrigger value="operations" className={`${tabTriggerBase} data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-500 data-[state=active]:border-blue-500/20`}><Wrench className="h-4 w-4" /> Operativo</TabsTrigger>
                                    <TabsTrigger value="checklist" className={`${tabTriggerBase} data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-500 data-[state=active]:border-orange-500/20`}><ClipboardCheck className="h-4 w-4" /> Recepción</TabsTrigger>
                                    <TabsTrigger value="legal" className={`${tabTriggerBase} data-[state=active]:bg-zinc-500/10 data-[state=active]:text-zinc-400 data-[state=active]:border-zinc-500/20`}><Scale className="h-4 w-4" /> Legales</TabsTrigger>
                                    <TabsTrigger value="security" className={`${tabTriggerBase} data-[state=active]:bg-red-500/10 data-[state=active]:text-red-500 data-[state=active]:border-red-500/20`}><ShieldCheck className="h-4 w-4" /> Seguridad</TabsTrigger>
                                    <TabsTrigger value="subscription" className={`rounded-full px-6 py-2.5 transition-all flex gap-2 items-center border border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.2)] text-emerald-700 hover:bg-emerald-500/10 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md`}><Zap className="h-4 w-4 fill-current animate-pulse" /><span className="font-semibold">Mi Plan</span></TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="general" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <Card className="lg:col-span-1 border-border/50 bg-gradient-to-br from-card via-card/90 to-violet-500/20 shadow-sm hover:border-violet-500/30 transition-all">
                                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ImageIcon className="h-5 w-5 text-violet-500" /> Identidad Visual</CardTitle></CardHeader>
                                        <CardContent className="space-y-6">
                                            <FormField control={form.control} name="shopName" render={({ field }) => (<FormItem><FormLabel>Nombre Comercial de la Marca</FormLabel><FormControl><Input placeholder="Ej. MonsterGSM" {...field} value={field.value ?? ""} className="bg-background/50 focus:border-violet-500/50" /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="logoUrl" render={({ field }) => (<FormItem><FormLabel>Logo Global</FormLabel><FormControl><LogoUpload value={field.value || ""} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
                                        </CardContent>
                                    </Card>
                                    <Card className="lg:col-span-2 border-border/50 bg-gradient-to-br from-card via-card/90 to-blue-500/20 shadow-sm hover:border-blue-500/30 transition-all">
                                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Store className="h-5 w-5 text-blue-500" /> Información de Contacto Principal</CardTitle><CardDescription>Este es el contacto que verán los clientes en la landing page principal.</CardDescription></CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email Principal</FormLabel><FormControl><div className="relative"><Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="contacto@taller.com" {...field} value={field.value ?? ""} className="pl-9 bg-background/50" /></div></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Celular Principal</FormLabel><FormControl><div className="relative"><Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="+54 9..." {...field} value={field.value ?? ""} className="pl-9 bg-background/50" /></div></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="whatsapp" render={({ field }) => (<FormItem><FormLabel>WhatsApp Oficial</FormLabel><FormControl><div className="relative"><Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-green-600/70" /><Input placeholder="+54 9..." {...field} value={field.value ?? ""} className="pl-9 bg-background/50" /></div></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="landline" render={({ field }) => (<FormItem><FormLabel>Tel. Fijo Principal</FormLabel><FormControl><div className="relative"><Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="4444-5555" {...field} value={field.value ?? ""} className="pl-9 bg-background/50" /></div></FormControl><FormMessage /></FormItem>)} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="branches" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <Card className="border-border/50 bg-gradient-to-br from-card via-card/90 to-indigo-500/10 shadow-sm hover:border-indigo-500/30 transition-all min-h-[400px]">
                                    <CardHeader className="pb-3 border-b border-border/50">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2 text-indigo-500">
                                                <Building2 className="w-5 h-5" /> Tus Sucursales
                                                <span className="text-xs ml-2 bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                                                        ({branches.length}/{maxBranchesAllowed})
                                                </span>
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    Aquí se define de dónde sale el stock y a qué caja va el dinero.
                                                </CardDescription>
                                            </div>
                                            <Button type="button" onClick={handleAddBranchClick} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20">
                                                <Plus className="w-4 h-4 mr-2" /> Nueva Sucursal
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {isLoadingBranches ? (
                                                <div className="col-span-full flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
                                            ) : branches.map((branch) => (
                                                <div key={branch.id} className="relative group p-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors">
                                                    {branch.isDefault && (
                                                        <div className="absolute -top-2.5 right-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                            PRINCIPAL
                                                        </div>
                                                    )}
                                                    
                                                    {/* 👇 AQUÍ ESTÁ EL BOTÓN DE ELIMINAR AGREGADO 👇 */}
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                                                            <Store className="w-4 h-4 text-indigo-400" /> {branch.name}
                                                        </h3>
                                                        <div className="flex items-center gap-1">
                                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-indigo-400" onClick={() => handleEditBranch(branch)}>
                                                                <Settings2 className="h-4 w-4" />
                                                            </Button>
                                                            {!branch.isDefault && (
                                                                <Button 
                                                                    type="button" 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10" 
                                                                    onClick={() => {
                                                                        if (confirm(`¿Seguro que deseas eliminar la sucursal "${branch.name}"? Esta acción es irreversible.`)) {
                                                                            deleteBranchMutation.mutate(branch.id);
                                                                        }
                                                                    }} 
                                                                    disabled={deleteBranchMutation.isPending}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1 mt-3">
                                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                            <Map className="w-3 h-3 opacity-70" /> {branch.address || "Sin dirección"}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                            <Phone className="w-3 h-3 opacity-70" /> {branch.phone || "Sin teléfono"}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="operations" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card className="border-border/50 bg-gradient-to-br from-card via-card/90 to-slate-500/20 shadow-sm hover:border-slate-500/30 transition-all">
                                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Printer className="h-5 w-5 text-slate-500" /> Formato de Impresión</CardTitle></CardHeader>
                                        <CardContent>
                                            <FormField control={form.control} name="printFormat" render={({ field }) => (
                                                <FormItem className="space-y-3">
                                                    <FormControl>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <label className={`cursor-pointer relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-6 hover:bg-muted/50 transition-all ${field.value === 'a4' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border/50'}`} onClick={() => field.onChange('a4')}>
                                                                <div className={`p-3 rounded-full ${field.value === 'a4' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}><FileText className="h-6 w-6" /></div>
                                                                <div className="text-center"><span className="font-semibold block">Hoja A4</span><span className="text-xs text-muted-foreground">Original y duplicado</span></div>
                                                            </label>
                                                            <label className={`cursor-pointer relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-6 hover:bg-muted/50 transition-all ${field.value === 'ticket' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border/50'}`} onClick={() => field.onChange('ticket')}>
                                                                <div className={`p-3 rounded-full ${field.value === 'ticket' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}><ScrollText className="h-6 w-6" /></div>
                                                                <div className="text-center"><span className="font-semibold block">Ticket 80mm</span><span className="text-xs text-muted-foreground">Formato térmico</span></div>
                                                            </label>
                                                        </div>
                                                    </FormControl><FormMessage />
                                                </FormItem>
                                            )} />
                                        </CardContent>
                                    </Card>
                                    <Card className="border-border/50 bg-gradient-to-br from-card via-card/90 to-emerald-500/20 shadow-sm hover:border-emerald-500/30 transition-all">
                                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5 text-emerald-500" /> Finanzas y Jornada</CardTitle></CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField control={form.control} name="cardSurcharge" render={({ field }) => (<FormItem><FormLabel>Recargo Tarjeta</FormLabel><FormControl><div className="relative"><Input type="number" min="0" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} className="pr-8 bg-background/50" /><span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span></div></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="transferSurcharge" render={({ field }) => (<FormItem><FormLabel>Recargo Transf.</FormLabel><FormControl><div className="relative"><Input type="number" min="0" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} className="pr-8 bg-background/50" /><span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span></div></FormControl><FormMessage /></FormItem>)} />
                                            </div>
                                            <FormField control={form.control} name="dayCutoffHour" render={({ field }) => (<FormItem><FormLabel>Cierre de Jornada</FormLabel><Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}><FormControl><SelectTrigger className="bg-background/50"><SelectValue placeholder="Selecciona hora" /></SelectTrigger></FormControl><SelectContent><SelectItem value="0">00:00 (Default)</SelectItem>{[...Array(23)].map((_, i) => (<SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1 < 10 ? `0${i + 1}:00` : `${i + 1}:00`}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="checklist" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <Card className="border-border/50 bg-gradient-to-br from-card via-card/90 to-orange-500/20 shadow-sm hover:border-orange-500/30 transition-all">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <div><CardTitle className="text-lg flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-orange-500" /> Checklist de Ingreso</CardTitle><CardDescription>Define qué revisar al recibir un equipo.</CardDescription></div>
                                        <Button type="button" variant="outline" size="sm" onClick={addChecklistItem} disabled={checklistItems.length >= 12}><Plus className="h-4 w-4 mr-2" /> Agregar</Button>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {checklistItems.map((item, index) => (
                                                <div key={index} className="flex gap-2 items-center group bg-background/40 p-1.5 rounded-lg border border-transparent hover:border-orange-500/20 transition-colors focus-within:border-orange-500/30">
                                                    <div className="h-8 w-8 flex items-center justify-center rounded bg-muted/50 text-xs font-mono text-muted-foreground shrink-0">{index + 1}</div>
                                                    <Input value={item} onChange={(e) => updateChecklistItem(index, e.target.value)} placeholder="Ej. ¿Enciende?" className="border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:bg-background/80 h-9" />
                                                    <Button type="button" variant="ghost" size="icon" className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => removeChecklistItem(index)}><X className="h-4 w-4" /></Button>
                                                </div>
                                            ))}
                                            {checklistItems.length === 0 && (<div className="col-span-full py-12 text-center border-2 border-dashed border-muted rounded-xl bg-muted/20"><ClipboardCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground">No hay items configurados.</p><Button variant="ghost" className="text-primary mt-2" onClick={addChecklistItem}>Agregar el primero</Button></div>)}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="legal" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <Card className="border-border/50 bg-gradient-to-br from-card via-card/90 to-zinc-500/20 shadow-sm hover:border-zinc-500/30 transition-all">
                                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Scale className="h-5 w-5 text-zinc-500" /> Legales</CardTitle></CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <FormField control={form.control} name="receiptDisclaimer" render={({ field }) => (<FormItem><FormLabel>Términos y Condiciones (Recibo A4)</FormLabel><FormControl><Textarea placeholder="Términos..." className="min-h-[150px] bg-background/50" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="ticketFooter" render={({ field }) => (<FormItem><FormLabel>Pie de Ticket (Impresora Térmica)</FormLabel><FormControl><Textarea placeholder="Gracias por su compra..." className="min-h-[150px] bg-background/50" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="security" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    
                                    <Card className="border-border/50 bg-gradient-to-br from-card via-card/90 to-red-500/10 shadow-sm hover:border-red-500/30 transition-all h-fit">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2 text-red-500">
                                            <Key className="w-5 h-5" /> Credenciales de Acceso
                                            </CardTitle>
                                            <CardDescription>Modifica la contraseña principal de tu cuenta de administrador.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Form {...passwordForm}>
                                                <form className="space-y-4">
                                                    <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Contraseña Actual</FormLabel>
                                                        <FormControl><Input type="password" {...field} className="bg-background/50" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                    )} />
                                                    <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Nueva Contraseña</FormLabel>
                                                        <FormControl><Input type="password" {...field} className="bg-background/50" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                    )} />
                                                    <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                                                        <FormControl><Input type="password" {...field} className="bg-background/50" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                    )} />
                                                    <Button type="button" onClick={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))} disabled={passwordMutation.isPending} variant="destructive" className="w-full mt-2">
                                                    {passwordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Actualizar Contraseña
                                                    </Button>
                                                </form>
                                            </Form>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-border/50 bg-gradient-to-br from-card via-card/90 to-blue-500/10 shadow-sm hover:border-blue-500/30 transition-all min-h-[400px] flex flex-col">
                                        <CardHeader className="pb-3 border-b border-border/50">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div>
                                                    <CardTitle className="text-lg flex items-center gap-2 text-blue-500">
                                                    <Users className="w-5 h-5" /> Cuentas de Empleados
                                                    </CardTitle>
                                                    <CardDescription className="mt-1">Gestiona accesos limitados para tu taller.</CardDescription>
                                                </div>
                                                <Button type="button" size="sm" variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 w-full sm:w-auto" onClick={() => setIsAddTechOpen(true)}>
                                                    <Plus className="w-4 h-4 mr-1" /> Nuevo Técnico
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4 flex-1 flex flex-col gap-4">
                                            <div className="text-sm bg-blue-500/10 text-blue-400 p-3 rounded-md border border-blue-500/20 leading-relaxed shadow-sm">
                                                <strong>Nivel de Acceso Técnico:</strong> Los empleados creados aquí solo podrán operar en la <span className="font-semibold text-white">sucursal asignada</span>. <span className="font-semibold text-red-400">No tendrán acceso</span> a Reportes, Caja, Stock, ni Configuración.
                                            </div>

                                            <div className="space-y-3 mt-2 flex-1 overflow-y-auto pr-1">
                                                {isLoadingTeam ? (
                                                    <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
                                                ) : teamMembers?.length === 0 ? (
                                                    <div className="text-center p-8 border-2 border-dashed border-border/50 rounded-xl bg-background/30">
                                                        <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                                        <p className="text-muted-foreground text-sm">No tienes técnicos registrados.</p>
                                                    </div>
                                                ) : (
                                                    teamMembers?.map((tech) => {
                                                        const techBranch = branches.find(b => b.id === tech.branchId);
                                                        return (
                                                        <div key={tech.id} className="flex items-center justify-between p-3 bg-background/60 border border-border/50 rounded-xl hover:border-blue-500/30 transition-colors shadow-sm">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm border border-blue-500/20">
                                                                    {tech.name ? tech.name.substring(0, 2).toUpperCase() : "TE"}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold leading-none text-foreground">{tech.name || "Técnico"}</p>
                                                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                                        <Map className="w-3 h-3" /> {techBranch ? techBranch.name : "Sin sucursal asignada"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors h-9 w-9 rounded-full" onClick={() => { if (confirm(`¿Seguro que deseas eliminar a ${tech.name}? Perderá el acceso al sistema inmediatamente.`)) { deleteTechMutation.mutate(tech.id); } }} disabled={deleteTechMutation.isPending}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                        )
                                                    })
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                </div>
                            </TabsContent>

                            <TabsContent value="subscription" className="space-y-10 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">

                                <div className="relative group max-w-4xl mx-auto">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
                                        <div className="flex items-center gap-5">
                                            <div className="relative">
                                                <div className="absolute -inset-1 bg-emerald-500 rounded-full blur opacity-40 animate-pulse"></div>
                                                <div className="relative h-14 w-14 rounded-full bg-neutral-950 flex items-center justify-center border border-emerald-500/50">
                                                    <Zap className="h-7 w-7 text-emerald-500 fill-emerald-500/20" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white tracking-tight">
                                                    {isTrialing ? "Periodo de Prueba Activo" : "Suscripción Profesional"}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                                    <p className="text-sm text-emerald-500/80 font-medium">Sistema funcionando al 100%</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 px-6 py-3 bg-neutral-950/50 rounded-xl border border-white/5">
                                            <div className="text-center md:text-left">
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Vencimiento</p>
                                                <p className="text-lg font-mono text-zinc-200">
                                                    {formatDate(isTrialing ? subData?.trialEndsAt : subData?.currentPeriodEnd)}
                                                </p>
                                            </div>
                                            <div className="h-10 w-[1px] bg-white/10"></div>
                                            <Badge className="bg-emerald-500 text-neutral-950 font-bold border-0">
                                                {subData?.subscriptionStatus === 'active' ? 'ACTIVO' : 'FREE'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-4">
                                    {isPromoActive && (
                                        <div className="flex items-center gap-2 text-emerald-400 font-bold animate-pulse">
                                            <Timer className="w-5 h-5" />
                                            <span>¡Oferta lanzamiento hasta el 18 de Marzo!</span>
                                        </div>
                                    )}

                                    <div className="relative inline-flex group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/30 via-blue-500/30 to-purple-600/30 rounded-xl blur opacity-20 transition duration-500"></div>
                                        <Tabs defaultValue={billingPeriod} className="relative w-full max-w-[500px] mx-auto" onValueChange={(v) => setBillingPeriod(v as BillingPeriod)}>
                                            <TabsList className="grid w-full grid-cols-3 bg-neutral-900/90 backdrop-blur-xl border border-white/10 p-1.5 h-auto rounded-xl shadow-lg">
                                                <TabsTrigger value="monthly" className="text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-blue-600 data-[state=active]:text-white py-2 hover:text-white transition-colors">Mensual</TabsTrigger>
                                                <TabsTrigger value="semester" className="text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-blue-600 data-[state=active]:text-white py-2 hover:text-white transition-colors">Semestral</TabsTrigger>
                                                <TabsTrigger value="annual" className="text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-blue-600 data-[state=active]:text-white py-2 hover:text-white transition-colors">Anual</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
                                    {plans.map((plan) => {
                                        const isCurrentPlan = !isTrialing && plan.id === currentPlanId;

                                        const styles = {
                                            emerald: { borderStrong: "border-emerald-500", glow: "shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]", gradient: "from-emerald-500/20", textPrice: "text-emerald-400", bgIcon: "bg-emerald-500/10", checkColor: "text-emerald-500" },
                                            violet: { borderStrong: "border-violet-500/50", glow: "shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)]", gradient: "from-violet-600/10", textPrice: "text-violet-400", bgIcon: "bg-violet-500/10", checkColor: "text-violet-400" },
                                            indigo: { borderStrong: "border-indigo-500/50", glow: "shadow-[0_0_30px_-5px_rgba(99,102,241,0.15)]", gradient: "from-indigo-600/10", textPrice: "text-indigo-400", bgIcon: "bg-indigo-500/10", checkColor: "text-indigo-400" }
                                        }[plan.color as 'emerald' | 'violet' | 'indigo'];

                                        return (
                                            <div key={plan.id} className={`relative group flex flex-col rounded-2xl transition-all duration-500 hover:scale-[1.02] border-2 ${isCurrentPlan ? `${styles.borderStrong} bg-neutral-900 ${styles.glow} z-10` : `${plan.comingSoon ? 'border-white/5 opacity-80' : 'border-white/10 hover:border-white/20'} bg-neutral-900/40`}`}>
                                                
                                                <div className={`absolute -inset-px bg-gradient-to-b ${styles.gradient} to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700 pointer-events-none`} />
                                                <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${styles.gradient} to-transparent rounded-t-2xl pointer-events-none`} />

                                                <div className="relative p-6 space-y-6 flex-1 flex flex-col">
                                                    <div className="space-y-2">
                                                        {isCurrentPlan && (
                                                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase font-bold px-2 py-0.5 mb-2">
                                                                Plan Actual
                                                            </Badge>
                                                        )}
                                                        {plan.comingSoon && (
                                                            <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-[10px] uppercase font-bold px-2 py-0.5 mb-2">
                                                                Próximamente
                                                            </Badge>
                                                        )}
                                                        <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                                            {plan.name}
                                                            {plan.comingSoon && <Lock className="h-4 w-4 text-zinc-600" />}
                                                        </h4>
                                                        <p className="text-sm text-zinc-500">{plan.desc}</p>
                                                    </div>

                                                    <div className="flex flex-col">
                                                        {plan.originalPrice && !plan.comingSoon && (
                                                            <span className="text-xs text-muted-foreground line-through font-medium ml-1 text-red-400">
                                                                {plan.originalPrice}
                                                            </span>
                                                        )}
                                                        <div className="flex items-baseline gap-1">
                                                            <span className={`text-3xl font-black ${plan.comingSoon ? 'text-zinc-600' : styles.textPrice}`}>
                                                                {plan.price}
                                                            </span>
                                                            <span className="text-zinc-500 text-xs font-medium">{plan.interval}</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3 pt-2 flex-1">
                                                        {plan.features.map((feature, i) => (
                                                            <div key={i} className="flex items-start gap-3 text-[13px] text-zinc-400">
                                                                <div className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${styles.bgIcon}`}>
                                                                    <Check className={`h-2.5 w-2.5 ${styles.checkColor}`} />
                                                                </div>
                                                                {feature}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="pt-6">
                                                        <Button
                                                            className={`relative w-full h-11 font-bold transition-all duration-300 ${plan.comingSoon
                                                                ? "bg-neutral-800 text-zinc-500 border border-white/5 cursor-not-allowed"
                                                                : isCurrentPlan
                                                                    ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] border-0 active:scale-95"
                                                                    : "bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] border-0 active:scale-95"
                                                            }`}
                                                            disabled={plan.comingSoon || loadingCheckout}
                                                            onClick={() => !plan.comingSoon && handleCheckout(plan.id)}
                                                            type="button"
                                                        >
                                                            {loadingCheckout && !plan.comingSoon ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Loader2 className="h-4 w-4 animate-spin" /> Procesando...
                                                                </div>
                                                            ) : isCurrentPlan ? (
                                                                "Extender Suscripción"
                                                            ) : plan.comingSoon ? (
                                                                "Próximamente"
                                                            ) : (
                                                                "Elegir Plan"
                                                            )}
                                                        </Button>
                                                        {isCurrentPlan && (
                                                            <p className="text-[10px] text-emerald-500/70 text-center mt-2 font-medium">
                                                                Paga ahora y suma tiempo a tu vencimiento actual.
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex flex-col items-center gap-4 py-6 border-t border-white/5">
                                    <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-500 opacity-60 flex items-center gap-2">
                                        <ShieldCheck className="h-3 w-3" /> Secure Checkout Mercado Pago
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </form>
            </Form>
        </div>
    );
}

function LogoUpload({ value, onChange }: { value: string, onChange: (url: string) => void }) {
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast({ title: "Solo se permiten imágenes", variant: "destructive" });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "La imagen no puede superar los 5MB", variant: "destructive" });
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const headers: Record<string, string> = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
                headers: headers
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Error al subir imagen");
            }

            const data = await res.json();
            onChange(data.url);
            toast({ title: "Logo cargado correctamente" });

        } catch (error: any) {
            console.error(error);
            toast({ title: "Error al subir imagen", description: error.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className={`h-24 w-24 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/30 overflow-hidden relative group transition-colors hover:border-violet-500/50 hover:bg-muted/50`}>
                {value ? (
                    <img src={value} alt="Logo" className="h-full w-full object-contain p-2" />
                ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                )}
                {uploading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-[1px]">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" size="sm" className="relative cursor-pointer overflow-hidden" disabled={uploading}>
                    <Upload className="h-3.5 w-3.5 mr-2" />
                    Subir Nueva Imagen
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} disabled={uploading} />
                </Button>
                {value && (
                    <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 justify-start" onClick={() => onChange("")}>
                        <X className="h-3.5 w-3.5 mr-2" />
                        Eliminar Logo
                    </Button>
                )}
                <p className="text-[10px] text-muted-foreground max-w-[200px]">
                    Recomendado: PNG transparente, máx 5MB.
                </p>
            </div>
        </div>
    )
}