// "/sin-permisos": adonde redirige ProtectedRoute cuando un usuario comun intenta entrar al panel admin.
import { Link } from "react-router";

export const Forbidden = () => {
  return (
    <section className="rounded-md border border-sand bg-sand-soft p-6 text-center">
      <h2 className="font-serif text-4xl font-medium text-cafe">Sin permisos</h2>
      <p className="mt-2 text-cafe">
        Esta sección es solo para administradores. Tu cuenta tiene rol <strong>user</strong>.
      </p>
      <Link to="/home" className="mt-4 inline-block text-cafe underline">
        Volver al catálogo
      </Link>
    </section>
  );
};
