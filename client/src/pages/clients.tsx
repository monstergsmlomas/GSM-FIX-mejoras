import { listClients } from "@/lib/gsmApi";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Plus, Search, Users, UserSquare2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ClientCard } from "@/components/cards/client-card";

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const { data: clients, isLoading, error } = useQuery({
    queryKey: ["clients"],
    queryFn: () => listClients(200),
  });

  const filteredClients = clients?.filter((client) => {
    return searchQuery === "" ||
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.phone ?? "").includes(searchQuery) ||
      (client.email ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  });

  // Manejador para ir al detalle del cliente
  const handleCardClick = (id: number) => {
    setLocation(`/clientes/${id}`);
  };

  // Manejador para el botón de editar
  const handleEditClick = (e: any, id: number) => {
    e.stopPropagation();
    setLocation(`/clientes/${id}`);
  };

  return (
    <div className="min-h-screen bg-background/50 pb-20 space-y-8">
      
      {/* --- HEADER STICKY "GLASS" --- */}
      <div className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-4 transition-all">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <UserSquare2 className="h-6 w-6 text-primary" />
              Clientes
            </h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Gestiona tu base de clientes y su historial.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* BOTÓN NUEVO CLIENTE (Estilo Primary Glass) */}
            <Button 
                asChild 
                variant="outline"
                className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 hover:border-primary/40 shadow-sm backdrop-blur-sm transition-all active:scale-95 flex-1 sm:flex-none"
                data-testid="button-new-client"
            >
              <Link href="/clientes/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full space-y-8">
        
        {/* --- BUSCADOR --- */}
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Directorio de Clientes</h2>
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre, teléfono o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 bg-background/50 border-border/50 focus:bg-background transition-colors"
                    data-testid="input-search-clients"
                />
            </div>
        </div>

        {/* --- CONTENIDO --- */}
        {error && (
            <div className="text-sm text-red-500 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
            Error cargando clientes: {(error as any).message}
            </div>
        )}

        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="border-border/50 bg-card/50">
                <CardContent className="p-6">
                    <Skeleton className="h-5 w-32 mb-3" />
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-4 w-28" />
                </CardContent>
                </Card>
            ))}
            </div>
        ) : filteredClients && filteredClients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredClients.map((client) => (
                <ClientCard
                    key={client.id}
                    client={client}
                    onClick={() => handleCardClick(client.id)}
                    onEdit={(e: any) => handleEditClick(e, client.id)}
                />
            ))}
            </div>
        ) : (
            <EmptyState
                icon={Users}
                title={searchQuery ? "Sin resultados" : "No hay clientes"}
                description={
                    searchQuery
                    ? "No se encontraron clientes con la búsqueda realizada"
                    : "Agrega tu primer cliente para comenzar"
                }
                actionLabel={!searchQuery ? "Nuevo Cliente" : undefined}
                actionHref={!searchQuery ? "/clientes/nuevo" : undefined}
            />
        )}
      </div>
    </div>
  );
}