// Junta todos los routers de la API (montados en /api). Las entidades nuevas se montan aca, no en server.ts.
import { Router } from "express";
import moviesRouter from "./movies.routes.js";
import myMoviesRouter from "./my-movies.routes.js";
import agentRouter from "./agent.routes.js";

const router = Router();

router.use("/movies", moviesRouter); // CRUD de la consigna (escritura solo admin)
router.use("/my-movies", myMoviesRouter); // opcional: registros propios de cada usuario
router.use("/agent", agentRouter); // extra: agente con LangChain (clase 14)

export default router;
