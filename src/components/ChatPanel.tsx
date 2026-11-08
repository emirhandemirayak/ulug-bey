"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
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
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [voice, setVoice] = useState<{
    index: number;
    status: "loading" | "playing";
  } | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const wasLoading = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    fetch("/api/tts")
      .then((r) => r.json())
      .then((d: { enabled?: boolean }) => setTtsEnabled(Boolean(d.enabled)))
      .catch(() => setTtsEnabled(false));
  }, []);

  const stopVoice = useCallback(() => {
    abortRef.current?.abort();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      URL.revokeObjectURL(audio.src);
      audioRef.current = null;
    }
    setVoice(null);
  }, []);

  useEffect(() => stopVoice, [stopVoice]);

  const speak = useCallback(
    async (index: number, text: string) => {
      stopVoice();
      setVoiceError(null);
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setVoice({ index, status: "loading" });
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("tts");
        const blob = await res.blob();
        if (ctrl.signal.aborted) return;
        const audio = new Audio(URL.createObjectURL(blob));
        audioRef.current = audio;
        audio.onended = stopVoice;
        audio.onerror = stopVoice;
        await audio.play();
        setVoice({ index, status: "playing" });
      } catch {
        if (ctrl.signal.aborted) return;
        stopVoice();
        setVoiceError("Ses şu anda oynatılamadı.");
      }
    },
    [stopVoice],
  );

  useEffect(() => {
    const finished = wasLoading.current && !loading;
    wasLoading.current = loading;
    if (!finished || !autoSpeak || !ttsEnabled) return;
    const index = messages.length - 1;
    const last = messages[index];
    if (last?.role !== "assistant" || !last.content) return;
    const timer = setTimeout(() => void speak(index, last.content), 0);
    return () => clearTimeout(timer);
  }, [loading, messages, autoSpeak, ttsEnabled, speak]);

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
        {ttsEnabled ? (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-gold-soft/80">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => {
                setAutoSpeak(e.target.checked);
                if (!e.target.checked) stopVoice();
              }}
              className="accent-[#d4af37]"
            />
            Sesli yanıt
          </label>
        ) : null}
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
            Uluğ Bey’e ölçümleri, Zîc-i Sultânî’yi, rasathanesini veya bu
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
            {m.role === "assistant" &&
            ttsEnabled &&
            m.content &&
            !(loading && i === messages.length - 1) ? (
              <button
                type="button"
                onClick={() =>
                  voice?.index === i ? stopVoice() : void speak(i, m.content)
                }
                className="mt-2 rounded-full border border-gold/30 px-3 py-1 text-[11px] text-gold-soft transition hover:border-gold hover:bg-gold/15"
              >
                {voice?.index === i
                  ? voice.status === "loading"
                    ? "Ses hazırlanıyor… (durdur)"
                    : "■ Durdur"
                  : "▶ Uluğ Bey'den dinle"}
              </button>
            ) : null}
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

      {error || voiceError ? (
        <p className="mt-3 text-xs text-red-300/90">{error ?? voiceError}</p>
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
