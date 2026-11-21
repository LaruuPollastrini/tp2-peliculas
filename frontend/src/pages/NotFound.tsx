import { Link } from "react-router";

export const NotFound = () => {
  return (
    <section className="text-center">
      <h2 className="font-serif text-4xl font-medium text-cafe">404 — Página no encontrada</h2>
      <Link to="/home" className="mt-2 inline-block text-topo underline">
        Volver al inicio
      </Link>
    </section>
  );
};
