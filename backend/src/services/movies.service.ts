// Capa de servicio: logica de negocio y acceso a datos de peliculas. No sabe nada de HTTP (req/res).
// Los ids llegan ya validados (isValidObjectId) por quien llama.
import { QueryFilter } from "mongoose";
import Movie, { IMovieDocument } from "../models/Movie.js";
import { escapeRegex } from "../lib/escape-regex.js";
import { CreateMovieInput, ListMoviesInput, UpdateMovieInput } from "../schemas/movie.schema.js";
import { Paginated } from "../types/pagination.types.js";

// El filtro se arma campo por campo desde input ya validado por Zod: nunca se pasa el input crudo
// a Mongo (eso permitiria inyectar operadores como { "$gt": "" }).
function buildFilter({ search, genre, watched }: ListMoviesInput, ownerId?: string): QueryFilter<IMovieDocument> {
  const filter: QueryFilter<IMovieDocument> = {};
  if (ownerId) filter.owner = ownerId;
  if (genre) filter.genre = genre;
  if (watched !== undefined) filter.watched = watched;
  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { title: { $regex: safe, $options: "i" } },
      { director: { $regex: safe, $options: "i" } },
    ];
  }
  return filter;
}

// ownerId opcional: sin el, lista todas (catalogo publico); con el, solo las de ese usuario ("mis peliculas").
export async function listMovies(input: ListMoviesInput, ownerId?: string): Promise<Paginated<IMovieDocument>> {
  const { page, limit, sortBy, sortOrder } = input;
  const filter = buildFilter(input, ownerId);

  const [data, total] = await Promise.all([
    Movie.find(filter)
      // _id como desempate: sin el, la paginacion puede repetir o saltear peliculas con el mismo valor.
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Movie.countDocuments(filter),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export function findMovieById(id: string): Promise<IMovieDocument | null> {
  return Movie.findById(id);
}

export function createMovie(input: CreateMovieInput, owner: { id: string; name: string }): Promise<IMovieDocument> {
  return Movie.create({ ...input, owner: owner.id, ownerName: owner.name });
}

export function updateMovie(id: string, input: UpdateMovieInput): Promise<IMovieDocument | null> {
  return Movie.findByIdAndUpdate(id, input, { new: true, runValidators: true });
}

export function deleteMovie(id: string): Promise<IMovieDocument | null> {
  return Movie.findByIdAndDelete(id);
}
