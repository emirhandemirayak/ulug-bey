import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type KnowledgeChunk = {
  id: string;
  source: string;
  title: string;
  text: string;
  embedding?: number[];
};

type Cache = {
  chunks: KnowledgeChunk[];
  embedded: boolean;
};

const globalForRag = globalThis as unknown as { __ulughRag?: Cache };

function cache(): Cache {
  if (!globalForRag.__ulughRag) {
    globalForRag.__ulughRag = { chunks: [], embedded: false };
  }
  return globalForRag.__ulughRag;
}

function contentDir(): string {
  return path.join(process.cwd(), "content");
}

function splitSections(markdown: string, source: string): KnowledgeChunk[] {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  const parts = normalized.split(/^## /m);
  const chunks: KnowledgeChunk[] = [];
  const fileTitle =
    parts[0]
      ?.split("\n")
      .find((l) => l.startsWith("# "))
      ?.replace(/^#\s+/, "")
      .trim() || source;

  const intro = parts[0]?.replace(/^#.*\n/, "").trim();
  if (intro) {
    chunks.push({
      id: `${source}::giris`,
      source,
      title: fileTitle,
      text: intro,
    });
  }

  for (let i = 1; i < parts.length; i += 1) {
    const block = parts[i];
    const nl = block.indexOf("\n");
    const heading = (nl === -1 ? block : block.slice(0, nl)).trim();
    const body = (nl === -1 ? "" : block.slice(nl + 1)).trim();
    const text = `${heading}\n\n${body}`.trim();
    if (text.length < 40) continue;
    const pieces = splitLong(text, 1200);
    pieces.forEach((piece, idx) => {
      chunks.push({
        id: `${source}::${heading}::${idx}`,
        source,
        title: heading,
        text: piece,
      });
    });
  }

  return chunks;
}

function splitLong(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const paras = text.split(/\n\n+/);
  const out: string[] = [];
  let buf = "";
  for (const p of paras) {
    if ((buf + "\n\n" + p).length > max && buf) {
      out.push(buf.trim());
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

export async function loadChunks(): Promise<KnowledgeChunk[]> {
  const c = cache();
  if (c.chunks.length) return c.chunks;

  const dir = contentDir();
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md"));
  const all: KnowledgeChunk[] = [];
  for (const file of files) {
    const raw = await readFile(path.join(dir, file), "utf8");
    all.push(...splitSections(raw, file.replace(/\.md$/, "")));
  }
  c.chunks = all;
  return all;
}

function apiConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const chatModel = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
  const embeddingModel =
    process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
  return { apiKey, baseUrl, chatModel, embeddingModel };
}

export function hasLlmKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

async function embedTexts(texts: string[]): Promise<number[][]> {
  const { apiKey, baseUrl, embeddingModel } = apiConfig();
  if (!apiKey) throw new Error("NO_API_KEY");

  const res = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: embeddingModel, input: texts }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embedding failed: ${res.status} ${err}`);
  }
  const json = (await res.json()) as {
    data: { index: number; embedding: number[] }[];
  };
  return json.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function tokenize(text: string): string[] {
  return text
    .toLocaleLowerCase("tr")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function keywordScore(query: string, chunk: KnowledgeChunk): number {
  const q = new Set(tokenize(query));
  const words = tokenize(`${chunk.title} ${chunk.text}`);
  let hit = 0;
  for (const w of words) {
    if (q.has(w)) hit += 1;
  }
  return hit / Math.sqrt(words.length + 1);
}

async function ensureEmbeddings(chunks: KnowledgeChunk[]): Promise<boolean> {
  const c = cache();
  if (c.embedded) return true;
  if (!hasLlmKey()) return false;
  try {
    const vectors = await embedTexts(chunks.map((ch) => `${ch.title}\n${ch.text}`));
    chunks.forEach((ch, i) => {
      ch.embedding = vectors[i];
    });
    c.embedded = true;
    return true;
  } catch {
    return false;
  }
}

export async function retrieve(
  query: string,
  k = 5,
): Promise<KnowledgeChunk[]> {
  const chunks = await loadChunks();
  const embedded = await ensureEmbeddings(chunks);

  if (embedded && chunks[0]?.embedding) {
    try {
      const [qVec] = await embedTexts([query]);
      return [...chunks]
        .map((ch) => ({
          ch,
          score: ch.embedding ? cosine(qVec, ch.embedding) : 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, k)
        .map((x) => x.ch);
    } catch {
      /* keyword fallback */
    }
  }

  return [...chunks]
    .map((ch) => ({ ch, score: keywordScore(query, ch) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.ch);
}

export function formatContext(chunks: KnowledgeChunk[]): string {
  return chunks
    .map(
      (c, i) =>
        `### Kaynak ${i + 1}: ${c.source} — ${c.title}\n${c.text}`,
    )
    .join("\n\n");
}

export { apiConfig };
