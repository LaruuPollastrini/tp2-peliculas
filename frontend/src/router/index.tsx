// Arbol de rutas centralizado (data router). Tres niveles de acceso: publico, privado y privado por rol.
import { createBrowserRouter, redirect } from "react-router";
import { Layout } from "../layouts/Layout";
import { ProtectedRoute } from "./ProtectedRoute";
import { Home } from "../pages/Home";
import { MovieDetail } from "../pages/MovieDetail";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { MyMovies } from "../pages/MyMovies";
import { AdminMovies } from "../pages/admin/AdminMovies";
import { AdminUsers } from "../pages/admin/AdminUsers";
import { Forbidden } from "../pages/Forbidden";
import { Privacy, Terms } from "../pages/Legal";
import { NotFound } from "../pages/NotFound";

export const router = createBrowserRouter([
  // Fuera del Layout: pantalla completa, sin header
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },

  {
    path: "/",
    element: <Layout />,
    children: [
      // "/" muestra el catalogo
      { index: true, loader: () => redirect("/home") },

      // Publicas
      { path: "home", element: <Home /> },
      { path: "movies/:id", element: <MovieDetail /> },
      { path: "sin-permisos", element: <Forbidden /> },
      { path: "privacidad", element: <Privacy /> },
      { path: "terminos", element: <Terms /> },

      // Privada: cualquier usuario logueado (opcional "registros propios")
      {
        element: <ProtectedRoute />,
        children: [{ path: "mis-peliculas", element: <MyMovies /> }],
      },

      // Privada por rol: solo admin. Un user comun es redirigido a /sin-permisos.
      {
        element: <ProtectedRoute roles={["admin"]} />,
        children: [
          {
            path: "admin",
            children: [
              { index: true, element: <AdminMovies /> },
              { path: "usuarios", element: <AdminUsers /> },
            ],
          },
        ],
      },

      { path: "*", element: <NotFound /> },
    ],
  },
]);
