import { supabase } from "./supabase";

export async function checkSupabaseReady(): Promise<boolean> {
  if (!supabase) return false;

  // Lightweight check: try selecting 1 row from a required table
  const { error } = await supabase.from("clients").select("id").limit(1);
  return !error;
}