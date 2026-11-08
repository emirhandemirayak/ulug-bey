import raw from "../../data/star-comparison.json";

export type StarGroup = "zodiac" | "north" | "south";

export type ComparedStar = {
  id: string;
  hip: number;
  names: string[];
  modern: string;
  bayer: string;
  constellation: string;
  group: StarGroup;
  confidence: "high" | "approx";
  note: string | null;
  catalogNo: number;
  derivedFromPtolemy: boolean;
  magUlugh: number;
  magModern: number;
  ulugh: { lon: number; lat: number };
  modernPos: { lon: number; lat: number };
  dLonArcmin: number;
  dLatArcmin: number;
  errorArcmin: number;
};

export type AbsentStar = {
  names: string[];
  modern: string;
  bayer: string;
  reason: string;
};

export type CatalogStats = {
  stars: number;
  secureStars: number;
  medianErrorArcmin: number;
  p25ErrorArcmin: number;
  p75ErrorArcmin: number;
  meanDLonArcmin: number;
  meanDLatArcmin: number;
  medianResidualArcmin: number;
};

export const COMPARISON = raw as {
  source: {
    title: string;
    authors: string;
    reference: string;
    vizier: string;
    epoch: number;
    note: string;
  };
  catalog: CatalogStats;
  absent: AbsentStar[];
  stars: ComparedStar[];
};

export const GROUP_LABEL: Record<StarGroup, string> = {
  zodiac: "Zodyak kuşağı",
  north: "Kuzey ve kutup çevresi",
  south: "Güney ve Avcı",
};

export const GROUP_COLOR: Record<StarGroup, string> = {
  zodiac: "#e8b84a",
  north: "#8fb8ff",
  south: "#d79bff",
};

export const SIGNS = [
  "Koç",
  "Boğa",
  "İkizler",
  "Yengeç",
  "Aslan",
  "Başak",
  "Terazi",
  "Akrep",
  "Yay",
  "Oğlak",
  "Kova",
  "Balık",
];

export function formatDeg(value: number, signed = false): string {
  const sign = value < 0 ? "−" : signed ? "+" : "";
  const abs = Math.abs(value);
  const d = Math.floor(abs);
  const m = Math.round((abs - d) * 60);
  const dd = m === 60 ? d + 1 : d;
  const mm = m === 60 ? 0 : m;
  return `${sign}${dd}° ${String(mm).padStart(2, "0")}′`;
}

export function errorDegrees(arcmin: number): string {
  return (arcmin / 60).toFixed(2).replace(".", ",");
}

export function arcminText(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}′`;
}
