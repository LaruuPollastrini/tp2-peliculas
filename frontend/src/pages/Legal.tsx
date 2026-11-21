// Paginas publicas que Google exige para publicar la app de OAuth (login con Google para cualquier cuenta).
// La consigna no las pide: son un requisito de Google Cloud > Google Auth Platform > Informacion de la marca.

export const Privacy = () => (
  <section className="rounded-md border border-sand bg-lino p-6 text-cafe">
    <h2 className="font-serif text-3xl font-medium text-cafe">Política de privacidad</h2>
    <p className="mt-3">
      Esta aplicación es un trabajo práctico académico. Al iniciar sesión con email, GitHub o Google se
      guardan únicamente tu nombre, tu email y tu foto de perfil (si el proveedor la envía), para
      identificar tu cuenta y mostrar quién cargó cada película.
    </p>
    <p className="mt-3">
      Los datos se almacenan en una base de datos MongoDB y no se comparten con terceros ni se usan con
      fines comerciales. Podés pedir que se elimine tu cuenta escribiendo a la dirección de contacto de la
      app.
    </p>
  </section>
);

export const Terms = () => (
  <section className="rounded-md border border-sand bg-lino p-6 text-cafe">
    <h2 className="font-serif text-3xl font-medium text-cafe">Condiciones del servicio</h2>
    <p className="mt-3">
      Esta aplicación es un trabajo práctico académico, ofrecida sin garantías y sin fines comerciales.
      Cada usuario es responsable de las películas que carga. Los administradores pueden editar o eliminar
      cualquier contenido.
    </p>
  </section>
);
