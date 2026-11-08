// Ekliptik koordinatlarda (1437 dönemi) kutupsal gök haritası matematiği.

export const LAT_MIN = -85;
const DEG = Math.PI / 180;

/** 1437 → J2000 arası presesyon: ~50,29″/yıl × 563 yıl ≈ 7,865°. */
export const PRECESSION_1437_DEG = 7.865;

/**
 * Azimutal eşit uzaklıklı izdüşüm, merkez = kuzey ekliptik kutbu.
 * Birim disk koordinatı döner (kenar = enlem LAT_MIN).
 * Boylam saat yönünün tersine artar; 0° (Koç) soldadır (burç çarkı düzeni).
 */
export function project(lon: number, lat: number): { u: number; v: number } {
  const r = (90 - lat) / (90 - LAT_MIN);
  const phi = (180 + lon) * DEG;
  return { u: r * Math.cos(phi), v: r * Math.sin(phi) };
}

export function radiusOfLat(lat: number): number {
  return (90 - lat) / (90 - LAT_MIN);
}

export function angleOfLon(lon: number): number {
  return (180 + lon) * DEG;
}

/** Galaktik (l, b) → 1437 ekliptik (boylam, enlem), derece. */
export function galacticToEcliptic1437(l: number, b: number): [number, number] {
  const lr = l * DEG;
  const br = b * DEG;
  const xg = Math.cos(br) * Math.cos(lr);
  const yg = Math.cos(br) * Math.sin(lr);
  const zg = Math.sin(br);
  // ICRS ← galaktik (Hipparcos A_G' devriği)
  const xe = -0.0548755604 * xg + 0.4941094279 * yg - 0.867666149 * zg;
  const ye = -0.8734370902 * xg - 0.44482963 * yg - 0.1980763734 * zg;
  const ze = -0.4838350155 * xg + 0.7469822445 * yg + 0.4559837762 * zg;
  const eps = 23.4392911 * DEG;
  const xc = xe;
  const yc = ye * Math.cos(eps) + ze * Math.sin(eps);
  const zc = -ye * Math.sin(eps) + ze * Math.cos(eps);
  const lon = ((Math.atan2(yc, xc) / DEG - PRECESSION_1437_DEG) % 360 + 360) % 360;
  const lat = Math.asin(Math.max(-1, Math.min(1, zc))) / DEG;
  return [lon, lat];
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export type MilkyGlow = {
  u: number;
  v: number;
  /** 0..1 göreli parlaklık */
  w: number;
  /** sıcaklık: 0 mavimsi … 1 sarımsı */
  warm: number;
};

export type MilkyDust = { color: string; coords: Float32Array };

export type MilkyWay = { dust: MilkyDust[]; glows: MilkyGlow[] };

const WARM_BUCKETS = 6;
const ALPHA_BUCKETS = 4;

/** Samanyolu için sahte-rastgele ama deterministik toz ve parıltı (birim disk). */
export function buildMilkyWay(): MilkyWay {
  const rand = mulberry32(1437);

  // Galaktik boylama göre parlaklık: merkez (l≈0) ve Kuğu kolu güçlü.
  const wrap = (a: number) => Math.min(Math.abs(a), 360 - Math.abs(a));
  const intensity = (l: number) =>
    0.3 + Math.exp(-((wrap(l) / 42) ** 2)) * 0.75 + Math.exp(-((wrap(l - 80) / 30) ** 2)) * 0.4;

  const pick = (): number => {
    for (let i = 0; i < 40; i += 1) {
      const l = rand() * 360;
      if (rand() < intensity(l) / 1.45) return l;
    }
    return rand() * 360;
  };

  const buckets: number[][] = Array.from(
    { length: WARM_BUCKETS * ALPHA_BUCKETS },
    () => [],
  );
  const DUST = 30000;
  for (let i = 0; i < DUST; i += 1) {
    const l = pick();
    const core = Math.exp(-((wrap(l) / 40) ** 2));
    const spread = 5 + 4.5 * core;
    const b = gaussian(rand) * spread * (rand() < 0.22 ? 2.3 : 1);
    const [lon, lat] = galacticToEcliptic1437(l, b);
    const { u, v } = project(lon, lat);
    const w = Math.min(1, intensity(l) * (0.3 + rand() * 0.7) * Math.exp(-Math.abs(b) / 12));
    const warm = Math.min(0.999, core * 0.9 + rand() * 0.15);
    const wb = Math.floor(warm * WARM_BUCKETS);
    const ab = Math.min(ALPHA_BUCKETS - 1, Math.floor(w * ALPHA_BUCKETS));
    buckets[wb * ALPHA_BUCKETS + ab].push(u, v);
  }

  const dust: MilkyDust[] = buckets.map((pts, idx) => {
    const wb = Math.floor(idx / ALPHA_BUCKETS);
    const ab = idx % ALPHA_BUCKETS;
    const warm = (wb + 0.5) / WARM_BUCKETS;
    const r = Math.round(160 + warm * 90);
    const g = Math.round(172 + warm * 50);
    const bl = Math.round(232 - warm * 95);
    const alpha = 0.035 + ((ab + 0.5) / ALPHA_BUCKETS) * 0.1;
    return { color: `rgba(${r},${g},${bl},${alpha.toFixed(3)})`, coords: new Float32Array(pts) };
  });

  const glows: MilkyGlow[] = [];
  for (let i = 0; i < 90; i += 1) {
    const l = pick();
    const b = gaussian(rand) * 4;
    const [lon, lat] = galacticToEcliptic1437(l, b);
    const { u, v } = project(lon, lat);
    glows.push({
      u,
      v,
      w: Math.min(1, intensity(l) * (0.5 + rand() * 0.5)),
      warm: Math.exp(-((wrap(l) / 32) ** 2)),
    });
  }
  return { dust, glows };
}

/** B−V → RGB (yaklaşık yıldız rengi). */
export function colorFromBV(bv: number): [number, number, number] {
  const t = Math.max(-0.3, Math.min(1.9, bv));
  const stops: [number, [number, number, number]][] = [
    [-0.3, [155, 176, 255]],
    [0.0, [202, 215, 255]],
    [0.3, [248, 247, 255]],
    [0.6, [255, 244, 234]],
    [0.9, [255, 226, 180]],
    [1.4, [255, 190, 125]],
    [1.9, [255, 150, 100]],
  ];
  for (let i = 1; i < stops.length; i += 1) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      const k = (t - t0) / (t1 - t0);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * k),
        Math.round(c0[1] + (c1[1] - c0[1]) * k),
        Math.round(c0[2] + (c1[2] - c0[2]) * k),
      ];
    }
  }
  return stops[stops.length - 1][1];
}
