import type { Express, Request } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { connectToWhatsApp, disconnectWhatsApp, sendWhatsAppMessage, getWaStatus, getWaQr } from './whatsapp';
import {
  insertRepairOrderSchema,
  insertClientSchema,
  insertDeviceSchema,
  insertPaymentSchema,
  insertSettingsSchema,
  insertProductSchema,
  insertExpenseSchema,
  insertDailyCashSchema
} from "@shared/schema";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import { Resend } from 'resend';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// --- HELPER: CALCULAR FECHA DE CAJA (ARGENTINA + CUTOFF) ---
const getShiftDate = (settings: any): string => {
  const cutoffHour = Number(settings?.dayCutoffHour ?? 0);
  const now = new Date();
  now.setUTCHours(now.getUTCHours() - 3); // UTC-3 Argentina
  const currentHourArg = now.getUTCHours();

  if (currentHourArg < cutoffHour) {
    now.setDate(now.getDate() - 1);
  }
  return now.toISOString().split("T")[0];
};

export async function registerRoutes(server: Server, app: Express) {
  // Iniciamos el motor de WhatsApp apenas arranca el servidor
  connectToWhatsApp();
  
  const resend = new Resend(process.env.RESEND_API_KEY);

  // 👇 HELPER INTELIGENTE: Obtener Dueño 👇
  const getUserId = async (req: Request): Promise<string> => {
    const GUEST_ID = "guest-user-no-access";
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return GUEST_ID;

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) return GUEST_ID;

      const dbUser = await storage.getUser(user.id);
      
      if (dbUser && dbUser.role === 'technician' && dbUser.ownerId) {
        return dbUser.ownerId; 
      }
      
      return user.id;
    } catch (e) {
      console.error("Error crítico validando usuario:", e);
      return GUEST_ID;
    }
  };

  // 👇 HELPER: Obtener la Sucursal Activa desde el Frontend 👇
  const getBranchId = (req: Request): string | undefined => {
    const branchId = req.headers['x-branch-id'];
    return typeof branchId === 'string' ? branchId : undefined;
  };

  const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

  // --- SUBSCRIPCIÓN & USUARIO ---
  app.get("/api/user/subscription", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "No token provided" });
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) return res.status(401).json({ error: "Invalid token" });

      let dbUser = await storage.getUser(user.id);

      // 🔥 EL BYPASS: Vamos directo a Supabase a buscar la columna sucursales_extra 🔥
      const { data: rawUser } = await supabase.from('users').select('sucursales_extra').eq('id', user.id).single();

      if (dbUser && dbUser.role === 'technician' && dbUser.ownerId) {
        const ownerProfile = await storage.getUser(dbUser.ownerId);
        
        // 🔥 BYPASS PARA TÉCNICOS: Buscamos las sucursales del dueño 🔥
        const { data: rawOwner } = await supabase.from('users').select('sucursales_extra').eq('id', dbUser.ownerId).single();

        if (ownerProfile) {
          return res.json({
            subscriptionStatus: ownerProfile.subscriptionStatus,
            trialEndsAt: ownerProfile.trialEndsAt,
            currentPeriodEnd: ownerProfile.currentPeriodEnd,
            billingInterval: ownerProfile.billingInterval,
            isAutoRenew: ownerProfile.isAutoRenew,
            role: 'technician', 
            ownerId: dbUser.ownerId,
            extraBranches: rawOwner?.sucursales_extra || 0 // Acá mandamos el dato real
          });
        }
      }

      if (!dbUser) {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);

        try {
          dbUser = await storage.createUser({
            id: user.id, email: user.email, trialEndsAt: trialEndsAt,
            subscriptionStatus: "trialing", isAutoRenew: true,
            billingInterval: null, currentPeriodEnd: null,
            role: "admin", name: user.user_metadata?.full_name || ""
          });
        } catch (createError) {
          dbUser = await storage.getUser(user.id);
          if (!dbUser) return res.status(500).json({ error: "Failed to initialize subscription" });
        }
      }

      res.json({
        subscriptionStatus: dbUser?.subscriptionStatus, trialEndsAt: dbUser?.trialEndsAt,
        currentPeriodEnd: dbUser?.currentPeriodEnd, billingInterval: dbUser?.billingInterval,
        isAutoRenew: dbUser?.isAutoRenew, role: dbUser?.role, ownerId: dbUser?.ownerId,
        extraBranches: rawUser?.sucursales_extra || 0 // Acá mandamos el dato real
      });
    } catch (e) { res.status(500).json({ error: "Internal Server Error" }); }
  });

  // =========================================================
  // 👇 RUTAS DE SUCURSALES (Multi-Branch) 👇
  // =========================================================
  app.get("/api/branches", async (req, res) => {
    try {
      const u = await getUserId(req);
      if (u === "guest-user-no-access") return res.status(401).json({ error: "Unauthorized" });

      let branches = await storage.getBranches(u);

      if (branches.length === 0) {
        const defaultBranch = await storage.createBranch({
          userId: u, name: "Sucursal Principal", address: "Local Central", phone: "", isDefault: true
        } as any);
        branches = [defaultBranch];

        const tablesToMigrate = ["clients", "repair_orders", "devices", "products", "payments", "expenses", "daily_cash", "settings"];
        for (const table of tablesToMigrate) {
          await supabase.from(table).update({ branch_id: defaultBranch.id }).eq("user_id", u).is("branch_id", null);
        }
      }

      res.json(branches);
    } catch (e) { console.error(e); res.status(500).json({ error: "Error fetching branches" }); }
  });

  app.post("/api/branches", async (req, res) => {
    try {
      const u = await getUserId(req);
      const newBranch = await storage.createBranch({ ...req.body, userId: u });
      res.status(201).json(newBranch);
    } catch (e) { res.status(500).json({ error: "Error creating branch" }); }
  });

  app.patch("/api/branches/:id", async (req, res) => {
    try {
      const u = await getUserId(req);
      const updated = await storage.updateBranch(req.params.id, req.body, u);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (e) { res.status(500).json({ error: "Error updating branch" }); }
  });

  app.delete("/api/branches/:id", async (req, res) => {
    try {
      const u = await getUserId(req);
      if (u === "guest-user-no-access") return res.status(401).json({ error: "Unauthorized" });

      // Eliminamos usando Supabase directo. 
      // La regla .eq("is_default", false) es el candado de seguridad para no borrar la sede principal.
      const { error } = await supabase
        .from("branches")
        .delete()
        .eq("id", req.params.id)
        .eq("user_id", u)
        .eq("is_default", false); 

      if (error) {
        console.error("Error al borrar sucursal:", error);
        return res.status(400).json({ error: "No se puede eliminar la sucursal porque tiene datos asociados." });
      }

      res.sendStatus(204);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error interno al eliminar sucursal" });
    }
  });

  // =========================================================
  // RUTAS DE EQUIPO / TÉCNICOS
  // =========================================================
  app.get("/api/team", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const team = await storage.getTeamMembers(user.id);
      res.json(team);
    } catch (e) { res.status(500).json({ error: "Error fetching team" }); }
  });

  app.post("/api/team", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
      const token = authHeader.replace("Bearer ", "");
      const { data: { user: adminUser } } = await supabase.auth.getUser(token);
      if (!adminUser) return res.status(401).json({ error: "Unauthorized" });

      const dbAdmin = await storage.getUser(adminUser.id);
      if (dbAdmin?.role !== 'admin') return res.status(403).json({ error: "Forbidden. Only admins can create team members." });

      const { email, password, name, branchId } = req.body; 

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email, password: password, email_confirm: true, 
        user_metadata: { full_name: name, created_by: adminUser.id, role: 'technician' }
      });

      if (authError) return res.status(400).json({ error: authError.message });

      let newTech;
      try {
        newTech = await storage.updateUser(authData.user.id, {
          name: name, role: "technician", ownerId: adminUser.id, subscriptionStatus: "active", branchId: branchId
        });
      } catch (e) { console.log("Fallo al actualizar perfil automático."); }

      if (!newTech) {
        try {
          newTech = await storage.createUser({
            id: authData.user.id, email: email, name: name, role: "technician", ownerId: adminUser.id, subscriptionStatus: "active", branchId: branchId
          } as any);
        } catch (insertError) {
           newTech = await storage.updateUser(authData.user.id, {
             name: name, role: "technician", ownerId: adminUser.id, subscriptionStatus: "active", branchId: branchId
           });
        }
      }

      res.status(201).json(newTech || { id: authData.user.id, email, name, role: 'technician' });
    } catch (e: any) { res.status(500).json({ error: e.message || "Error creating technician" }); }
  });

  app.delete("/api/team/:id", async (req, res) => {
    try { await supabase.auth.admin.deleteUser(req.params.id); res.sendStatus(204); } 
    catch (e) { res.status(500).json({ error: "Error deleting technician" }); }
  });

  // =========================================================
  // CHECKOUT Y WEBHOOKS
  // =========================================================
  app.post("/api/checkout", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "No token provided" });
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: "Unauthorized: Invalid token" });

      const { planId } = req.body;
      let title = "Suscripción Mensual - GSM FIX";
      const now = new Date();
      const promoDeadline = new Date("2026-03-18T23:59:59");
      const isPromoActive = now <= promoDeadline;

      let price = isPromoActive ? 25000 : 30000;
      if (planId === 'semi_annual') { title = "Suscripción Semestral - GSM FIX"; price = 160000; } 
      else if (planId === 'annual') { title = "Suscripción Anual - GSM FIX"; price = 300000; }
      else if (planId === 'extra_branch') { title = "Cupo para Sucursal Extra - GSM FIX"; price = 15000; } 

      let baseUrl = process.env.CLIENT_URL || process.env.BASE_URL || "http://localhost:5173";
      baseUrl = baseUrl.replace(/\/$/, "");
      const webhookUrl = process.env.WEBHOOK_URL;

      const preference = new Preference(mpClient);
      const result = await preference.create({
        body: {
          items: [{ id: planId, title: title, quantity: 1, unit_price: price, currency_id: 'ARS' }],
          external_reference: user.id, metadata: { plan_id: planId },
          back_urls: { success: `${baseUrl}/payment-success?planId=${planId}`, failure: `${baseUrl}/plan-expired`, pending: `${baseUrl}/plan-expired` },
          notification_url: webhookUrl ? `${webhookUrl}/api/webhooks/mercadopago` : undefined,
          auto_return: 'approved',
        }
      });
      res.json({ init_point: result.init_point });
    } catch (e: any) { res.status(500).json({ error: "Error creando pago" }); }
  });

  app.post("/api/webhooks/mercadopago", async (req, res) => {
    const { type, data, action } = req.body;
    res.status(200).send("OK");
    if (type === "payment" || action === "payment.created") {
      try {
        const id = data?.id || req.body.data?.id;
        const paymentClient = new Payment(mpClient);
        const payment = await paymentClient.get({ id: id });

        if (payment.status === 'approved') {
          const userId = payment.external_reference;
          const planId = payment.metadata?.plan_id || 'monthly';

          if (userId) {
            const user = await storage.getUser(userId);
            if (user) {
              if (planId === 'extra_branch') {
                const currentExtras = user.extraBranches || 0;
                await storage.updateUser(userId, { extraBranches: currentExtras + 1 });
              } else {
                let monthsToAdd = 1;
                let billingInterval: 'monthly' | 'semi_annual' | 'annual' = 'monthly';
                if (planId === 'annual') { monthsToAdd = 12; billingInterval = 'annual'; }
                else if (planId === 'semi_annual') { monthsToAdd = 6; billingInterval = 'semi_annual'; }

                const now = new Date();
                const currentExpiry = user.currentPeriodEnd ? new Date(user.currentPeriodEnd) : now;
                const baseDate = currentExpiry > now ? currentExpiry : now;
                baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
                await storage.updateUser(userId, { subscriptionStatus: "active", billingInterval: billingInterval, currentPeriodEnd: baseDate, isAutoRenew: true });
              }
            }
          }
        }
      } catch (error) { console.error("Error webhook:", error); }
    }
  });

  // --- RUTAS DE CLIENTES ---
  app.get("/api/clients", async (req, res) => { 
    try { 
      const u = await getUserId(req); 
      const branchId = getBranchId(req);
      let data = await storage.getClients(u); 
      if (branchId) data = data.filter(d => d.branchId === branchId); 
      res.json(data); 
    } catch (e) { res.status(500).json({ error: "Error" }); } 
  });
  
  app.get("/api/clients/:id", async (req, res) => { try { const c = await storage.getClient(req.params.id); if (!c) return res.status(404).json({ error: "Not found" }); res.json(c); } catch (e) { res.status(500).json({ error: "Error" }); } });

  app.post("/api/clients", async (req, res) => {
    try {
      const parseResult = insertClientSchema.safeParse(req.body);
      if (!parseResult.success) return res.status(400).json({ error: parseResult.error.errors });
      const u = await getUserId(req);
      const branchId = getBranchId(req);
      
      const newClient = await storage.createClient({ ...parseResult.data, userId: u } as any);
      if (branchId) {
        await supabase.from("clients").update({ branch_id: branchId }).eq("id", newClient.id);
        newClient.branchId = branchId;
      }
      res.status(201).json(newClient);
    } catch (e) { res.status(500).json({ error: "Internal Server Error" }); }
  });
  
  app.patch("/api/clients/:id", async (req, res) => { try { res.json(await storage.updateClient(req.params.id, req.body)); } catch (e) { res.status(500).json({ error: "Error" }); } });
  app.delete("/api/clients/:id", async (req, res) => { try { await storage.deleteClient(req.params.id, await getUserId(req)); res.sendStatus(204); } catch (e) { res.status(500).json({ error: "Error" }); } });

  // --- RUTAS DE DISPOSITIVOS ---
  app.get("/api/devices", async (req, res) => { 
    try { 
      const u = await getUserId(req); 
      const branchId = getBranchId(req);
      let data = await storage.getDevices(u); 
      if (branchId) data = data.filter(d => d.branchId === branchId); 
      res.json(data); 
    } catch (e) { res.status(500).json({ error: "Error" }); } 
  });
  
  app.get("/api/devices/:clientId", async (req, res) => { try { res.json(await storage.getDevicesByClient(req.params.clientId)); } catch (e) { res.status(500).json({ error: "Error" }); } });
  
  app.post("/api/devices", async (req, res) => { 
    try { 
      const p = insertDeviceSchema.safeParse(req.body); 
      if (!p.success) return res.status(400).json({ error: p.error.errors }); 
      const u = await getUserId(req); 
      const branchId = getBranchId(req);
      
      const newDevice = await storage.createDevice({ ...p.data, userId: u } as any); 
      if (branchId) {
        await supabase.from("devices").update({ branch_id: branchId }).eq("id", newDevice.id);
        newDevice.branchId = branchId;
      }
      res.status(201).json(newDevice);
    } catch (e) { res.status(500).json({ error: "Error" }); } 
  });

  app.patch("/api/devices/:id", async (req, res) => {
    try {
      const u = await getUserId(req);
      const updated = await storage.updateDevice(req.params.id, req.body, u);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (e) { res.status(500).json({ error: "Error updating device" }); }
  });
  
  // --- RUTAS DE ÓRDENES ---
  app.get("/api/orders", async (req, res) => { 
    try { 
      const u = await getUserId(req); 
      const branchId = getBranchId(req);
      let data = await storage.getOrdersWithDetails(u); 
      if (branchId) data = data.filter(d => d.branchId === branchId); 
      res.json(data); 
    } catch (e) { res.status(500).json({ error: "Error" }); } 
  });
  
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const u = await getUserId(req);
      const order = await storage.getOrderWithDetails(req.params.id);
      if (!order || (order.userId !== u && u !== "guest-user-no-access")) return res.status(404).json({ error: "Orden no encontrada" });
      res.json(order);
    } catch (e) { res.status(500).json({ error: "Error" }); }
  });

  app.post("/api/orders", async (req, res) => { 
    try { 
      const p = insertRepairOrderSchema.safeParse(req.body); 
      if (!p.success) return res.status(400).json({ error: p.error.errors }); 
      const u = await getUserId(req); 
      const branchId = getBranchId(req);
      
      // 1. Creamos la Orden de Reparación
      const newOrder = await storage.createOrder({ ...p.data, userId: u } as any); 
      if (branchId) {
        await supabase.from("repair_orders").update({ branch_id: branchId }).eq("id", newOrder.id);
        newOrder.branchId = branchId;
      }

      // 🔥 2. MAGIA DE LA SEÑA: Si mandan adelanto, generamos el pago automático 🔥
      const advanceAmount = Number(req.body.advancePayment || req.body.deposit || req.body.advance || req.body.seña || 0);
      
      if (advanceAmount > 0) {
        const newPayment = await storage.createPayment({ 
          amount: String(advanceAmount), 
          method: req.body.paymentMethod || "efectivo",
          notes: "Seña / Adelanto inicial", 
          orderId: newOrder.id,
          items: [{ name: "Seña inicial", price: advanceAmount, quantity: 1, type: "repair" }], 
          userId: u 
        } as any);

        if (branchId) {
          await supabase.from("payments").update({ branch_id: branchId }).eq("id", newPayment.id);
        }
      }

      // 🤖 3. MAGIA DEL BOT: Disparo automático al CREAR (Estado "recibido")
      let botQuery = supabase.from("bot_settings").select("*").eq("user_id", u);
      if (branchId) botQuery = botQuery.eq("branch_id", branchId);
      else botQuery = botQuery.is("branch_id", null);
      
      const { data: botSettings } = await botQuery.maybeSingle();

      if (botSettings && botSettings.is_enabled !== false && botSettings.template_recibido) {
        const fullClient = await storage.getClient(newOrder.clientId);
        const fullDevice = await storage.getDevice(newOrder.deviceId);

        if (fullClient?.phone) {
          const shortOrderId = newOrder.id.split('-')[0].toUpperCase();
          const clientName = fullClient.name || "Cliente";
          const deviceBrand = fullDevice?.brand || "Equipo";
          const deviceModel = fullDevice?.model || "";
          const cost = Number(newOrder.estimatedCost) || 0;

          const messageToSend = botSettings.template_recibido
            .replace(/{nombre}/g, clientName)
            .replace(/{marca}/g, deviceBrand)
            .replace(/{modelo}/g, deviceModel)
            .replace(/{orden}/g, shortOrderId)
            .replace(/{costo}/g, String(cost));

          await sendWhatsAppMessage(fullClient.phone, messageToSend);
        }
      }

      res.status(201).json(newOrder);
    } catch (e) { 
      res.status(500).json({ error: "Error interno al crear orden" }); 
    } 
  });

  app.patch("/api/orders/:id", async (req, res) => { 
    try { 
      // 1. Obtenemos la orden ANTES de cambiarla para saber si hubo un cambio de estado
      const oldOrder = await storage.getOrderWithDetails(req.params.id);
      if (!oldOrder) return res.status(404).json({ error: "Orden no encontrada" });

      // 2. Actualizamos la orden normalmente
      const updatedOrder = await storage.updateOrder(req.params.id, req.body);
      if (!updatedOrder) return res.status(500).json({ error: "No se pudo actualizar la orden" });
      
      // 3. 🤖 MAGIA DEL BOT: Si el estado cambió, disparamos la notificación
      if (req.body.status && req.body.status !== oldOrder.status) {
        const u = oldOrder.userId;
        const branchId = oldOrder.branchId;
        const newStatus = req.body.status;

        let botQuery = supabase.from("bot_settings").select("*").eq("user_id", u);
        if (branchId) botQuery = botQuery.eq("branch_id", branchId);
        else botQuery = botQuery.is("branch_id", null);
        
        const { data: botSettings } = await botQuery.maybeSingle();

        if (botSettings && botSettings.is_enabled !== false) {
          let template = "";
          if (newStatus === "recibido") template = botSettings.template_recibido;
          else if (newStatus === "presupuesto") template = botSettings.template_presupuesto;
          else if (newStatus === "en_curso") template = botSettings.template_en_curso;
          else if (newStatus === "listo") template = botSettings.template_listo;
          else if (newStatus === "entregado") template = botSettings.template_entregado;

          if (template && oldOrder.client?.phone) {
            const shortOrderId = oldOrder.id.split('-')[0].toUpperCase();
            const clientName = oldOrder.client.name || "Cliente";
            const deviceBrand = oldOrder.device?.brand || "Equipo";
            const deviceModel = oldOrder.device?.model || "";
            const cost = Number(updatedOrder.finalCost) > 0 ? updatedOrder.finalCost : updatedOrder.estimatedCost;

            const messageToSend = template
              .replace(/{nombre}/g, clientName)
              .replace(/{marca}/g, deviceBrand)
              .replace(/{modelo}/g, deviceModel)
              .replace(/{orden}/g, shortOrderId)
              .replace(/{costo}/g, String(cost));

            console.log("\n==========================================");
            console.log(`🚀 DISPARO DE WHATSAPP DETECTADO`);
            console.log(`📱 Destinatario: ${oldOrder.client.phone}`);
            console.log(`💬 Mensaje:\n${messageToSend}`);
            console.log("==========================================\n");

            await sendWhatsAppMessage(oldOrder.client.phone, messageToSend);
          }
        }
      }

      res.json(updatedOrder); 
    } catch (e) { 
      console.error(e);
      res.status(500).json({ error: "Error al actualizar orden" }); 
    } 
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const u = await getUserId(req);
      if (u === "guest-user-no-access") return res.status(401).json({ error: "Unauthorized" });
      const orderId = req.params.id;

      await supabase.from("payments").delete().eq("order_id", orderId);

      const { error } = await supabase
        .from("repair_orders")
        .delete()
        .eq("id", orderId)
        .eq("user_id", u); 

      if (error) {
        console.error("Error de Supabase al borrar:", error);
        return res.status(400).json({ error: error.message });
      }

      res.sendStatus(204);
    } catch (e) {
      console.error("Error crítico al eliminar orden:", e);
      res.status(500).json({ error: "Error interno al eliminar" });
    }
  });

  // --- RUTAS DE PAGOS ---
  app.get("/api/payments", async (req, res) => { 
    try { 
      const u = await getUserId(req); 
      const branchId = getBranchId(req);
      let data = await storage.getPaymentsWithOrders(u); 
      if (branchId) data = data.filter(d => d.branchId === branchId); 
      res.json(data); 
    } catch (e) { res.status(500).json({ error: "Error" }); } 
  });
  
  app.post("/api/payments", async (req, res) => {
    try {
      const p = insertPaymentSchema.safeParse(req.body);
      if (!p.success) return res.status(400).json({ error: p.error.errors });
      const u = await getUserId(req);
      const branchId = getBranchId(req);
      
      const newPayment = await storage.createPayment({ amount: p.data.amount, method: p.data.method, notes: p.data.notes, orderId: p.data.orderId || undefined, items: p.data.items || [], userId: u } as any);
      if (branchId) {
        await supabase.from("payments").update({ branch_id: branchId }).eq("id", newPayment.id);
        newPayment.branchId = branchId;
      }
      res.status(201).json(newPayment);
    } catch (e) { res.status(500).json({ error: "Error interno" }); }
  });

  app.delete("/api/payments/:id", async (req, res) => { try { await storage.deletePayment(req.params.id); res.sendStatus(204); } catch (e) { res.status(500).json({ error: "Error" }); } });

  // --- RUTAS DE GASTOS ---
  app.get("/api/expenses", async (req, res) => { 
    try { 
      const u = await getUserId(req); 
      const branchId = getBranchId(req);
      let data = await storage.getExpenses(u); 
      if (branchId) data = data.filter(d => d.branchId === branchId); 
      res.json(data); 
    } catch (e) { res.status(500).json({ error: "Error" }); } 
  });
  
  app.post("/api/expenses", async (req, res) => { 
    try { 
      const p = insertExpenseSchema.safeParse(req.body); 
      if (!p.success) return res.status(400).json({ error: p.error.errors }); 
      const u = await getUserId(req); 
      const branchId = getBranchId(req);
      
      const newExp = await storage.createExpense({ ...p.data, userId: u } as any); 
      if (branchId) {
        await supabase.from("expenses").update({ branch_id: branchId }).eq("id", newExp.id);
        newExp.branchId = branchId;
      }
      res.status(201).json(newExp);
    } catch (e) { res.status(500).json({ error: "Error" }); } 
  });

  app.delete("/api/expenses/:id", async (req, res) => { try { await storage.deleteExpense(req.params.id); res.sendStatus(204); } catch (e) { res.status(500).json({ error: "Error" }); } });

  // --- RUTAS DE CAJA ---
  app.get("/api/cash/today", async (req, res) => {
    try {
      const u = await getUserId(req);
      const branchId = getBranchId(req);
      const settings = await storage.getSettings(u);
      const dateStr = getShiftDate(settings);
      
      let query = supabase.from("daily_cash").select("*").eq("user_id", u).eq("date", dateStr);
      if (branchId) query = query.eq("branch_id", branchId);
      
      const { data } = await query.maybeSingle();
      res.json({ amount: data ? parseFloat(data.amount) : null });
    } catch (e) { res.status(500).json({ error: "Error" }); }
  });

  app.post("/api/cash", async (req, res) => {
    try {
      const u = await getUserId(req);
      const branchId = getBranchId(req);
      const parseResult = insertDailyCashSchema.pick({ amount: true }).safeParse(req.body);
      if (!parseResult.success) return res.status(400).json({ error: parseResult.error.errors });
      
      const settings = await storage.getSettings(u);
      const dateStr = getShiftDate(settings);
      
      let query = supabase.from("daily_cash").select("*").eq("user_id", u).eq("date", dateStr);
      if (branchId) query = query.eq("branch_id", branchId);
      const { data: existing } = await query.maybeSingle();

      let result;
      if (existing) {
        const { data } = await supabase.from("daily_cash").update({ amount: String(parseResult.data.amount) }).eq("id", existing.id).select().single();
        result = data;
      } else {
        const { data } = await supabase.from("daily_cash").insert({ user_id: u, branch_id: branchId, date: dateStr, amount: String(parseResult.data.amount) }).select().single();
        result = data;
      }
      res.json(result);
    } catch (e) { res.status(500).json({ error: "Error guardando caja" }); }
  });

  // --- ESTADISTICAS Y GRAFICOS ---
  app.get("/api/stats", async (req, res) => { 
    try { 
      const u = await getUserId(req); 
      const branchId = getBranchId(req);
      const settings = await storage.getSettings(u);
      const cutoffHour = settings?.dayCutoffHour || 0;

      const now = new Date();
      now.setUTCHours(now.getUTCHours() - 3);
      const currentHour = now.getUTCHours();

      let startOfBusinessDay = new Date(now);
      startOfBusinessDay.setUTCHours(cutoffHour + 3, 0, 0, 0);

      if (currentHour < cutoffHour) startOfBusinessDay.setDate(startOfBusinessDay.getDate() - 1);
      const filterDate = startOfBusinessDay.toISOString();

      let oQuery = supabase.from("repair_orders").select("status, final_cost").eq("user_id", u);
      if (branchId) oQuery = oQuery.eq("branch_id", branchId);
      const { data: orders } = await oQuery;

      const activeOrders = orders?.filter(o => ["recibido", "diagnostico", "en_curso", "esperando_aprobacion"].includes(o.status)).length || 0;
      const pendingDiagnosis = orders?.filter(o => o.status === "recibido").length || 0;
      const readyPickup = orders?.filter(o => o.status === "listo").length || 0;

      let pQuery = supabase.from("payments").select("amount").eq("user_id", u).gte("date", filterDate);
      if (branchId) pQuery = pQuery.eq("branch_id", branchId);
      const { data: payments } = await pQuery;
      const dailyIncome = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

      let eQuery = supabase.from("expenses").select("amount").eq("user_id", u).gte("date", filterDate);
      if (branchId) eQuery = eQuery.eq("branch_id", branchId);
      const { data: expenses } = await eQuery;
      const dailyExpenses = expenses?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;

      res.json({ activeOrders, pendingDiagnosis, readyPickup, dailyIncome, dailyExpenses, cashInBox: dailyIncome - dailyExpenses, netBalance: dailyIncome - dailyExpenses });
    } catch (e) { res.status(500).json({ error: "Error" }); } 
  });

  app.get("/api/settings", async (req, res) => { try { const u = await getUserId(req); res.json((await storage.getSettings(u)) || {}); } catch (e) { res.status(500).json({ error: "Error" }); } });
  app.post("/api/settings", async (req, res) => { 
    try { 
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "");
      if (token) {
        const { data: { user } } = await supabase.auth.getUser(token);
        const dbUser = await storage.getUser(user!.id);
        if (dbUser?.role === 'technician') return res.status(403).json({ error: "Los técnicos no pueden modificar la configuración." });
      }
      const u = await getUserId(req); 
      res.json(await storage.updateSettings(u, req.body)); 
    } catch (e) { res.status(500).json({ error: "Error" }); } 
  });

  app.get("/api/products", async (req, res) => { 
    try { 
      const u = await getUserId(req); 
      const branchId = getBranchId(req);
      let data = await storage.getProducts(u); 
      if (branchId) data = data.filter(d => d.branchId === branchId); 
      res.json(data); 
    } catch (e) { res.status(500).json({ error: "Error" }); } 
  });

  app.post("/api/products", async (req, res) => { 
    try { 
      const u = await getUserId(req); 
      const branchId = getBranchId(req);
      const newProd = await storage.createProduct({ ...req.body, userId: u } as any); 
      if (branchId) {
        await supabase.from("products").update({ branch_id: branchId }).eq("id", newProd.id);
        newProd.branchId = branchId;
      }
      res.status(201).json(newProd); 
    } catch (e) { res.status(500).json({ error: "Error" }); } 
  });
  
  app.patch("/api/products/:id", async (req, res) => { try { res.json(await storage.updateProduct(req.params.id, req.body)); } catch (e) { res.status(500).json({ error: "Error" }); } });
  app.delete("/api/products/:id", async (req, res) => { try { await storage.deleteProduct(req.params.id, await getUserId(req)); res.sendStatus(204); } catch (e) { res.status(500).json({ error: "Error" }); } });

  app.post("/api/upload", upload.single("file"), async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file" });
      const file = req.file;
      const fileName = `${Date.now()}-${file.originalname}`;
      const { data, error } = await supabase.storage.from('logos').upload(fileName, file.buffer, { contentType: file.mimetype });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(fileName);
      res.json({ url: publicUrlData.publicUrl });
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/support", async (req, res) => {
    try {
      const { message, imageUrls } = req.body;
      const u = await getUserId(req);
      let userInfo = "Usuario Invitado"; let userEmail = "No disponible";
      if (u !== "guest-user-no-access") {
        const userRecord = await storage.getUser(u);
        if (userRecord) { userInfo = `Usuario ID: ${u}`; userEmail = userRecord.email || "No disponible"; }
      }
      if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: "Falta RESEND_API_KEY en el servidor" });

      const { data, error } = await resend.emails.send({
        from: 'Soporte <onboarding@resend.dev>', to: process.env.GMAIL_USER || 'soporte@tu-dominio.com',
        subject: `Ticket Soporte: ${userEmail}`, html: `<h3>Nuevo Ticket</h3><p><strong>Usuario:</strong> ${userInfo}</p><p>${message}</p>`
      });
      if (error) return res.status(400).json({ error });
      res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/reports/monthly-detail", async (req, res) => {
    try {
      const u = await getUserId(req);
      const branchId = getBranchId(req);
      const { month, year } = req.query;
      const targetMonth = parseInt(month as string) - 1;
      const targetYear = parseInt(year as string);
      
      let allPayments = await storage.getPaymentsWithOrders(u);
      if (branchId) allPayments = allPayments.filter(p => p.branchId === branchId); 
      const monthlyPayments = allPayments.filter(p => { const d = new Date(p.date); return d.getMonth() === targetMonth && d.getFullYear() === targetYear; });
      
      let allExpenses = await storage.getExpenses(u);
      if (branchId) allExpenses = allExpenses.filter(e => e.branchId === branchId); 
      const monthlyExpenses = allExpenses.filter(e => { const d = new Date(e.date); return d.getMonth() === targetMonth && d.getFullYear() === targetYear; });
      
      const incomeByMethod: Record<string, number> = {};
      let totalIncome = 0;
      monthlyPayments.forEach(p => { const amount = Number(p.amount); incomeByMethod[p.method || "Otros"] = (incomeByMethod[p.method || "Otros"] || 0) + amount; totalIncome += amount; });
      const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      res.json({ totals: { income: totalIncome, expenses: totalExpenses, balance: totalIncome - totalExpenses }, incomeByMethod: Object.entries(incomeByMethod).map(([method, total]) => ({ method, total })) });
    } catch (e) { res.status(500).json({ error: "Error" }); }
  });

  // =========================================================
  // RUTAS DEL MOTOR DE WHATSAPP (BOT)
  // =========================================================
  app.get("/api/bot/settings", async (req, res) => {
    try {
      const u = await getUserId(req);
      if (u === "guest-user-no-access") return res.status(401).json({ error: "Unauthorized" });
      const branchId = getBranchId(req);

      let query = supabase.from("bot_settings").select("*").eq("user_id", u);
      if (branchId) query = query.eq("branch_id", branchId);

      const { data, error } = await query.maybeSingle();
      res.json(data || {});
    } catch (e) { res.status(500).json({ error: "Error obteniendo bot settings" }); }
  });

  app.post("/api/bot/settings", async (req, res) => {
    try {
      const u = await getUserId(req);
      if (u === "guest-user-no-access") return res.status(401).json({ error: "Unauthorized" });
      const branchId = getBranchId(req);

      const payload = {
        is_enabled: req.body.isEnabled,
        template_recibido: req.body.templateRecibido,
        template_presupuesto: req.body.templatePresupuesto,
        template_en_curso: req.body.templateEnCurso,
        template_listo: req.body.templateListo,
        template_entregado: req.body.templateEntregado,
        updated_at: new Date().toISOString()
      };

      let query = supabase.from("bot_settings").select("id").eq("user_id", u);
      if (branchId) query = query.eq("branch_id", branchId);
      else query = query.is("branch_id", null);

      const { data: existing } = await query.maybeSingle();

      let result;
      if (existing) {
        const { data } = await supabase.from("bot_settings").update(payload).eq("id", existing.id).select().single();
        result = data;
      } else {
        const { data } = await supabase.from("bot_settings").insert({ ...payload, user_id: u, branch_id: branchId }).select().single();
        result = data;
      }
      res.json(result);
    } catch (e) { res.status(500).json({ error: "Error guardando bot settings" }); }
  });

  // ---------------------------------------------------------
  // 🔌 RUTAS DE CONEXIÓN Y ESTADO DEL BOT
  // ---------------------------------------------------------
  app.get("/api/bot/status", (req, res) => {
    res.json({ status: getWaStatus(), qr: getWaQr() });
  });

  app.post("/api/bot/disconnect", async (req, res) => {
    await disconnectWhatsApp();
    res.json({ success: true });
  });
// ---------------------------------------------------------
  // 🔴 RUTAS DEL RADAR DE MENSAJES (GLOBITO)
  // ---------------------------------------------------------
  app.get("/api/bot/unread", async (req, res) => {
    try {
      const u = await getUserId(req);
      if (u === "guest-user-no-access") return res.json({ hasUnread: false });
      
      const { data } = await supabase.from("bot_settings").select("has_unread_messages").eq("user_id", u).maybeSingle();
      res.json({ hasUnread: !!data?.has_unread_messages });
    } catch (e) {
      res.json({ hasUnread: false });
    }
  });

  app.post("/api/bot/clear-unread", async (req, res) => {
    try {
      const u = await getUserId(req);
      if (u !== "guest-user-no-access") {
        await supabase.from("bot_settings").update({ has_unread_messages: false }).eq("user_id", u);
      }
      res.sendStatus(200);
    } catch (e) {
      res.sendStatus(500);
    }
  });
  return server;
}