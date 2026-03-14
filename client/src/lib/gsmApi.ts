import { supabase } from "./supabaseClient";

export type NewClient = {
    name: string;
    phone?: string | null;
    email?: string | null;
};

export type NewDevice = {
    brand: string;
    model: string;
    imei?: string | null;
};

export async function createClient(input: NewClient) {
    const { data, error } = await supabase
        .from("clients")
        .insert(input)
        .select()
        .single();

    if (error) throw error;
    return data; // incluye id
}

export async function createDevice(clientId: string, device: NewDevice) {
    const { data, error } = await supabase
        .from("devices")
        .insert({ ...device, client_id: clientId })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function createRepairOrder(params: {
    clientId: string;
    deviceId: string;
    problem: string;
    status?: string;
    price_estimate?: number | null;
}) {
    const { data, error } = await supabase
        .from("repair_orders")
        .insert({
            client_id: params.clientId,
            device_id: params.deviceId,
            problem: params.problem,
            status: params.status ?? "received",
            price_estimate: params.price_estimate ?? null,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function listRepairOrders(limit = 10) {
    // OJO: este select asume que existen FKs hacia clients/devices como creamos en SQL
    const { data, error } = await supabase
        .from("repair_orders")
        .select(
            `
      id, created_at, status, problem, price_estimate, final_price,
      clients ( id, name, phone, email ),
      devices ( id, brand, model, imei )
    `
        )
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}

// CLIENTS
export async function listClients(limit = 50) {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, phone, email, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getClientById(id: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, phone, email, created_at")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

// ORDERS
export async function getRepairOrderById(id: string) {
  const { data, error } = await supabase
    .from("repair_orders")
    .select(
      `
      id, created_at, status, problem, diagnosis, price_estimate, final_price,
      clients ( id, name, phone, email ),
      devices ( id, brand, model, imei )
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}