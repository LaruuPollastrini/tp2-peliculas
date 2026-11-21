// PASO 5 — Controller: HTTP <-> agente, respondiendo con Server-Sent Events (SSE).
// En vez de un JSON al final, la respuesta queda ABIERTA y se van escribiendo eventos:
//
//   event: tool           data: {"name":"list_movies"}
//   event: token          data: {"text":"Hay "}
//   event: token          data: {"text":"12 peliculas"}
//   event: done           data: {}
//
// Cada evento termina con una linea en blanco (\n\n). Asi el front muestra el texto a medida que el
// modelo lo genera, en vez de esperar todo el loop (LLM → tool → LLM).
import { Request, Response } from "express";
import { streamAgent } from "../agent/agent.js";
import { ChatInput } from "../schemas/agent.schema.js";

// El plan gratuito de Groq tiene un limite de tokens por minuto. Si se pasa, el error trae
// code "rate_limit_exceeded" (status 429): se le avisa al usuario que espere, en vez de un error generico.
function isRateLimit(error: unknown): boolean {
  const e = error as { status?: number; error?: { error?: { code?: string } }; message?: string };
  return e?.status === 429 || e?.error?.error?.code === "rate_limit_exceeded" || /rate limit/i.test(e?.message ?? "");
}

function sendEvent(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function chat(req: Request<{}, {}, ChatInput>, res: Response): Promise<void> {
  const startedAt = Date.now();
  console.log(`[③ controller] mensaje de ${req.user?.email}: "${req.body.message}"`);

  // Si el usuario cierra la pestaña o cancela, se corta el agente (y la llamada a Groq).
  const abort = new AbortController();
  res.on("close", () => abort.abort());

  // Headers SSE. A partir de aca el status ya es 200: los errores se mandan como evento, no como 500.
  // (Auth y validacion corren ANTES, en la ruta: esos si responden 401/400 con JSON normal.)
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform", // que ningun proxy guarde ni comprima la respuesta
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // proxies tipo nginx: no acumular, mandar cada write al instante
  });
  res.flushHeaders();
  console.log("[③ controller] stream SSE abierto (200 text/event-stream)");

  let reply = "";
  let tokens = 0;

  try {
    // El usuario sale de la SESION (authMiddleware), nunca del body: el cliente no puede decir "soy admin".
    const user = req.user!;
    const context = { user: { id: user.id, name: user.name, email: user.email, role: user.role ?? "user" } };

    for await (const event of streamAgent(req.body.message, req.body.history, context, abort.signal)) {
      if (event.type === "token") {
        reply += event.text;
        tokens++;
      } else {
        console.log(`[③ controller] → SSE event: ${event.type} ${JSON.stringify(event)}`);
      }
      sendEvent(res, event.type, event);
    }
    sendEvent(res, "done", {});
    console.log(`[③ controller] → SSE event: done (${tokens} tokens en ${Date.now() - startedAt} ms)`);
    console.log(`[③ controller] respuesta final:\n${reply}`);
  } catch (error) {
    // Si se aborto, el cliente ya no esta: no hay a quien avisarle.
    if (abort.signal.aborted) {
      console.log(`[③ controller] el cliente cancelo despues de ${Date.now() - startedAt} ms`);
    } else {
      // El detalle (rate limit de Groq, etc.) queda en el log, no se le muestra al usuario.
      console.error("[③ controller] error del agente:", error);
      sendEvent(res, "error", {
        message: isRateLimit(error)
          ? "Hubo muchas consultas seguidas (límite del plan gratuito de Groq). Esperá unos segundos y volvé a preguntar."
          : "El asistente no pudo responder",
      });
    }
  } finally {
    res.end();
  }
}
