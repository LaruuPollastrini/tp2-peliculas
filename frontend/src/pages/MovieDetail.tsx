// Page: ruta publica "/movies/:id". El id sale de la URL con useParams.
import { skipToken } from "@reduxjs/toolkit/query";
import { Link, useParams } from "react-router";
import { getErrorMessage } from "../lib/api";
import { GENRE_LABELS } from "../lib/genres";
import { useGetMovieByIdQuery } from "../store/api";

// La fecha se guarda a las 00:00 UTC: se muestra en UTC para que no aparezca el dia anterior en Argentina.
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("es-AR", { timeZone: "UTC" });

export const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  // skipToken = no pedir nada si no hay id.
  const { data: movie, isLoading, error } = useGetMovieByIdQuery(id ?? skipToken);

  if (isLoading) {
    return <p className="text-topo">Cargando película...</p>;
  }

  if (error || !movie) {
    return (
      <section>
        <p className="text-red-600">No se pudo cargar la película: {getErrorMessage(error)}</p>
        <Link to="/home" className="mt-2 inline-block text-topo underline">
          Volver al catálogo
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-sand bg-lino p-6">
      <Link to="/home" className="text-sm text-topo underline">
        Volver al catálogo
      </Link>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-5xl font-medium text-cafe">{movie.title}</h2>
        <span className="text-lg font-medium text-bronce">{movie.rating.toFixed(1)} / 10</span>
      </div>
      <p className="text-topo">Dirigida por {movie.director}</p>

      {movie.synopsis && <p className="mt-4 text-cafe">{movie.synopsis}</p>}

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:max-w-md">
        <dt className="text-topo">Género</dt>
        <dd className="text-cafe">{GENRE_LABELS[movie.genre]}</dd>
        <dt className="text-topo">Duración</dt>
        <dd className="text-cafe">{movie.durationMin} minutos</dd>
        <dt className="text-topo">Estreno</dt>
        <dd className="text-cafe">{formatDate(movie.releaseDate)}</dd>
        <dt className="text-topo">Estado</dt>
        <dd className={movie.watched ? "text-oliva" : "text-topo"}>
          {movie.watched ? "Vista" : "No vista"}
        </dd>
        <dt className="text-topo">Cargada por</dt>
        <dd className="text-cafe">{movie.ownerName}</dd>
      </dl>
    </section>
  );
};
