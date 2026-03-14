import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // Usamos el componente Button de la UI
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Como usamos un schema extendido en la página padre, usamos 'any' acá 
// para evitar errores de tipeo estrictos con el nuevo campo advancePayment
interface OrderDetailsProps {
    form: UseFormReturn<any>;
}

export function OrderDetails({ form }: OrderDetailsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Detalles de la Reparación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="problem"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Problema Reportado *</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="Describe el problema que reporta el cliente..."
                                    className="min-h-24 resize-none"
                                    data-testid="input-problem"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* MODIFICADO: Ahora es una grilla de 4 columnas en desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                    
                    {/* 1. COSTO ESTIMADO */}
                    <FormField
                        control={form.control}
                        name="estimatedCost"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Costo Total Estimado</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            {...field}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            data-testid="input-estimated-cost"
                                            className="h-10 pl-8 font-medium" 
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* 2. NUEVO CAMPO: SEÑA / ADELANTO */}
                    <FormField
                        control={form.control}
                        name="advancePayment"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="text-green-600 dark:text-green-500">Seña / Adelanto</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-green-600/70 dark:text-green-500/70" />
                                        <Input
                                            {...field}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="h-10 pl-8 border-green-500/30 focus-visible:ring-green-500 bg-green-50/30 dark:bg-green-950/10 font-bold text-green-700 dark:text-green-400" 
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* 3. FECHA ESTIMADA */}
                    <FormField
                        control={form.control}
                        name="estimatedDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fecha Estimada</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "h-10 w-full px-3 text-left font-normal",
                                                    "border-input bg-background hover:bg-accent hover:text-accent-foreground",
                                                    "flex items-center justify-between",
                                                    !field.value ? "text-muted-foreground" : "text-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(new Date(field.value + "T00:00:00"), "dd/MM/yy")
                                                ) : (
                                                    <span>dd/mm/aa</span>
                                                )}
                                                <CalendarIcon className="h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                                            onSelect={(date) => {
                                                field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                                            }}
                                            disabled={(date) =>
                                                date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* 4. PRIORIDAD */}
                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Prioridad</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                        <SelectTrigger
                                            data-testid="select-priority"
                                            className="h-10 bg-background w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="urgente">Urgente</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="technicianName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Técnico Asignado</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="Nombre del técnico"
                                    data-testid="input-technician"
                                    className="h-10"
                                />
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
                            <FormLabel>Notas Adicionales</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="Cualquier información adicional..."
                                    data-testid="input-notes"
                                    className="min-h-[80px]"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}