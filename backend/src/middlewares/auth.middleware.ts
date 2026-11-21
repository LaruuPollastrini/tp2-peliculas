// Protege rutas: Better Auth lee la cookie de sesion y la busca en Mongo.
import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { isValidObjectId } from "mongoose";
import { auth } from "../lib/auth.js";
import { UserRole } from "../types/auth.types.js";
import * as moviesService from "../services/movies.service.js";

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

    if (!session) {
      res.status(401).json({ success: false, error: { message: "Sesion requerida" } });
      return;
    }

    req.user = session.user;
    next();
  } catch (error) {
    console.error("[auth] error reading session:", error);
    res.status(500).json({ success: false, error: { message: "No se pudo verificar la sesion" } });
  }
}

// requireRole: siempre se usa DESPUES de authMiddleware, asume que req.user ya esta seteado.
export function requireRole(...rolesPermitidos: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: "Sesion requerida" } });
      return;
    }

    if (!rolesPermitidos.includes(req.user.role as UserRole)) {
      res.status(403).json({ success: false, error: { message: "No tenes permisos para realizar esta accion" } });
      return;
    }

    next();
  };
}

// Registros propios (/my-movies): solo el dueño puede ver, editar o eliminar su pelicula.
// El admin modifica cualquiera, pero por /movies. Va DESPUES de authMiddleware.
// Responde 400 (id invalido), 404 (no existe) o 403 (no es suya).
export async function requireMovieOwner(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const id = String(req.params.id);

  if (!isValidObjectId(id)) {
    res.status(400).json({ success: false, error: { message: "El id no es valido" } });
    return;
  }

  try {
    const movie = await moviesService.findMovieById(id);

    if (!movie) {
      res.status(404).json({ success: false, error: { message: "Pelicula no encontrada" } });
      return;
    }

    if (movie.owner !== req.user?.id) {
      res.status(403).json({ success: false, error: { message: "Solo podes acceder a tus propias peliculas" } });
      return;
    }

    req.movie = movie;
    next();
  } catch (error) {
    console.error("[auth] error checking movie ownership:", error);
    res.status(500).json({ success: false, error: { message: "No se pudo verificar la pelicula" } });
  }
}
