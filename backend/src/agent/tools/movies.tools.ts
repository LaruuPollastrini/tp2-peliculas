// PASO 3 — Las tools (las "manos" del agente).
// Una tool = funcion + nombre + descripcion + schema Zod. El LLM NO ejecuta nada: lee la
// descripcion, decide llamarla y devuelve los argumentos; LangChain valida con Zod y ejecuta.
// La tool es un "controller cuyo cliente es el LLM": no tiene logica de negocio, llama al MISMO
// service que usa la API REST. Las de lectura las puede usar cualquier usuario logueado; las de
// escritura (crear, eliminar) chequean el rol ADENTRO de la tool, igual que requireRole("admin") en la API.
import { tool, type ToolRuntime } from "langchain";
import { z } from "zod";
import { isValidObjectId } from "mongoose";
import * as moviesService from "../../services/movies.service.js";
import { createMovieSchema, listMoviesSchema } from "../../schemas/movie.schema.js";
import { GENRES, IMovieDocument } from "../../models/Movie.js";
import { AgentContext, isAdmin } from "../context.js";
import { withoutNulls } from "./without-nulls.js";

// Lo que la tool le devuelve al LLM cuando el usuario no es admin. El modelo lo lee y se lo explica.
const FORBIDDEN = "Permiso denegado: solo un administrador puede cargar o eliminar peliculas.";

const MAX_RESULTS = 20;

// Solo los campos que el modelo necesita: menos tokens y nada interno (__v, owner).
// toSummary (listados) no incluye la sinopsis: con 20 peliculas gastaria mucho del limite de tokens de Groq.
function toSummary(m: IMovieDocument) {
  return {
    id: m._id.toString(),
    title: m.title,
    director: m.director,
    genre: m.genre,
    durationMin: m.durationMin,
    rating: m.rating,
    releaseDate: m.releaseDate.toISOString().slice(0, 10),
    watched: m.watched,
  };
}

// toPublic (detalle): todo, con la sinopsis y quien la cargo.
function toPublic(m: IMovieDocument) {
  return {
    id: m._id.toString(),
    title: m.title,
    director: m.director,
    genre: m.genre,
    durationMin: m.durationMin,
    rating: m.rating,
    releaseDate: m.releaseDate.toISOString().slice(0, 10),
    watched: m.watched,
    loadedBy: m.ownerName,
    synopsis: m.synopsis,
  };
}

// Filtros que puede usar el modelo. .nullish(): el modelo manda null en los que no usa (ver without-nulls.ts).
const filtersSchema = z.object({
  search: z.string().trim().max(120).nullish().describe("Texto a buscar en el titulo o el director"),
  genre: z.enum(GENRES).nullish().describe("Genero exacto"),
  watched: z.boolean().nullish().describe("true = solo vistas, false = solo sin ver"),
});

// Convierte los filtros del modelo al formato del listMoviesSchema de la API (watched llega como texto en la query).
function toListInput(args: z.infer<typeof filtersSchema>) {
  const { watched, ...rest } = withoutNulls(args);
  return listMoviesSchema.parse({
    ...rest,
    watched: watched === undefined ? undefined : String(watched),
    limit: MAX_RESULTS,
  });
}

export const listMoviesTool = tool(
  async (args) => {
    console.log(`[⑥ tool] list_movies args (ya validados por Zod): ${JSON.stringify(args)}`);
    const { data, meta } = await moviesService.listMovies(toListInput(args));
    console.log(`[⑥ tool] list_movies → ${data.length} de ${meta.total} peliculas`);
    // Las tools devuelven texto: JSON es lo mas facil de leer para el modelo.
    return JSON.stringify({ total: meta.total, shown: data.length, movies: data.map(toSummary) });
  },
  {
    name: "list_movies",
    description:
      "Lista peliculas de TODO el catalogo. Filtros opcionales: texto en titulo/director, genero, " +
      "o si estan vistas. Devuelve el total y hasta 20 resultados.",
    schema: filtersSchema,
  }
);

// Usa el usuario del CONTEXTO (la sesion), no un parametro: el modelo no puede pedir las de otro.
export const listMyMoviesTool = tool(
  async (args, runtime: ToolRuntime<unknown, AgentContext>) => {
    const userId = runtime.context?.user.id;
    console.log(`[⑥ tool] list_my_movies args: ${JSON.stringify(args)} de ${runtime.context?.user.email}`);
    if (!userId) return "No hay un usuario en la sesion.";
    const { data, meta } = await moviesService.listMovies(toListInput(args), userId);
    console.log(`[⑥ tool] list_my_movies → ${data.length} de ${meta.total} peliculas`);
    return JSON.stringify({ total: meta.total, shown: data.length, movies: data.map(toSummary) });
  },
  {
    name: "list_my_movies",
    description:
      "Lista SOLO las peliculas que cargo el usuario que esta chateando ('mis peliculas'). " +
      "Mismos filtros opcionales que list_movies.",
    schema: filtersSchema,
  }
);

export const getMovieByIdTool = tool(
  async ({ id }) => {
    console.log(`[⑥ tool] get_movie_by_id id=${id}`);
    if (!isValidObjectId(id)) return "El id no es valido.";

    const movie = await moviesService.findMovieById(id);
    console.log(`[⑥ tool] get_movie_by_id → ${movie ? "encontrada" : "no existe"}`);
    return movie ? JSON.stringify(toPublic(movie)) : "No existe una pelicula con ese id.";
  },
  {
    name: "get_movie_by_id",
    description: "Trae una pelicula por su id de MongoDB (24 caracteres hexadecimales), con su sinopsis.",
    schema: z.object({ id: z.string().describe("El id de la pelicula (obtenido con list_movies)") }),
  }
);

// ── Escritura ────────────────────────────────────────────────────────────────────────────────
// runtime.context = { user } que armo el controller con req.user (ver agent/context.ts).
// Los errores se DEVUELVEN como texto (no se tiran): asi el LLM los lee y le explica al usuario
// que paso, en vez de cortar todo el agente con un error.

export const createMovieTool = tool(
  async (args, runtime: ToolRuntime<unknown, AgentContext>) => {
    const user = runtime.context?.user;
    console.log(`[⑥ tool] create_movie args: ${JSON.stringify(args)} por ${user?.email}`);
    if (!user || !isAdmin(runtime.context)) return FORBIDDEN;

    // Se valida con el MISMO schema que POST /api/movies.
    const parsed = createMovieSchema.safeParse(withoutNulls(args));
    if (!parsed.success) return `Datos invalidos: ${parsed.error.issues.map((i) => i.message).join("; ")}`;

    try {
      const movie = await moviesService.createMovie(parsed.data, { id: user.id, name: user.name });
      console.log(`[⑥ tool] create_movie → creada ${movie._id}`);
      return `Pelicula cargada: ${JSON.stringify(toPublic(movie))}`;
    } catch (error) {
      if (error instanceof Error && error.name === "ValidationError") return `Datos invalidos: ${error.message}`;
      throw error; // error inesperado (Mongo caido, etc.): que lo maneje el controller
    }
  },
  {
    name: "create_movie",
    description:
      "Carga una pelicula nueva en el catalogo. Usala SOLO si el usuario pide explicitamente agregar una " +
      "pelicula y dio titulo, director, genero, duracion, puntaje y fecha de estreno. Si falta alguno, no la llames: pedile el dato.",
    // Schema propio para el modelo: la fecha como texto AAAA-MM-DD (Date no existe en JSON Schema)
    // y los opcionales aceptando null. Antes de crear se valida con createMovieSchema.
    schema: z.object({
      title: z.string().describe("Titulo"),
      director: z.string().describe("Director"),
      genre: z.enum(GENRES).describe("Genero"),
      durationMin: z.number().int().describe("Duracion en minutos"),
      rating: z.number().describe("Puntaje de 0 a 10"),
      releaseDate: z.string().describe("Fecha de estreno en formato AAAA-MM-DD"),
      synopsis: z.string().nullish().describe("Sinopsis corta (opcional)"),
      watched: z.boolean().nullish().describe("Si ya la vio (opcional)"),
    }),
  }
);

export const deleteMovieTool = tool(
  async ({ id }, runtime: ToolRuntime<unknown, AgentContext>) => {
    console.log(`[⑥ tool] delete_movie id=${id} por ${runtime.context?.user.email}`);
    if (!isAdmin(runtime.context)) return FORBIDDEN;
    if (!isValidObjectId(id)) return "El id no es valido.";

    const deleted = await moviesService.deleteMovie(id);
    console.log(`[⑥ tool] delete_movie → ${deleted ? "eliminada" : "no existe"}`);
    return deleted ? `Pelicula eliminada: ${deleted.title} (${deleted.director}).` : "No existe una pelicula con ese id.";
  },
  {
    name: "delete_movie",
    description:
      "Elimina una pelicula por su id. Usala SOLO si el usuario pide explicitamente eliminar/borrar " +
      "una pelicula. Primero buscala con list_movies para obtener el id; si hay mas de una que " +
      "coincide, NO elimines: mostra las opciones y pedi que aclare cual.",
    schema: z.object({ id: z.string().describe("El id de la pelicula a eliminar (obtenido con list_movies)") }),
  }
);
