import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";
import { SubscriptionGuard } from "@/components/subscription-guard";
import PaymentSuccess from "@/pages/payment-success";

//  PÁGINAS (App)
import Dashboard from "@/pages/dashboard";
import Orders from "@/pages/orders";
import NewOrder from "@/pages/new-order";
import OrderDetail from "@/pages/order-detail";
import Clients from "@/pages/clients";
import NewClient from "@/pages/new-client";
import ClientDetail from "@/pages/client-detail";
import Payments from "@/pages/payments";
import Reports from "@/pages/reports";
import PrintOrder from "@/pages/print-order";
import InventoryPage from "@/pages/inventory";
import SettingsPage from "@/pages/settings";
// 👇 IMPORTAMOS LA NUEVA PANTALLA DE NOTIFICACIONES 👇
import NotificationsPage from "@/pages/notifications";

// PÁGINAS PÚBLICAS
import LandingPage from "@/pages/landing/home";
import Login from "@/pages/auth-login";
import Register from "@/pages/auth-register";
import LegalPage from "@/components/marketing/legal";
import ResetPasswordPage from "@/pages/reset-password";


const PrivateRoutes = () => (
  <Switch>
    
    <Route path="/payment-success" component={PaymentSuccess} />

    <Route path="/payment-failure">
      <Redirect to="/configuracion?tab=subscription" />
    </Route>
    <Route path="/payment-pending">
      <Redirect to="/configuracion?tab=subscription" />
    </Route>
    <Route path="/plan-expired">
      <Redirect to="/configuracion?tab=subscription" />
    </Route>

    {/* 🔒 RUTA 2: EL RESTO DE LA APP (Candado Activo) */}
    <Route>
      <SubscriptionGuard>
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/ordenes" component={Orders} />
          <Route path="/ordenes/nueva" component={NewOrder} />
          <Route path="/ordenes/:id/print" component={PrintOrder} />
          <Route path="/ordenes/:id" component={OrderDetail} />
          <Route path="/clientes" component={Clients} />
          <Route path="/clientes/nuevo" component={NewClient} />
          <Route path="/clientes/:id" component={ClientDetail} />
          <Route path="/cobros" component={Payments} />
          <Route path="/reportes" component={Reports} />
          {/* 👇 REGISTRAMOS LA NUEVA RUTA PROTEGIDA 👇 */}
          <Route path="/notificaciones" component={NotificationsPage} />
          <Route path="/inventory" component={InventoryPage} />
          <Route path="/configuracion" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </SubscriptionGuard>
    </Route>
  </Switch>
);

function App() {
  const [location] = useLocation();

  //  rutas son públicas (no requieren Sidebar ni Auth)
  const isPublicRoute =
    location === "/" ||
    location === "/login" ||
    location === "/register" ||
    location === "/legal" ||
    location === "/reset-password" ||
    location.startsWith("/auth");

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {isPublicRoute ? (
          /* 1. RUTAS PÚBLICAS (Landing, Login, Register, LEGALES, RESET) */
          <Switch>
            <Route path="/" component={LandingPage} />
            <Route path="/legal" component={LegalPage} />

            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/reset-password" component={ResetPasswordPage} />

            <Route path="/auth" component={Login} />
            <Route path="/auth/login" component={Login} />
            <Route path="/auth/register" component={Register} />

            <Route component={NotFound} />
          </Switch>
        ) : (
          /* 2. RUTAS PRIVADAS (Dashboard y App) */
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <div className="flex min-h-screen w-full bg-sidebar-background/5">
              <AppSidebar />
              {/* Le quitamos el overflow-hidden al layout para que el scroll fluya libre */}
              <div className="flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out">
                {/* Ojo: Esta barrita (la que tiene las 3 rayitas para ocultar el menú) 
                  también estaba en "sticky top-0". Para que no colisione con 
                  el "sticky top-0" de tu barra de botones, la dejamos fluir normal.
                */}
                <header className="flex items-center justify-between gap-4 px-4 py-3 border-b bg-background">
                  <SidebarTrigger />
                </header>
                {/* EL CAMBIO MAGICO: Eliminamos "overflow-auto" de main */}
                <main className="flex-1 p-6">
                  <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
                    <ProtectedRoute component={PrivateRoutes} />
                  </div>
                </main>
              </div>
            </div>
          </SidebarProvider>
        )}
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;