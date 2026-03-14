import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Smartphone,
  ClipboardList,
  Edit,
  MessageCircle,
  Trash2 // Icono de basura
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Client, Device, RepairOrderWithDetails } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ClientDialog } from "@/components/orders/client-dialog"; // <--- IMPORTANTE: Importamos el diálogo

export default function ClientDetail() {
  const [, params] = useRoute("/clientes/:id");
  const [, navigate] = useLocation(); // Hook para redirigir
  const { toast } = useToast();
  const clientId = params?.id;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // <--- NUEVO ESTADO

  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ["/api/clients", clientId],
    enabled: !!clientId,
  });

  const { data: devices, isLoading: devicesLoading } = useQuery<Device[]>({
    queryKey: ["/api/devices", clientId],
    enabled: !!clientId,
  });

  // 👇 FIX 1: Pedimos todas las órdenes y las filtramos para no depender de una ruta inexistente
  const { data: allOrders, isLoading: ordersLoading } = useQuery<RepairOrderWithDetails[]>({
    queryKey: ["/api/orders"],
  });
  
  const orders = allOrders?.filter(order => order.clientId === clientId);

  // --- LÓGICA DELETE ---
  const deleteClient = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/clients/${clientId}`);
    },
    onSuccess: () => {
      toast({ title: "Cliente eliminado", description: "El cliente ha sido borrado correctamente." });
      navigate("/clientes"); // Redirigir a la lista
    },
    onError: () => {
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar. Verifica si tiene órdenes pendientes.",
        variant: "destructive"
      });
    }
  });

  const openWhatsApp = (phone: string | null | undefined) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  if (clientLoading) {
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
          <Skeleton className="h-48" />
          <Skeleton className="h-48 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <Button asChild className="mt-4">
          <Link href="/clientes">Volver a Clientes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* --- AQUÍ INSERTAMOS EL DIÁLOGO DE EDICIÓN --- */}
      <ClientDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        client={client}
      />

      {/* DIÁLOGO DE CONFIRMACIÓN DE BORRADO */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará al cliente <strong>{client.name}</strong>.
              Si tiene órdenes asociadas, es posible que debas borrarlas primero.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteClient.mutate()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteClient.isPending ? "Eliminando..." : "Eliminar Cliente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild data-testid="button-back">
            <Link href="/clientes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{client.name}</h1>
            <p className="text-muted-foreground">Ficha del cliente</p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* BOTÓN ELIMINAR */}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-red-600 hover:bg-red-100"
            onClick={() => setIsDeleteDialogOpen(true)}
            title="Eliminar Cliente"
          >
            <Trash2 className="h-5 w-5" />
          </Button>

          {/* BOTÓN EDITAR CONECTADO */}
          <Button
            variant="outline"
            size="sm"
            data-testid="button-edit-client"
            onClick={() => setIsEditDialogOpen(true)} // <--- AHORA SÍ ABRE EL POPUP
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* SECCIÓN TELÉFONO */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{client.phone}</p>

                  {client.phone && (
                    <div
                      role="button"
                      onClick={() => openWhatsApp(client.phone)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 border border-green-600/40 text-green-600 hover:bg-green-900/30 hover:border-green-500/60 hover:text-green-400 transition-all cursor-pointer backdrop-blur-sm -translate-y-2"
                      title="Enviar mensaje por WhatsApp"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECCIÓN EMAIL */}
            {client.email && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>
            )}

            {/* SECCIÓN DIRECCIÓN */}
            {client.address && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <p className="font-medium">{client.address}</p>
                </div>
              </div>
            )}

            {client.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Notas</p>
                <p className="text-sm">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Dispositivos ({devices?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {devicesLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : devices && devices.length > 0 ? (
                <div className="space-y-3">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                      data-testid={`device-${device.id}`}
                    >
                      <div>
                        <p className="font-medium">{device.brand} {device.model}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {device.imei && <span className="font-mono">IMEI: {device.imei}</span>}
                          {device.color && <span>{device.color}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay dispositivos registrados
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Historial de Órdenes ({orders?.length ?? 0})
              </CardTitle>
              {/* 👇 FIX 2: Le pasamos el ID del cliente en la URL */}
              <Button size="sm" asChild data-testid="button-new-order-from-client">
                <Link href={`/ordenes/nueva?clientId=${clientId}`}>Nueva Orden</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <Link key={order.id} href={`/ordenes/${order.id}`}>
                      <div
                        className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover-elevate cursor-pointer"
                        data-testid={`order-${order.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{order.device.brand} {order.device.model}</p>
                            <StatusBadge status={order.status as any} showIcon={false} />
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{order.problem}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.createdAt), "d MMM yyyy", { locale: es })}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium">${order.finalCost || order.estimatedCost}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ClipboardList}
                  title="Sin órdenes"
                  description="Este cliente no tiene órdenes de reparación"
                  actionLabel="Nueva Orden"
                  actionHref={`/ordenes/nueva?clientId=${clientId}`} // 👇 Y acá también
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}