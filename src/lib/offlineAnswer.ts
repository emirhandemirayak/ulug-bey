import {
  DEFAULT_COMPARISON_ROWS,
  DEFAULT_TIMELINE,
  type ChatPayload,
} from "./visuals";
import type { KnowledgeChunk } from "./rag";

function includesAny(q: string, words: string[]): boolean {
  return words.some((w) => q.includes(w));
}

export function offlineAnswer(
  query: string,
  chunks: KnowledgeChunk[],
): ChatPayload {
  const q = query.toLocaleLowerCase("tr");
  const body = chunks
    .slice(0, 3)
    .map((c) => c.text)
    .join("\n\n");
  const clipped = body.length > 1400 ? `${body.slice(0, 1400)}…` : body;
  const sources = [...new Set(chunks.slice(0, 3).map((c) => c.title))];

  if (includesAny(q, ["proje", "tübitak", "tubitak", "ekip"])) {
    return {
      answer:
        clipped ||
        "Proje ayrıntıları henüz bilgi tabanına eklenmedi. content/project.md dosyasını doldurduğunuzda bu soruya net yanıt verilebilir. Şimdilik site, Uluğ Bey’in astronomik mirasını ve ölçümlerinin günümüzle karşılaştırmasını anlatmak üzere hazırlanmıştır.",
      visual: { type: "none", title: "Proje" },
      sources,
    };
  }

  if (
    includesAny(q, [
      "ölçüm",
      "güncel",
      "yakın",
      "yıl",
      "eğik",
      "karşılaştır",
      "modern",
      "doğru",
    ])
  ) {
    return {
      answer:
        clipped ||
        "Uluğ Bey’in yıldız yılı (~365g 6s 10d 8sn) modern değere yaklaşık bir dakika yakındır. Ekliptik eğimi kendi çağı için isabetlidir; parlak yıldız kimlikleri bugün de geçerlidir.",
      visual: {
        type: "comparison",
        title: "Uluğ Bey ve günümüz",
        rows: DEFAULT_COMPARISON_ROWS,
      },
      sources,
    };
  }

  if (
    includesAny(q, [
      "zîc",
      "zic",
      "katalog",
      "yıldız",
      "vega",
      "sirius",
      "harita",
    ])
  ) {
    return {
      answer:
        clipped ||
        "Zîc-i Sultânî yaklaşık 1018 yıldızın konumunu içeren Semerkant kataloğudur. Parlak yıldızların kimliği bugün de aynıdır; değişen şey koordinat çerçevesi ve kesinliktir.",
      visual: {
        type: "star_map",
        title: "Zîc-i Sultânî’den parlak yıldızlar",
        stars: [
          { id: "vega", highlight: true },
          { id: "deneb", highlight: true },
          { id: "altair", highlight: true },
          { id: "aldebaran", highlight: true },
          { id: "regulus", highlight: true },
          { id: "sirius", highlight: true },
        ],
      },
      sources,
    };
  }

  if (
    includesAny(q, [
      "gözlemevi",
      "alet",
      "kadran",
      "sekstant",
      "semerkant",
      "nasıl çalış",
    ])
  ) {
    return {
      answer:
        clipped ||
        "Semerkant gözlemevinin belkemiği, meridyen doğrultusunda yer altına inen büyük duvar kadranıdır. Teleskop yoktur; açı, büyük yarıçap ve titiz ölçeklerle ölçülür.",
      visual: {
        type: "observatory",
        title: "Semerkant meridyen kadranı",
      },
      sources,
    };
  }

  if (includesAny(q, ["kimdir", "hayat", "tarih", "ölüm", "doğum", "miras"])) {
    return {
      answer:
        clipped ||
        "Uluğ Bey (1394–1449) Timurlu hükümdar, matematikçi ve astronomdur. Semerkant’ta gözlemevi kurmuş, Zîc-i Sultânî’yi hazırlatmıştır.",
      visual: {
        type: "timeline",
        title: "Uluğ Bey zaman çizelgesi",
        events: DEFAULT_TIMELINE,
      },
      sources,
    };
  }

  return {
    answer:
      clipped ||
      "Bilgi tabanında bu soruya denk düşen net bir bölüm yok. Uluğ Bey’in ölçümleri, Zîc-i Sultânî, gözlemevi veya TÜBİTAK projesi hakkında sorabilirsiniz.",
    visual: { type: "none", title: "" },
    sources,
  };
}
