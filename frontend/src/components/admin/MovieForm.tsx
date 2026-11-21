// Formulario de alta / edicion con React Hook Form + Zod. Lo usan el panel admin y "Mis peliculas".
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getErrorMessage } from "../../lib/api";
import { GENRES, GENRE_LABELS } from "../../lib/genres";
import {
  emptyMovie,
  movieSchema,
  toMovieFormValues,
  type MovieFormValues,
} from "../../schemas/movie.schema";
import type { Movie } from "../../types/movie";

interface MovieFormProps {
  movie: Movie | null; // null = alta; una pelicula = edicion
  onSave: (values: MovieFormValues) => Promise<void>;
  onCancel: () => void;
}

const inputClass = "rounded border border-sand px-3 py-2 aria-invalid:border-red-500";
const labelClass = "flex flex-col gap-1 text-sm text-cafe";

const FieldError = ({ message }: { message?: string }) =>
  message ? <span className="text-xs text-red-600">{message}</span> : null;

export const MovieForm = ({ movie, onSave, onCancel }: MovieFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    values: movie ? toMovieFormValues(movie) : emptyMovie,
  });

  const onSubmit = async (values: MovieFormValues) => {
    try {
      await onSave(values);
      reset(emptyMovie);
    } catch (err) {
      // Errores del backend (400, 403...) se muestran abajo del formulario.
      setError("root.server", { message: getErrorMessage(err) });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-3 rounded-md border border-sand bg-lino p-6"
    >
      <h3 className="font-serif text-2xl font-medium text-cafe">
        {movie ? `Editando "${movie.title}"` : "Nueva película"}
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Título
          <input type="text" aria-invalid={!!errors.title} {...register("title")} className={inputClass} />
          <FieldError message={errors.title?.message} />
        </label>

        <label className={labelClass}>
          Director
          <input
            type="text"
            aria-invalid={!!errors.director}
            {...register("director")}
            className={inputClass}
          />
          <FieldError message={errors.director?.message} />
        </label>

        <label className={labelClass}>
          Género
          <select aria-invalid={!!errors.genre} {...register("genre")} className={`${inputClass} bg-lino`}>
            {GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {GENRE_LABELS[genre]}
              </option>
            ))}
          </select>
          <FieldError message={errors.genre?.message} />
        </label>

        <label className={labelClass}>
          Fecha de estreno
          <input
            type="date"
            aria-invalid={!!errors.releaseDate}
            {...register("releaseDate")}
            className={inputClass}
          />
          <FieldError message={errors.releaseDate?.message} />
        </label>

        <label className={labelClass}>
          Duración (minutos)
          <input
            type="number"
            min={1}
            step={1}
            aria-invalid={!!errors.durationMin}
            {...register("durationMin", { valueAsNumber: true })}
            className={inputClass}
          />
          <FieldError message={errors.durationMin?.message} />
        </label>

        <label className={labelClass}>
          Puntaje (0 a 10)
          <input
            type="number"
            min={0}
            max={10}
            step={0.1}
            aria-invalid={!!errors.rating}
            {...register("rating", { valueAsNumber: true })}
            className={inputClass}
          />
          <FieldError message={errors.rating?.message} />
        </label>
      </div>

      <label className={labelClass}>
        Sinopsis (opcional)
        <textarea
          rows={3}
          aria-invalid={!!errors.synopsis}
          {...register("synopsis")}
          className={inputClass}
        />
        <FieldError message={errors.synopsis?.message} />
      </label>

      <label className="flex items-center gap-2 text-sm text-cafe">
        <input type="checkbox" {...register("watched")} />
        Ya la vi
      </label>

      {errors.root?.server && (
        <p role="alert" className="text-sm text-red-600">
          {errors.root.server.message}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-cafe px-4 py-2 font-medium text-lino transition hover:bg-cafe-soft disabled:opacity-50"
        >
          {isSubmitting ? "Guardando..." : movie ? "Guardar cambios" : "Crear"}
        </button>
        {movie && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-sand px-4 py-2 text-cafe hover:bg-sand-soft"
          >
            Cancelar edición
          </button>
        )}
      </div>
    </form>
  );
};
