// Junta todos los routers de la v1. Las entidades nuevas se montan aca, no en server.ts.
import { Router } from "express";
import moviesRouter from "./movies.routes.js";
import myMoviesRouter from "./my-movies.routes.js";

const router = Router();

router.use("/movies", moviesRouter); // CRUD de la consigna (escritura solo admin)
router.use("/my-movies", myMoviesRouter); // opcional: registros propios de cada usuario

export default router;
