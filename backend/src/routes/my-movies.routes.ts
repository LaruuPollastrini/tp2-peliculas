// Opcional "cada usuario ve / edita solo sus propios registros".
// Recurso SEPARADO de /movies, asi el CRUD principal queda exactamente como pide la consigna
// (user solo lee, admin escribe). Aca cualquier usuario logueado gestiona SOLO las peliculas que cargo:
//   - GET    /my-movies       -> solo las suyas (mismos filtros y paginacion que /movies)
//   - GET    /my-movies/:id   -> 403 si no es suya
//   - POST   /my-movies       -> queda a su nombre
//   - PUT/PATCH/DELETE /my-movies/:id -> 403 si no es suya
// Las peliculas cargadas aca tambien aparecen en el catalogo publico (GET /movies).
import { Router } from "express";
import {
  listMyMovies,
  getMyMovie,
  createMovie,
  updateMovie,
  deleteMovie,
} from "../controllers/movies.controller.js";
import { validateBody, validateQuery } from "../middlewares/validate.js";
import { createMovieSchema, listMoviesSchema, updateMovieSchema } from "../schemas/movie.schema.js";
import { authMiddleware, requireMovieOwner, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Todas las rutas de este router requieren sesion (rol user o admin).
router.use(authMiddleware, requireRole("user", "admin"));

router.get("/", validateQuery(listMoviesSchema), listMyMovies);
router.get("/:id", requireMovieOwner, getMyMovie);
router.post("/", validateBody(createMovieSchema), createMovie);
router.put("/:id", requireMovieOwner, validateBody(updateMovieSchema), updateMovie);
router.patch("/:id", requireMovieOwner, validateBody(updateMovieSchema), updateMovie);
router.delete("/:id", requireMovieOwner, deleteMovie);

export default router;
