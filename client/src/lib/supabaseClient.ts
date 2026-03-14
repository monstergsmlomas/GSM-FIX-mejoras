import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Revisá tu .env y reiniciá npm run dev."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
