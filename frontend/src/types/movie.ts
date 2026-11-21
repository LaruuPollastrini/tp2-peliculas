import type { Genre } from "../lib/genres";

// Misma forma que IMovie en el backend (backend/src/models/Movie.ts). El JSON no trae tipos: los declaramos a mano.
// Las fechas llegan como string ISO.
export interface Movie {
  _id: string;
  title: string;
  director: string;
  genre: Genre;
  synopsis?: string;
  durationMin: number;
  rating: number;
  releaseDate: string;
  watched: boolean;
  owner: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

// Envelope de los listados paginados del backend: { data, meta }.
export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// Query string de GET /api/movies y GET /api/my-movies. Los campos vacios no se mandan.
export interface MovieQuery {
  page?: number;
  limit?: number;
  search?: string;
  genre?: Genre;
  watched?: "true" | "false";
  sortBy?: "createdAt" | "title" | "releaseDate" | "rating" | "durationMin";
  sortOrder?: "asc" | "desc";
}
