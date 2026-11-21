// Ruta privada "/mis-peliculas" (cualquier usuario logueado). Opcional "registros propios":
// cada usuario ve, crea, edita y elimina SOLO sus peliculas (/api/my-movies).
import { useState } from "react";
import { getErrorMessage } from "../lib/api";
import { useMovieListParams } from "../lib/use-movie-list-params";
import type { MovieFormValues } from "../schemas/movie.schema";
import {
  useCreateMyMovieMutation,
  useDeleteMyMovieMutation,
  useGetMyMoviesQuery,
  useUpdateMyMovieMutation,
} from "../store/api";
import type { Movie } from "../types/movie";
import { MovieForm } from "../components/admin/MovieForm";
import { MovieTable } from "../components/admin/MovieTable";
import { MovieFilters } from "../components/MovieFilters";
import { Pagination } from "../components/Pagination";

export const MyMovies = () => {
  const { filters, query, setFilters, setPage } = useMovieListParams(10);
  const { data, error: loadError } = useGetMyMoviesQuery(query);
  const [createMovie] = useCreateMyMovieMutation();
  const [updateMovie] = useUpdateMyMovieMutation();
  const [deleteMovie, { error: deleteError }] = useDeleteMyMovieMutation();
  const [editing, setEditing] = useState<Movie | null>(null);

  // Cada mutation invalida el tag "Movies" y RTK Query vuelve a pedir el listado solo.
  // unwrap() lanza el error para que lo muestre el formulario.
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
    const result = await deleteMovie(movie._id);
    if (!result.error && editing?._id === movie._id) setEditing(null);
  };

  const error = loadError ?? deleteError;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-3xl font-medium text-cafe">Mis películas</h2>
        <p className="text-sm text-topo">
          Las películas que cargues quedan a tu nombre: solo vos podés editarlas o eliminarlas desde acá.
          También aparecen en el catálogo público.
        </p>
      </div>

      <MovieForm movie={editing} onSave={handleSave} onCancel={() => setEditing(null)} />

      <MovieFilters value={filters} onChange={setFilters} />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {getErrorMessage(error)}
        </p>
      )}

      <MovieTable movies={data?.data ?? []} onEdit={setEditing} onDelete={handleDelete} />

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
