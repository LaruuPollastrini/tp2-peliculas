import type { auth } from "../lib/auth.js";
import type { IMovieDocument } from "../models/Movie.js";

// Tipos inferidos de la config de Better Auth: incluyen el `role` que agrega el plugin admin.
type Session = typeof auth.$Infer.Session;
export type SessionUser = Session["user"];
export type UserRole = "admin" | "user";

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      // Lo setea requireMovieOwner: la pelicula ya buscada, para no ir dos veces a la base.
      movie?: IMovieDocument;
    }
  }
}
