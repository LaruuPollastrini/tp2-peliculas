interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ page, totalPages, total, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) {
    return <p className="text-center text-sm text-topo">{total} películas</p>;
  }

  const buttonClass =
    "rounded border border-sand px-3 py-1.5 text-sm text-cafe hover:bg-sand-soft disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-3">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className={buttonClass}>
        Anterior
      </button>
      <span className="text-sm text-topo">
        Página {page} de {totalPages} ({total} películas)
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={buttonClass}
      >
        Siguiente
      </button>
    </nav>
  );
};
