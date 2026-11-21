// RTK Query: estado del SERVIDOR (peliculas). Cada endpoint genera un hook con cache incluida.
import { createApi, type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import type { AxiosRequestConfig } from "axios";
import { api as http, getErrorMessage } from "../lib/api";
import type { MovieFormValues } from "../schemas/movie.schema";
import type { Movie, MovieQuery, Paginated } from "../types/movie";

// Usa la misma instancia de axios. El error se guarda ya como string, listo para mostrar.
const axiosBaseQuery: BaseQueryFn<AxiosRequestConfig, unknown, string> = async (config) => {
  try {
    const { data } = await http.request(config);
    return { data };
  } catch (err) {
    return { error: getErrorMessage(err) };
  }
};

// Saca los filtros vacios para no mandar "?search=&genre=" al backend.
const cleanParams = (query: MovieQuery) =>
  Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== ""));

export const moviesApi = createApi({
  reducerPath: "moviesApi",
  baseQuery: axiosBaseQuery,
  // Las queries "proveen" el tag y las mutations lo "invalidan" -> RTK Query vuelve a pedir solo.
  tagTypes: ["Movies"],
  endpoints: (build) => ({
    // ---- /api/movies: catalogo publico (lectura) + ABM solo admin ----
    getMovies: build.query<Paginated<Movie>, MovieQuery>({
      query: (query) => ({ url: "/movies", params: cleanParams(query) }),
      providesTags: ["Movies"],
    }),
    getMovieById: build.query<Movie, string>({
      query: (id) => ({ url: `/movies/${id}` }),
      providesTags: ["Movies"],
    }),
    createMovie: build.mutation<Movie, MovieFormValues>({
      query: (data) => ({ url: "/movies", method: "POST", data }),
      invalidatesTags: ["Movies"],
    }),
    updateMovie: build.mutation<Movie, { id: string; values: MovieFormValues }>({
      query: ({ id, values }) => ({ url: `/movies/${id}`, method: "PUT", data: values }),
      invalidatesTags: ["Movies"],
    }),
    deleteMovie: build.mutation<void, string>({
      query: (id) => ({ url: `/movies/${id}`, method: "DELETE" }),
      invalidatesTags: ["Movies"],
    }),

    // ---- /api/my-movies: opcional "registros propios" (cualquier usuario logueado) ----
    getMyMovies: build.query<Paginated<Movie>, MovieQuery>({
      query: (query) => ({ url: "/my-movies", params: cleanParams(query) }),
      providesTags: ["Movies"],
    }),
    createMyMovie: build.mutation<Movie, MovieFormValues>({
      query: (data) => ({ url: "/my-movies", method: "POST", data }),
      invalidatesTags: ["Movies"],
    }),
    updateMyMovie: build.mutation<Movie, { id: string; values: MovieFormValues }>({
      query: ({ id, values }) => ({ url: `/my-movies/${id}`, method: "PUT", data: values }),
      invalidatesTags: ["Movies"],
    }),
    deleteMyMovie: build.mutation<void, string>({
      query: (id) => ({ url: `/my-movies/${id}`, method: "DELETE" }),
      invalidatesTags: ["Movies"],
    }),
  }),
});

export const {
  useGetMoviesQuery,
  useGetMovieByIdQuery,
  useCreateMovieMutation,
  useUpdateMovieMutation,
  useDeleteMovieMutation,
  useGetMyMoviesQuery,
  useCreateMyMovieMutation,
  useUpdateMyMovieMutation,
  useDeleteMyMovieMutation,
} = moviesApi;
