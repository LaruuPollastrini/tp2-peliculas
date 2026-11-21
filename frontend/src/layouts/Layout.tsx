// Layout generico: encabezado con navegacion segun la sesion y el rol. Se monta una sola vez,
// al navegar solo cambia lo que renderiza <Outlet />.
import { Link, NavLink, Outlet } from "react-router";
import { signOut, useSession } from "../lib/auth-client";

// Pagina activa: subrayado fino en el color de acento.
const navClass = ({ isActive }: { isActive: boolean }) =>
  `border-b px-1 py-1 text-sm transition-colors hover:text-cafe ${
    isActive ? "border-bronce text-cafe" : "border-transparent text-topo"
  }`;

export const Layout = () => {
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin = user?.role === "admin";

  // signOut borra la sesion EN LA BASE (no solo la cookie).
  // Recarga completa: limpia el cache de useSession y de RTK Query.
  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      alert(error.message ?? "No se pudo cerrar sesión");
      return;
    }
    window.location.replace("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-arena font-sans text-cafe">
      <header className="border-b border-sand bg-lino px-6 py-5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-4">
          <Link to="/home" className="font-serif text-4xl leading-none font-medium tracking-tight text-cafe">
            Películas
          </Link>
          <nav className="flex flex-wrap items-center gap-5">
            <NavLink to="/home" className={navClass}>
              Catálogo
            </NavLink>
            {user && (
              <>
                <NavLink to="/mis-peliculas" className={navClass}>
                  Mis películas
                </NavLink>
                <NavLink to="/asistente" className={navClass}>
                  Asistente
                </NavLink>
              </>
            )}
            {isAdmin && (
              <>
                <NavLink to="/admin" end className={navClass}>
                  Administrar
                </NavLink>
                <NavLink to="/admin/usuarios" className={navClass}>
                  Usuarios
                </NavLink>
              </>
            )}
            {user ? (
              <span className="flex items-center gap-3 border-l border-sand pl-5 text-sm">
                <span className="text-topo">
                  {user.name} <span className="text-xs">({user.role})</span>
                </span>
                <button type="button" onClick={handleLogout} className="text-cafe underline-offset-4 hover:underline">
                  Salir
                </button>
              </span>
            ) : (
              <>
                <NavLink to="/login" className={navClass}>
                  Ingresar
                </NavLink>
                <NavLink to="/register" className={navClass}>
                  Crear cuenta
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <Outlet />
      </main>
      <footer className="border-t border-sand px-6 py-5 text-center text-xs text-topo">
        <Link to="/privacidad" className="underline-offset-4 hover:underline">
          Política de privacidad
        </Link>
        <span className="mx-3">|</span>
        <Link to="/terminos" className="underline-offset-4 hover:underline">
          Condiciones del servicio
        </Link>
      </footer>
    </div>
  );
};
