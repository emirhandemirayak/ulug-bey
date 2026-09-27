"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { SUGGESTED_QUESTIONS } from "../lib/questions";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

type Props = {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  onSend: (text: string) => void;
};

export function ChatPanel({ messages, loading, error, onSend }: Props) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || loading) return;
    setDraft("");
    onSend(text);
  };

  return (
    <div className="flex h-full min-h-[420px] flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-gold/20 pb-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
            Sohbet
          </p>
          <h2 className="font-serif text-2xl text-gold-soft">
            Uluğ Bey ile Konuş
          </h2>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={loading}
            onClick={() => onSend(q)}
            className="rounded-full border border-gold/30 bg-indigo/40 px-3 py-1.5 text-left text-xs text-gold-soft transition hover:border-gold hover:bg-indigo/70 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-night">
        {messages.length === 0 ? (
          <p className="text-sm leading-relaxed text-foreground/65">
            Uluğ Bey'e ölçümleri, Zîc-i Sultânî'yi, rasathanesini veya bu
            projeyi sorun — yanıtları bilgi tabanındaki metinlere dayanır.
          </p>
        ) : null}
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}-${m.content.slice(0, 12)}`}
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-8 border border-gold/25 bg-gold/10"
                : "mr-4 border border-white/10 bg-white/5"
            }`}
          >
            <p className="mb-1 text-[10px] uppercase tracking-widest text-gold/80">
              {m.role === "user" ? "Siz" : "Uluğ Bey"}
            </p>
            <p className="whitespace-pre-wrap">{m.content}</p>
            {m.sources && m.sources.length ? (
              <p className="mt-2 text-[11px] text-gold-soft/60">
                Kaynak: {m.sources.join(" · ")}
              </p>
            ) : null}
          </div>
        ))}
        {loading ? (
          <p className="animate-pulse text-xs text-gold-soft/70">
            Gökyüzü kayıtları taranıyor…
          </p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="mt-3 text-xs text-red-300/90">{error}</p>
      ) : null}

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Bir soru yazın…"
          className="flex-1 rounded-full border border-gold/30 bg-night/80 px-4 py-3 text-sm outline-none ring-gold/40 placeholder:text-foreground/35 focus:ring-2"
        />
        <button
          type="submit"
          disabled={loading || !draft.trim()}
          className="rounded-full bg-gold px-5 py-3 text-sm font-medium text-night transition hover:bg-gold-soft disabled:opacity-40"
        >
          Gönder
        </button>
      </form>
    </div>
  );
}
