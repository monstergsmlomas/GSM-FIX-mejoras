import { Plus, Smartphone } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PatternLock } from "@/components/ui/pattern-lock";
import type { Device } from "@shared/schema";
import { OrderFormValues, NewDeviceValues } from "./schemas";

// Definimos el tipo localmente para corregir el error
type LockType = "PIN" | "PASSWORD" | "PATRON" | "NONE";

interface DeviceSelectionProps {
    form: UseFormReturn<OrderFormValues>;
    deviceForm: UseFormReturn<NewDeviceValues>;
    devices?: Device[];
    selectedClientId: string;
    showNewDevice: boolean;
    setShowNewDevice: (show: boolean) => void;
    onCreateDevice: (data: NewDeviceValues) => void;
    isCreatingDevice: boolean;
}

export function DeviceSelection({
    form,
    deviceForm,
    devices,
    selectedClientId,
    showNewDevice,
    setShowNewDevice,
    onCreateDevice,
    isCreatingDevice,
}: DeviceSelectionProps) {
    const lockType = deviceForm.watch("lockType") as LockType;

    return (
        <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm space-y-3">
            {/* --- ENCABEZADO CON ÍCONO VERDE --- */}
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-500/10 rounded-full">
                    <Smartphone className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg">Dispositivo</h3>
            </div>

            {!showNewDevice ? (
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <FormField
                            control={form.control}
                            name="deviceId"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Seleccionar Dispositivo *</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        disabled={!selectedClientId}
                                    >
                                        <FormControl>
                                            <SelectTrigger data-testid="select-device">
                                                <SelectValue
                                                    placeholder={
                                                        selectedClientId
                                                            ? "Selecciona un dispositivo"
                                                            : "Primero selecciona un cliente"
                                                    }
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {devices?.map((device) => (
                                                <SelectItem key={device.id} value={device.id}>
                                                    {device.brand} {device.model}{" "}
                                                    {device.imei && `- ${device.imei}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* --- BOTÓN DE AGREGAR CON ÍCONO DE SMARTPHONE --- */}
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowNewDevice(true)}
                        disabled={!selectedClientId}
                        title="Nuevo Dispositivo"
                        className="mb-[2px]"
                    >
                        <Smartphone className="h-5 w-5" />
                    </Button>
                </div>
            ) : (
                <div className="space-y-4 pt-2 border-t mt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Marca *</Label>
                            <Input
                                {...deviceForm.register("brand")}
                                placeholder="Samsung, Apple..."
                                data-testid="input-device-brand"
                            />
                        </div>
                        <div>
                            <Label>Modelo *</Label>
                            <Input
                                {...deviceForm.register("model")}
                                placeholder="Galaxy S21..."
                                data-testid="input-device-model"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>IMEI</Label>
                            <Input
                                {...deviceForm.register("imei")}
                                placeholder="123456789012345"
                                className="font-mono"
                                data-testid="input-device-imei"
                            />
                        </div>
                        <div>
                            <Label>Tipo de Bloqueo</Label>
                            <Select
                                value={lockType || "NONE"}
                                onValueChange={(value) => {
                                    const actualValue = value === "NONE" ? "" : value;
                                    deviceForm.setValue("lockType", actualValue as any); // cast any para evitar conflicto
                                    deviceForm.setValue("lockValue", "");
                                    deviceForm.clearErrors("lockValue");
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NONE">Ninguno</SelectItem>
                                    <SelectItem value="PIN">PIN</SelectItem>
                                    <SelectItem value="PATRON">Patrón</SelectItem>
                                    <SelectItem value="PASSWORD">Contraseña</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {lockType && lockType !== "NONE" && (
                        <div className="space-y-2 p-3 bg-muted/30 rounded-md border border-dashed">
                            {lockType === "PIN" && (
                                <div>
                                    <Label>PIN *</Label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={8}
                                        {...deviceForm.register("lockValue", {
                                            required: lockType === "PIN" ? "El PIN es requerido" : false,
                                            minLength: { value: 4, message: "Mínimo 4 dígitos" },
                                            maxLength: { value: 8, message: "Máximo 8 dígitos" },
                                            validate: (value) => {
                                                if (lockType === "PIN" && value) {
                                                    if (!/^\d+$/.test(value)) return "Solo números";
                                                    if (value.length < 4) return "Mínimo 4 dígitos";
                                                }
                                                return true;
                                            },
                                            onChange: (e) => {
                                                const value = e.target.value.replace(/\D/g, "").slice(0, 8);
                                                e.target.value = value;
                                                deviceForm.setValue("lockValue", value);
                                            },
                                        })}
                                        placeholder="1234"
                                        autoComplete="off"
                                        data-testid="input-lock-pin"
                                    />
                                    {deviceForm.formState.errors.lockValue && (
                                        <p className="text-sm text-destructive mt-1">
                                            {deviceForm.formState.errors.lockValue.message}
                                        </p>
                                    )}
                                </div>
                            )}
                            {lockType === "PASSWORD" && (
                                <div>
                                    <Label>Contraseña *</Label>
                                    <Input
                                        type="text"
                                        maxLength={20}
                                        {...deviceForm.register("lockValue", {
                                            required: lockType === "PASSWORD" ? "Requerida" : false,
                                            maxLength: { value: 20, message: "Máximo 20 caracteres" },
                                        })}
                                        placeholder="Ingresa la contraseña"
                                        autoComplete="off"
                                        data-testid="input-lock-password"
                                    />
                                    {deviceForm.formState.errors.lockValue && (
                                        <p className="text-sm text-destructive mt-1">
                                            {deviceForm.formState.errors.lockValue.message}
                                        </p>
                                    )}
                                </div>
                            )}
                            {lockType === "PATRON" && (
                                <div>
                                    <Label>Patrón de Desbloqueo *</Label>
                                    {/* AJUSTE: w-[250px] para tamaño medio y p-3 para un aire correcto */}
                                    <div className="flex justify-center items-center p-3 bg-background rounded border w-[250px] mx-auto">
                                        <PatternLock
                                            value={deviceForm.watch("lockValue") || ""}
                                            onChange={(pattern) => {
                                                deviceForm.setValue("lockValue", pattern);
                                                if (pattern) {
                                                    deviceForm.clearErrors("lockValue");
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Color</Label>
                            <Input
                                {...deviceForm.register("color")}
                                placeholder="Negro"
                            />
                        </div>
                        <div>
                            <Label>Condición</Label>
                            <Input
                                {...deviceForm.register("condition")}
                                placeholder="Bueno"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowNewDevice(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={deviceForm.handleSubmit((data) => onCreateDevice(data))}
                            disabled={isCreatingDevice}
                            data-testid="button-save-device"
                        >
                            Guardar Dispositivo
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}