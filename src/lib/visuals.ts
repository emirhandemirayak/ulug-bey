export type VisualType =
  | "star_map"
  | "comparison"
  | "timeline"
  | "observatory"
  | "info"
  | "none";

export type VisualStar = {
  id: string;
  highlight?: boolean;
};

export type ComparisonRow = {
  label: string;
  ulugh: string;
  modern: string;
  note?: string;
};

export type TimelineEvent = {
  year: string;
  text: string;
};

export type ChatVisual = {
  type: VisualType;
  title: string;
  stars?: VisualStar[];
  rows?: ComparisonRow[];
  events?: TimelineEvent[];
  points?: string[];
};

export type ChatPayload = {
  answer: string;
  visual: ChatVisual;
  sources?: string[];
};

export const VISUAL_TYPES: VisualType[] = [
  "star_map",
  "comparison",
  "timeline",
  "observatory",
  "info",
  "none",
];

export function isVisualType(value: unknown): value is VisualType {
  return typeof value === "string" && VISUAL_TYPES.includes(value as VisualType);
}

export function parseChatPayload(raw: unknown): ChatPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.answer !== "string" || !obj.answer.trim()) return null;

  const visualRaw =
    obj.visual && typeof obj.visual === "object"
      ? (obj.visual as Record<string, unknown>)
      : {};
  const type = isVisualType(visualRaw.type) ? visualRaw.type : "none";
  const title =
    typeof visualRaw.title === "string" && visualRaw.title.trim()
      ? visualRaw.title
      : "Görsel";

  const stars: VisualStar[] | undefined = Array.isArray(visualRaw.stars)
    ? visualRaw.stars.reduce<VisualStar[]>((acc, s) => {
        if (!s || typeof s !== "object") return acc;
        const rec = s as Record<string, unknown>;
        if (typeof rec.id !== "string") return acc;
        acc.push({
          id: rec.id,
          highlight: rec.highlight !== false,
        });
        return acc;
      }, [])
    : undefined;

  const rows: ComparisonRow[] | undefined = Array.isArray(visualRaw.rows)
    ? visualRaw.rows.reduce<ComparisonRow[]>((acc, r) => {
        if (!r || typeof r !== "object") return acc;
        const rec = r as Record<string, unknown>;
        if (
          typeof rec.label !== "string" ||
          typeof rec.ulugh !== "string" ||
          typeof rec.modern !== "string"
        ) {
          return acc;
        }
        const row: ComparisonRow = {
          label: rec.label,
          ulugh: rec.ulugh,
          modern: rec.modern,
        };
        if (typeof rec.note === "string") row.note = rec.note;
        acc.push(row);
        return acc;
      }, [])
    : undefined;

  const events: TimelineEvent[] | undefined = Array.isArray(visualRaw.events)
    ? visualRaw.events.reduce<TimelineEvent[]>((acc, e) => {
        if (!e || typeof e !== "object") return acc;
        const rec = e as Record<string, unknown>;
        if (typeof rec.year !== "string" || typeof rec.text !== "string") {
          return acc;
        }
        acc.push({ year: rec.year, text: rec.text });
        return acc;
      }, [])
    : undefined;

  const points: string[] | undefined = Array.isArray(visualRaw.points)
    ? visualRaw.points.filter(
        (p): p is string => typeof p === "string" && p.trim().length > 0,
      )
    : undefined;

  const sources = Array.isArray(obj.sources)
    ? obj.sources.filter((s): s is string => typeof s === "string")
    : undefined;

  return {
    answer: obj.answer.trim(),
    visual: { type, title, stars, rows, events, points },
    sources,
  };
}

export const DEFAULT_COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: "Yıldız yılı",
    ulugh: "365g 6s 10d 8sn",
    modern: "365g 6s 9d 10sn",
    note: "Fark ~1 dakika",
  },
  {
    label: "Tropik yıl",
    ulugh: "~365g 5s 49d 15sn",
    modern: "~365g 5s 48d 45sn",
    note: "Mevsim yılı",
  },
  {
    label: "Ekliptik eğimi",
    ulugh: "23° 30′ 17″",
    modern: "23° 26′ 21″ (J2000)",
    note: "15. yy için kendi çağına daha da yakın",
  },
  {
    label: "Katalog",
    ulugh: "~1018 yıldız, yay dakikası",
    modern: "Gaia: miliyay-saniye",
    note: "Kimlikler aynı, kesinlik değişti",
  },
];

export const DEFAULT_TIMELINE: TimelineEvent[] = [
  { year: "1394", text: "Uluğ Bey (Mirza Muhammed Taragay) doğar." },
  { year: "1420’ler", text: "Semerkant Gözlemevi kurulur; büyük meridyen kadranı." },
  { year: "1437 civarı", text: "Zîc-i Sultânî yıldız kataloğu ve tablolar olgunlaşır." },
  { year: "1447", text: "Timurlu tahtına geçer." },
  { year: "1449", text: "Suikastte öldürülür; bilimsel miras Ali Kuşçu ile yayılır." },
];
