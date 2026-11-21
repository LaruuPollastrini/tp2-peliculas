// Presentacional: recibe una pelicula por props, no sabe nada de axios ni de estado.
// Toda la tarjeta es un <Link>: click en cualquier parte navega al detalle (/movies/:id).
import { Link } from "react-router";
import { GENRE_LABELS } from "../lib/genres";
import type { Movie } from "../types/movie";

interface MovieCardProps {
  movie: Movie;
}

export const MovieCard = ({ movie }: MovieCardProps) => {
  return (
    <Link
      to={`/movies/${movie._id}`}
      className="group flex flex-col rounded-md border border-sand bg-lino p-6 transition-colors hover:border-topo"
    >
      <article className="flex flex-1 flex-col">
        <p className="text-xs text-topo">
          {GENRE_LABELS[movie.genre]}, {new Date(movie.releaseDate).getUTCFullYear()}
        </p>
        <h3 className="mt-2 font-serif text-3xl leading-tight font-medium text-cafe group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
          {movie.title}
        </h3>
        <p className="mt-1 text-sm text-topo">
          {movie.director}, {movie.durationMin} min
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-sand pt-4 text-sm">
          <span className="font-medium text-bronce">{movie.rating.toFixed(1)} / 10</span>
          <span className={movie.watched ? "text-oliva" : "text-topo"}>
            {movie.watched ? "Vista" : "Sin ver"}
          </span>
        </div>
      </article>
    </Link>
  );
};
