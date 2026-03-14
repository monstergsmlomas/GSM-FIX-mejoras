import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  type Payment,
  type InsertPayment,
  type RepairOrderWithDetails,
  type Product,
  type PaymentItem,
  type Settings,
  type InsertExpense,
  type Expense
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  ShoppingBag,
  Wrench,
  Trash2,
  ShoppingCart,
  DollarSign,
  TrendingDown,
  Printer,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  TrendingUp,
  CreditCard
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { printTicket } from "@/lib/printer";

// Tipo unificado para mostrar en la tabla
type Transaction =
  | ({ type: 'payment' } & Payment & { order?: RepairOrderWithDetails })
  | ({ type: 'expense' } & Expense);

export default function Payments() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog States
  const [isOpenSale, setIsOpenSale] = useState(false);
  const [isOpenExpense, setIsOpenExpense] = useState(false);

  // --- POS STATE (VENTAS) ---
  const [cart, setCart] = useState<PaymentItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | "transferencia">("efectivo");
  const [saleNotes, setSaleNotes] = useState("");

  // --- EXPENSE STATE (GASTOS) ---
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Insumos");

  // Selection States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQty, setProductQty] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<RepairOrderWithDetails | null>(null);
  const [customItem, setCustomItem] = useState({ name: "", price: 0 });
  const [isProductComboboxOpen, setIsProductComboboxOpen] = useState(false);
  const [isOrderComboboxOpen, setIsOrderComboboxOpen] = useState(false);

  // --- QUERIES ---
  const { data: payments = [] } = useQuery<(Payment & { order?: RepairOrderWithDetails })[]>({
    queryKey: ["/api/payments"],
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: orders = [] } = useQuery<RepairOrderWithDetails[]>({
    queryKey: ["/api/orders"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  // Filter Active Orders
  const activeOrders = orders.filter(o => o.status !== "entregado" || o.finalCost > 0);

  // --- CART ACTIONS ---
  const addToCart = (item: PaymentItem) => {
    if (item.type === 'repair' && cart.some(i => i.type === 'repair' && i.id === item.id)) {
      toast({ title: "Esta orden ya está en el carrito", variant: "destructive" });
      return;
    }

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

  // --- CALCULATIONS ---
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

  // --- MUTATION: CREAR PAGO (VENTA) ---
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
        notes: saleNotes || (cart.length > 0 ? `Venta de ${cart.length} items` : "Venta general"),
        items: finalItems
      };
      const res = await apiRequest("POST", "/api/payments", payload);
      return res.json();
    },
    onSuccess: (newPayment) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Pago registrado correctamente" });
      setIsOpenSale(false);
      setCart([]);
      setSaleNotes("");
      setPaymentMethod("efectivo");
    },
    onError: (error: Error) => {
      toast({
        title: "Error al registrar pago",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // --- MUTATION: CREAR GASTO ---
  const createExpenseMutation = useMutation({
    mutationFn: async (newExpense: InsertExpense) => {
      const res = await apiRequest("POST", "/api/expenses", newExpense);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Gasto registrado correctamente" });
      setIsOpenExpense(false);
      setExpenseAmount("");
      setExpenseDesc("");
      setExpenseCategory("Insumos");
    },
    onError: (error: Error) => {
      toast({
        title: "Error al registrar gasto",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // --- MUTATION: ELIMINAR PAGO ---
  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/payments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Transacción eliminada", description: "Se ha descontado de la caja." });
    },
    onError: () => {
      toast({ title: "Error al eliminar", variant: "destructive" });
    },
  });

  // --- MUTATION: ELIMINAR GASTO ---
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Gasto eliminado", description: "El monto ha vuelto a la caja." });
    },
    onError: () => {
      toast({ title: "Error al eliminar", variant: "destructive" });
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

  // --- HELPERS ---
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // ===========================================================================
  // LÓGICA DE FILTRADO DE FECHAS (Cierre de Caja)
  // ===========================================================================
  const cutoffHour = Number((settings as any)?.dayCutoffHour ?? 0);
  const now = new Date();
  let startOfShift = new Date(now);
  startOfShift.setHours(cutoffHour, 0, 0, 0);

  // Si son las 15hs y cierro a las 21hs, mi turno empezó AYER a las 21hs.
  if (now < startOfShift) {
    startOfShift.setDate(startOfShift.getDate() - 1);
  }
  // ===========================================================================

  // --- COMBINAR Y FILTRAR TRANSACCIONES ---
  const allTransactions: Transaction[] = [
    ...payments.map(p => ({ ...p, type: 'payment' as const })),
    ...expenses.map(e => ({ ...e, type: 'expense' as const }))
  ]
    // Primero filtramos por fecha (SOLO lo del turno actual)
    .filter(t => new Date(t.date) >= startOfShift)
    // Luego ordenamos por fecha descendente
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- CALCULAR TOTALES FILTRADOS O GLOBALES ---
  const filteredTransactions = allTransactions.filter((item) => {
    const searchLower = searchTerm.toLowerCase();

    if (item.type === 'payment') {
      const notes = (item.notes || "").toLowerCase();
      const clientName = item.order?.client?.name.toLowerCase() || "";
      const deviceModel = item.order?.device?.model.toLowerCase() || "";

      return notes.includes(searchLower) || clientName.includes(searchLower) || deviceModel.includes(searchLower);
    } else {
      const desc = item.description.toLowerCase();
      const cat = item.category.toLowerCase();
      return desc.includes(searchLower) || cat.includes(searchLower);
    }
  });

  const totalIncome = allTransactions
    .filter(t => t.type === 'payment')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen bg-background/50 pb-20 space-y-8">

      {/* --- HEADER STICKY "GLASS" --- */}
      <div className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-4 transition-all">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              Cobros y Caja
            </h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Gestiona ingresos, gastos y el flujo de caja diario.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* BOTÓN REGISTRAR GASTO */}
            <Dialog open={isOpenExpense} onOpenChange={setIsOpenExpense}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/50">
                  <TrendingDown className="mr-2 h-4 w-4" />
                  Registrar Gasto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Nuevo Gasto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Monto</Label>
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
                        <SelectItem value="Servicios">Servicios (Luz, Internet)</SelectItem>
                        <SelectItem value="Alquiler">Alquiler</SelectItem>
                        <SelectItem value="Comida">Comida / Viáticos</SelectItem>
                        <SelectItem value="Sueldos">Sueldos</SelectItem>
                        <SelectItem value="Otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Input
                      placeholder="Detalle del gasto..."
                      value={expenseDesc}
                      onChange={(e) => setExpenseDesc(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateExpense} disabled={createExpenseMutation.isPending} variant="destructive">
                    {createExpenseMutation.isPending ? "Guardando..." : "Guardar Gasto"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* BOTÓN NUEVA VENTA (ESTILO PRIMARY GLASS) */}
            <Dialog open={isOpenSale} onOpenChange={setIsOpenSale}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 hover:border-primary/40 shadow-sm backdrop-blur-sm transition-all active:scale-95"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Venta
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b bg-muted/10">
                  <DialogTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" /> Nueva Venta / Cobro
                  </DialogTitle>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                  {/* LEFT COLUMN: ITEM SELECTION */}
                  <div className="w-1/2 p-4 border-r overflow-y-auto space-y-4 bg-muted/30">
                    <Tabs defaultValue="product" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="product">Producto</TabsTrigger>
                        <TabsTrigger value="repair">Reparación</TabsTrigger>
                        <TabsTrigger value="custom">Manual</TabsTrigger>
                      </TabsList>

                      {/* TAB: PRODUCT */}
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
                                {/* 👇 AQUÍ ESTÁ EL ARREGLO DEL SCROLL: max-h-[300px] overflow-y-auto 👇 */}
                                <CommandList className="max-h-[300px] overflow-y-auto">
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

                      {/* TAB: REPAIR */}
                      <TabsContent value="repair" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Buscar Orden</label>
                          <Popover open={isOrderComboboxOpen} onOpenChange={setIsOrderComboboxOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" role="combobox" className="w-full justify-between">
                                {selectedOrder ? `#${selectedOrder.id.slice(0, 4)} - ${selectedOrder.client.name}` : "Seleccionar orden..."}
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Buscar por cliente..." />
                                {/* 👇 AQUÍ TAMBIÉN ARREGLAMOS EL SCROLL POR LAS DUDAS 👇 */}
                                <CommandList className="max-h-[300px] overflow-y-auto">
                                  <CommandEmpty>No encontrada.</CommandEmpty>
                                  <CommandGroup>
                                    {activeOrders.map((order) => {
                                      const precioAmostrar = order.finalCost > 0 ? order.finalCost : order.estimatedCost;
                                      return (
                                        <CommandItem
                                          key={order.id}
                                          value={order.client.name + " " + order.device.model}
                                          onSelect={() => {
                                            setSelectedOrder(order);
                                            setIsOrderComboboxOpen(false);
                                          }}
                                        >
                                          <Check className={cn("mr-2 h-4 w-4", selectedOrder?.id === order.id ? "opacity-100" : "opacity-0")} />
                                          <div className="flex flex-col">
                                            <span className="font-medium">{order.client.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                              {order.device.model} | Total: {formatMoney(precioAmostrar)}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {selectedOrder && (
                          <div className="p-3 border rounded-md bg-background space-y-3 shadow-sm">
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Dispositivo:</span>
                                <span>{selectedOrder.device.brand} {selectedOrder.device.model}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Costo Total:</span>
                                <span className="font-bold">
                                  {formatMoney(selectedOrder.finalCost > 0 ? selectedOrder.finalCost : selectedOrder.estimatedCost)}
                                </span>
                              </div>
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => {
                                const fullCost = selectedOrder.finalCost > 0 ? selectedOrder.finalCost : selectedOrder.estimatedCost;
                                const totalPaid = selectedOrder.payments?.reduce((sum, p) => {
                                  if (p.items && p.items.length > 0) {
                                    const repairPayment = p.items
                                      .filter((i: any) => i.type === 'repair' || (!i.type && !i.name.toLowerCase().includes('recargo')))
                                      .reduce((s: number, i: any) => s + Number(i.price || 0), 0);
                                    return sum + repairPayment;
                                  }
                                  return sum + Number(p.amount);
                                }, 0) ?? 0;

                                const balance = Math.max(0, fullCost - totalPaid);

                                if (balance <= 0) {
                                  toast({
                                    title: "Orden Pagada",
                                    description: "Esta orden ya no tiene saldo pendiente.",
                                    variant: "default"
                                  });
                                  return;
                                }

                                addToCart({
                                  type: "repair",
                                  id: selectedOrder.id,
                                  name: `Reparación ${selectedOrder.device.model} - ${selectedOrder.client.name} (Saldo)`,
                                  price: balance,
                                  quantity: 1
                                });
                                setSelectedOrder(null);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" /> Agregar Orden
                            </Button>
                          </div>
                        )}
                      </TabsContent>

                      {/* TAB: CUSTOM */}
                      <TabsContent value="custom" className="space-y-4 mt-4">
                        <div className="space-y-3 p-3 border rounded-md bg-background shadow-sm">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Concepto</label>
                            <Input
                              placeholder="Ej: Servicio express"
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

                  {/* RIGHT COLUMN: CART & CHECKOUT */}
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
                              <div className={cn("p-2 rounded-full",
                                item.type === 'product' ? "bg-green-100 text-green-700" :
                                  item.type === 'repair' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                              )}>
                                {item.type === 'product' && <ShoppingBag className="w-4 h-4" />}
                                {item.type === 'repair' && <Wrench className="w-4 h-4" />}
                                {item.type === 'other' && <DollarSign className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.quantity} x {formatMoney(item.price)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-sm">{formatMoney(item.price * item.quantity)}</span>
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
                          <Input placeholder="Nota de venta..." value={saleNotes} onChange={(e) => setSaleNotes(e.target.value)} />
                        </div>
                      </div>

                      <Button size="lg" className="w-full font-bold shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all" disabled={cart.length === 0 || createPaymentMutation.isPending} onClick={handleCreatePayment}>
                        {createPaymentMutation.isPending ? "Procesando..." : `Cobrar ${formatMoney(totalAmount)}`}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full space-y-8">

        {/* --- KPI CARDS (RESUMEN FINANCIERO) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border/50 bg-gradient-to-br from-card via-card/95 to-emerald-500/10 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 p-3 opacity-10">
              <TrendingUp className="w-24 h-24 text-emerald-500" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-emerald-500" /> Ingresos (Hoy)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatMoney(totalIncome)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-card via-card/95 to-red-500/10 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 p-3 opacity-10">
              <TrendingDown className="w-24 h-24 text-red-500" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-red-500" /> Gastos (Hoy)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {formatMoney(totalExpenses)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-card via-card/95 to-blue-500/10 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 p-3 opacity-10">
              <Wallet className="w-24 h-24 text-blue-500" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-500" /> Balance Neto (Hoy)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-3xl font-bold", netBalance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-500")}>
                {formatMoney(netBalance)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- TABLA DE MOVIMIENTOS --- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Movimientos del Turno Actual</h2>
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente o concepto..."
                className="pl-8 bg-background/50 border-border/50 focus:bg-background transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-[180px]">Fecha</TableHead>
                    <TableHead className="w-[120px]">Tipo</TableHead>
                    <TableHead>Detalle</TableHead>
                    <TableHead className="w-[150px]">Categoría</TableHead>
                    <TableHead className="text-right w-[150px]">Monto</TableHead>
                    <TableHead className="w-[100px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-8 w-8 opacity-20" />
                          <p>No se encontraron movimientos hoy</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((item) => {
                      // --- LÓGICA DE BADGES ---
                      let hasRepair = false;
                      let hasProduct = false;
                      let isGeneral = false;

                      if (item.type === 'payment') {
                        hasRepair = !!item.orderId || (item.items?.some((i: any) => i.type === 'repair') ?? false);
                        hasProduct = item.items?.some((i: any) => i.type === 'product') ?? false;
                        if (!hasRepair && !hasProduct) isGeneral = true;
                      }

                      return (
                        <TableRow key={`${item.type}-${item.id}`} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {format(new Date(item.date), "dd/MM/yyyy HH:mm", { locale: es })}
                          </TableCell>

                          <TableCell>
                            {item.type === 'payment' ? (
                              <div className="flex gap-1 flex-wrap">
                                {hasRepair && (
                                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800 text-[10px] h-5 px-1.5">
                                    <Wrench className="w-3 h-3 mr-1" /> Reparación
                                  </Badge>
                                )}
                                {hasProduct && (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 dark:border-green-800 text-[10px] h-5 px-1.5">
                                    <ShoppingBag className="w-3 h-3 mr-1" /> Venta
                                  </Badge>
                                )}
                                {isGeneral && (
                                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 text-[10px] h-5 px-1.5">
                                    <ArrowUpCircle className="w-3 h-3 mr-1" /> General
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 dark:border-red-800 text-[10px] h-5 px-1.5">
                                <ArrowDownCircle className="w-3 h-3 mr-1" /> Gasto
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell>
                            {item.type === 'payment' ? (
                              <div className="flex flex-col gap-0.5">
                                {item.items && item.items.length > 0 ? (
                                  <div className="flex flex-col gap-0.5">
                                    {item.items.map((subItem: any, idx: number) => (
                                      <span key={idx} className="font-medium text-sm flex items-center gap-1.5">
                                        <span className="text-xs font-mono text-muted-foreground bg-muted px-1 rounded">{subItem.quantity}x</span>
                                        {subItem.name}
                                      </span>
                                    ))}
                                    {item.notes && !item.notes.startsWith("Venta de") && (
                                      <span className="text-xs text-muted-foreground italic mt-0.5 ml-6">"{item.notes}"</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-foreground font-medium">
                                    {item.orderId ? "Pago de Reparación" : (item.notes || "Movimiento general")}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="font-medium">{item.description}</span>
                            )}
                          </TableCell>

                          <TableCell className="capitalize text-sm text-muted-foreground">
                            {item.type === 'payment' ? (
                              <span>{item.method}</span>
                            ) : (
                              <Badge variant="secondary" className="font-normal text-xs bg-muted/50">
                                {item.category}
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className={cn("text-right font-bold tabular-nums", item.type === 'expense' ? "text-red-500" : "text-emerald-600")}>
                            {item.type === 'expense' ? "- " : "+ "}
                            {formatMoney(item.amount)}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* IMPRIMIR */}
                              {item.type === 'payment' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  onClick={() => printTicket(item as Payment, settings)}
                                  title="Imprimir Ticket"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              )}

                              {/* BORRAR */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" title="Eliminar" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar {item.type === 'payment' ? "este cobro" : "este gasto"}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción eliminará el registro y <strong>{item.type === 'payment' ? "restará" : "sumará"} el monto a la caja</strong>.
                                      {item.type === 'payment' && (
                                        <div className="mt-2 p-3 bg-destructive/10 text-destructive rounded-md text-xs font-medium">
                                          Advertencia: El stock de productos NO se repondrá automáticamente.
                                        </div>
                                      )}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive hover:bg-destructive/90 text-white"
                                      onClick={() => {
                                        if (item.type === 'payment') {
                                          deletePaymentMutation.mutate(item.id);
                                        } else {
                                          deleteExpenseMutation.mutate(item.id);
                                        }
                                      }}
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}