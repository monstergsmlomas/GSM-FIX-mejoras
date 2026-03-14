import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Smartphone,
  User,
  Calendar,
  DollarSign,
  Save,
  Printer,
  ChevronRight,
  Plus,
  MessageCircle,
  Lock,
  Unlock,
  Trash2,
  Pencil,
  ShoppingCart,
  ShoppingBag,
  Wrench,
  Search,
  Check,
  TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusBadge } from "@/components/status-badge";
import { PatternLock } from "@/components/ui/pattern-lock";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { RepairOrderWithDetails, OrderStatus, Payment, Settings, Product, PaymentItem, InsertPayment, InsertExpense } from "@shared/schema";
import { DeviceDialog } from "@/components/orders/device-dialog";

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "presupuesto", label: "Presupuesto" },
  { value: "esperando_aprobacion", label: "Esperando Aprobación" },
  { value: "recibido", label: "Recibido" },
  { value: "en_curso", label: "En Curso" },
  { value: "listo", label: "Listo para Entregar" },
  { value: "entregado", label: "Entregado" },
  { value: "irreparable", label: "Irreparable" },
  { value: "abandonado", label: "Abandonado" },
];

export default function OrderDetail() {
  const [, params] = useRoute("/ordenes/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const orderId = params?.id;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeviceDialogOpen, setIsDeviceDialogOpen] = useState(false);

  // --- ESTADO DEL CARRITO POS (INGRESOS) ---
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [cart, setCart] = useState<PaymentItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | "transferencia">("efectivo");
  const [saleNotes, setSaleNotes] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQty, setProductQty] = useState(1);
  const [customItem, setCustomItem] = useState({ name: "", price: 0 });
  const [isProductComboboxOpen, setIsProductComboboxOpen] = useState(false);

  // --- ESTADO PARA GASTOS (EGRESOS) ---
  const [isOpenExpense, setIsOpenExpense] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Insumos");

  const { data: order, isLoading } = useQuery<RepairOrderWithDetails>({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId,
    refetchInterval: (data) => (data ? 5000 : false), // Detiene el refetch si la orden desaparece
  });

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const [formData, setFormData] = useState<Partial<RepairOrderWithDetails>>({});

  const updateOrder = useMutation({
    mutationFn: async (data: Partial<RepairOrderWithDetails>) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", orderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Cambios guardados",
        description: "La orden se actualizó correctamente.",
      });
    },
    onError: () => {
      toast({ title: "Error al actualizar", variant: "destructive" });
    },
  });

  // 👇 FUNCIÓN DE BORRADO CORREGIDA 👇
  const deleteOrder = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/orders/${orderId}`);
    },
    onSuccess: () => {
      // 1. Limpiamos las listas para que no aparezca la orden vieja
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      // 2. Cerramos el modal de confirmación
      setIsDeleteDialogOpen(false);

      // 3. Redirigimos INMEDIATAMENTE a la lista principal
      navigate("/ordenes", { replace: true });

      toast({ 
        title: "Orden eliminada", 
        description: "La orden y sus cobros han sido borrados de la caja." 
      });
    },
    onError: () => {
      toast({ title: "Error al eliminar", description: "No se pudo eliminar la orden.", variant: "destructive" });
    }
  });

  const openWhatsApp = (e: React.MouseEvent, phone: string | null | undefined) => {
    e.preventDefault();
    e.stopPropagation();
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const currentData = { ...order, ...formData };

  const totalPaid = order?.payments?.reduce((sum, p) => {
    if (p.items && p.items.length > 0) {
      const repairPayment = p.items
        .filter((i: any) => i.type === 'repair' || (!i.type && !i.name.toLowerCase().includes('recargo')))
        .reduce((s: number, i: any) => s + Number(i.price || 0), 0);
      return sum + repairPayment;
    }
    return sum + Number(p.amount);
  }, 0) ?? 0;

  const final = currentData.finalCost ?? 0;
  const estimated = currentData.estimatedCost ?? 0;
  const totalCost = final > 0 ? final : estimated;
  const isCostDefined = totalCost > 0;
  const balance = Math.max(0, totalCost - totalPaid);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const addToCart = (item: PaymentItem) => {
    if (item.type === 'product') {
      const existing = cart.find(i => i.type === 'product' && i.id === item.id);
      if (existing) {
        setCart(cart.map(i => i.id === item.id && i.type === 'product'
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
        ));
        toast({ title: "Cantidad actualizada" });
        return;
      }
    }
    setCart([...cart, item]);
    toast({ title: "Item agregado" });
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateItemPrice = (index: number, newPrice: number) => {
    const updatedCart = [...cart];
    updatedCart[index].price = newPrice;
    setCart(updatedCart);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let surchargePercent = 0;
  let surchargeLabel = "";

  if (paymentMethod === "tarjeta") {
    surchargePercent = settings?.cardSurcharge || 0;
    surchargeLabel = "Recargo Tarjeta";
  } else if (paymentMethod === "transferencia") {
    surchargePercent = settings?.transferSurcharge || 0;
    surchargeLabel = "Recargo Transferencia";
  }

  const surchargeAmount = subtotal * (surchargePercent / 100);
  const totalAmount = subtotal + surchargeAmount;

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const finalItems = [...cart];
      if (surchargeAmount > 0) {
        finalItems.push({
          type: "other",
          id: "surcharge",
          name: `${surchargeLabel} (${surchargePercent}%)`,
          quantity: 1,
          price: surchargeAmount
        });
      }

      const payload: InsertPayment = {
        amount: totalAmount,
        method: paymentMethod,
        notes: saleNotes || (cart.length > 0 ? `Cobro de ${cart.length} items` : "Cobro general"),
        items: finalItems,
        orderId: order?.id 
      };
      const res = await apiRequest("POST", "/api/payments", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", orderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Pago registrado correctamente" });
      setIsPaymentDialogOpen(false);
      setCart([]);
      setSaleNotes("");
      setPaymentMethod("efectivo");
    },
    onError: (error: Error) => {
      toast({ title: "Error al registrar pago", description: error.message, variant: "destructive" });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (newExpense: InsertExpense) => {
      const res = await apiRequest("POST", "/api/expenses", newExpense);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Gasto de repuesto registrado correctamente" });
      setIsOpenExpense(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error al registrar gasto", description: error.message, variant: "destructive" });
    },
  });

  const handleCreatePayment = () => {
    if (cart.length === 0) {
      toast({ title: "El carrito está vacío", variant: "destructive" });
      return;
    }
    createPaymentMutation.mutate();
  };

  const handleCreateExpense = () => {
    if (!expenseAmount || !expenseDesc) {
      toast({ title: "Complete todos los campos", variant: "destructive" });
      return;
    }
    createExpenseMutation.mutate({
      amount: parseFloat(expenseAmount),
      description: expenseDesc,
      category: expenseCategory,
      date: new Date()
    });
  };

  const openPosWithOrder = () => {
    const newCart: PaymentItem[] = [];
    if (balance > 0 && order) {
      newCart.push({
        type: "repair",
        id: order.id,
        name: `Reparación ${order.device.model}`,
        price: balance,
        quantity: 1
      });
    }
    setCart(newCart);
    setIsPaymentDialogOpen(true);
  };

  const openExpenseForOrder = () => {
    if (order) {
      setExpenseDesc(`Repuesto para ${order.device.brand} ${order.device.model} (Orden #${order.id.slice(0, 4)})`);
    }
    setExpenseCategory("Insumos");
    setExpenseAmount("");
    setIsOpenExpense(true);
  };

  const handleSave = () => {
    updateOrder.mutate(formData);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.currentTarget.tagName.toLowerCase() === 'textarea') {
        if (e.ctrlKey || e.metaKey) {
          e.currentTarget.blur();
          handleSave();
        }
      } else {
        e.currentTarget.blur();
        handleSave();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Orden no encontrada</p>
        <Button asChild className="mt-4">
          <Link href="/ordenes">Volver a Órdenes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-12 relative">
      
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b bg-muted/10">
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" /> Nueva Venta / Cobro
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-1/2 p-4 border-r overflow-y-auto space-y-4 bg-muted/30">
              <Tabs defaultValue="product" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="product">Producto</TabsTrigger>
                  <TabsTrigger value="custom">Manual</TabsTrigger>
                </TabsList>

                <TabsContent value="product" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Buscar Producto</label>
                    <Popover open={isProductComboboxOpen} onOpenChange={setIsProductComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                          {selectedProduct ? selectedProduct.name : "Seleccionar producto..."}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar por nombre o SKU..." />
                          <CommandList>
                            <CommandEmpty>No encontrado.</CommandEmpty>
                            <CommandGroup>
                              {products.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  value={product.name}
                                  onSelect={() => {
                                    setSelectedProduct(product);
                                    setIsProductComboboxOpen(false);
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", selectedProduct?.id === product.id ? "opacity-100" : "opacity-0")} />
                                  <div className="flex flex-col">
                                    <span>{product.name}</span>
                                    <span className="text-xs text-muted-foreground">Stock: {product.quantity} | {formatMoney(product.price)}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {selectedProduct && (
                    <div className="p-3 border rounded-md bg-background space-y-3 shadow-sm">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Precio Unitario:</span>
                        <span className="font-bold">{formatMoney(selectedProduct.price)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Disponible:</span>
                        <span className={selectedProduct.quantity < 1 ? "text-destructive font-bold" : ""}>{selectedProduct.quantity}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium">Cantidad:</label>
                        <Input
                          type="number"
                          min={1}
                          max={selectedProduct.quantity}
                          value={productQty}
                          onChange={(e) => setProductQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20"
                        />
                      </div>
                      <Button
                        className="w-full"
                        disabled={selectedProduct.quantity < 1}
                        onClick={() => {
                          addToCart({
                            type: "product",
                            id: selectedProduct.id,
                            name: selectedProduct.name,
                            price: selectedProduct.price,
                            quantity: productQty
                          });
                          setSelectedProduct(null);
                          setProductQty(1);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Agregar al Carrito
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="custom" className="space-y-4 mt-4">
                  <div className="space-y-3 p-3 border rounded-md bg-background shadow-sm">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Concepto</label>
                      <Input
                        placeholder="Ej: Templado extra"
                        value={customItem.name}
                        onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Precio</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={customItem.price || ""}
                        onChange={(e) => setCustomItem({ ...customItem, price: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <Button
                      className="w-full"
                      disabled={!customItem.name || customItem.price <= 0}
                      onClick={() => {
                        addToCart({
                          type: "other",
                          name: customItem.name,
                          price: customItem.price,
                          quantity: 1
                        });
                        setCustomItem({ name: "", price: 0 });
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Agregar Item
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="w-1/2 flex flex-col h-full bg-background rounded-r-lg">
              <div className="p-4 border-b bg-muted/10">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Carrito de Venta
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                    <ShoppingBag className="w-12 h-12 mb-2" />
                    <p>Carrito vacío</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-card shadow-sm group hover:border-primary/50 transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={cn("p-2 rounded-full flex-shrink-0",
                          item.type === 'product' ? "bg-green-100 text-green-700" :
                            item.type === 'repair' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                        )}>
                          {item.type === 'product' && <ShoppingBag className="w-4 h-4" />}
                          {item.type === 'repair' && <Wrench className="w-4 h-4" />}
                          {item.type === 'other' && <DollarSign className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          {item.type === 'repair' ? (
                            <p className="text-xs text-muted-foreground">Monto modificable (Seña/Total)</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">{item.quantity} x {formatMoney(item.price)}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {item.type === 'repair' ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-muted-foreground">$</span>
                            <Input
                              type="number"
                              min="0"
                              className="w-24 h-8 text-right font-bold px-2"
                              value={item.price === 0 ? "" : item.price}
                              onChange={(e) => updateItemPrice(idx, parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        ) : (
                          <span className="font-bold text-sm">{formatMoney(item.price * item.quantity)}</span>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(idx)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t bg-muted/20 space-y-4">
                <div className="space-y-2">
                  {surchargeAmount > 0 ? (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-md text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatMoney(subtotal)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>+ {surchargeLabel} ({surchargePercent}%):</span>
                        <span>{formatMoney(surchargeAmount)}</span>
                      </div>
                      <div className="border-t border-yellow-300 dark:border-yellow-800 pt-1 mt-1 flex justify-between font-bold text-base">
                        <span>Total Final:</span>
                        <span>{formatMoney(totalAmount)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                      <span>Total a Pagar</span>
                      <span>{formatMoney(totalAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Método de Pago</label>
                    <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Nota (Opcional)</label>
                    <Input placeholder="Ej: Seña inicial..." value={saleNotes} onChange={(e) => setSaleNotes(e.target.value)} />
                  </div>
                </div>

                <Button size="lg" className="w-full font-bold shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all" disabled={cart.length === 0 || createPaymentMutation.isPending || totalAmount <= 0} onClick={handleCreatePayment}>
                  {createPaymentMutation.isPending ? "Procesando..." : `Cobrar ${formatMoney(totalAmount)}`}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpenExpense} onOpenChange={setIsOpenExpense}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <TrendingDown className="h-5 w-5" /> Registrar Gasto / Repuesto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Costo del Repuesto</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  className="pl-8"
                  placeholder="0.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Insumos">Insumos (Repuestos)</SelectItem>
                  <SelectItem value="Servicios">Servicios (Logística, etc)</SelectItem>
                  <SelectItem value="Otros">Otros Gastos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descripción (Se autocompleta sola)</Label>
              <Input
                placeholder="Detalle del gasto..."
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateExpense} disabled={createExpenseMutation.isPending} variant="destructive">
              {createExpenseMutation.isPending ? "Guardando..." : "Guardar Gasto en Caja"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeviceDialog open={isDeviceDialogOpen} onOpenChange={setIsDeviceDialogOpen} device={order.device} />

      {/* 👇 ALERT DIALOG CORREGIDO 👇 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la orden y todos los cobros asociados a ella de tu caja diaria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => deleteOrder.mutate()}
              disabled={deleteOrder.isPending}
            >
              {deleteOrder.isPending ? "Eliminando..." : "Eliminar Orden"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md pt-4 pb-4 mb-6 border-b border-border/50 flex items-center justify-between gap-4 flex-wrap shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild data-testid="button-back">
            <Link href="/ordenes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold">
                {order.device.brand} {order.device.model}
              </h1>
              <StatusBadge status={currentData.status as OrderStatus} />
            </div>
            <p className="text-muted-foreground text-sm">
              Orden #{order.id.slice(0, 8)} - Creada {format(new Date(order.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-red-600 hover:bg-red-100"
            onClick={() => setIsDeleteDialogOpen(true)}
            title="Eliminar Orden"
          >
            <Trash2 className="h-5 w-5" />
          </Button>

          <Button variant="outline" size="sm" asChild>
            <Link href={`/ordenes/${orderId}/print`}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateOrder.isPending || Object.keys(formData).length === 0}
            data-testid="button-save-order"
            className="shadow-sm shadow-primary/20"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateOrder.isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estado y Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Estado</Label>
                  <Select
                    value={currentData.status}
                    onValueChange={(value) => {
                      const newStatus = value as OrderStatus;
                      const newData = { ...formData, status: newStatus };
                      setFormData(newData);
                      updateOrder.mutate(newData);
                    }}
                  >
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Técnico Asignado</Label>
                  <Input
                    value={currentData.technicianName || ""}
                    onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                    onKeyDown={handleKeyDown}
                    placeholder="Nombre del técnico"
                    data-testid="input-technician"
                  />
                </div>
              </div>

              <div>
                <Label>Problema Reportado</Label>
                <Textarea
                  value={currentData.problem}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="min-h-20"
                  data-testid="input-problem"
                />
              </div>

              <div>
                <Label>Diagnóstico</Label>
                <Textarea
                  value={currentData.diagnosis || ""}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="Resultado del diagnóstico técnico... (Ctrl+Enter para guardar rápido)"
                  className="min-h-20"
                  data-testid="input-diagnosis"
                />
              </div>

              <div>
                <Label>Solución / Trabajo Realizado</Label>
                <Textarea
                  value={currentData.solution || ""}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe el trabajo realizado... (Ctrl+Enter para guardar rápido)"
                  className="min-h-20"
                  data-testid="input-solution"
                />
              </div>

              <div>
                <Label>Notas Internas</Label>
                <Textarea
                  value={currentData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="Notas adicionales..."
                  data-testid="input-notes"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Costos y Pagos
              </CardTitle>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 border-destructive/20 flex-1 sm:flex-none"
                  onClick={openExpenseForOrder}
                >
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Gasto / Repuesto
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-primary hover:bg-primary/10 border-primary/20 flex-1 sm:flex-none"
                  onClick={openPosWithOrder}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Cobrar al Cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Costo Estimado</Label>
                  <Input
                    type="number"
                    value={currentData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })}
                    onKeyDown={handleKeyDown}
                    min="0"
                    step="0.01"
                    data-testid="input-estimated-cost"
                  />
                </div>
                <div>
                  <Label>Costo Final</Label>
                  <Input
                    type="number"
                    value={currentData.finalCost}
                    onChange={(e) => setFormData({ ...formData, finalCost: parseFloat(e.target.value) || 0 })}
                    onKeyDown={handleKeyDown}
                    min="0"
                    step="0.01"
                    data-testid="input-final-cost"
                  />
                </div>
                <div>
                  <Label>Saldo Pendiente</Label>
                  {isCostDefined ? (
                    <div className={`h-10 flex items-center px-3 rounded-md border font-medium ${balance > 0 ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300' : 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'}`}>
                      {formatMoney(balance)}
                    </div>
                  ) : (
                    <div className="h-10 flex items-center px-3 rounded-md border bg-muted text-muted-foreground text-sm">
                      Costo no definido
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center text-sm px-1">
                <span className="text-muted-foreground">Total Pagado: <span className="font-medium text-foreground">{formatMoney(totalPaid)}</span></span>
                {isCostDefined && (
                  <span className="text-muted-foreground">Costo Total: <span className="font-medium text-foreground">{formatMoney(totalCost)}</span></span>
                )}
              </div>

              {order.payments && order.payments.length > 0 && (
                <div className="pt-4 border-t">
                  <Label className="mb-2 block">Historial de Pagos</Label>
                  <div className="space-y-2">
                    {order.payments.map((payment: Payment) => (
                      <div key={payment.id} className="flex flex-col space-y-1 text-sm py-2 px-3 bg-muted rounded-md">
                        <div className="flex justify-between items-center">
                          <span>{format(new Date(payment.date), "d MMM yyyy", { locale: es })}</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            +{formatMoney(Number(payment.amount))}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {payment.items && payment.items.length > 0 ? (
                            <div className="flex flex-col gap-1 mt-1">
                              {payment.items.map((item: any, idx: number) => (
                                <span key={idx} className="flex justify-between">
                                  <span>• {item.quantity}x {item.name}</span>
                                </span>
                              ))}
                              {payment.notes && <span className="italic mt-1 border-t pt-1">Nota: "{payment.notes}"</span>}
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <span className="capitalize">{payment.method}</span>
                              {payment.notes && <span className="italic max-w-[200px] truncate">"{payment.notes}"</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/clientes/${order.client.id}`}>
                <div className="hover-elevate rounded-md p-3 -m-3 cursor-pointer flex items-center justify-between" data-testid="link-client">
                  <div>
                    <p className="font-medium">{order.client.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-sm text-muted-foreground">{order.client.phone}</p>
                      {order.client.phone && (
                        <div
                          role="button"
                          onClick={(e) => openWhatsApp(e, order.client.phone)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 border border-green-600/40 text-green-600 hover:bg-green-900/30 hover:border-green-500/60 hover:text-green-400 transition-all cursor-pointer backdrop-blur-sm"
                          title="Enviar WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    {order.client.email && (
                      <p className="text-sm text-muted-foreground">{order.client.email}</p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Dispositivo
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:text-primary"
                onClick={() => setIsDeviceDialogOpen(true)}
                title="Editar Dispositivo"
              >
                <Pencil className="h-3 w-3 mr-1" />
                Editar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Marca / Modelo</p>
                <p className="font-medium text-base">{order.device.brand} {order.device.model}</p>
              </div>

              {(order.device.imei || order.device.serialNumber) && (
                <div className="grid grid-cols-2 gap-2">
                  {order.device.imei && (
                    <div>
                      <p className="text-sm text-muted-foreground">IMEI</p>
                      <p className="font-mono text-sm">{order.device.imei}</p>
                    </div>
                  )}
                  {order.device.serialNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">N° Serie</p>
                      <p className="font-mono text-sm">{order.device.serialNumber}</p>
                    </div>
                  )}
                </div>
              )}

              {(order.device.color || order.device.condition) && (
                <div className="grid grid-cols-2 gap-2">
                  {order.device.color && (
                    <div>
                      <p className="text-sm text-muted-foreground">Color</p>
                      <p>{order.device.color}</p>
                    </div>
                  )}
                  {order.device.condition && (
                    <div>
                      <p className="text-sm text-muted-foreground">Condición</p>
                      <p>{order.device.condition}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 border-t mt-2">
                <div className="flex items-center gap-2 mb-2">
                  {(!order.device.lockType || order.device.lockType === "NONE") ? (
                    <Unlock className="h-4 w-4 text-green-500" />
                  ) : (
                    <Lock className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="font-medium text-sm">Bloqueo de Pantalla</span>
                </div>

                {(!order.device.lockType || order.device.lockType === "NONE") ? (
                  <p className="text-sm text-muted-foreground pl-6">Sin bloqueo</p>
                ) : (
                  <div className="pl-6 space-y-2">
                    {(order.device.lockType === "PIN" || order.device.lockType === "PASSWORD") && (
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                          {order.device.lockType === "PIN" ? "PIN" : "Contraseña"}
                        </span>
                        <div className="text-lg font-mono bg-muted/30 p-2 rounded border border-dashed mt-1 select-all">
                          {order.device.lockValue || "No definido"}
                        </div>
                      </div>
                    )}

                    {order.device.lockType === "PATRON" && (
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold block mb-2">
                          Patrón
                        </span>
                        <div className="flex justify-center items-center p-3 bg-muted/20 rounded-md border border-dashed border-muted-foreground/30 w-[200px]">
                          <PatternLock
                            value={order.device.lockValue || ""}
                            readOnly={true}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-0.5">Fecha de Ingreso</p>
                <div className="relative inline-flex items-center group">
                  <p className="font-medium group-hover:text-primary transition-colors">
                    {currentData.createdAt ? format(new Date(currentData.createdAt), "d 'de' MMMM, yyyy", { locale: es }) : "Sin fecha"}
                    <Pencil className="w-3 h-3 ml-2 inline opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  </p>
                  <input
                    type="date"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    value={currentData.createdAt ? (() => {
                      const d = new Date(currentData.createdAt);
                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    })() : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [year, month, day] = e.target.value.split('-').map(Number);
                        setFormData({ ...formData, createdAt: new Date(year, month - 1, day) as any });
                      }
                    }}
                  />
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-0.5">Fecha Estimada</p>
                <div className="relative inline-flex items-center group">
                  <p className="font-medium group-hover:text-primary transition-colors">
                    {currentData.estimatedDate ? format(new Date(currentData.estimatedDate), "d 'de' MMMM, yyyy", { locale: es }) : "Agregar fecha..."}
                    <Pencil className="w-3 h-3 ml-2 inline opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  </p>
                  <input
                    type="date"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    value={currentData.estimatedDate ? (() => {
                      const d = new Date(currentData.estimatedDate);
                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    })() : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [year, month, day] = e.target.value.split('-').map(Number);
                        setFormData({ ...formData, estimatedDate: new Date(year, month - 1, day) as any });
                      } else {
                        setFormData({ ...formData, estimatedDate: null as any });
                      }
                    }}
                  />
                </div>
              </div>

              {order.completedAt && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-0.5">Fecha de Finalización</p>
                  <p className="font-medium">{format(new Date(order.completedAt), "d 'de' MMMM, yyyy", { locale: es })}</p>
                </div>
              )}
              {order.deliveredAt && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-0.5">Fecha de Entrega</p>
                  <p className="font-medium">{format(new Date(order.deliveredAt), "d 'de' MMMM, yyyy", { locale: es })}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Checklist de Recepción
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(settings?.checklistOptions || Object.keys(order.intakeChecklist || {})).map((item) => {
                const val = (order.intakeChecklist as any)?.[item];
                let text = "Desconocido";
                let color = "text-muted-foreground";

                if (val === "yes") { text = "Sí"; color = "text-green-600 dark:text-green-400 font-medium"; }
                else if (val === "no") { text = "No"; color = "text-red-600 dark:text-red-400 font-medium"; }

                return (
                  <div key={item} className="flex justify-between items-center text-sm border-b last:border-0 pb-2 last:pb-0">
                    <span>{item}</span>
                    <span className={color}>{text}</span>
                  </div>
                );
              })}

              {(!settings?.checklistOptions && (!order.intakeChecklist || Object.keys(order.intakeChecklist).length === 0)) && (
                <p className="text-sm text-muted-foreground italic">Sin información de checklist.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}