// Ruta privada por rol "/admin" (solo admin). ABM de TODAS las peliculas sobre /api/movies,
// cuyas rutas de escritura estan protegidas en el backend con authMiddleware + requireRole("admin").
import { useState } from "react";
import { getErrorMessage } from "../../lib/api";
import { useMovieListParams } from "../../lib/use-movie-list-params";
import type { MovieFormValues } from "../../schemas/movie.schema";
import {
  useCreateMovieMutation,
  useDeleteMovieMutation,
  useGetMoviesQuery,
  useUpdateMovieMutation,
} from "../../store/api";
import type { Movie } from "../../types/movie";
import { MovieForm } from "../../components/admin/MovieForm";
import { MovieTable } from "../../components/admin/MovieTable";
import { MovieFilters } from "../../components/MovieFilters";
import { Pagination } from "../../components/Pagination";

export const AdminMovies = () => {
  const { filters, query, setFilters, setPage } = useMovieListParams(10);
  const { data, error: loadError } = useGetMoviesQuery(query);
  const [createMovie] = useCreateMovieMutation();
  const [updateMovie] = useUpdateMovieMutation();
  const [deleteMovie, { error: deleteError }] = useDeleteMovieMutation();
  // Estado de UI de esta pantalla: no es global, se queda en useState.
  const [editing, setEditing] = useState<Movie | null>(null);

  const handleSave = async (values: MovieFormValues) => {
    if (editing) {
      await updateMovie({ id: editing._id, values }).unwrap();
      setEditing(null);
    } else {
      await createMovie(values).unwrap();
    }
  };

  const handleDelete = async (movie: Movie) => {
    if (!window.confirm(`¿Eliminar "${movie.title}"?`)) return;
    // Sin unwrap: si falla, el error queda en `deleteError` y se muestra abajo.
    const result = await deleteMovie(movie._id);
    if (!result.error && editing?._id === movie._id) setEditing(null);
  };

  const error = loadError ?? deleteError;

  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-serif text-3xl font-medium text-cafe">Panel de administración: películas</h2>

      <MovieForm movie={editing} onSave={handleSave} onCancel={() => setEditing(null)} />

      <MovieFilters value={filters} onChange={setFilters} />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {getErrorMessage(error)}
        </p>
      )}

      <MovieTable movies={data?.data ?? []} showOwner onEdit={setEditing} onDelete={handleDelete} />

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
