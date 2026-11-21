import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "El email no tiene un formato válido" }).trim().toLowerCase(),
  password: z.string().min(1, { error: "La contraseña es obligatoria" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// Better Auth exige minimo 8 caracteres de contraseña por defecto.
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { error: "El nombre debe tener al menos 2 caracteres" })
      .max(80, { error: "Máximo 80 caracteres" }),
    email: z.email({ error: "El email no tiene un formato válido" }).trim().toLowerCase(),
    password: z
      .string()
      .min(8, { error: "La contraseña debe tener al menos 8 caracteres" })
      .max(128, { error: "Máximo 128 caracteres" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
