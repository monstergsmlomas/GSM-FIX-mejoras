import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Save, User, UserPlus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Client } from "@shared/schema";

const clientSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    phone: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    address: z.string().optional(),
    dni: z.string().optional(),
    notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client?: Client; // Si viene, es EDICIÓN. Si no, es CREACIÓN.
}

export function ClientDialog({ open, onOpenChange, client }: ClientDialogProps) {
    const { toast } = useToast();
    const isEditing = !!client;

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: "",
            phone: "",
            email: "",
            address: "",
            dni: "",
            notes: "",
        },
    });

    // Efecto para rellenar el formulario al abrir en modo edición
    useEffect(() => {
        if (client && open) {
            form.reset({
                name: client.name,
                phone: client.phone || "",
                email: client.email || "",
                address: client.address || "",
                dni: client.dni || "",
                notes: client.notes || "",
            });
        } else if (!client && open) {
            form.reset({
                name: "",
                phone: "",
                email: "",
                address: "",
                dni: "",
                notes: "",
            });
        }
    }, [client, open, form]);

    const mutation = useMutation({
        mutationFn: async (values: ClientFormValues) => {
            if (isEditing && client) {
                // MODO EDICIÓN (PATCH)
                await apiRequest("PATCH", `/api/clients/${client.id}`, values);
            } else {
                // MODO CREACIÓN (POST) - Por si lo usas en el futuro
                await apiRequest("POST", "/api/clients", values);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
            // Si estamos editando, invalidamos también la query específica de ese cliente
            if (isEditing && client) {
                queryClient.invalidateQueries({ queryKey: ["/api/clients", client.id] });
            }

            toast({
                title: isEditing ? "Cliente actualizado" : "Cliente creado",
                description: "Los cambios se han guardado correctamente."
            });
            onOpenChange(false);
        },
        onError: (error) => {
            console.error(error);
            toast({
                title: "Error",
                description: "No se pudo guardar la información.",
                variant: "destructive"
            });
        },
    });

    const onSubmit = (data: ClientFormValues) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isEditing ? <User className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                        {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre Completo *</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Juan Pérez" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="dni"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>DNI / Identificación</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="12345678" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teléfono</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="11 1234 5678" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="email" placeholder="cliente@email.com" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dirección</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Av. Siempre Viva 123" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="Datos adicionales..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                <Save className="h-4 w-4 mr-2" />
                                {mutation.isPending ? "Guardando..." : "Guardar Cambios"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}