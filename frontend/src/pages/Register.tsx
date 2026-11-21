// Ruta publica "/register". Crea el usuario (siempre rol "user") y Better Auth abre la sesion en el mismo paso.
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useNavigate } from "react-router";
import { registerSchema, type RegisterFormValues } from "../schemas/auth.schema";
import { signUp, useSession } from "../lib/auth-client";
import { SocialButtons } from "../components/SocialButtons";

const fields = [
  { name: "name", label: "Nombre", type: "text", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "password", label: "Contraseña", type: "password", autoComplete: "new-password" },
  { name: "confirmPassword", label: "Repetir contraseña", type: "password", autoComplete: "new-password" },
] as const;

export const Register = () => {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  if (session) {
    return <Navigate to="/home" replace />;
  }

  const onSubmit = async ({ name, email, password }: RegisterFormValues) => {
    // autoSignIn: signUp ya deja la sesion abierta, no hace falta un login aparte.
    const { error } = await signUp.email({ name, email, password });
    if (error) {
      setError("root.server", { message: error.message ?? "No se pudo crear la cuenta" });
      return;
    }
    navigate("/home", { replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-arena p-6 font-sans">
      <section className="w-full max-w-sm rounded-md border border-sand bg-lino p-6">
        <h2 className="mb-4 font-serif text-3xl font-medium text-cafe">Crear cuenta</h2>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
          {fields.map(({ name, label, type, autoComplete }) => (
            <label key={name} className="flex flex-col gap-1 text-sm text-cafe">
              {label}
              <input
                type={type}
                autoComplete={autoComplete}
                aria-invalid={!!errors[name]}
                {...register(name)}
                className="rounded border border-sand px-3 py-2 aria-invalid:border-red-500"
              />
              {errors[name] && <span className="text-xs text-red-600">{errors[name].message}</span>}
            </label>
          ))}
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
            {isSubmitting ? "Creando..." : "Crear cuenta"}
          </button>
        </form>
        <div className="my-4 flex items-center gap-3 text-xs text-topo">
          <span className="h-px flex-1 bg-sand" />o<span className="h-px flex-1 bg-sand" />
        </div>
        <SocialButtons callbackURL="/home" />
        <p className="mt-4 text-center text-sm text-topo">
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="font-medium text-cafe underline">
            Ingresar
          </Link>
        </p>
      </section>
    </main>
  );
};
