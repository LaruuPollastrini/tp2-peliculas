import { z } from "zod";
import { GENRES } from "../lib/genres";
import type { Movie } from "../types/movie";

// Mismas reglas que createMovieSchema del backend, con mensajes para mostrar en el formulario.
// Los inputs numericos usan valueAsNumber: si quedan vacios llegan como NaN y z.number los rechaza.
export const movieSchema = z.object({
  title: z.string().trim().min(1, { error: "El título es obligatorio" }).max(120, { error: "Máximo 120 caracteres" }),
  director: z
    .string()
    .trim()
    .min(1, { error: "El director es obligatorio" })
    .max(80, { error: "Máximo 80 caracteres" }),
  genre: z.enum(GENRES, { error: "Elegí un género" }),
  synopsis: z.string().trim().max(1000, { error: "Máximo 1000 caracteres" }),
  durationMin: z
    .number({ error: "La duración debe ser un número" })
    .int({ error: "La duración debe ser un número entero" })
    .min(1, { error: "La duración mínima es 1 minuto" })
    .max(600, { error: "La duración máxima es 600 minutos" }),
  rating: z
    .number({ error: "El puntaje debe ser un número" })
    .min(0, { error: "El puntaje va de 0 a 10" })
    .max(10, { error: "El puntaje va de 0 a 10" }),
  // <input type="date"> devuelve "AAAA-MM-DD" (o "" si esta vacio).
  releaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "La fecha de estreno es obligatoria" }),
  watched: z.boolean(),
});

export type MovieFormValues = z.infer<typeof movieSchema>;

export const emptyMovie: MovieFormValues = {
  title: "",
  director: "",
  genre: "drama",
  synopsis: "",
  durationMin: NaN,
  rating: NaN,
  releaseDate: "",
  watched: false,
};

export const toMovieFormValues = (movie: Movie): MovieFormValues => ({
  title: movie.title,
  director: movie.director,
  genre: movie.genre,
  synopsis: movie.synopsis ?? "",
  durationMin: movie.durationMin,
  rating: movie.rating,
  releaseDate: movie.releaseDate.slice(0, 10), // ISO -> "AAAA-MM-DD" para el input date
  watched: movie.watched,
});
