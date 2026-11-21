// Lista de peliculas con botones Editar / Eliminar. Presentacional: las acciones llegan por props.
import { Link } from "react-router";
import { GENRE_LABELS } from "../../lib/genres";
import type { Movie } from "../../types/movie";

interface MovieTableProps {
  movies: Movie[];
  showOwner?: boolean;
  onEdit: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
}

export const MovieTable = ({ movies, showOwner = false, onEdit, onDelete }: MovieTableProps) => {
  return (
    <ul className="divide-y divide-sand rounded-md border border-sand bg-lino">
      {movies.map((movie) => (
        <li key={movie._id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div>
            <Link to={`/movies/${movie._id}`} className="font-serif text-xl font-medium text-cafe hover:underline">
              {movie.title} ({new Date(movie.releaseDate).getUTCFullYear()})
            </Link>
            <p className="text-sm text-topo">
              {movie.director}, {GENRE_LABELS[movie.genre]}, {movie.rating.toFixed(1)} / 10,{" "}
              {movie.watched ? "vista" : "sin ver"}
              {showOwner && `. Cargada por ${movie.ownerName}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onEdit(movie)}
              className="rounded border border-sand px-3 py-1 text-sm hover:bg-sand-soft"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => onDelete(movie)}
              className="rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50"
            >
              Eliminar
            </button>
          </div>
        </li>
      ))}
      {movies.length === 0 && (
        <li className="px-4 py-3 text-sm text-topo">No hay películas para mostrar.</li>
      )}
    </ul>
  );
};
