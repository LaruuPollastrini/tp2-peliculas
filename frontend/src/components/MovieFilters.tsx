// Busqueda, filtros y orden del listado. Los valores viven en la URL (?search=&genre=...):
// asi un F5 o un link compartido muestran el mismo listado.
import { useState, type SubmitEvent } from "react";
import { GENRES, GENRE_LABELS, SORT_OPTIONS } from "../lib/genres";

export interface FiltersValue {
  search: string;
  genre: string;
  watched: string;
  sort: string; // "campo:orden", ej "rating:desc"
}

interface MovieFiltersProps {
  value: FiltersValue;
  onChange: (value: FiltersValue) => void;
}

export const MovieFilters = ({ value, onChange }: MovieFiltersProps) => {
  // El texto se aplica al apretar "Buscar" (no en cada tecla, para no pedir al backend letra por letra).
  const [search, setSearch] = useState(value.search);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    onChange({ ...value, search: search.trim() });
  };

  const handleClear = () => {
    setSearch("");
    onChange({ search: "", genre: "", watched: "", sort: "createdAt:desc" });
  };

  const selectClass = "rounded border border-sand bg-lino px-3 py-2 text-sm";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-md border border-sand bg-lino p-4"
    >
      <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm text-cafe">
        Buscar
        <input
          type="search"
          placeholder="Título o director"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-sand px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-cafe">
        Género
        <select
          value={value.genre}
          onChange={(e) => onChange({ ...value, search, genre: e.target.value })}
          className={selectClass}
        >
          <option value="">Todos</option>
          {GENRES.map((genre) => (
            <option key={genre} value={genre}>
              {GENRE_LABELS[genre]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-cafe">
        Vista
        <select
          value={value.watched}
          onChange={(e) => onChange({ ...value, search, watched: e.target.value })}
          className={selectClass}
        >
          <option value="">Todas</option>
          <option value="true">Vistas</option>
          <option value="false">No vistas</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-cafe">
        Ordenar por
        <select
          value={value.sort}
          onChange={(e) => onChange({ ...value, search, sort: e.target.value })}
          className={selectClass}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded bg-cafe px-4 py-2 text-sm font-medium text-lino hover:bg-cafe-soft"
        >
          Buscar
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded border border-sand px-4 py-2 text-sm text-cafe hover:bg-sand-soft"
        >
          Limpiar
        </button>
      </div>
    </form>
  );
};
