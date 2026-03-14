import { Request, Response, NextFunction } from "express";
import { createClient, User } from "@supabase/supabase-js";

// 1. Extendemos la definición de Request de Express para que acepte "user"
// Esto evita el error de TypeScript y el uso de "as any"
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Ensure env vars are present
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables in backend.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No authorization header provided" });
  }

  // Usamos split para ser más robustos (por si viene sin espacio o con formato raro)
  const token = authHeader.split(" ")[1]; 

  if (!token) {
      return res.status(401).json({ message: "Malformed authorization header" });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  // 2. ¡IMPORTANTE! Adjuntamos el usuario a la request.
  // Ahora, en tus rutas (routes.ts), podrás hacer: req.user.id
  req.user = user;

  next();
};