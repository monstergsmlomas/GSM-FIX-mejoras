import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, Power, RefreshCw, Save, CheckCircle2, AlertCircle, Type, BotMessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

type OrderStatusType = "recibido" | "presupuesto" | "en_curso" | "listo" | "entregado";

export default function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isBotEnabled, setIsBotEnabled] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatusType>("recibido");

  const [templates, setTemplates] = useState<Record<OrderStatusType, string>>({
    recibido: "Hola, *{nombre}* 👋. Acabamos de ingresar tu *{marca} {modelo}* a nuestro taller (Orden #{orden}). 🛠️ Te avisaremos por acá en cuanto tengamos novedades. ¡Gracias por elegirnos! ✨",
    presupuesto: "Hola, *{nombre}* 📝. Ya tenemos el presupuesto para tu *{marca} {modelo}* (Orden #{orden}). El costo estimado es de *${costo}*. 💰 ¿Nos das luz verde para avanzar con la reparación? 🚀",
    en_curso: "¡Buenas noticias, *{nombre}*! ⚙️ Ya pusimos manos a la obra y estamos trabajando en tu *{marca} {modelo}*. Te avisamos apenas quede de 10. 🔧⚡",
    listo: "¡Tu *{marca} {modelo}* ya está listo, *{nombre}*! 🎉 Podes pasar a retirarlo por nuestro local con tu número de orden #{orden}. Total a abonar: *${costo}*. ¡Te esperamos! 🏃‍♂️💨",
    entregado: "¡Gracias por confiar en nosotros, *{nombre}*! 🙌 Esperamos que disfrutes tu *{marca} {modelo}* a pleno. Recordá que tu orden fue la #{orden}. ¡Cualquier cosita estamos a disposición! 📱✨",
  });

  const { data: dbSettings, isLoading } = useQuery({ queryKey: ["/api/bot/settings"] });

  useEffect(() => {
    if (dbSettings && Object.keys(dbSettings).length > 0) {
      const data = dbSettings as any;
      setIsBotEnabled(data.is_enabled !== false);
      setTemplates({
        recibido: data.template_recibido || templates.recibido,
        presupuesto: data.template_presupuesto || templates.presupuesto,
        en_curso: data.template_en_curso || templates.en_curso,
        listo: data.template_listo || templates.listo,
        entregado: data.template_entregado || templates.entregado,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbSettings]);

  const handleTemplateChange = (value: string) => {
    setTemplates(prev => ({ ...prev, [selectedStatus]: value }));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        isEnabled: isBotEnabled,
        templateRecibido: templates.recibido,
        templatePresupuesto: templates.presupuesto,
        templateEnCurso: templates.en_curso,
        templateListo: templates.listo,
        templateEntregado: templates.entregado,
      };
      const res = await apiRequest("POST", "/api/bot/settings", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/settings"] });
      toast({ title: "Plantillas Guardadas", description: "Los mensajes automáticos se actualizaron correctamente." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudieron guardar las plantillas.", variant: "destructive" });
    }
  });

  const handleSaveTemplates = () => { mutation.mutate(); };

  const { data: botStatus } = useQuery({
    queryKey: ["/api/bot/status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/bot/status");
      return await res.json();
    },
    refetchInterval: 2000, 
  });

  const connectionStatus = (botStatus as any)?.status || "disconnected";
  const currentQr = (botStatus as any)?.qr || null;

  const handleRestartMotor = async () => {
    toast({ title: "Reiniciando Motor...", description: "Por favor, espera unos segundos. Generando QR nuevo..." });
    await apiRequest("POST", "/api/bot/disconnect");
  };

  const statusLabels: Record<OrderStatusType, string> = {
    recibido: "Recibido (Ingreso al taller)",
    presupuesto: "Esperando Aprobación (Presupuesto)",
    en_curso: "En Curso (Reparando)",
    listo: "Listo para Entregar",
    entregado: "Entregado (Finalizado)"
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-md px-6 py-5 shrink-0">
        <div className="max-w-7xl mx-auto w-full">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <MessageSquare className="h-6 w-6 text-purple-500" /> Notificaciones WhatsApp
          </h1>
          <p className="text-sm text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
            &gt; Automatización de mensajes a clientes
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full mt-8 flex-1 animate-in fade-in-50 duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start h-full">
          
          {/* === COLUMNA IZQUIERDA === */}
          <div className="flex flex-col gap-6">
            <Card className="relative overflow-hidden border-border/40 bg-card shadow-lg">
              {/* Brillo sutil de fondo imitando el estilo de tu sistema */}
              <div className="absolute -left-20 -top-20 w-64 h-64 bg-teal-500/5 rounded-full blur-[60px] pointer-events-none" />
              
              <CardHeader className="border-b border-border/40 pb-4 relative z-10">
                <CardTitle className="text-sm font-bold tracking-widest uppercase text-foreground flex items-center gap-2">
                  <BotMessageSquare className="h-4 w-4 text-teal-500" /> Estado del Motor
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center relative z-10">
                
                {connectionStatus === "qr" && currentQr && (
                  <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    <h3 className="text-lg font-black text-amber-500 mb-4 tracking-wider">ESPERANDO VINCULACIÓN</h3>
                    <div className="bg-white p-4 rounded-2xl shadow-xl shadow-amber-500/10 mb-4 border-4 border-amber-500/20">
                      <img src={currentQr} alt="WhatsApp QR" className="w-48 h-48 object-contain" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-6">Escaneá este código desde tu WhatsApp para vincular GSM-FIX</p>
                  </div>
                )}

                {connectionStatus === "qr" && !currentQr && (
                  <div className="flex flex-col items-center py-16">
                    <Loader2 className="h-12 w-12 text-amber-500 animate-spin mb-4" />
                    <h3 className="text-base font-bold text-muted-foreground tracking-wider">GENERANDO QR...</h3>
                  </div>
                )}

                {connectionStatus === "connected" && (
                  <div className="flex flex-col items-center py-8 animate-in zoom-in duration-300">
                    <div className="h-20 w-20 bg-teal-500/10 rounded-full flex items-center justify-center mb-4 border border-teal-500/20">
                      <CheckCircle2 className="h-10 w-10 text-teal-500" />
                    </div>
                    <h3 className="text-xl font-black text-teal-500 mb-2 tracking-wider">MOTOR CONECTADO</h3>
                    <p className="text-sm text-muted-foreground mb-6">El sistema está listo para enviar mensajes.</p>
                  </div>
                )}

                {connectionStatus === "disconnected" && (
                  <div className="flex flex-col items-center py-16">
                    <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
                    <h3 className="text-base font-bold text-muted-foreground tracking-wider">INICIANDO...</h3>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  onClick={handleRestartMotor}
                  className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors mt-4 bg-background/50"
                >
                  <Power className="mr-2 h-4 w-4" /> Desvincular / Reiniciar Motor
                </Button>
              </CardContent>
            </Card>

            <div className="relative overflow-hidden bg-card border border-border/40 rounded-xl p-5 shadow-sm">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/5 rounded-full blur-[50px] pointer-events-none" />
              <h4 className="relative z-10 flex items-center gap-2 text-blue-500 font-bold text-sm mb-4 tracking-wide">
                <Type className="w-4 h-4" /> Variables Dinámicas
              </h4>
              <ul className="relative z-10 space-y-3 text-[13px] text-muted-foreground mb-5 list-disc list-inside ml-1 marker:text-blue-500/50">
                <li>Usá <strong className="text-foreground font-mono bg-background/80 px-1.5 py-0.5 rounded border border-border/50">{"{nombre}"}</strong> para el cliente.</li>
                <li>Usá <strong className="text-foreground font-mono bg-background/80 px-1.5 py-0.5 rounded border border-border/50">{"{marca}"}</strong> y <strong className="text-foreground font-mono bg-background/80 px-1.5 py-0.5 rounded border border-border/50">{"{modelo}"}</strong> para el equipo.</li>
                <li>Usá <strong className="text-foreground font-mono bg-background/80 px-1.5 py-0.5 rounded border border-border/50">{"{orden}"}</strong> para el Nº de reparación.</li>
                <li>Usá <strong className="text-foreground font-mono bg-background/80 px-1.5 py-0.5 rounded border border-border/50">{"{costo}"}</strong> para el total a pagar.</li>
              </ul>
              <div className="relative z-10 bg-background/50 border border-border/50 rounded-lg p-3.5 text-[12px] font-mono text-muted-foreground leading-relaxed">
                "Hola {"{nombre}"}, tu {"{marca}"} #{"{orden}"} ya está listo..."
              </div>
            </div>
          </div>

          {/* === COLUMNA DERECHA === */}
          <div className="flex flex-col gap-6">
            <Card className="relative overflow-hidden border-border/40 bg-card shadow-lg flex flex-col h-full">
              <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-500/5 rounded-full blur-[60px] pointer-events-none" />
              
              <CardHeader className="border-b border-border/40 pb-4 shrink-0 relative z-10">
                <CardTitle className="text-sm font-bold tracking-widest uppercase text-foreground flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-purple-500" /> Configuración de Automatización
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col flex-1 gap-6 relative z-10">
                
                <div className="bg-background/40 border border-border/40 rounded-xl p-5 flex items-center justify-between shadow-inner shrink-0">
                  <div>
                    <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Escudo de Notificaciones</h3>
                    <p className="text-xs text-muted-foreground mt-1">Activa o pausa el envío automático.</p>
                  </div>
                  
                  <div 
                    onClick={() => setIsBotEnabled(!isBotEnabled)}
                    className={cn(
                      "w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300",
                      isBotEnabled ? "bg-purple-600" : "bg-muted"
                    )}
                  >
                    <div 
                      className={cn(
                        "bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300",
                        isBotEnabled ? "translate-x-6" : "translate-x-0"
                      )} 
                    />
                  </div>
                </div>

                <div 
                  className="flex flex-col flex-1 gap-5 transition-opacity duration-300" 
                  style={{ opacity: isBotEnabled ? 1 : 0.4, pointerEvents: isBotEnabled ? "auto" : "none" }}
                >
                  
                  <div className="space-y-2 shrink-0">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      Estado de la Orden (Gatillo)
                    </label>
                    <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val as OrderStatusType)}>
                      <SelectTrigger className="bg-background/50 border-border/50 h-11 text-sm font-medium focus:ring-1 focus:ring-purple-500/50 shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key} className="cursor-pointer">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 flex flex-col flex-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex justify-between">
                      <span>Cuerpo del Mensaje Automatizado</span>
                    </label>
                    
                    <Textarea 
                      value={templates[selectedStatus]} 
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="w-full flex-1 bg-background/50 text-sm resize-none border-border/50 focus-visible:ring-1 focus-visible:ring-purple-500/50 shadow-sm leading-relaxed p-4 min-h-[140px]"
                      placeholder="Escribe aquí tu mensaje automático..."
                    />
                  </div>

                  <Button 
                    onClick={handleSaveTemplates} 
                    disabled={mutation.isPending}
                    className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-medium tracking-wide shadow-sm transition-all shrink-0"
                  >
                    {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {mutation.isPending ? "Guardando..." : "Guardar Plantilla"}
                  </Button>

                </div>
              </CardContent>
            </Card>

            <div className="relative overflow-hidden bg-card border border-border/40 rounded-xl p-5 shadow-sm">
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-red-500/5 rounded-full blur-[50px] pointer-events-none" />
              <h4 className="relative z-10 flex items-center gap-2 text-red-500 font-bold text-sm mb-3 tracking-wide">
                <AlertCircle className="w-4 h-4" /> Nota Importante
              </h4>
              <p className="relative z-10 text-[13px] text-muted-foreground leading-relaxed">
                WhatsApp puede bloquear números si detecta <strong>SPAM</strong>. Como estos son avisos esperados por el cliente, el riesgo es mínimo. Te recomendamos no incluir promociones masivas para cuidar la línea.
              </p>
            </div>
            
          </div>

        </div>
      </div>
    </div>
  );
}