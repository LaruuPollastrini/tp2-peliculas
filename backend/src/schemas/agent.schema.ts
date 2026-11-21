import { z } from "zod";

// El limite de largo no es estetico: cada caracter son tokens que pagamos y que gastan el rate limit.
// history: los ultimos mensajes de la conversacion (memoria corta). Lo manda el front; como mucho 10,
// para no gastar el limite de tokens por minuto del plan gratuito de Groq.
export const chatSchema = z.object({
  message: z.string().trim().min(1, "El mensaje es obligatorio").max(1000, "Maximo 1000 caracteres"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      })
    )
    .max(10, "Maximo 10 mensajes de historial")
    .default([]),
});

export type ChatInput = z.infer<typeof chatSchema>;
export type ChatHistory = ChatInput["history"];
