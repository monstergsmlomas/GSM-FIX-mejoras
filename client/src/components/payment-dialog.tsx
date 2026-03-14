import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Banknote, CreditCard, ArrowRightLeft, AlertCircle } from "lucide-react";
import type { PaymentMethod, RepairOrderWithDetails, Settings } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";

// --- CAMBIO 1: Agregamos defaultAmount a la interfaz ---
interface PaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultOrderId?: string;
    defaultAmount?: number; // <--- ¡Esto faltaba!
    onPaymentSuccess?: () => void;
}

const methodIcons: Record<PaymentMethod, typeof Banknote> = {
    efectivo: Banknote,
    tarjeta: CreditCard,
    transferencia: ArrowRightLeft,
};

const methodLabels: Record<PaymentMethod, string> = {
    efectivo: "Efectivo",
    tarjeta: "Tarjeta",
    transferencia: "Transferencia",
};

export function PaymentDialog({
    open,
    onOpenChange,
    defaultOrderId,
    defaultAmount, // <--- Lo recibimos aquí
    onPaymentSuccess
}: PaymentDialogProps) {
    const [selectedOrderId, setSelectedOrderId] = useState(defaultOrderId || "");
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState<PaymentMethod>("efectivo");
    const [notes, setNotes] = useState("");
    const { toast } = useToast();

    const { data: orders } = useQuery<RepairOrderWithDetails[]>({
        queryKey: ["/api/orders"],
    });

    const { data: settings } = useQuery<Settings>({
        queryKey: ["/api/settings"],
    });

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (open) {
            if (defaultOrderId) {
                setSelectedOrderId(defaultOrderId);
            }
            setMethod("efectivo");
            setNotes("");
        }
    }, [open, defaultOrderId]);

    const selectedOrder = orders?.find(o => o.id === selectedOrderId);

    // --- CAMBIO 2: Lógica mejorada para ignorar recargos en el cálculo interno ---
    const totalPaid = selectedOrder?.payments?.reduce((sum, p) => {
        if (p.items && p.items.length > 0) {
            // Filtramos los items que sean "recargo" para no restarlos de la deuda real
            const repairPayment = p.items
                .filter((i: any) => i.type === 'repair' || (!i.type && !i.name.toLowerCase().includes('recargo')))
                .reduce((s: number, i: any) => s + Number(i.price || 0), 0);
            return sum + repairPayment;
        }
        return sum + Number(p.amount);
    }, 0) ?? 0;
    // --------------------------------------------------------------------------

    const estimated = selectedOrder?.estimatedCost ?? 0;
    const final = selectedOrder?.finalCost ?? 0;

    const totalCost = final > 0 ? final : estimated;
    const isCostDefined = totalCost > 0;

    const pendingBalance = Math.max(0, totalCost - totalPaid);

    // Auto-fill amount when order changes
    useEffect(() => {
        if (open && selectedOrder && isCostDefined) {
            // Prioridad: Si nos pasaron un defaultAmount exacto, usamos ese. Si no, usamos el cálculo interno.
            const targetAmount = defaultAmount !== undefined ? defaultAmount : pendingBalance;

            if (targetAmount > 0) {
                setAmount(targetAmount.toFixed(2));
            } else {
                setAmount("");
            }
        }
    }, [selectedOrderId, isCostDefined, pendingBalance, open, defaultAmount]);

    const createPayment = useMutation({
        mutationFn: async (data: {
            amount: number;
            method: PaymentMethod;
            notes: string;
            items: any[]
        }) => {
            const res = await apiRequest("POST", "/api/payments", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
            if (selectedOrderId) {
                queryClient.invalidateQueries({ queryKey: ["/api/orders", selectedOrderId] });
            }
            queryClient.invalidateQueries({ queryKey: ["/api/orders/recent"] });
            queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

            toast({ title: "Pago registrado correctamente" });
            onOpenChange(false);
            onPaymentSuccess?.();
        },
        onError: () => {
            toast({ title: "Error al registrar el pago", variant: "destructive" });
        },
    });

    const handleSubmit = () => {
        if (!selectedOrderId || !amount || !selectedOrder) return;

        const amountNum = parseFloat(amount || "0");
        let finalAmount = amountNum;
        const items = [];

        // Calculation: Surcharge
        const cardSurchargePercent = settings?.cardSurcharge || 0;
        const transferSurchargePercent = settings?.transferSurcharge || 0;

        let surchargeAmount = 0;
        let appliedSurchargePercent = 0;
        let surchargeLabel = "";

        if (method === "tarjeta" && cardSurchargePercent > 0) {
            surchargeAmount = amountNum * (cardSurchargePercent / 100);
            appliedSurchargePercent = cardSurchargePercent;
            surchargeLabel = "Recargo Tarjeta";
        } else if (method === "transferencia" && transferSurchargePercent > 0) {
            surchargeAmount = amountNum * (transferSurchargePercent / 100);
            appliedSurchargePercent = transferSurchargePercent;
            surchargeLabel = "Recargo Transferencia";
        }

        finalAmount = amountNum + surchargeAmount;

        if (finalAmount <= 0) {
            toast({ title: "El monto debe ser mayor a 0", variant: "destructive" });
            return;
        }

        /* Validación de saldo: 
           Si es tarjeta, el total puede superar el saldo pendiente por el recargo.
           Validamos sobre el BASE (amountNum).
        */
        if (amountNum > pendingBalance + 0.05) { // tiny tolerance
            toast({
                title: "El monto base excede el saldo pendiente",
                description: `Saldo pendiente: $${pendingBalance.toFixed(2)}`,
                variant: "destructive"
            });
            return;
        }

        // 1. Repair Item
        items.push({
            type: "repair",
            id: selectedOrder.id,
            name: `Reparación ${selectedOrder.device.brand} ${selectedOrder.device.model}`,
            quantity: 1,
            price: amountNum
        });

        // 2. Surcharge Item (if applied)
        if (surchargeAmount > 0) {
            items.push({
                type: "other",
                name: `${surchargeLabel} (${appliedSurchargePercent}%)`,
                quantity: 1,
                price: surchargeAmount
            });
        }

        createPayment.mutate({
            amount: finalAmount,
            method,
            notes: notes + (surchargeAmount > 0 ? ` (Incluye recargo: $${surchargeAmount.toFixed(2)})` : ""),
            items: items
        });
    };

    const sortedOrders = orders?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Registrar Pago</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    <div>
                        <Label>Orden de Reparación</Label>
                        <Select
                            value={selectedOrderId}
                            onValueChange={setSelectedOrderId}
                            disabled={!!defaultOrderId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una orden" />
                            </SelectTrigger>
                            <SelectContent>
                                {sortedOrders?.map((order) => {
                                    // Cálculo inline para el dropdown (también debe ignorar recargos idealmente, 
                                    // pero aquí es solo visual para la lista).
                                    const pCost = order.finalCost > 0 ? order.finalCost : order.estimatedCost;
                                    const pPaid = order.payments?.reduce((s, p) => s + p.amount, 0) ?? 0;
                                    const pBal = Math.max(0, pCost - pPaid);

                                    return (
                                        <SelectItem key={order.id} value={order.id}>
                                            {order.device.brand} {order.device.model} - {order.client.name}
                                            {pCost <= 0 ? " (Sin costo)" : ` ($${pBal.toFixed(2)} pendiente)`}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedOrder && (
                        <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Costo Total:</span>
                                <span className="font-medium">
                                    {isCostDefined ? `$${totalCost.toFixed(2)}` : "No definido"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Pagado:</span>
                                <span className="font-medium">${totalPaid.toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between">
                                <span className="font-semibold">Pendiente:</span>
                                <span className={`font-bold ${pendingBalance > 0 ? "text-red-500" : "text-green-500"}`}>
                                    ${pendingBalance.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}

                    {selectedOrder && !isCostDefined && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Esta orden no tiene un costo definido. Asigne un costo estimado o final antes de registrar pagos.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div>
                        <Label>Monto</Label>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            min="0.01"
                            step="0.01"
                            disabled={!selectedOrderId || !isCostDefined}
                        />
                        {(
                            (method === "tarjeta" && (settings?.cardSurcharge || 0) > 0) ||
                            (method === "transferencia" && (settings?.transferSurcharge || 0) > 0)
                        ) && (
                                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded text-sm text-yellow-800 dark:text-yellow-200">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>${parseFloat(amount || "0").toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                        <span>
                                            + Recargo ({method === "tarjeta" ? settings?.cardSurcharge : settings?.transferSurcharge}%):
                                        </span>
                                        <span>
                                            ${(parseFloat(amount || "0") * (((method === "tarjeta" ? settings?.cardSurcharge : settings?.transferSurcharge) || 0) / 100)).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="border-t border-yellow-300 dark:border-yellow-800 mt-1 pt-1 flex justify-between font-bold">
                                        <span>Total Final:</span>
                                        <span>
                                            ${(parseFloat(amount || "0") * (1 + (((method === "tarjeta" ? settings?.cardSurcharge : settings?.transferSurcharge) || 0) / 100))).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}
                    </div>

                    <div>
                        <Label>Método de Pago</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {(["efectivo", "tarjeta", "transferencia"] as PaymentMethod[]).map((m) => {
                                const Icon = methodIcons[m];
                                return (
                                    <Button
                                        key={m}
                                        type="button"
                                        variant={method === m ? "default" : "outline"}
                                        className="flex-col h-auto py-3 gap-1"
                                        onClick={() => setMethod(m)}
                                        disabled={!selectedOrderId || !isCostDefined}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span className="text-xs">{methodLabels[m]}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <Label>Notas</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Notas adicionales..."
                            disabled={!selectedOrderId || !isCostDefined}
                        />
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={
                            !selectedOrderId ||
                            !amount ||
                            !isCostDefined ||
                            createPayment.isPending
                        }
                    >
                        {createPayment.isPending ? "Registrando..." : "Registrar Pago"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}