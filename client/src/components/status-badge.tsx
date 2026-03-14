import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Loader2,
  CheckCircle2,
  PackageCheck,
  FileText,
  Inbox,
  XCircle,
  Clock,     // <--- Ícono para Esperando Aprobación
  ArchiveX   // <--- Ícono para Abandonado
} from "lucide-react";
import type { OrderStatus } from "@shared/schema";

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {

  // ESTILOS DE COLOR (Recibido y Entregado invertidos + Nuevos Estados)
  const styles: Record<string, string> = {
    // PRESUPUESTO (Rosa/Pink)
    presupuesto: "bg-pink-500/10 text-pink-400 border-pink-500/20 hover:bg-pink-500/20",

    // ESPERANDO APROBACIÓN (Violeta/Purple)
    esperando_aprobacion: "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20",

    // RECIBIDO (Azul/Blue - Antes era Gris)
    recibido: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",

    // EN CURSO (Ámbar/Amber)
    en_curso: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20",

    // LISTO (Verde/Green)
    listo: "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20",

    // ENTREGADO (Gris/Zinc - Antes era Azul)
    entregado: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20",

    // IRREPARABLE (Rojo/Red)
    irreparable: "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20",

    // ABANDONADO (Naranja Oscuro/Orange)
    abandonado: "bg-orange-600/10 text-orange-500 border-orange-600/20 hover:bg-orange-600/20",
  };

  const labels: Record<string, string> = {
    presupuesto: "Presupuesto",
    esperando_aprobacion: "Esperando Aprobación",
    recibido: "Recibido",
    en_curso: "En Curso",
    listo: "Listo",
    entregado: "Entregado",
    irreparable: "Irreparable",
    abandonado: "Abandonado",
  };

  const icons: Record<string, any> = {
    presupuesto: FileText,
    esperando_aprobacion: Clock,
    recibido: Inbox,
    en_curso: Loader2,
    listo: CheckCircle2,
    entregado: PackageCheck,
    irreparable: XCircle,
    abandonado: ArchiveX,
  };

  const currentStatus = status as OrderStatus;
  const Icon = icons[currentStatus] || ClipboardList;

  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize font-bold tracking-wide border transition-colors flex items-center gap-1.5 w-fit px-2.5 py-0.5 text-[10px] shadow-none",
        styles[status] || styles.recibido,
        className
      )}
    >
      {showIcon && <Icon className={cn("h-3.5 w-3.5", status === 'en_curso' && "animate-spin")} />}
      {labels[status] || status}
    </Badge>
  );
}