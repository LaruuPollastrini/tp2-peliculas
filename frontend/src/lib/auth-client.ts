// Cliente de Better Auth. Sin baseURL: el front y la API comparten origen
// (proxy de Vite en local, rewrite de Render en produccion).
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

// adminClient(): habilita authClient.admin.* (listUsers, setRole...) para la pagina de usuarios.
export const authClient = createAuthClient({
  plugins: [adminClient()],
});

// useSession es estado del SERVIDOR: pide /api/auth/get-session y lo cachea.
// Al recargar la pagina (F5) lo vuelve a pedir, asi que la sesion se mantiene.
export const { useSession, signIn, signUp, signOut } = authClient;
