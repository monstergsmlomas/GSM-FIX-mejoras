import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CreditCard,
  BarChart3,
  HelpCircle,
  Package,
  Settings as SettingsIcon,
  Smartphone,
  Wrench,
  LogOut,
  ChevronUp,
  X,
  Store,
  MessageSquare
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { SupportDialog } from "@/components/support-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button"; 
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Settings } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { useBranch } from "@/hooks/use-branch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    color: "text-pink-500",
    activeBg: "bg-pink-500/10",
    activeText: "text-pink-600 dark:text-pink-400",
    border: "border-pink-500/20"
  },
  {
    title: "Órdenes",
    url: "/ordenes",
    icon: ClipboardList,
    color: "text-indigo-500",
    activeBg: "bg-indigo-500/10",
    activeText: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500/20"
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: Users,
    color: "text-violet-500",
    activeBg: "bg-violet-500/10",
    activeText: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/20"
  },
  {
    title: "Cobros",
    url: "/cobros",
    icon: CreditCard,
    color: "text-emerald-500",
    activeBg: "bg-emerald-500/10",
    activeText: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20"
  },
  {
    title: "Stock",
    url: "/inventory",
    icon: Package,
    color: "text-orange-500",
    activeBg: "bg-orange-500/10",
    activeText: "text-orange-600 dark:text-orange-400",
    border: "border-orange-500/20"
  },
  {
    title: "Reportes",
    url: "/reportes",
    icon: BarChart3,
    color: "text-cyan-500",
    activeBg: "bg-cyan-500/10",
    activeText: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-500/20"
  },
  {
    title: "Notificaciones",
    url: "/notificaciones",
    icon: MessageSquare,
    color: "text-teal-500",
    activeBg: "bg-teal-500/10",
    activeText: "text-teal-600 dark:text-teal-400",
    border: "border-teal-500/20"
  },
  {
    title: "Configuración",
    url: "/configuracion",
    icon: SettingsIcon,
    color: "text-zinc-500",
    activeBg: "bg-zinc-500/10",
    activeText: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-500/20"
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const { session, signOut } = useAuth(); 
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { branches, activeBranch, setActiveBranch } = useBranch();

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const { data: userProfile } = useQuery({
    queryKey: ["/api/user/subscription"],
    queryFn: async () => {
        const token = session?.access_token;
        if (!token) return null;
        const res = await fetch("/api/user/subscription", {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return null;
        return res.json();
    },
    enabled: !!session?.access_token 
  });

  // 👇 CONSULTA: ¿Hay mensajes sin leer? (Se actualiza cada 10 segundos) 👇
  const { data: unreadData } = useQuery({
    queryKey: ["/api/bot/unread"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/bot/unread");
      return await res.json();
    },
    refetchInterval: 10000, 
    enabled: !!session?.access_token,
  });

  // 👇 MUTACIÓN: Apagar el globito al entrar a notificaciones 👇
  const clearUnreadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/bot/clear-unread");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/bot/unread"], { hasUnread: false });
    }
  });

  // Si el usuario entra a la URL de notificaciones, apagamos el globito automáticamente
  React.useEffect(() => {
    if (location.startsWith("/notificaciones") && unreadData?.hasUnread) {
      clearUnreadMutation.mutate();
    }
  }, [location, unreadData?.hasUnread]);


  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "Sesión cerrada" });
    } catch (error: any) {
      toast({ title: "Error al salir", variant: "destructive" });
    }
  };

  const smoothHideText = "ml-3 transition-all duration-300 ease-in-out overflow-hidden group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:ml-0";
  const userRole = userProfile?.role || "admin"; 
  
  const filteredMenuItems = menuItems.filter(item => {
    if (userRole === "technician") {
      const forbiddenUrls = ["/inventory", "/reportes", "/configuracion", "/notificaciones"];
      return !forbiddenUrls.includes(item.url);
    }
    return true; 
  });

  return (
    <>
      <Sidebar 
        collapsible="icon" 
        className="border-r border-border/50 bg-background/95 backdrop-blur-sm z-50"
        style={{ "--sidebar-width-icon": "4rem" } as React.CSSProperties}
      >
        <SidebarHeader className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-muted/50 transition-all group overflow-hidden group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0"
              >
                <div className="relative flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 shadow-sm shadow-primary/20 transition-all duration-300 overflow-hidden">
                  <Smartphone className="absolute size-5 text-primary/50" strokeWidth={1.5} />
                  <Wrench className="absolute size-5 text-primary rotate-[-30deg] translate-x-0.5" strokeWidth={2} />
                </div>
                <div className={`grid flex-1 text-left text-sm leading-tight ${smoothHideText}`}>
                  <span className="truncate font-bold text-base tracking-tight text-primary">GSM FIX</span>
                  <span className="truncate text-[10px] text-muted-foreground uppercase tracking-wider">Sistema de Gestión</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {userRole === "admin" && branches.length > 1 && (
              <SidebarMenuItem className={cn("mt-2 px-1", "group-data-[collapsible=icon]:hidden")}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-9 px-3 bg-background border-border/50 shadow-sm">
                      <Store className="w-4 h-4 mr-2 text-primary" />
                      <span className="truncate flex-1 text-left text-sm">
                        {activeBranch ? activeBranch.name : "Cargando sucursal..."}
                      </span>
                      <ChevronUp className="w-3 h-3 opacity-50 rotate-180" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px]">
                    <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">Tus Sucursales</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {branches.map((branch) => (
                      <DropdownMenuItem 
                        key={branch.id}
                        className={cn("cursor-pointer", activeBranch?.id === branch.id && "bg-primary/10 font-bold text-primary")}
                        onClick={() => setActiveBranch(branch.id)}
                      >
                        <Store className="w-4 h-4 mr-2" />
                        {branch.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer text-xs text-muted-foreground">
                      <Link href="/configuracion">⚙️ Administrar sucursales</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            )}

          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="px-2 mt-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {filteredMenuItems.map((item) => {
                  const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                  const isNotificationTab = item.url === "/notificaciones";
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          "h-12 transition-all duration-200 group relative overflow-hidden rounded-xl",
                          isActive 
                            ? `${item.activeBg} ${item.activeText} font-medium border ${item.border} shadow-sm` 
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                          "group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0"
                        )}
                      >
                        <Link href={item.url} className="flex items-center w-full group-data-[collapsible=icon]:justify-center">
                          
                          {/* Contenedor relativo para poder anclar el globito al ícono */}
                          <div className="relative flex shrink-0">
                            <item.icon 
                              className={cn(
                                "size-7 transition-colors duration-200", 
                                isActive ? item.activeText : item.color,
                                !isActive && "opacity-70 group-hover:opacity-100"
                              )} 
                            />
                            
                            {/* 👇 EL GLOBITO PARPADEANTE DE WHATSAPP 👇 */}
                            {isNotificationTab && unreadData?.hasUnread && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border-[1.5px] border-background"></span>
                              </span>
                            )}
                          </div>

                          <span className={`text-sm font-medium truncate ${smoothHideText}`}>
                            {item.title}
                          </span>
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-current opacity-60 group-data-[collapsible=icon]:hidden" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border/40 mt-auto p-2 relative">
          
          {isMenuOpen && (
            <div className="absolute bottom-20 left-2 right-2 bg-neutral-900 border border-white/10 rounded-xl p-2 shadow-2xl z-[100] animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-white/5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cuenta</span>
                <button onClick={() => setIsMenuOpen(false)} className="text-zinc-500 hover:text-white"><X className="h-3 w-3"/></button>
              </div>
              
              <button 
                onClick={() => { setSupportDialogOpen(true); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:bg-white/5 transition-colors"
              >
                <HelpCircle className="h-4 w-4 text-primary" /> Ayuda y Soporte
              </button>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 font-bold hover:bg-red-500/10 transition-colors mt-1"
              >
                <LogOut className="h-4 w-4" /> Cerrar Sesión
              </button>
            </div>
          )}

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                  "data-[state=open]:bg-sidebar-accent hover:bg-muted/30 transition-all mt-2 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0",
                  isMenuOpen && "bg-muted/30"
                )}
              >
                <Avatar className="h-9 w-9 rounded-lg border border-border/50 bg-background shadow-sm shrink-0">
                  <AvatarImage src={settings?.logoUrl || ""} alt={settings?.shopName} className="object-contain p-1" />
                  <AvatarFallback className="rounded-lg bg-primary/5 text-primary font-bold text-xs">
                    {settings?.shopName?.substring(0, 2).toUpperCase() || "TL"}
                  </AvatarFallback>
                </Avatar>
                <div className={`grid flex-1 text-left text-sm leading-tight ${smoothHideText}`}>
                  <span className="truncate font-semibold">{settings?.shopName || "Mi Taller"}</span>
                  <span className={cn(
                    "truncate text-[10px] font-bold uppercase mt-0.5",
                    userRole === "technician" ? "text-blue-500" : "text-muted-foreground"
                  )}>
                    {userRole === "technician" ? "Técnico" : "Administrador"}
                  </span>
                </div>
                <ChevronUp className={cn("ml-auto h-4 w-4 text-muted-foreground transition-transform", isMenuOpen && "rotate-180", smoothHideText)} />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SupportDialog
        open={supportDialogOpen}
        onOpenChange={setSupportDialogOpen}
      />
    </>
  );
}