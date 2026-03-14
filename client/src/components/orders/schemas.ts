import { z } from "zod";
import { intakeChecklistSchema } from "@shared/schema";

export const orderFormSchema = z.object({
    clientId: z.string().min(1, "Selecciona un cliente"),
    deviceId: z.string().min(1, "Selecciona o crea un dispositivo"),
    problem: z.string().min(1, "Describe el problema"),
    
    // 👇 ACÁ ESTÁ LA SOLUCIÓN: Acepta números, textos vacíos y asume 0 por defecto
    estimatedCost: z.coerce.number().optional().default(0),
    
    estimatedDate: z.string(),
    priority: z.enum(["normal", "urgente"]),
    technicianName: z.string().optional(), // Lo hacemos opcional por las dudas
    notes: z.string().optional(),          // Lo hacemos opcional por las dudas
    intakeChecklist: intakeChecklistSchema,
});

export const newDeviceSchema = z.object({
    brand: z.string().min(1, "La marca es requerida"),
    model: z.string().min(1, "El modelo es requerido"),
    imei: z.string().optional(),
    serialNumber: z.string().optional(),
    color: z.string().optional(),
    condition: z.string().optional(),
    lockType: z.enum(["PIN", "PATRON", "PASSWORD"]).or(z.literal("")).optional(),
    lockValue: z.string().optional(),
});

export type OrderFormValues = z.input<typeof orderFormSchema>;
export type NewDeviceValues = z.input<typeof newDeviceSchema>;