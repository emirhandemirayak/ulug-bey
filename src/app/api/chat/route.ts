import { completeChat } from "@/lib/openaiChat";
import { offlineAnswer } from "@/lib/offlineAnswer";
import { hasLlmKey, retrieve } from "@/lib/rag";
import type { ChatPayload } from "@/lib/visuals";

export const runtime = "nodejs";

type Incoming = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  let messages: Incoming[] = [];
  try {
    const body = (await req.json()) as { messages?: Incoming[] };
    messages = Array.isArray(body.messages) ? body.messages : [];
  } catch {
    return Response.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content?.trim()) {
    return Response.json({ error: "Soru gerekli" }, { status: 400 });
  }

  const query = lastUser.content.trim();
  const chunks = await retrieve(query, 5);

  let payload: ChatPayload;
  let mode: "llm" | "offline" = "offline";
  if (hasLlmKey()) {
    try {
      payload = await completeChat(
        messages.filter((m) => m.content.trim()).slice(-8),
        chunks,
      );
      mode = "llm";
    } catch {
      payload = offlineAnswer(query, chunks);
    }
  } else {
    payload = offlineAnswer(query, chunks);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      send("meta", { mode, sources: payload.sources ?? [] });
      send("visual", payload.visual);
      const text = payload.answer;
      const step = 24;
      for (let i = 0; i < text.length; i += step) {
        send("token", text.slice(i, i + step));
        await new Promise((r) => setTimeout(r, 16));
      }
      send("done", {});
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
