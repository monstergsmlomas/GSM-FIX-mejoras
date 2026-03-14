import {
  type User, type InsertUser,
  type Branch, type InsertBranch, 
  type Client, type InsertClient,
  type Device, type InsertDevice,
  type RepairOrder, type InsertRepairOrder, type RepairOrderWithDetails,
  type Product, type InsertProduct,
  type Payment, type InsertPayment, type PaymentItem,
  type Expense, type InsertExpense,
  type Settings, type InsertSettings,
  type DailyCash, type InsertDailyCash
} from "@shared/schema";
import { supabase } from "./supabase";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;

  getTeamMembers(ownerId: string): Promise<User[]>;

  // 👇 NUEVOS MÉTODOS PARA SUCURSALES 👇
  getBranches(userId: string): Promise<Branch[]>;
  getBranch(id: string): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch & { userId: string }): Promise<Branch>;
  updateBranch(id: string, data: Partial<InsertBranch>, userId: string): Promise<Branch | undefined>;
  deleteBranch(id: string, userId: string): Promise<void>;

  getClients(userId: string): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient & { userId: string }): Promise<Client>;
  updateClient(id: string, data: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string, userId: string): Promise<void>;

  getDevices(userId: string): Promise<Device[]>;
  getDevicesByClient(clientId: string): Promise<Device[]>;
  createDevice(device: InsertDevice & { userId: string }): Promise<Device>;
  updateDevice(id: string, data: Partial<InsertDevice>, userId: string): Promise<Device | undefined>;

  getOrdersWithDetails(userId: string): Promise<RepairOrderWithDetails[]>;
  getOrderWithDetails(id: string): Promise<RepairOrderWithDetails | undefined>;
  getOrder(id: string): Promise<RepairOrder | undefined>;
  
  createOrder(order: InsertRepairOrder & { userId: string }): Promise<RepairOrder>;
  updateOrder(id: string, data: Partial<InsertRepairOrder>): Promise<RepairOrder | undefined>;
  deleteOrder(id: string, userId: string): Promise<void>;

  getPaymentsWithOrders(userId: string): Promise<(Payment & { order?: RepairOrder })[]>;
  createPayment(payment: InsertPayment & { userId: string, items: PaymentItem[] }): Promise<Payment>;
  deletePayment(id: string): Promise<void>;

  getProducts(userId: string): Promise<Product[]>;
  createProduct(product: InsertProduct & { userId: string }): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string, userId: string): Promise<void>;

  getExpenses(userId: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense & { userId: string }): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;

  getDailyCash(userId: string, date: string): Promise<DailyCash | undefined>;
  upsertDailyCash(userId: string, cash: InsertDailyCash): Promise<DailyCash>;

  getStats(userId: string): Promise<any>;

  getSettings(userId: string): Promise<Settings | undefined>;
  updateSettings(userId: string, settings: InsertSettings): Promise<Settings>;
}

export class SupabaseStorage implements IStorage {

  // --- MAPPERS ---
  private mapUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name || "", 
      role: row.role || "admin",
      ownerId: row.owner_id || null,
      branchId: row.branch_id || null,
      extraBranches: row.extra_branches || 0, // 👈 AGREGAR ESTA LÍNEA
      trialEndsAt: row.trial_ends_at ? new Date(row.trial_ends_at) : null,
      subscriptionStatus: row.subscription_status,
      currentPeriodEnd: row.current_period_end ? new Date(row.current_period_end) : null,
      billingInterval: row.billing_interval,
      isAutoRenew: row.is_auto_renew
    };
  }

  private mapBranch(row: any): Branch {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      address: row.address,
      phone: row.phone,
      isDefault: row.is_default,
      createdAt: row.created_at ? new Date(row.created_at) : null
    };
  }

  private mapClient(row: any): Client {
    return {
      id: row.id,
      userId: row.user_id,
      branchId: row.branch_id || null,
      name: row.name,
      dni: row.dni,
      address: row.address,
      phone: row.phone,
      email: row.email,
      whoPicksUp: row.who_picks_up,
      notes: row.notes
    };
  }

  private mapDevice(row: any): Device {
    return {
      id: row.id,
      userId: row.user_id,
      branchId: row.branch_id || null,
      clientId: row.client_id,
      brand: row.brand,
      model: row.model,
      imei: row.imei,
      serialNumber: row.serial_number,
      color: row.color,
      condition: row.condition,
      lockType: row.lock_type,
      lockValue: row.lock_value
    };
  }

  private mapOrder(row: any): RepairOrder {
    return {
      id: row.id,
      userId: row.user_id,
      branchId: row.branch_id || null,
      clientId: row.client_id,
      deviceId: row.device_id,
      status: row.status,
      problem: row.problem,
      diagnosis: row.diagnosis,
      solution: row.solution,
      technicianName: row.technician_name,
      estimatedCost: parseFloat(row.estimated_cost || "0"),
      finalCost: parseFloat(row.final_cost || "0"),
      estimatedDate: row.estimated_date ? new Date(row.estimated_date) : null,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      deliveredAt: row.delivered_at ? new Date(row.delivered_at) : null,
      priority: row.priority,
      notes: row.notes,
      intakeChecklist: row.intake_checklist
    };
  }

  private mapPayment(row: any): Payment {
    return {
      id: row.id,
      userId: row.user_id,
      branchId: row.branch_id || null,
      orderId: row.order_id,
      amount: parseFloat(row.amount || "0"),
      method: row.method,
      date: new Date(row.date),
      notes: row.notes,
      items: row.cart_items
    };
  }

  private mapSettings(row: any): Settings {
    return {
      id: row.id,
      userId: row.user_id,
      branchId: row.branch_id || null,
      shopName: row.shop_name,
      address: row.address,
      phone: row.phone,
      email: row.email,
      whatsapp: row.whatsapp,
      landline: row.landline,
      logoUrl: row.logo_url,
      cardSurcharge: parseFloat(row.card_surcharge || "0"),
      transferSurcharge: parseFloat(row.transfer_surcharge || "0"),
      receiptDisclaimer: row.receipt_disclaimer,
      ticketFooter: row.ticket_footer,
      checklistOptions: row.checklist_options || [],
      printFormat: row.print_format || "a4",
      dayCutoffHour: row.day_cutoff_hour || 0,
      updatedAt: row.updated_at ? new Date(row.updated_at) : null
    };
  }

  private mapDailyCash(row: any): DailyCash {
    return {
      id: row.id,
      userId: row.user_id,
      branchId: row.branch_id || null,
      date: row.date,
      amount: parseFloat(row.amount || "0"),
      createdAt: row.created_at ? new Date(row.created_at) : null
    };
  }

  private async enrichOrder(order: RepairOrder): Promise<RepairOrderWithDetails> {
    const client = await this.getClient(order.clientId);
    const device = await this.getDevice(order.deviceId);

    const { data: paymentsData } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", order.id);

    const payments = paymentsData ? paymentsData.map((row) => this.mapPayment(row)) : [];

    return {
      ...order,
      client: client!,
      device: device!,
      payments
    };
  }

  // --- IMPLEMENTACIÓN DE MÉTODOS ---

  async getUser(id: string): Promise<User | undefined> {
    const { data } = await supabase.from("users").select("*").eq("id", id).single();
    return data ? this.mapUser(data) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data } = await supabase.from("users").select("*").eq("email", username).single();
    return data ? this.mapUser(data) : undefined;
  }

  async getTeamMembers(ownerId: string): Promise<User[]> {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("role", "technician");
      
    return (data || []).map(row => this.mapUser(row));
  }

  async createUser(user: InsertUser): Promise<User> {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name || "",
      role: user.role || "admin",
      owner_id: user.ownerId || null,
      branch_id: user.branchId || null,
      trial_ends_at: user.trialEndsAt,
      subscription_status: user.subscriptionStatus,
      is_auto_renew: user.isAutoRenew
    };
    const { data, error } = await supabase.from("users").insert(payload).select().single();
    if (error) throw error;
    return this.mapUser(data);
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | undefined> {
    const payload: any = {};
    if (user.name !== undefined) payload.name = user.name;
    if (user.role) payload.role = user.role;
    if (user.ownerId !== undefined) payload.owner_id = user.ownerId;
    if (user.branchId !== undefined) payload.branch_id = user.branchId;
    if (user.extraBranches !== undefined) payload.extra_branches = user.extraBranches; // 👈 AGREGAR ESTA LÍNEA
    if (user.subscriptionStatus) payload.subscription_status = user.subscriptionStatus;
    if (user.billingInterval) payload.billing_interval = user.billingInterval;
    if (user.currentPeriodEnd) payload.current_period_end = user.currentPeriodEnd;
    if (user.isAutoRenew !== undefined) payload.is_auto_renew = user.isAutoRenew;
    if (user.trialEndsAt) payload.trial_ends_at = user.trialEndsAt;

    const { data, error } = await supabase.from("users").update(payload).eq("id", id).select().single();
    if (error) return undefined;
    return this.mapUser(data);
  }

  // 👇 MÉTODOS PARA MANEJAR SUCURSALES EN LA DB 👇
  async getBranches(userId: string): Promise<Branch[]> {
    const { data } = await supabase.from("branches").select("*").eq("user_id", userId).order("created_at");
    return (data || []).map((row) => this.mapBranch(row));
  }

  async getBranch(id: string): Promise<Branch | undefined> {
    const { data } = await supabase.from("branches").select("*").eq("id", id).single();
    return data ? this.mapBranch(data) : undefined;
  }

  async createBranch(branch: InsertBranch & { userId: string }): Promise<Branch> {
    const payload = {
      user_id: branch.userId,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      is_default: branch.isDefault
    };
    const { data, error } = await supabase.from("branches").insert(payload).select().single();
    if (error) throw error;
    return this.mapBranch(data);
  }

  async updateBranch(id: string, data: Partial<InsertBranch>, userId: string): Promise<Branch | undefined> {
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.address !== undefined) payload.address = data.address;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.isDefault !== undefined) payload.is_default = data.isDefault;

    const { data: res, error } = await supabase.from("branches").update(payload).eq("id", id).eq("user_id", userId).select().single();
    if (error) return undefined;
    return this.mapBranch(res);
  }

  async deleteBranch(id: string, userId: string): Promise<void> {
    const { error } = await supabase.from("branches").delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;
  }
  // 👆 ------------------------------------------------ 👇

  async getClients(userId: string): Promise<Client[]> {
    const { data } = await supabase.from("clients").select("*").eq("user_id", userId).order("name");
    return (data || []).map((row) => this.mapClient(row));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const { data } = await supabase.from("clients").select("*").eq("id", id).single();
    return data ? this.mapClient(data) : undefined;
  }

  async createClient(client: InsertClient & { userId: string }): Promise<Client> {
    const payload = {
      user_id: client.userId,
      name: client.name,
      dni: client.dni,
      address: client.address,
      phone: client.phone,
      email: client.email,
      who_picks_up: client.whoPicksUp,
      notes: client.notes
    };
    const { data, error } = await supabase.from("clients").insert(payload).select().single();
    if (error) throw error;
    return this.mapClient(data);
  }

  async updateClient(id: string, data: Partial<InsertClient>): Promise<Client | undefined> {
    const input = data as any;
    const payload: any = {};

    if (input.name !== undefined) payload.name = input.name;
    if (input.dni !== undefined) payload.dni = input.dni;
    if (input.address !== undefined) payload.address = input.address;
    if (input.phone !== undefined) payload.phone = input.phone;
    if (input.email !== undefined) payload.email = input.email;
    if (input.whoPicksUp !== undefined) payload.who_picks_up = input.whoPicksUp;
    if (input.notes !== undefined) payload.notes = input.notes;

    const { data: res, error } = await supabase.from("clients").update(payload).eq("id", id).select().single();
    if (error) return undefined;
    return this.mapClient(res);
  }

  async deleteClient(id: string, userId: string): Promise<void> {
    const { error } = await supabase.from("clients").delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;
  }

  async getDevices(userId: string): Promise<Device[]> {
    const { data } = await supabase.from("devices").select("*").eq("user_id", userId);
    return (data || []).map((row) => this.mapDevice(row));
  }

  async getDevicesByClient(clientId: string): Promise<Device[]> {
    const { data } = await supabase.from("devices").select("*").eq("client_id", clientId);
    return (data || []).map((row) => this.mapDevice(row));
  }

  async getDevice(id: string): Promise<Device | undefined> {
    const { data } = await supabase.from("devices").select("*").eq("id", id).single();
    return data ? this.mapDevice(data) : undefined;
  }

  async createDevice(device: InsertDevice & { userId: string }): Promise<Device> {
    const payload = {
      user_id: device.userId,
      client_id: device.clientId,
      brand: device.brand,
      model: device.model,
      imei: device.imei,
      serial_number: device.serialNumber,
      color: device.color,
      condition: device.condition,
      lock_type: device.lockType,
      lock_value: device.lockValue
    };
    const { data, error } = await supabase.from("devices").insert(payload).select().single();
    if (error) throw error;
    return this.mapDevice(data);
  }

  async updateDevice(id: string, data: Partial<InsertDevice>, userId: string): Promise<Device | undefined> {
    const input = data as any;
    const payload: any = {};

    if (input.brand !== undefined) payload.brand = input.brand;
    if (input.model !== undefined) payload.model = input.model;
    if (input.imei !== undefined) payload.imei = input.imei;
    if (input.serialNumber !== undefined) payload.serial_number = input.serialNumber;
    if (input.color !== undefined) payload.color = input.color;
    if (input.condition !== undefined) payload.condition = input.condition;
    if (input.lockType !== undefined) payload.lockType = input.lockType;
    if (input.lockValue !== undefined) payload.lockValue = input.lockValue;

    const { data: res, error } = await supabase
      .from("devices")
      .update(payload)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) return undefined;
    return res ? this.mapDevice(res) : undefined;
  }

  async getOrdersWithDetails(userId: string): Promise<RepairOrderWithDetails[]> {
    const { data } = await supabase
      .from("repair_orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!data) return [];
    return Promise.all(data.map(row => this.enrichOrder(this.mapOrder(row))));
  }

  async getOrderWithDetails(id: string): Promise<RepairOrderWithDetails | undefined> {
    const { data } = await supabase
      .from("repair_orders")
      .select("*")
      .eq("id", id)
      .single();

    if (!data) return undefined;
    return this.enrichOrder(this.mapOrder(data));
  }

  async getOrder(id: string): Promise<RepairOrder | undefined> {
    const { data } = await supabase
      .from("repair_orders")
      .select("*")
      .eq("id", id)
      .single();
    
    return data ? this.mapOrder(data) : undefined;
  }

  async createOrder(order: InsertRepairOrder & { userId: string }): Promise<RepairOrder> {
    const payload = {
      user_id: order.userId,
      client_id: order.clientId,
      device_id: order.deviceId,
      problem: order.problem,
      priority: order.priority,
      status: order.status,
      diagnosis: order.diagnosis,
      solution: order.solution,
      technician_name: order.technicianName,
      estimated_cost: String(order.estimatedCost || 0),
      final_cost: String(order.finalCost || 0),
      estimated_date: order.estimatedDate,
      intake_checklist: order.intakeChecklist || {},
      notes: order.notes
    };
    const { data, error } = await supabase.from("repair_orders").insert(payload).select().single();
    if (error) throw error;
    return this.mapOrder(data);
  }

  async updateOrder(id: string, order: Partial<InsertRepairOrder>): Promise<RepairOrder | undefined> {
    const payload: any = {};
    if (order.status) payload.status = order.status;
    if (order.diagnosis) payload.diagnosis = order.diagnosis;
    if (order.solution) payload.solution = order.solution;
    if (order.technicianName) payload.technician_name = order.technicianName;
    if (order.problem) payload.problem = order.problem;
    if (order.finalCost !== undefined) payload.final_cost = String(order.finalCost);
    if (order.estimatedCost !== undefined) payload.estimated_cost = String(order.estimatedCost);
    if (order.completedAt) payload.completed_at = order.completedAt;
    if (order.deliveredAt) payload.delivered_at = order.deliveredAt;
    if (order.notes) payload.notes = order.notes;
    if (order.intakeChecklist) payload.intake_checklist = order.intakeChecklist;

    const { data, error } = await supabase.from("repair_orders").update(payload).eq("id", id).select().single();
    if (error) return undefined;
    return this.mapOrder(data);
  }

  async deleteOrder(id: string, userId: string): Promise<void> {
    await supabase.from("payments").delete().eq("order_id", id);
    const { error } = await supabase.from("repair_orders").delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;
  }

  async getPaymentsWithOrders(userId: string): Promise<(Payment & { order?: RepairOrder })[]> {
    const { data } = await supabase
      .from("payments")
      .select(`*, order:repair_orders(*)`)
      .eq("user_id", userId)
      .order("date", { ascending: false });

    return (data || []).map(p => ({
      id: p.id,
      userId: p.user_id,
      branchId: p.branch_id || null, // 👈
      orderId: p.order_id,
      amount: parseFloat(p.amount),
      method: p.method,
      date: new Date(p.date),
      notes: p.notes,
      items: p.cart_items,
      order: p.order ? this.mapOrder(p.order) : undefined
    }));
  }

  async createPayment(payment: InsertPayment & { userId: string, items: PaymentItem[] }): Promise<Payment> {
    if (payment.items && payment.items.length > 0) {
      for (const item of payment.items) {
        if (item.type === 'product' && item.id) {
          const { data: prod } = await supabase.from("products").select("quantity").eq("id", item.id).single();
          if (prod) {
            const newQty = prod.quantity - item.quantity;
            await supabase.from("products").update({ quantity: newQty }).eq("id", item.id);
          }
        }
      }
    }

    let targetOrderId = payment.orderId || null;
    if (!targetOrderId && payment.items && payment.items.length > 0) {
      const repairItem = payment.items.find((item: any) => item.type === 'repair' && item.id) as any;
      if (repairItem) {
        targetOrderId = repairItem.id!;
      }
    }

    const payload = {
      user_id: payment.userId,
      order_id: targetOrderId,
      amount: payment.amount.toString(),
      method: payment.method,
      notes: payment.notes,
      cart_items: payment.items,
      date: new Date()
    };

    const { data, error } = await supabase.from("payments").insert(payload).select().single();
    if (error) throw error;
    
    // 👇 Solución al error rojo de TypeScript 👇
    return {
      id: data.id,
      userId: data.user_id,
      branchId: data.branch_id || null, // 👈
      orderId: data.order_id,
      amount: parseFloat(data.amount || "0"),
      method: data.method,
      date: new Date(data.date),
      notes: data.notes,
      items: data.cart_items
    };
  }

  async deletePayment(id: string): Promise<void> {
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) throw error;
  }

  async getExpenses(userId: string): Promise<Expense[]> {
    const { data } = await supabase.from("expenses").select("*").eq("user_id", userId).order("date", { ascending: false });
    return (data || []).map(e => ({
      id: e.id,
      userId: e.user_id,
      branchId: e.branch_id || null, // 👈 Solución al error rojo
      category: e.category,
      description: e.description,
      amount: parseFloat(e.amount),
      date: new Date(e.date)
    }));
  }

  async createExpense(expense: InsertExpense & { userId: string }): Promise<Expense> {
    const payload = {
      user_id: expense.userId,
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date
    };
    const { data, error } = await supabase.from("expenses").insert(payload).select().single();
    if (error) throw error;
    
    // 👇 Solución al error rojo de TypeScript 👇
    return {
      id: data.id,
      userId: data.user_id,
      branchId: data.branch_id || null, // 👈
      category: data.category,
      description: data.description,
      amount: parseFloat(data.amount),
      date: new Date(data.date)
    };
  }

  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw error;
  }

  async getDailyCash(userId: string, date: string): Promise<DailyCash | undefined> {
    const { data, error } = await supabase
      .from("daily_cash")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    if (error) console.error("Error getting daily cash:", error);
    return data ? this.mapDailyCash(data) : undefined;
  }

  async upsertDailyCash(userId: string, cash: InsertDailyCash): Promise<DailyCash> {
    const existing = await this.getDailyCash(userId, cash.date);

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from("daily_cash")
        .update({ amount: String(cash.amount) })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from("daily_cash")
        .insert({
          user_id: userId,
          date: cash.date,
          amount: String(cash.amount)
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return this.mapDailyCash(result);
  }

  async getStats(userId: string): Promise<any> {
    const settings = await this.getSettings(userId);
    const cutoffHour = settings?.dayCutoffHour || 0;

    const now = new Date();
    const currentHour = now.getHours();

    let startOfBusinessDay = new Date(now);
    startOfBusinessDay.setHours(cutoffHour, 0, 0, 0);

    if (currentHour < cutoffHour) {
      startOfBusinessDay.setDate(startOfBusinessDay.getDate() - 1);
    }

    const filterDate = startOfBusinessDay.toISOString();

    const { data: orders } = await supabase.from("repair_orders").select("status, final_cost").eq("user_id", userId);
    const activeOrders = orders?.filter(o => ["recibido", "diagnostico", "en_curso"].includes(o.status)).length || 0;
    const pendingDiagnosis = orders?.filter(o => o.status === "recibido").length || 0;
    const readyPickup = orders?.filter(o => o.status === "listo").length || 0;

    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("user_id", userId)
      .gte("date", filterDate);

    const dailyIncome = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    const { data: expenses } = await supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", userId)
      .gte("date", filterDate);

    const dailyExpenses = expenses?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;

    return {
      activeOrders,
      pendingDiagnosis,
      readyPickup,
      dailyIncome,
      dailyExpenses,
      cashInBox: dailyIncome - dailyExpenses,
      netBalance: dailyIncome - dailyExpenses
    };
  }

  async getProducts(userId: string): Promise<Product[]> {
    const { data } = await supabase.from("products").select("*").eq("user_id", userId).order("name");
    return (data || []).map(p => ({
      id: p.id,
      userId: p.user_id,
      branchId: p.branch_id || null, // 👈 Solución al error rojo
      name: p.name,
      description: p.description,
      sku: p.sku,
      quantity: p.quantity,
      price: parseFloat(p.price),
      cost: parseFloat(p.cost),
      category: p.category,
      lowStockThreshold: p.low_stock_threshold,
      supplier: p.supplier,
    }));
  }

  async createProduct(product: InsertProduct & { userId: string }): Promise<Product> {
    const payload = {
      user_id: product.userId,
      name: product.name,
      description: product.description,
      sku: product.sku,
      quantity: product.quantity,
      price: product.price.toString(),
      cost: product.cost.toString(),
      category: product.category,
      low_stock_threshold: product.lowStockThreshold,
      supplier: product.supplier,
    };

    const { data, error } = await supabase.from("products").insert(payload).select().single();
    if (error) throw error;
    
    // 👇 Solución al error rojo de TypeScript 👇
    return {
      id: data.id,
      userId: data.user_id,
      branchId: data.branch_id || null, // 👈
      name: data.name,
      description: data.description,
      sku: data.sku,
      quantity: data.quantity,
      price: parseFloat(data.price),
      cost: parseFloat(data.cost),
      category: data.category,
      lowStockThreshold: data.low_stock_threshold,
      supplier: data.supplier,
    };
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const payload: any = {};
    if (product.name) payload.name = product.name;
    if (product.description) payload.description = product.description;
    if (product.sku) payload.sku = product.sku;
    if (product.quantity !== undefined) payload.quantity = product.quantity;
    if (product.price !== undefined) payload.price = product.price.toString();
    if (product.cost !== undefined) payload.cost = product.cost.toString();
    if (product.category !== undefined) payload.category = product.category;
    if (product.lowStockThreshold !== undefined) payload.low_stock_threshold = product.lowStockThreshold;
    if (product.supplier !== undefined) payload.supplier = product.supplier;

    const { data, error } = await supabase.from("products").update(payload).eq("id", id).select().single();
    if (error) return undefined;
    
    // 👇 Solución al error rojo de TypeScript 👇
    return {
      id: data.id,
      userId: data.user_id,
      branchId: data.branch_id || null, // 👈
      name: data.name,
      description: data.description,
      sku: data.sku,
      quantity: data.quantity,
      price: parseFloat(data.price),
      cost: parseFloat(data.cost),
      category: data.category,
      lowStockThreshold: data.low_stock_threshold,
      supplier: data.supplier,
    };
  }

  async deleteProduct(id: string, userId: string): Promise<void> {
    await supabase.from("products").delete().eq("id", id).eq("user_id", userId);
  }

  async getSettings(userId: string): Promise<Settings | undefined> {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) return undefined;
    return this.mapSettings(data);
  }

  async updateSettings(userId: string, settings: InsertSettings): Promise<Settings> {
    const existing = await this.getSettings(userId);

    const payload = {
      user_id: userId,
      shop_name: settings.shopName,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      whatsapp: settings.whatsapp,
      landline: settings.landline,
      logo_url: settings.logoUrl,
      card_surcharge: settings.cardSurcharge.toString(),
      transfer_surcharge: settings.transferSurcharge.toString(),
      receipt_disclaimer: settings.receiptDisclaimer,
      ticket_footer: settings.ticketFooter,
      checklist_options: settings.checklistOptions,
      print_format: settings.printFormat,
      day_cutoff_hour: settings.dayCutoffHour,
      updated_at: new Date()
    };

    let result;
    if (existing) {
      const { data } = await supabase
        .from("settings")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single();
      result = data;
    } else {
      const { data } = await supabase
        .from("settings")
        .insert(payload)
        .select()
        .single();
      result = data;
    }

    if (!result) throw new Error("Failed to update settings");
    return this.mapSettings(result);
  }
}

export const storage = new SupabaseStorage();