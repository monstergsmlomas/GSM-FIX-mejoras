import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MessageCircle, IdCard, StickyNote } from "lucide-react";

interface ClientProps {
  id: number;
  name: string;
  dni?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  [key: string]: any;
}

export function ClientCard({ client, onClick }: { client: ClientProps, onClick?: () => void, onEdit?: (e: any) => void }) {
  
  return (
    <Card 
      onClick={onClick}
      // CAMBIOS DE ESTILO AQUÍ:
      // 1. bg-gradient-to-br: Crea el degradado diagonal.
      // 2. from-card via-card/80 to-violet-900/20: Empieza oscuro y termina con un tinte violeta suave.
      // 3. hover:shadow-violet-900/20: Sombra violeta al pasar el mouse.
      className="w-full relative group transition-all duration-300 border-border/50 bg-gradient-to-br from-card via-card/90 to-violet-900/20 hover:to-violet-900/30 backdrop-blur-sm hover:border-violet-500/50 cursor-pointer overflow-hidden hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.15)]"
    >
      <CardHeader className="pb-2 pt-5 flex flex-row items-start justify-between space-y-0">
        <div className="flex flex-col gap-1 overflow-hidden pr-2">
          {/* Nombre: Se ilumina en violeta al hacer hover */}
          <h3 className="font-bold text-lg leading-none tracking-tight truncate capitalize text-foreground/90 group-hover:text-violet-400 transition-colors">
            {client.name}
          </h3>
          
          {/* DNI */}
          {client.dni && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 font-mono">
              <IdCard className="h-3 w-3" />
              <span>{client.dni}</span>
            </div>
          )}
        </div>

        {/* Botón WhatsApp: Mantenemos el verde porque es el color de la marca WhatsApp, 
            pero le damos un estilo "glass" para que combine */}
        {client.phone && (
          <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9 shrink-0 rounded-full border-green-500/20 bg-green-500/10 text-green-500 hover:text-green-400 hover:bg-green-500/20 hover:border-green-500/50 transition-all shadow-[0_0_10px_-3px_rgba(34,197,94,0.1)]"
            onClick={(e) => { 
                e.stopPropagation(); 
                if (client.phone) {
                    window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}`, '_blank');
                }
            }}
            title="Enviar WhatsApp"
          >
              <MessageCircle className="h-5 w-5" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="grid gap-2 text-sm pb-5">
        {/* Teléfono con ícono Violeta */}
        <div className="flex items-center gap-2.5 text-muted-foreground group-hover:text-foreground/90 transition-colors">
            <Phone className="h-4 w-4 text-violet-500/70" />
            <span className="font-medium tracking-wide">{client.phone || "Sin teléfono"}</span>
        </div>
        
        {/* Email con ícono Violeta */}
        {client.email && (
            <div className="flex items-center gap-2.5 text-muted-foreground truncate">
                <Mail className="h-4 w-4 text-violet-500/70" />
                <span className="truncate opacity-80" title={client.email}>{client.email}</span>
            </div>
        )}

        {/* Badges / Notas */}
        {client.notes && (
            <div className="mt-2 pt-2 border-t border-border/40 flex">
                <Badge variant="secondary" className="gap-1 text-[10px] font-normal bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border-violet-500/20">
                    <StickyNote className="h-3 w-3" />
                    Notas
                </Badge>
            </div>
        )}
      </CardContent>
      
      {/* Decoración lateral: Barra violeta brillante que aparece al hacer hover */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500/0 via-violet-500 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Card>
  );
}