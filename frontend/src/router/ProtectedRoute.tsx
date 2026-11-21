import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "../lib/auth-client";
import type { UserRole } from "../types/auth";

interface ProtectedRouteProps {
  roles?: UserRole[];
  redirectTo?: string;
}

// Sin sesion -> /login (y despues vuelve a la pagina pedida).
// Con sesion pero sin el rol -> /sin-permisos (pagina que muestra "Sin permisos").
export const ProtectedRoute = ({ roles, redirectTo = "/sin-permisos" }: ProtectedRouteProps) => {
  // isPending: true hasta que responde /api/auth/get-session (por eso un F5 no expulsa al usuario).
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return <p className="text-topo">Verificando sesión...</p>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(session.user.role as UserRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};
