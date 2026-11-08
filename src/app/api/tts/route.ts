export const runtime = "nodejs";

const MAX_CHARS = 1200;
const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 60_000;

const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

function speechText(raw: string): string {
  return raw
    .replace(/[*_`#>]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CHARS);
}

type Provider = "gemini" | "elevenlabs";

function config() {
  const env = process.env;
  const geminiKey =
    env.GEMINI_TTS_API_KEY ||
    (env.OPENAI_BASE_URL?.includes("generativelanguage")
      ? env.OPENAI_API_KEY
      : undefined);
  const elevenKey = env.ELEVENLABS_API_KEY;
  const elevenVoice = env.ELEVENLABS_VOICE_ID;

  const wanted = env.TTS_PROVIDER as Provider | undefined;
  const available: Provider[] = [];
  if (geminiKey) available.push("gemini");
  if (elevenKey && elevenVoice) available.push("elevenlabs");
  const provider =
    wanted && available.includes(wanted) ? wanted : available[0];

  return {
    provider,
    geminiKey,
    geminiModel: env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts",
    geminiVoice: env.GEMINI_TTS_VOICE || "Algenib",
    elevenKey,
    elevenVoice,
    elevenModel: env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
  };
}

function wavFromPcm(pcm: Buffer, sampleRate: number): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function geminiSpeech(
  text: string,
  c: ReturnType<typeof config>,
): Promise<Response> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(c.geminiModel)}:generateContent`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: c.geminiVoice } },
      },
    },
  });

  let res: Response | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "x-goog-api-key": c.geminiKey as string,
        "Content-Type": "application/json",
      },
      body,
    });
    if (res.status !== 503 && res.status !== 429) break;
    await new Promise((r) => setTimeout(r, 700));
  }
  if (!res || !res.ok) {
    return Response.json(
      { error: "Ses üretilemedi", status: res?.status ?? 0 },
      { status: 502 },
    );
  }

  const json = (await res.json()) as {
    candidates?: {
      content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] };
    }[];
  };
  const inline = json.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData?.data,
  )?.inlineData;
  if (!inline?.data) {
    return Response.json({ error: "Ses üretilemedi" }, { status: 502 });
  }

  let audio: Buffer = Buffer.from(inline.data, "base64");
  if (audio.subarray(0, 4).toString("ascii") !== "RIFF") {
    const rate = Number(/rate=(\d+)/.exec(inline.mimeType ?? "")?.[1]) || 24000;
    audio = wavFromPcm(audio, rate);
  }
  return new Response(new Uint8Array(audio), {
    headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" },
  });
}

async function elevenLabsSpeech(
  text: string,
  c: ReturnType<typeof config>,
): Promise<Response> {
  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(c.elevenVoice as string)}?output_format=mp3_44100_64`,
    {
      method: "POST",
      headers: {
        "xi-api-key": c.elevenKey as string,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: c.elevenModel,
        voice_settings: { stability: 0.55, similarity_boost: 0.8 },
      }),
    },
  );

  if (!upstream.ok || !upstream.body) {
    return Response.json(
      { error: "Ses üretilemedi", status: upstream.status },
      { status: 502 },
    );
  }
  return new Response(upstream.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}

export async function GET() {
  const { provider } = config();
  return Response.json({ enabled: Boolean(provider), provider: provider ?? null });
}

export async function POST(req: Request) {
  const c = config();
  if (!c.provider) {
    return Response.json({ error: "Ses yapılandırılmadı" }, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return Response.json({ error: "Çok fazla istek" }, { status: 429 });
  }

  let text = "";
  try {
    const body = (await req.json()) as { text?: unknown };
    text = typeof body.text === "string" ? speechText(body.text) : "";
  } catch {
    return Response.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  if (!text) {
    return Response.json({ error: "Metin gerekli" }, { status: 400 });
  }

  return c.provider === "gemini"
    ? geminiSpeech(text, c)
    : elevenLabsSpeech(text, c);
}
