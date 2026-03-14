import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, FileText, Cookie, ArrowLeft, Lock } from "lucide-react";

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState("terms");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Simple */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            GSM PROYECT <span className="text-muted-foreground font-normal text-sm ml-2">Legales</span>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto py-10 px-4">
        <Tabs defaultValue="terms" className="space-y-8" onValueChange={setActiveTab}>
          
          <div className="flex justify-center">
            <TabsList className="grid w-full grid-cols-3 max-w-[600px] h-auto p-1 bg-muted/50">
              <TabsTrigger value="terms" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <FileText className="mr-2 h-4 w-4" /> Términos
              </TabsTrigger>
              <TabsTrigger value="privacy" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Lock className="mr-2 h-4 w-4" /> Privacidad
              </TabsTrigger>
              <TabsTrigger value="cookies" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Cookie className="mr-2 h-4 w-4" /> Cookies
              </TabsTrigger>
            </TabsList>
          </div>

          {/* --- TÉRMINOS Y CONDICIONES --- */}
          <TabsContent value="terms" className="animate-in fade-in-50 slide-in-from-bottom-2">
            <Card>
              <CardHeader>
                <CardTitle>Términos y Condiciones de Uso</CardTitle>
                <CardDescription>Última actualización: Febrero 2026</CardDescription>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none text-sm text-muted-foreground space-y-4">
                <p>Bienvenido a <strong>GSM PROYECT</strong>. Al acceder y utilizar nuestro software de gestión para talleres (SaaS), aceptas cumplir con los siguientes términos:</p>
                
                <h3 className="text-foreground font-semibold text-base mt-6">1. El Servicio</h3>
                <p>GSM PROYECT proporciona una plataforma en la nube para la gestión de órdenes de reparación, clientes e inventario. Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto del servicio en cualquier momento, aunque intentaremos notificar con antelación cambios críticos.</p>

                <h3 className="text-foreground font-semibold text-base mt-6">2. Suscripciones y Pagos</h3>
                <p>El servicio se ofrece bajo modelos de suscripción (Mensual, Semestral, Anual). Los pagos son procesados de forma segura a través de <strong>Mercado Pago</strong>. Al suscribirte, aceptas el cobro recurrente según el plan elegido. No almacenamos datos sensibles de tarjetas de crédito en nuestros servidores.</p>

                <h3 className="text-foreground font-semibold text-base mt-6">3. Uso Aceptable</h3>
                <p>Te comprometes a utilizar el sistema únicamente para fines legales y relacionados con la gestión de tu negocio. Está prohibido intentar vulnerar la seguridad del sitio, realizar ingeniería inversa o utilizar la plataforma para actividades fraudulentas.</p>

                <h3 className="text-foreground font-semibold text-base mt-6">4. Limitación de Responsabilidad</h3>
                <p>GSM PROYECT no se hace responsable por la pérdida de datos ocasionada por mal uso de la cuenta, interrupciones del servicio ajenas a nosotros (caídas de servidores globales) o fuerza mayor. Recomendamos mantener copias de seguridad de tu información crítica.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- POLÍTICA DE PRIVACIDAD --- */}
          <TabsContent value="privacy" className="animate-in fade-in-50 slide-in-from-bottom-2">
            <Card>
              <CardHeader>
                <CardTitle>Política de Privacidad</CardTitle>
                <CardDescription>Cómo protegemos tus datos y los de tus clientes.</CardDescription>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none text-sm text-muted-foreground space-y-4">
                <p>En GSM PROYECT, la seguridad de tus datos es nuestra prioridad. Esta política explica cómo recopilamos y usamos tu información.</p>

                <h3 className="text-foreground font-semibold text-base mt-6">1. Datos que Recopilamos</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Información de Cuenta:</strong> Nombre, email y datos de facturación (procesados por Mercado Pago).</li>
                  <li><strong>Datos del Negocio:</strong> Los datos de tus clientes, órdenes de reparación y productos que ingresas al sistema.</li>
                  <li><strong>Archivos:</strong> Imágenes y logos subidos a nuestra plataforma.</li>
                </ul>

                <h3 className="text-foreground font-semibold text-base mt-6">2. Uso de la Información</h3>
                <p>Utilizamos tus datos exclusivamente para: Proporcionar el servicio contratado, procesar pagos, enviar notificaciones del sistema y mejorar la plataforma. <strong>No vendemos ni compartimos tus datos con terceros</strong> para fines publicitarios.</p>

                <h3 className="text-foreground font-semibold text-base mt-6">3. Almacenamiento y Seguridad</h3>
                <p>Tus datos están alojados en proveedores de infraestructura de clase mundial (Supabase/AWS/Railway). Utilizamos encriptación SSL/TLS para proteger la transmisión de datos. Las contraseñas se almacenan hashadas (encriptadas) y nadie del equipo tiene acceso a ellas.</p>

                <h3 className="text-foreground font-semibold text-base mt-6">4. Tus Derechos</h3>
                <p>Como usuario, tienes derecho a solicitar la exportación o eliminación de tu cuenta y todos tus datos asociados en cualquier momento, contactando a soporte.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- POLÍTICA DE COOKIES --- */}
          <TabsContent value="cookies" className="animate-in fade-in-50 slide-in-from-bottom-2">
            <Card>
              <CardHeader>
                <CardTitle>Política de Cookies</CardTitle>
                <CardDescription>Uso de tecnologías de almacenamiento local.</CardDescription>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none text-sm text-muted-foreground space-y-4">
                <p>GSM PROYECT utiliza cookies y tecnologías similares (como Local Storage) para garantizar el funcionamiento del sitio.</p>

                <h3 className="text-foreground font-semibold text-base mt-6">1. ¿Qué son las Cookies?</h3>
                <p>Son pequeños archivos de texto que se guardan en tu navegador para recordar información sobre tu visita.</p>

                <h3 className="text-foreground font-semibold text-base mt-6">2. Cookies Esenciales (Obligatorias)</h3>
                <p>Solo utilizamos cookies <strong>estrictamente necesarias</strong> para:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Mantener tu sesión iniciada de forma segura (Autenticación).</li>
                  <li>Recordar tus preferencias de configuración (ej. Tema oscuro/claro).</li>
                  <li>Procesar los pagos de forma segura.</li>
                </ul>
                <p>No utilizamos cookies de rastreo publicitario ni vendemos tu historial de navegación.</p>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}