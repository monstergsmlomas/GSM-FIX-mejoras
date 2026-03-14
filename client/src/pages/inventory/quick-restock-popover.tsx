
import { useState } from "react";
import { Product } from "@shared/schema";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuickRestockPopoverProps {
    product: Product;
}

export function QuickRestockPopover({ product }: QuickRestockPopoverProps) {
    const [open, setOpen] = useState(false);
    const [amountToAdd, setAmountToAdd] = useState<number | "">("");
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const mutation = useMutation({
        mutationFn: async (addedQty: number) => {
            return apiRequest("PATCH", `/api/products/${product.id}`, {
                quantity: product.quantity + addedQty,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/products"] }); 
            toast({
                title: "Stock actualizado",
                description: `Se agregaron unidades a ${product.name}. Nuevo total: ${product.quantity + Number(amountToAdd)
                    }`,
            });
            setOpen(false);
            setAmountToAdd("");
        },
        onError: () => {
            toast({
                title: "Error",
                description: "No se pudo actualizar el stock.",
                variant: "destructive",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const qty = Number(amountToAdd);
        if (!qty || qty <= 0) return;
        mutation.mutate(qty);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Agregar Stock</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
                <form onSubmit={handleSubmit} className="grid gap-3">
                    <div className="space-y-1">
                        <h4 className="font-medium leading-none">Restock Rápido</h4>
                        <p className="text-xs text-muted-foreground">
                            Stock actual: {product.quantity}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="grid flex-1 gap-1">
                            <Label htmlFor="qty" className="sr-only">
                                Cantidad
                            </Label>
                            <Input
                                id="qty"
                                type="number"
                                placeholder="Cantidad"
                                min="1"
                                value={amountToAdd}
                                onChange={(e) => setAmountToAdd(parseInt(e.target.value) || "")}
                                className="h-8"
                                autoFocus
                            />
                        </div>
                        <Button type="submit" size="sm" className="h-8" disabled={!amountToAdd || mutation.isPending}>
                            {mutation.isPending ? "..." : "Add"}
                        </Button>
                    </div>
                </form>
            </PopoverContent>
        </Popover>
    );
}
