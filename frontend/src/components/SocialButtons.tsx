// Botones de login con GitHub y Google. Los usan Login y Register.
// OAuth: redirige al proveedor; al volver, Better Auth crea la sesion y manda al callbackURL.
// Si falla, vuelve a /login?error=<codigo> en vez de la pagina de error generica de Better Auth.
import { signIn } from "../lib/auth-client";

interface SocialButtonsProps {
  callbackURL: string;
}

const buttonClass =
  "w-full rounded border border-sand py-2 font-medium text-cafe transition hover:bg-sand-soft";

export const SocialButtons = ({ callbackURL }: SocialButtonsProps) => {
  const handle = (provider: "github" | "google") =>
    signIn.social({ provider, callbackURL, errorCallbackURL: "/login" });

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={() => handle("github")} className={buttonClass}>
        Entrar con GitHub
      </button>
      <button type="button" onClick={() => handle("google")} className={buttonClass}>
        Entrar con Google
      </button>
    </div>
  );
};
