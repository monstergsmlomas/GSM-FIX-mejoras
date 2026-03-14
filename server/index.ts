import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// 1. CARGA DE VARIABLES DE ENTORNO
// Buscamos el archivo .env explícitamente en la raíz para evitar errores de ruta
const envPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // Si no existe (ej: en producción Railway sin archivo físico), usamos las variables del sistema
  dotenv.config();
}

// 2. IMPORTS DEL SISTEMA
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import cors from "cors";

const app = express();

// Configuración para permitir archivos pesados (imágenes base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Configuración de Seguridad CORS
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origen (como apps móviles o Postman)
    if (!origin) return callback(null, true);

    // Permitir Localhost y Vercel (Desarrollo y Previews)
    if (origin.startsWith("http://localhost") || origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    // Permitir Dominios de Producción
    const allowedDomains = ['https://gsm-proyect.com', 'https://www.gsm-proyect.com'];
    if (allowedDomains.includes(origin)) return callback(null, true);

    // Bloquear el resto
    console.log(`🚫 Bloqueado por CORS: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Logging básico de peticiones API (para ver qué pasa en la consola)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

const httpServer = createServer(app);

// 3. ARRANQUE DEL SERVIDOR (ASÍNCRONO)
// Usamos importación dinámica para asegurar que las variables de entorno
// estén cargadas ANTES de importar las rutas (esto evita el error de Supabase).
(async () => {
  try {
    const { registerRoutes } = await import("./routes");
    const { serveStatic } = await import("./static");

    await registerRoutes(httpServer, app);

    // Manejo global de errores
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Error del servidor:", err); // Solo logueamos errores reales
      res.status(status).json({ message });
    });

    // Configuración de Vite (Dev) vs Static (Prod)
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    // Iniciar escucha
    const port = parseInt(process.env.PORT || "5001", 10);
    httpServer.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Servidor corriendo en el puerto ${port}`);
    });

  } catch (error) {
    console.error("❌ Error fatal al iniciar el servidor:", error);
    process.exit(1);
  }
})();