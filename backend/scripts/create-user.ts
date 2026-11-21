// Crea un usuario con email/contraseña (o actualiza el rol si ya existe). Sirve para el PRIMER admin:
// todo el que se registra desde la app es "user", y solo un admin puede cambiar roles.
//
// Uso:  npm run create-user -- <email> <password> "<nombre>" [admin|user]
// Ej:   npm run create-user -- admin@peliculas.com Admin12345 "Admin" admin
import "dotenv/config";
import { MongoClient } from "mongodb";
import { auth } from "../src/lib/auth.js";

const [email, password, name, role = "user"] = process.argv.slice(2);

if (!email || !password || !name || !["admin", "user"].includes(role)) {
  console.error('Uso: npm run create-user -- <email> <password> "<nombre>" [admin|user]');
  process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI!);

try {
  const users = client.db().collection("user");

  if (await users.findOne({ email: email.toLowerCase() })) {
    console.log(`El usuario ${email} ya existia: solo se actualiza el rol.`);
  } else {
    // Pasa por Better Auth para que la contraseña quede hasheada igual que en un registro normal.
    await auth.api.signUpEmail({ body: { email, password, name } });
    console.log(`Usuario ${email} creado.`);
  }

  await users.updateOne({ email: email.toLowerCase() }, { $set: { role } });
  console.log(`Rol de ${email}: ${role}`);
} catch (error) {
  console.error("No se pudo crear el usuario:", error);
  process.exitCode = 1;
} finally {
  await client.close();
  process.exit();
}
