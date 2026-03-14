import { Link } from "wouter";
import { Plus, User } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Client } from "@shared/schema";
import { OrderFormValues } from "./schemas";

interface ClientSelectionProps {
    form: UseFormReturn<OrderFormValues>;
    clients?: Client[];
    onClientSelect: (clientId: string) => void;
}

export function ClientSelection({ form, clients, onClientSelect }: ClientSelectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Cliente
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Seleccionar Cliente *</FormLabel>
                            <Select
                                value={field.value}
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    onClientSelect(value);
                                }}
                            >
                                <FormControl>
                                    <SelectTrigger data-testid="select-client">
                                        <SelectValue placeholder="Selecciona un cliente" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {clients?.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.name} - {client.phone}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button variant="outline" size="sm" asChild>
                    <Link href="/clientes/nuevo">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Cliente
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
