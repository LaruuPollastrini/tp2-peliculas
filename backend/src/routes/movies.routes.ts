// Mapping entre (metodo HTTP + ruta) y controller. Sin logica de negocio.
//
// Requisito minimo de la consigna:
//   - Lectura: publica.
//   - Crear / editar / eliminar: solo admin (authMiddleware + requireRole("admin")). El admin puede
//     modificar CUALQUIER pelicula.
// El opcional "registros propios" vive aparte, en my-movies.routes.ts.
import { Router } from "express";
import {
  listMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} from "../controllers/movies.controller.js";
import { validateBody, validateQuery } from "../middlewares/validate.js";
import { createMovieSchema, listMoviesSchema, updateMovieSchema } from "../schemas/movie.schema.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();
const onlyAdmin = [authMiddleware, requireRole("admin")];

router.get("/", validateQuery(listMoviesSchema), listMovies);
router.get("/:id", getMovieById);
router.post("/", onlyAdmin, validateBody(createMovieSchema), createMovie);
router.put("/:id", onlyAdmin, validateBody(updateMovieSchema), updateMovie);
router.patch("/:id", onlyAdmin, validateBody(updateMovieSchema), updateMovie);
router.delete("/:id", onlyAdmin, deleteMovie);

export default router;
