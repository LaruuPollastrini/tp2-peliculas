// Ruta publica "/login": email/contraseña (React Hook Form + Zod), GitHub y Google.
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useLocation, useNavigate, type Location } from "react-router";
import { loginSchema, type LoginFormValues } from "../schemas/auth.schema";
import { signIn, useSession } from "../lib/auth-client";
import { SocialButtons } from "../components/SocialButtons";

export const Login = () => {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Vuelve a la pagina que quiso abrir antes del login (la guarda ProtectedRoute en el state).
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? "/home";
  const oauthError = new URLSearchParams(location.search).get("error");

  if (session) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (credentials: LoginFormValues) => {
    // Better Auth no tira excepcion: devuelve { data, error }. Si sale bien setea la cookie y useSession se entera.
    const { error } = await signIn.email(credentials);
    if (error) {
      setError("root.server", { message: error.message ?? "No se pudo iniciar sesión" });
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-arena p-6 font-sans">
      <section className="w-full max-w-sm rounded-md border border-sand bg-lino p-6">
        <h2 className="mb-4 font-serif text-3xl font-medium text-cafe">Iniciar sesión</h2>
        {oauthError && (
          <p role="alert" className="mb-4 rounded bg-sand-soft p-3 text-sm text-cafe">
            No se pudo iniciar sesión con el proveedor externo ({oauthError}).
          </p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-cafe">
            Email
            <input
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
              className="rounded border border-sand px-3 py-2 aria-invalid:border-red-500"
            />
            {errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}
          </label>
          <label className="flex flex-col gap-1 text-sm text-cafe">
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register("password")}
              className="rounded border border-sand px-3 py-2 aria-invalid:border-red-500"
            />
            {errors.password && <span className="text-xs text-red-600">{errors.password.message}</span>}
          </label>
          {errors.root?.server && (
            <p role="alert" className="text-sm text-red-600">
              {errors.root.server.message}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-cafe py-2 font-medium text-lino transition hover:bg-cafe-soft disabled:opacity-50"
          >
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        <div className="my-4 flex items-center gap-3 text-xs text-topo">
          <span className="h-px flex-1 bg-sand" />o<span className="h-px flex-1 bg-sand" />
        </div>
        <SocialButtons callbackURL={from} />
        <p className="mt-4 text-center text-sm text-topo">
          ¿No tenés cuenta?{" "}
          <Link to="/register" className="font-medium text-cafe underline">
            Crear cuenta
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <Link to="/home" className="text-topo underline">
            Ver el catálogo sin iniciar sesión
          </Link>
        </p>
      </section>
    </main>
  );
};
