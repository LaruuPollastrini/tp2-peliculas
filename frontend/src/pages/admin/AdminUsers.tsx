// Ruta privada por rol "/admin/usuarios" (solo admin). Gestion de usuarios:
//   - crear usuarios (authClient.admin.createUser)
//   - cambiar roles (authClient.admin.setRole) -> opcional "pagina de admin para cambiar roles"
// Todo sale del plugin admin de Better Auth: el backend ya valida que quien llama sea admin.
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient, useSession } from "../../lib/auth-client";
import type { UserRole } from "../../types/auth";

type AdminUser = { id: string; name: string; email: string; role?: string | null };

// Formulario de alta de usuario (React Hook Form + Zod).
const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "El nombre debe tener al menos 2 caracteres" })
    .max(80, { error: "Máximo 80 caracteres" }),
  email: z.email({ error: "El email no tiene un formato válido" }).trim().toLowerCase(),
  password: z
    .string()
    .min(8, { error: "La contraseña debe tener al menos 8 caracteres" })
    .max(128, { error: "Máximo 128 caracteres" }),
  role: z.enum(["user", "admin"], { error: "Elegí un rol" }),
});

type CreateUserValues = z.infer<typeof createUserSchema>;

const emptyUser: CreateUserValues = { name: "", email: "", password: "", role: "user" };

const inputClass = "rounded border border-sand px-3 py-2 aria-invalid:border-red-500";

const CreateUserForm = ({ onCreated }: { onCreated: () => Promise<void> }) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: emptyUser,
  });

  const onSubmit = async (values: CreateUserValues) => {
    const { error } = await authClient.admin.createUser(values);
    if (error) {
      setError("root.server", { message: error.message ?? "No se pudo crear el usuario" });
      return;
    }
    reset(emptyUser);
    await onCreated();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mb-8 flex flex-col gap-3 rounded-md border border-sand p-5"
    >
      <h3 className="font-serif text-2xl font-medium text-cafe">Nuevo usuario</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-cafe">
          Nombre
          <input type="text" aria-invalid={!!errors.name} {...register("name")} className={inputClass} />
          {errors.name && <span className="text-xs text-red-600">{errors.name.message}</span>}
        </label>
        <label className="flex flex-col gap-1 text-sm text-cafe">
          Email
          <input type="email" aria-invalid={!!errors.email} {...register("email")} className={inputClass} />
          {errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}
        </label>
        <label className="flex flex-col gap-1 text-sm text-cafe">
          Contraseña
          <input
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
            className={inputClass}
          />
          {errors.password && <span className="text-xs text-red-600">{errors.password.message}</span>}
        </label>
        <label className="flex flex-col gap-1 text-sm text-cafe">
          Rol
          <select aria-invalid={!!errors.role} {...register("role")} className={inputClass}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          {errors.role && <span className="text-xs text-red-600">{errors.role.message}</span>}
        </label>
      </div>
      {errors.root?.server && (
        <p role="alert" className="text-sm text-red-600">
          {errors.root.server.message}
        </p>
      )}
      {isSubmitSuccessful && !errors.root?.server && (
        <p role="status" className="text-sm text-oliva">
          Usuario creado.
        </p>
      )}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-cafe px-4 py-2 font-medium text-lino transition hover:bg-cafe-soft disabled:opacity-50"
        >
          {isSubmitting ? "Creando..." : "Crear usuario"}
        </button>
      </div>
    </form>
  );
};

export const AdminUsers = () => {
  const { data: session } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    const { data, error } = await authClient.admin.listUsers({
      query: { limit: 100, sortBy: "createdAt", sortDirection: "desc" },
    });
    if (error) setError(error.message ?? "No se pudieron cargar los usuarios");
    else setUsers(data.users);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const changeRole = async (user: AdminUser, role: UserRole) => {
    if (!window.confirm(`¿Cambiar el rol de ${user.email} a "${role}"?`)) return;
    setError(null);
    setSavingId(user.id);
    const { error } = await authClient.admin.setRole({ userId: user.id, role });
    setSavingId(null);
    if (error) {
      setError(error.message ?? "No se pudo cambiar el rol");
      return;
    }
    await loadUsers();
  };

  return (
    <section className="rounded-md border border-sand bg-lino p-6">
      <h2 className="mb-1 font-serif text-3xl font-medium text-cafe">Usuarios y roles</h2>
      <p className="mb-6 text-sm text-topo">
        Todo usuario que se registra es <strong>user</strong>: lee el catálogo y gestiona sus propias películas.
        Un <strong>admin</strong> puede crear, editar y eliminar cualquier película, crear usuarios y cambiar roles.
      </p>

      <CreateUserForm onCreated={loadUsers} />

      {error && (
        <p role="alert" className="mb-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <ul className="divide-y divide-sand">
        {users.map((user) => {
          const isMe = user.id === session?.user.id;
          const role = (user.role ?? "user") as UserRole;
          return (
            <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-cafe">
                  {user.name} {isMe && <span className="text-sm text-topo">(vos)</span>}
                </p>
                <p className="text-sm text-topo">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs ${role === "admin" ? "bg-cafe text-lino" : "bg-sand-soft text-cafe"}`}
                >
                  {role}
                </span>
                {/* Un admin no puede quitarse el rol a si mismo: evita quedarse sin ningun admin. */}
                {!isMe && (
                  <button
                    type="button"
                    disabled={savingId === user.id}
                    onClick={() => changeRole(user, role === "admin" ? "user" : "admin")}
                    className="rounded border border-sand px-3 py-1 text-sm hover:bg-sand-soft disabled:opacity-50"
                  >
                    {role === "admin" ? "Quitar admin" : "Hacer admin"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};