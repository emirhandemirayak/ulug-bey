"use client";

import { useCallback, useRef, useState } from "react";
import { ChatPanel, type ChatMessage } from "./ChatPanel";
import { Starfield } from "./Starfield";
import { VisualStage } from "./VisualStage";
import { SUGGESTED_QUESTIONS } from "../lib/questions";
import type { ChatVisual } from "../lib/visuals";

async function readSse(
  response: Response,
  onEvent: (event: string, data: unknown) => void,
) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Akış yok");
  const decoder = new TextDecoder();
  let buf = "";
  let event = "message";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n");
    buf = parts.pop() ?? "";
    for (const line of parts) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        const raw = line.slice(5).trim();
        try {
          onEvent(event, JSON.parse(raw));
        } catch {
          onEvent(event, raw);
        }
      } else if (line.trim() === "") {
        event = "message";
      }
    }
  }
}

export function HomeExperience() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [visual, setVisual] = useState<ChatVisual | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileVisualOpen, setMobileVisualOpen] = useState(false);
  const chatRef = useRef<HTMLElement>(null);
  const sending = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);

  const send = useCallback(async (text: string) => {
    if (sending.current) return;
    sending.current = true;
    setError(null);
    setLoading(true);
    chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    const history: ChatMessage[] = [
      ...messagesRef.current,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ];
    messagesRef.current = history;
    setMessages(history);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history
            .filter((m) => m.content)
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
        }),
      });
      if (!res.ok) {
        throw new Error("Yanıt alınamadı");
      }

      let sources: string[] = [];
      await readSse(res, (event, data) => {
        if (event === "meta" && data && typeof data === "object") {
          const rec = data as { sources?: string[] };
          sources = rec.sources ?? [];
        }
        if (event === "visual" && data && typeof data === "object") {
          setVisual(data as ChatVisual);
          const vis = data as ChatVisual;
          if (vis.type && vis.type !== "none") setMobileVisualOpen(true);
        }
        if (event === "token" && typeof data === "string") {
          const copy = [...messagesRef.current];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            copy[copy.length - 1] = {
              ...last,
              content: last.content + data,
              sources,
            };
          }
          messagesRef.current = copy;
          setMessages(copy);
        }
      });
    } catch {
      setError("Sohbet şu anda yanıt veremedi. Biraz sonra yeniden deneyin.");
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant" && !last.content) copy.pop();
        messagesRef.current = copy;
        return copy;
      });
    } finally {
      setLoading(false);
      sending.current = false;
    }
  }, []);

  const askFromHero = (q: string) => {
    void send(q);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="fixed inset-0 z-0 bg-[#050510]">
        <div className="milky-haze absolute inset-0" />
        <Starfield />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#050510] to-transparent" />
        <ObservatorySilhouette />
      </div>

      <section className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">
          Semerkant · Zîc-i Sultânî · TÜBİTAK
        </p>
        <h1 className="mt-5 font-serif text-5xl leading-tight text-gold-soft sm:text-7xl">
          Uluğ Bey’in göğü
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg">
          15. yüzyıl Semerkant’ında ölçülen yıldız yılı, eksen eğikliği ve
          katalog hâlâ gökyüzünün aynı cisimlerini gösterir. Bu sayfa, Uluğ Bey
          ile yürüttüğümüz projenin sorularına astronomik bir sahnede yanıt
          verir.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => askFromHero(q)}
              className="rounded-full border border-gold/40 bg-night/50 px-4 py-2 text-sm text-gold-soft backdrop-blur-sm transition hover:border-gold hover:bg-gold/15"
            >
              {q}
            </button>
          ))}
        </div>
        <a
          href="#sohbet"
          className="mt-12 text-xs uppercase tracking-[0.25em] text-gold/80 hover:text-gold"
        >
          Sohbete in
        </a>
      </section>

      <section
        id="sohbet"
        ref={chatRef}
        className="relative mx-auto grid max-w-6xl gap-6 px-4 pb-24 md:grid-cols-2 md:px-6"
      >
        <div className="gold-border panel-glass rounded-3xl p-5 shadow-[0_0_80px_rgba(30,20,80,0.45)] md:p-7">
          <ChatPanel
            messages={messages}
            loading={loading}
            error={error}
            onSend={(t) => void send(t)}
          />
        </div>
        <div className="gold-border panel-glass hidden rounded-3xl p-5 md:block md:p-7">
          <VisualStage visual={visual} />
        </div>
      </section>

      {visual && visual.type !== "none" ? (
        <button
          type="button"
          className="fixed bottom-5 right-5 z-20 rounded-full bg-gold px-4 py-2 text-sm font-medium text-night shadow-lg md:hidden"
          onClick={() => setMobileVisualOpen(true)}
        >
          Görseli aç
        </button>
      ) : null}

      {mobileVisualOpen ? (
        <div className="fixed inset-0 z-30 flex flex-col bg-night/95 p-4 md:hidden">
          <button
            type="button"
            className="mb-3 self-end text-sm text-gold"
            onClick={() => setMobileVisualOpen(false)}
          >
            Kapat
          </button>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <VisualStage visual={visual} />
          </div>
        </div>
      ) : null}

      <footer className="relative px-6 pb-10 text-center text-xs text-gold-soft/50">
        Uluğ Bey astronomisi · eğitim amaçlı karşılaştırmalar · proje metni
        content/project.md içinden güncellenir
      </footer>
    </div>
  );
}

function ObservatorySilhouette() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full text-black/80"
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M0 160 L0 110 L80 110 L110 70 L180 70 L210 110 L320 110 L340 90 L420 90 L450 110 L700 110 L730 40 L780 40 L810 110 L1100 110 L1130 85 L1220 85 L1250 110 L1440 110 L1440 160 Z"
      />
      <path
        fill="none"
        stroke="#d4af37"
        strokeOpacity="0.25"
        d="M730 40 L810 110 L700 110 Z"
      />
    </svg>
  );
}
