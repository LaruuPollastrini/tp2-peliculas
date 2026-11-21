import { z } from "zod";
import { GENRES } from "../models/Movie.js";

export const ALLOWED_SORT_FIELDS = ["createdAt", "title", "releaseDate", "rating", "durationMin"] as const;

// Query string del listado: todo llega como texto, por eso z.coerce para los numeros
// y un enum "true"/"false" para el booleano (z.coerce.boolean() convierte "false" en true).
export const listMoviesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  sortBy: z.enum(ALLOWED_SORT_FIELDS).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().trim().min(1).max(120).optional(),
  genre: z.enum(GENRES).optional(),
  watched: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const createMovieSchema = z.object({
  title: z.string({ error: "El titulo es obligatorio" }).trim().min(1, "El titulo es obligatorio").max(120, "Maximo 120 caracteres"),
  director: z
    .string({ error: "El director es obligatorio" })
    .trim()
    .min(1, "El director es obligatorio")
    .max(80, "Maximo 80 caracteres"),
  genre: z.enum(GENRES, { error: `El genero debe ser uno de: ${GENRES.join(", ")}` }),
  synopsis: z.string().trim().max(1000, "Maximo 1000 caracteres").optional(),
  durationMin: z
    .number({ error: "La duracion debe ser un numero" })
    .int("La duracion debe ser un numero entero")
    .min(1, "La duracion minima es 1 minuto")
    .max(600, "La duracion maxima es 600 minutos"),
  rating: z
    .number({ error: "El puntaje debe ser un numero" })
    .min(0, "El puntaje va de 0 a 10")
    .max(10, "El puntaje va de 0 a 10"),
  // Acepta "2010-07-16" o un ISO completo y lo convierte a Date.
  releaseDate: z.coerce.date({ error: "La fecha de estreno no es valida" }),
  watched: z.boolean({ error: "watched debe ser true o false" }).optional(),
});

// Editar: todos los campos opcionales, pero al menos uno.
export const updateMovieSchema = createMovieSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { error: "Envia al menos un campo para actualizar" });

export type ListMoviesInput = z.infer<typeof listMoviesSchema>;
export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
