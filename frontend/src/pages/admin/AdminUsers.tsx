// Ruta privada por rol "/admin/usuarios" (solo admin). Opcional "pagina de admin para cambiar roles".
// Todo sale del plugin admin de Better Auth (authClient.admin.*): el backend ya valida que sea admin.
import { useCallback, useEffect, useState } from "react";
import { authClient, useSession } from "../../lib/auth-client";
import type { UserRole } from "../../types/auth";

type AdminUser = { id: string; name: string; email: string; role?: string | null };

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
      <p className="mb-4 text-sm text-topo">
        Todo usuario nuevo es <strong>user</strong> (solo lee el catálogo y gestiona sus propias películas). Un{" "}
        <strong>admin</strong> puede crear, editar y eliminar cualquier película y cambiar roles.
      </p>
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
                  className={`rounded px-2 py-0.5 text-xs ${role === "admin" ? "bg-sand-soft text-cafe" : "bg-sand-soft text-cafe"}`}
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
