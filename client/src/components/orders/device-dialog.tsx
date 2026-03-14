import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Save, Smartphone } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PatternLock } from "@/components/ui/pattern-lock";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Device } from "@shared/schema";

const deviceSchema = z.object({
    brand: z.string().min(1, "Marca requerida"),
    model: z.string().min(1, "Modelo requerido"),
    imei: z.string().optional(),
    serialNumber: z.string().optional(),
    color: z.string().optional(),
    condition: z.string().optional(),
    lockType: z.enum(["PIN", "PASSWORD", "PATRON", "NONE"]).default("NONE"),
    lockValue: z.string().optional(),
});

type DeviceFormValues = z.infer<typeof deviceSchema>;

interface DeviceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    device: Device;
}

export function DeviceDialog({ open, onOpenChange, device }: DeviceDialogProps) {
    const { toast } = useToast();

    const form = useForm<DeviceFormValues>({
        resolver: zodResolver(deviceSchema),
        defaultValues: {
            brand: device.brand,
            model: device.model,
            imei: device.imei || "",
            serialNumber: device.serialNumber || "",
            color: device.color || "",
            condition: device.condition || "",
            lockType: (device.lockType as any) || "NONE",
            lockValue: device.lockValue || "",
        },
    });

    useEffect(() => {
        if (device && open) {
            form.reset({
                brand: device.brand,
                model: device.model,
                imei: device.imei || "",
                serialNumber: device.serialNumber || "",
                color: device.color || "",
                condition: device.condition || "",
                lockType: (device.lockType as any) || "NONE",
                lockValue: device.lockValue || "",
            });
        }
    }, [device, open, form]);

    const updateDevice = useMutation({
        mutationFn: async (values: DeviceFormValues) => {
            // AQUÍ ESTABA EL CAMBIO: Ahora llamamos a la API real
            await apiRequest("PATCH", `/api/devices/${device.id}`, values);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] }); // Actualiza la orden en pantalla
            toast({ title: "Dispositivo actualizado", description: "Los cambios se han guardado." });
            onOpenChange(false);
        },
        onError: (error) => {
            console.error("Error al actualizar:", error);
            toast({ title: "Error", description: "No se pudo actualizar el dispositivo.", variant: "destructive" });
        },
    });

    const onSubmit = (data: DeviceFormValues) => {
        // ¡AHORA SÍ GUARDAMOS! (Antes solo había un console.log)
        updateDevice.mutate(data);
    };

    const lockType = form.watch("lockType");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        Editar Dispositivo
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="brand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Marca *</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Samsung" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Modelo *</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="S21" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="imei"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>IMEI</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Opcional" className="font-mono" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="serialNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>N° Serie</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Opcional" className="font-mono" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Color</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Negro" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="condition"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Condición</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Usado, pantalla rota..." />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* SECCIÓN DE BLOQUEO */}
                        <div className="space-y-4 pt-2 border-t">
                            <FormField
                                control={form.control}
                                name="lockType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Bloqueo</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="NONE">Ninguno</SelectItem>
                                                <SelectItem value="PIN">PIN</SelectItem>
                                                <SelectItem value="PATRON">Patrón</SelectItem>
                                                <SelectItem value="PASSWORD">Contraseña</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {lockType !== "NONE" && (
                                <div className="p-4 bg-muted/30 rounded-md border border-dashed flex justify-center">
                                    {lockType === "PATRON" ? (
                                        <PatternLock
                                            value={form.watch("lockValue") || ""}
                                            onChange={(val) => form.setValue("lockValue", val)}
                                        />
                                    ) : (
                                        <FormField
                                            control={form.control}
                                            name="lockValue"
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormLabel>
                                                        {lockType === "PIN" ? "Ingrese PIN" : "Ingrese Contraseña"}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type={lockType === "PIN" ? "number" : "text"}
                                                            placeholder={lockType === "PIN" ? "1234" : "password123"}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={updateDevice.isPending}>
                                <Save className="h-4 w-4 mr-2" />
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}