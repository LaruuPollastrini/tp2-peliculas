// Controller = capa HTTP: lee req, llama al service, traduce el resultado a status + JSON.
import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import * as moviesService from "../services/movies.service.js";
import { CreateMovieInput, ListMoviesInput, UpdateMovieInput } from "../schemas/movie.schema.js";

function sendError(res: Response, status: number, message: string): void {
  res.status(status).json({ success: false, error: { message } });
}

function isMongooseValidationError(error: unknown): error is Error {
  return error instanceof Error && error.name === "ValidationError";
}

// GET /api/v1/movies?page=1&limit=12&search=nolan&genre=drama&watched=true&sortBy=rating&sortOrder=desc
// Catalogo publico: todas las peliculas. La query ya viene validada en res.locals.query.
export async function listMovies(_req: Request, res: Response): Promise<void> {
  try {
    res.status(200).json(await moviesService.listMovies(res.locals.query as ListMoviesInput));
  } catch (error) {
    console.error("[movies] error listing:", error);
    sendError(res, 500, "No se pudieron obtener las peliculas");
  }
}

// GET /api/v1/my-movies — mismas opciones que el listado, pero solo las del usuario logueado.
export async function listMyMovies(req: Request, res: Response): Promise<void> {
  try {
    res.status(200).json(await moviesService.listMovies(res.locals.query as ListMoviesInput, req.user!.id));
  } catch (error) {
    console.error("[movies] error listing mine:", error);
    sendError(res, 500, "No se pudieron obtener tus peliculas");
  }
}

export async function getMovieById(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    sendError(res, 400, "El id no es valido");
    return;
  }

  try {
    const movie = await moviesService.findMovieById(id);

    if (!movie) {
      sendError(res, 404, "Pelicula no encontrada");
      return;
    }

    res.status(200).json(movie);
  } catch (error) {
    console.error("[movies] error fetching by id:", error);
    sendError(res, 500, "No se pudo obtener la pelicula");
  }
}

// GET /api/v1/my-movies/:id — requireMovieOwner ya la busco y verifico que sea suya.
export function getMyMovie(req: Request, res: Response): void {
  res.status(200).json(req.movie);
}

// Lo usan POST /movies (admin) y POST /my-movies (cualquier logueado): queda a nombre de quien la crea.
export async function createMovie(req: Request<{}, {}, CreateMovieInput>, res: Response): Promise<void> {
  try {
    const { id, name } = req.user!;
    res.status(201).json(await moviesService.createMovie(req.body, { id, name }));
  } catch (error) {
    if (isMongooseValidationError(error)) {
      sendError(res, 400, error.message);
      return;
    }

    console.error("[movies] error creating:", error);
    sendError(res, 500, "No se pudo crear la pelicula");
  }
}

// Lo usan PUT/PATCH /movies/:id (admin) y /my-movies/:id (dueño, ya verificado por requireMovieOwner).
// En /movies el id no paso por ningun middleware: se valida aca.
export async function updateMovie(req: Request<{ id: string }, {}, UpdateMovieInput>, res: Response): Promise<void> {
  if (!isValidObjectId(req.params.id)) {
    sendError(res, 400, "El id no es valido");
    return;
  }

  try {
    const updatedMovie = await moviesService.updateMovie(req.params.id, req.body);

    if (!updatedMovie) {
      sendError(res, 404, "Pelicula no encontrada");
      return;
    }

    res.status(200).json(updatedMovie);
  } catch (error) {
    if (isMongooseValidationError(error)) {
      sendError(res, 400, error.message);
      return;
    }

    console.error("[movies] error updating:", error);
    sendError(res, 500, "No se pudo actualizar la pelicula");
  }
}

export async function deleteMovie(req: Request<{ id: string }>, res: Response): Promise<void> {
  if (!isValidObjectId(req.params.id)) {
    sendError(res, 400, "El id no es valido");
    return;
  }

  try {
    const deletedMovie = await moviesService.deleteMovie(req.params.id);

    if (!deletedMovie) {
      sendError(res, 404, "Pelicula no encontrada");
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("[movies] error deleting:", error);
    sendError(res, 500, "No se pudo eliminar la pelicula");
  }
}
