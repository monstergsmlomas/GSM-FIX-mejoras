import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, User, MapPin, Phone, Mail, FileText, StickyNote, UserPlus,
  Check, ChevronsUpDown, Printer, Loader2
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Client, Device, Settings, RepairOrder } from "@shared/schema";
import { DeviceSelection } from "@/components/orders/device-selection";
import { OrderDetails } from "@/components/orders/order-details";
import { orderFormSchema, newDeviceSchema, NewDeviceValues } from "@/components/orders/schemas";

export default function NewOrder() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [showNewDevice, setShowNewDevice] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [openClientCombobox, setOpenClientCombobox] = useState(false);
  const searchParams = new URLSearchParams(window.location.search);
  const urlClientId = searchParams.get("clientId") || "";

  const [selectedClientId, setSelectedClientId] = useState(urlClientId);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  const { data: clients } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  
  const { data: devices } = useQuery<Device[]>({
    queryKey: ["/api/devices", selectedClientId],
    enabled: !!selectedClientId,
  });
  
  const { data: settings } = useQuery<Settings>({ queryKey: ["/api/settings"] });

  const form = useForm<any>({
    resolver: zodResolver(orderFormSchema as any),
    defaultValues: {
      clientId: urlClientId, 
      deviceId: "",
      problem: "",
      estimatedCost: 0, 
      advancePayment: "", // Campo para la seña
      estimatedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      priority: "normal",
      technicianName: "",
      notes: "",
      intakeChecklist: {},
    },
  });

  const deviceForm = useForm<NewDeviceValues>({
    resolver: zodResolver(newDeviceSchema),
    defaultValues: {
      brand: "", model: "", imei: "", serialNumber: "", color: "", condition: "Bueno", lockType: "" as any, lockValue: "",
    },
  });

  const [newClientData, setNewClientData] = useState({
    name: "", phone: "", email: "", dni: "", address: "", notes: ""
  });

  useEffect(() => {
    form.resetField("intakeChecklist");
  }, [selectedClientId, selectedDeviceId, form]);

  const createClient = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/clients", newClientData);
      return res.json();
    },
    onSuccess: (newClient: Client) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      form.setValue("clientId", newClient.id, { shouldValidate: true });
      setSelectedClientId(newClient.id);
      form.setValue("deviceId", "");
      setSelectedDeviceId("");
      setShowNewClient(false);
      setNewClientData({ name: "", phone: "", email: "", dni: "", address: "", notes: "" });
      toast({ title: "Cliente creado y seleccionado" });
    },
    onError: () => { toast({ title: "Error al crear cliente", variant: "destructive" }); }
  });

  const createDevice = useMutation({
    mutationFn: async (data: z.infer<typeof newDeviceSchema>) => {
      const res = await apiRequest("POST", "/api/devices", { ...data, clientId: selectedClientId });
      return res.json();
    },
    onSuccess: (newDevice: Device) => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      form.setValue("deviceId", newDevice.id, { shouldValidate: true, shouldDirty: true });
      setSelectedDeviceId(newDevice.id);
      setShowNewDevice(false);
      deviceForm.reset({ brand: "", model: "", imei: "", serialNumber: "", color: "", condition: "Bueno", lockType: "" as any, lockValue: "" });
      toast({ title: "Dispositivo agregado y seleccionado" });
    },
    onError: () => {
      toast({ title: "Error al guardar dispositivo", variant: "destructive" });
    }
  });

  // MUTACIÓN PARA REGISTRAR LA SEÑA EN CAJA
  const createPayment = useMutation({
    mutationFn: async ({ orderId, amount, notes }: { orderId: string, amount: number, notes: string }) => {
      // Le pegamos directo al servidor asegurándonos de que mande la sucursal actual
      const activeBranchId = localStorage.getItem('activeBranchId');
      
      const res = await apiRequest("POST", "/api/payments", {
        amount: String(amount), // El backend espera string para dinero
        method: "efectivo",
        notes: notes,
        orderId: orderId,
        // Inyectamos branchId por si acaso
        branchId: activeBranchId, 
        items: [{
          type: "repair",
          id: orderId,
          name: notes,
          price: amount,
          quantity: 1
        }]
      });
      return res.json();
    }
  });

  const createOrder = useMutation({
    mutationFn: async ({ data, status }: { data: any, status: string }) => {
      
      // 🔥 TRUCO: Leemos el DOM directamente por si el componente 'OrderDetails' 
      // no actualiza el estado de React Hook Form correctamente.
      const advanceInput = document.querySelector('input[name="advancePayment"]') as HTMLInputElement;
      const rawAdvance = advanceInput ? advanceInput.value : form.getValues("advancePayment");
      
      // Limpiamos los números y forzamos numérico
      const advanceAmount = Number(String(rawAdvance).replace(/[^0-9.-]+/g,"")) || 0;
      const estimatedCostAmount = Number(String(data.estimatedCost).replace(/[^0-9.-]+/g,"")) || 0;

      // 1. Separamos la data
      const { advancePayment, ...orderData } = data;
      orderData.estimatedCost = estimatedCostAmount;

      // 2. Creamos la orden en la base de datos
      const res = await apiRequest("POST", "/api/orders", {
        ...orderData,
        status: status,
        diagnosis: "",
        solution: "",
        finalCost: 0,
      });
      
      const newOrder = await res.json();

      // 3. Si hay seña, registramos la plata en la caja forzosamente
      if (advanceAmount > 0) {
        await createPayment.mutateAsync({
          orderId: newOrder.id,
          amount: advanceAmount,
          notes: `Seña inicial por reparación`
        });
      }

      return newOrder;
    },
    onSuccess: (newOrder: RepairOrder) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash/today"] }); // Forzamos refresh de la caja

      const isBudget = newOrder.status === "presupuesto";
      toast({ title: isBudget ? "Presupuesto guardado" : "Orden creada con seña", description: "Se registró el adelanto en la caja." });

      if (isBudget) {
        window.open(`/ordenes/${newOrder.id}/print`, "_blank");
        navigate(`/ordenes/${newOrder.id}`);
      } else {
        navigate(`/ordenes/${newOrder.id}`);
      }
    },
    onError: () => {
      toast({ title: "Error al guardar", variant: "destructive" });
    },
  });

  const handleSave = (status: "recibido" | "presupuesto") => {
    form.handleSubmit((data) => {
      createOrder.mutate({ data, status });
    })();
  };

  const checklistItems = settings?.checklistOptions && settings.checklistOptions.length > 0
    ? settings.checklistOptions
    : ["¿Carga?", "¿Enciende?", "¿Golpeado?", "¿Mojado?", "¿Abierto previamente?", "¿En garantía?", "¿Micro SD?", "¿Porta SIM?", "¿Tarjeta SIM?"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild data-testid="button-back">
          <Link href="/ordenes"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Nueva Orden</h1>
          <p className="text-muted-foreground">Registra una reparación o presupuesto</p>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-full"><User className="h-4 w-4 text-primary" /></div>
                <h3 className="font-semibold text-lg">Cliente</h3>
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <FormField
                    control={form.control as any}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Seleccionar Cliente *</FormLabel>
                        <Popover open={openClientCombobox} onOpenChange={setOpenClientCombobox}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openClientCombobox}
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !field.value ? "text-muted-foreground" : "text-foreground border-input hover:text-foreground"
                                )}
                              >
                                {field.value ? clients?.find((client) => client.id === field.value)?.name : "Buscar cliente..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0">
                            <Command>
                              <CommandInput placeholder="Buscar cliente..." />
                              <CommandList>
                                <CommandEmpty>No encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {clients?.map((client) => (
                                    <CommandItem
                                      value={client.name}
                                      key={client.id}
                                      onSelect={() => {
                                        form.setValue("clientId", client.id);
                                        setSelectedClientId(client.id);
                                        form.setValue("deviceId", "");
                                        setSelectedDeviceId("");
                                        setOpenClientCombobox(false);
                                      }}
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", client.id === field.value ? "opacity-100" : "opacity-0")} />
                                      <div className="flex flex-col">
                                        <span>{client.name}</span>
                                        <span className="text-xs text-muted-foreground">{client.phone}</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="button" variant="outline" size="icon" onClick={() => setShowNewClient(true)} title="Crear Nuevo Cliente" className="mb-[2px]">
                  <UserPlus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <DeviceSelection
              form={form as any}
              deviceForm={deviceForm}
              devices={devices}
              selectedClientId={selectedClientId}
              showNewDevice={showNewDevice}
              setShowNewDevice={setShowNewDevice}
              onCreateDevice={(data) => createDevice.mutate(data)}
              isCreatingDevice={createDevice.isPending}
            />
          </div>

          <OrderDetails form={form as any} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Checklist de Recepción</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {checklistItems.map((item, index) => (
                  <FormField
                    key={index}
                    control={form.control as any}
                    name={`intakeChecklist.${item}`}
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>{item}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            key={field.value}
                            value={field.value || ""}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id={`${index}-yes`} onClick={(e) => { if (field.value === "yes") { e.preventDefault(); field.onChange(null); } }} />
                              <label htmlFor={`${index}-yes`} className="font-normal cursor-pointer text-sm">Sí</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id={`${index}-no`} onClick={(e) => { if (field.value === "no") { e.preventDefault(); field.onChange(null); } }} />
                              <label htmlFor={`${index}-no`} className="font-normal cursor-pointer text-sm">No</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/ordenes">Cancelar</Link>
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 border"
              onClick={() => handleSave("presupuesto")}
              disabled={createOrder.isPending}
            >
              <Printer className="mr-2 h-4 w-4" />
              Guardar Presupuesto
            </Button>

            <Button
              type="button"
              onClick={() => handleSave("recibido")}
              disabled={createOrder.isPending}
            >
              {createOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null} 
              {createOrder.isPending ? "Creando..." : "Crear Orden"}
            </Button>
          </div>
        </form>
      </Form>

      {/* MODAL CLIENTE */}
      <Dialog open={showNewClient} onOpenChange={setShowNewClient}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Nuevo Cliente</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre Completo *</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" value={newClientData.name} onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })} placeholder="Ej: Juan Pérez" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono *</label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" value={newClientData.phone} onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })} placeholder="Ej: 11 1234 5678" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="email" className="pl-9" value={newClientData.email} onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })} placeholder="cliente@email.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">DNI / Documento</label>
                <div className="relative">
                  <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" value={newClientData.dni} onChange={(e) => setNewClientData({ ...newClientData, dni: e.target.value })} placeholder="DNI" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Dirección</label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" value={newClientData.address} onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })} placeholder="Calle 123, Ciudad" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas / ¿Quién retira?</label>
              <div className="relative">
                <StickyNote className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea className="pl-9 min-h-[80px]" value={newClientData.notes} onChange={(e) => setNewClientData({ ...newClientData, notes: e.target.value })} placeholder="Notas adicionales sobre el cliente..." />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewClient(false)}>Cancelar</Button>
            <Button onClick={() => createClient.mutate()} disabled={!newClientData.name || !newClientData.phone || createClient.isPending}>
              {createClient.isPending ? "Guardando..." : "Guardar y Seleccionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}