import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, Smartphone, Coins, Building2 } from "lucide-react";

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  
  // 🔥 CAMBIÁ ESTE NÚMERO EN EL FUTURO PARA QUE VUELVA A SALTAR
  const UPDATE_VERSION = "v2.0-multisede"; 

  useEffect(() => {
    const hasSeenUpdate = localStorage.getItem(`seen_update_${UPDATE_VERSION}`);
    if (!hasSeenUpdate) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(`seen_update_${UPDATE_VERSION}`, "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-blue-500/20">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">¡Mega-Actualización!</DialogTitle>
          </div>
          <DialogDescription className="text-base text-muted-foreground">
            Escuchamos sus sugerencias y lanzamos un montón de mejoras para que administrar tu taller sea más rápido y cómodo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-4 pr-2">
          
          <div>
            <h3 className="font-bold text-blue-500 flex items-center gap-2 mb-2"><Smartphone className="h-4 w-4"/> Gestión de Órdenes</h3>
            <ul className="space-y-2 text-sm text-foreground/80 ml-6 list-disc marker:text-blue-500">
              <li><strong>Nuevos Estados:</strong> "Esperando Aprobación" y "Abandonado".</li>
              <li><strong>Cambio Rápido:</strong> Cambiá el estado directo desde la lista, sin entrar a la orden.</li>
              <li><strong>Nuevas Impresiones:</strong> Elegí formato Clásico, Solo Técnico o Solo Cliente.</li>
              <li><strong>Navegación Ágil:</strong> Guardado con tecla <kbd className="bg-muted px-1 rounded border">Enter</kbd> y nueva barra móvil.</li>
              <li><strong>Señas y Gastos:</strong> Botón de gastos directo en la orden, y las señas ahora van directo a la caja diaria.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-emerald-500 flex items-center gap-2 mb-2"><Coins className="h-4 w-4"/> Caja y Reportes</h3>
            <ul className="space-y-2 text-sm text-foreground/80 ml-6 list-disc marker:text-emerald-500">
              <li>El cajón de pagos ahora muestra directamente los cobros.</li>
              <li>Se reparó y optimizó el gráfico de cantidad de equipos mensuales.</li>
              <li>Nuevo botón en Reportes para imprimir un resumen financiero mes a mes.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-violet-500 flex items-center gap-2 mb-2"><Building2 className="h-4 w-4"/> Multisede y Seguridad</h3>
            <ul className="space-y-2 text-sm text-foreground/80 ml-6 list-disc marker:text-violet-500">
              <li><strong>Nuevo Plan Multisede:</strong> Creá múltiples sucursales con cajas y datos independientes.</li>
              <li><strong>Cuentas para Empleados:</strong> Creá usuarios restringidos para tus técnicos asignados a un local.</li>
              <li><strong>Seguridad:</strong> Cambio de contraseña segura habilitado desde Configuración.</li>
            </ul>
          </div>

        </div>

        <DialogFooter className="sm:justify-center border-t border-border pt-4 mt-2">
          <Button onClick={handleClose} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-8">
            ¡Genial, a trabajar!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}