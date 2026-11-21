// Better Auth: guarda usuarios, sesiones y cuentas de GitHub/Google en NUESTRO Mongo
// (colecciones user, session, account).
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} environment variable. Check your .env file (see .env.example).`);
  return value;
}

// Better Auth usa el driver nativo de Mongo. Pasarlo como `client` habilita transacciones (Atlas = replica set).
const client = new MongoClient(requireEnv("MONGODB_URI"));

export const auth = betterAuth({
  // URL publica que ve el navegador: la del FRONT, porque /api llega al back a traves del proxy/rewrite.
  // El secret se lee solo de BETTER_AUTH_SECRET.
  baseURL: requireEnv("BETTER_AUTH_URL"),
  database: mongodbAdapter(client.db(), { client }),
  emailAndPassword: {
    enabled: true, // hashea con scrypt; minimo 8 caracteres por defecto
  },
  socialProviders: {
    github: {
      clientId: requireEnv("GITHUB_CLIENT_ID"),
      clientSecret: requireEnv("GITHUB_CLIENT_SECRET"),
    },
    google: {
      clientId: requireEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
      // Siempre muestra el selector de cuentas de Google (util para probar con varias cuentas).
      prompt: "select_account",
    },
  },
  // Si alguien ya registrado con email+password entra con GitHub o Google (mismo email), une las cuentas.
  // Seguro porque ambos proveedores devuelven emails verificados.
  account: {
    accountLinking: { trustedProviders: ["github", "google"] },
  },
  // admin(): agrega user.role ("user" por defecto a todo el que se registra) y los endpoints
  // /api/auth/admin/* (listar usuarios, setRole, crear usuarios...), que solo puede usar un admin.
  plugins: [admin()],
});
