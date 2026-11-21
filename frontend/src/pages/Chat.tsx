// Ruta privada "/asistente": chat con el agente de LangChain. La respuesta llega por SSE: el texto
// aparece a medida que el modelo lo genera, y mientras corre una tool se muestra que esta consultando.
// Memoria corta: con cada mensaje se mandan los ultimos (HISTORY_SIZE) de la conversacion.
// No usa RTK Query: RTK Query espera UNA respuesta por request, y aca llegan muchos eventos.
import { useRef, useState, type FormEvent } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readSSE } from "../lib/sse";

// El modelo responde en Markdown (**negrita**, listas, tablas). react-markdown lo convierte a elementos
// React y NO interpreta HTML crudo: si el modelo devolviera <script>, se muestra como texto (sin XSS).
// Tailwind resetea listas y margenes (preflight), por eso se reponen aca con variantes [&_tag].
const MARKDOWN_STYLES =
  "[&_p:not(:last-child)]:mb-2 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_strong]:font-semibold [&_code]:rounded [&_code]:bg-sand [&_code]:px-1 [&_a]:underline " +
  "[&_table]:my-2 [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:border-sand " +
  "[&_th]:bg-sand-soft [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-medium " +
  "[&_td]:border [&_td]:border-sand [&_td]:px-2 [&_td]:py-1 [&_td]:align-top";

// tools: que tools pidio el agente para armar ESTA respuesta (llegan por el evento SSE "tool").
type ToolCall = { name: string; args: Record<string, unknown> };
type ChatMessage = { role: "user" | "assistant"; text: string; tools: ToolCall[] };

// Nombre tecnico de la tool → lo que ve el usuario mientras corre (STATUS) y despues (DONE).
const TOOL_STATUS: Record<string, string> = {
  list_movies: "Buscando en el catálogo…",
  list_my_movies: "Buscando tus películas…",
  get_movie_by_id: "Buscando la película…",
  create_movie: "Cargando la película…",
  delete_movie: "Eliminando la película…",
};

const TOOL_DONE: Record<string, string> = {
  list_movies: "Buscó en el catálogo",
  list_my_movies: "Buscó tus películas",
  get_movie_by_id: "Consultó una película",
  create_movie: "Cargó una película",
  delete_movie: "Eliminó una película",
};

// Cuantos mensajes anteriores se mandan: mas memoria = mas tokens del limite gratuito de Groq.
const HISTORY_SIZE = 6;

const EXAMPLES = ["¿Qué películas de ciencia ficción hay?", "¿Cuáles son mis películas?", "¿Qué podés hacer?"];

export const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const loading = status !== null;

  // Actualiza el ultimo mensaje (el del asistente) sin mutar el array.
  const updateAssistant = (update: (m: ChatMessage) => ChatMessage) =>
    setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? update(m) : m)));

  const send = async (raw: string) => {
    const message = raw.trim();
    if (!message || loading) return;

    // Solo el texto de los mensajes anteriores (sin los vacios de una respuesta que fallo).
    const history = messages
      .filter((m) => m.text)
      .slice(-HISTORY_SIZE)
      .map((m) => ({ role: m.role, content: m.text }));

    setInput("");
    setError(null);
    setStatus("Pensando…");
    // El mensaje del asistente arranca vacio y se va llenando con cada evento "token".
    setMessages((prev) => [
      ...prev,
      { role: "user", text: message, tools: [] },
      { role: "assistant", text: "", tools: [] },
    ]);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      // Mismo origen: el proxy de Vite (local) o el rewrite de Render mandan /api al backend.
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
        signal: abort.signal,
      });

      // Auth (401) y validacion (400) fallan ANTES de abrir el stream: llegan como JSON normal.
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Error ${response.status}`);
      }

      await readSSE(response, ({ event, data }) => {
        const payload = data as { text?: string; name?: string; args?: ToolCall["args"]; message?: string };
        if (event === "tool" && payload.name) {
          const call: ToolCall = { name: payload.name, args: payload.args ?? {} };
          setStatus(TOOL_STATUS[call.name] ?? "Consultando…");
          updateAssistant((m) => ({ ...m, tools: [...m.tools, call] }));
        }
        if (event === "token" && payload.text) {
          const text = payload.text;
          setStatus(null);
          updateAssistant((m) => ({ ...m, text: m.text + text }));
        }
        if (event === "error") setError(payload.message ?? "El asistente no pudo responder");
      });
    } catch (err) {
      if (!abort.signal.aborted) setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setStatus(null);
      abortRef.current = null;
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <section className="flex flex-col gap-5 rounded-md border border-sand bg-lino p-6">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-3xl font-medium text-cafe">Asistente</h2>
          {messages.length > 0 && !loading && (
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setError(null);
              }}
              className="text-sm text-topo underline-offset-4 hover:text-cafe hover:underline"
            >
              Nueva conversación
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-topo">
          Preguntá por el catálogo en tus palabras. Recuerda los últimos mensajes de esta conversación.
        </p>
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => send(example)}
              className="rounded border border-sand px-3 py-1.5 text-sm text-cafe hover:bg-sand-soft"
            >
              {example}
            </button>
          ))}
        </div>
      )}

      <ul className="flex flex-col gap-3" aria-live="polite">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <li key={i} className="max-w-[80%] self-end rounded-md bg-cafe px-3 py-2 text-lino">
              {m.text}
            </li>
          ) : (
            <li key={i} className="flex max-w-full flex-col gap-1 self-start">
              {/* Las tools aparecen ANTES del texto: el agente primero consulta y despues responde. */}
              {m.tools.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-xs text-topo">
                  {/* Texto amigable; el detalle tecnico (tool + argumentos) queda en el tooltip. */}
                  {m.tools.map((t, j) => (
                    <span
                      key={j}
                      title={`Tool: ${t.name}(${JSON.stringify(t.args)})`}
                      className="rounded border border-sand bg-arena px-2 py-0.5 text-topo"
                    >
                      {TOOL_DONE[t.name] ?? "Consultó el catálogo"}
                    </span>
                  ))}
                </div>
              )}
              {/* overflow-x-auto: una tabla ancha scrollea adentro de la burbuja en el celular */}
              <div
                className={`max-w-full overflow-x-auto rounded-md border border-sand bg-arena px-3 py-2 text-cafe ${MARKDOWN_STYLES}`}
              >
                {m.text ? (
                  <Markdown remarkPlugins={[remarkGfm]}>{m.text}</Markdown>
                ) : (
                  loading && i === messages.length - 1 && "…"
                )}
              </div>
            </li>
          )
        )}
      </ul>

      {status && <p className="text-sm text-topo italic">{status}</p>}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Mensaje
        </label>
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          placeholder="¿Qué películas de Nolan hay?"
          className="flex-1 rounded border border-sand px-3 py-2"
        />
        {loading ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="rounded border border-sand px-4 py-2 text-sm font-medium text-cafe hover:bg-sand-soft"
          >
            Cancelar
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded bg-cafe px-4 py-2 text-sm font-medium text-lino hover:bg-cafe-soft disabled:opacity-50"
          >
            Enviar
          </button>
        )}
      </form>
    </section>
  );
};
