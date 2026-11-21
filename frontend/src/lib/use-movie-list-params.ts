// Hook compartido por el catalogo, "Mis peliculas" y el panel admin:
// lee page/search/genre/watched/sort de la URL y los convierte en la query del backend.
import { useSearchParams } from "react-router";
import type { FiltersValue } from "../components/MovieFilters";
import type { MovieQuery } from "../types/movie";
import { GENRES } from "./genres";

const SORT_FIELDS = ["createdAt", "title", "releaseDate", "rating", "durationMin"] as const;

export const useMovieListParams = (limit = 12) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: FiltersValue = {
    search: searchParams.get("search") ?? "",
    genre: searchParams.get("genre") ?? "",
    watched: searchParams.get("watched") ?? "",
    sort: searchParams.get("sort") ?? "createdAt:desc",
  };
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  // Solo se mandan valores validos: si alguien edita la URL a mano, se ignoran en vez de dar 400.
  const [sortBy, sortOrder] = filters.sort.split(":");
  const query: MovieQuery = {
    page,
    limit,
    search: filters.search || undefined,
    genre: GENRES.find((g) => g === filters.genre),
    watched: filters.watched === "true" || filters.watched === "false" ? filters.watched : undefined,
    sortBy: SORT_FIELDS.find((f) => f === sortBy),
    sortOrder: sortOrder === "asc" || sortOrder === "desc" ? sortOrder : undefined,
  };

  // Al cambiar un filtro se vuelve a la pagina 1.
  const setFilters = (next: FiltersValue) => {
    const params = new URLSearchParams();
    if (next.search) params.set("search", next.search);
    if (next.genre) params.set("genre", next.genre);
    if (next.watched) params.set("watched", next.watched);
    if (next.sort && next.sort !== "createdAt:desc") params.set("sort", next.sort);
    setSearchParams(params);
  };

  const setPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(nextPage));
    setSearchParams(params);
  };

  return { filters, query, setFilters, setPage };
};
