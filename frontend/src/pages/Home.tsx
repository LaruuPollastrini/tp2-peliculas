// Page: ruta publica "/home". Catalogo con busqueda, filtros y paginacion (GET /api/movies).
import { getErrorMessage } from "../lib/api";
import { useMovieListParams } from "../lib/use-movie-list-params";
import { useGetMoviesQuery } from "../store/api";
import { MovieCard } from "../components/MovieCard";
import { MovieFilters } from "../components/MovieFilters";
import { Pagination } from "../components/Pagination";

export const Home = () => {
  const { filters, query, setFilters, setPage } = useMovieListParams(12);
  // Cada combinacion de filtros es una entrada distinta en la cache de RTK Query.
  const { data, isFetching, error } = useGetMoviesQuery(query);
  const movies = data?.data ?? [];

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-5xl font-medium text-cafe">Catálogo</h2>
        <p className="mt-2 text-topo">Buscá por título o director y filtrá por género.</p>
      </div>

      <MovieFilters value={filters} onChange={setFilters} />

      {error && <p className="text-red-600">No se pudieron cargar las películas: {getErrorMessage(error)}</p>}

      {!error && !data && isFetching && <p className="text-topo">Cargando películas...</p>}

      {data && movies.length === 0 && (
        <p className="text-topo">No hay películas que coincidan con la búsqueda.</p>
      )}

      {movies.length > 0 && (
        <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${isFetching ? "opacity-60" : ""}`}>
          {movies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>
      )}

      {data && (
        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          total={data.meta.total}
          onPageChange={setPage}
        />
      )}
    </section>
  );
};
