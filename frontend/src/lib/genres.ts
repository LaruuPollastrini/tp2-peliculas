// Mismos valores que GENRES en el backend (backend/src/models/Movie.ts).
export const GENRES = [
  "accion",
  "aventura",
  "animacion",
  "comedia",
  "drama",
  "terror",
  "ciencia-ficcion",
  "suspenso",
  "romance",
  "documental",
] as const;

export type Genre = (typeof GENRES)[number];

// Texto para mostrar en pantalla (el valor guardado no lleva tildes ni mayusculas).
export const GENRE_LABELS: Record<Genre, string> = {
  accion: "Acción",
  aventura: "Aventura",
  animacion: "Animación",
  comedia: "Comedia",
  drama: "Drama",
  terror: "Terror",
  "ciencia-ficcion": "Ciencia ficción",
  suspenso: "Suspenso",
  romance: "Romance",
  documental: "Documental",
};

export const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Más recientes" },
  { value: "title:asc", label: "Título (A-Z)" },
  { value: "rating:desc", label: "Mejor puntaje" },
  { value: "releaseDate:desc", label: "Estreno (nuevas primero)" },
  { value: "releaseDate:asc", label: "Estreno (viejas primero)" },
  { value: "durationMin:asc", label: "Más cortas" },
] as const;
