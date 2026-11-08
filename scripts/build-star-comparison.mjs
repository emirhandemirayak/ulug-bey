// Builds data/star-comparison.json from the machine-readable Ulugh Beg catalogue
// (Verbunt & van Gent 2012, A&A 544, A31; VizieR J/A+A/544/A31/ulughbeg).
// Usage: node scripts/build-star-comparison.mjs [path-to-saved-vizier-tsv]
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCES = [
  "https://vizier.cfa.harvard.edu/viz-bin/asu-tsv?-source=J/A%2BA/544/A31&-out.max=5000&-out.form=%7C",
  "https://vizier.cds.unistra.fr/viz-bin/asu-tsv?-source=J/A%2BA/544/A31&-out.max=5000&-out.form=%7C",
];

// group: zodiac | north | south. confidence "approx" = the traditional name could
// not be tied to one modern star with certainty and should be double-checked.
const STARS = [
  // Zodyak kuşağı
  { hip: 8903, names: ["Kabal / Sharatan"], modern: "Sheratan", bayer: "β Ari", constellation: "Koç", group: "zodiac", note: "“Kabal” adı doğrulanamadı; Sharatan = β Arietis." },
  { hip: 21421, names: ["Düberan"], modern: "Aldebaran", bayer: "α Tau", constellation: "Boğa", group: "zodiac" },
  { hip: 24608, names: ["Ayvuk"], modern: "Capella", bayer: "α Aur", constellation: "Arabacı", group: "zodiac" },
  { hip: 14135, names: ["Reel / Menkar"], modern: "Menkar", bayer: "α Cet", constellation: "Balina", group: "zodiac", note: "“Reel” adı doğrulanamadı; Menkar = α Ceti." },
  { hip: 36850, names: ["İkizler’in başı (Castor)"], modern: "Castor", bayer: "α Gem", constellation: "İkizler", group: "zodiac" },
  { hip: 37826, names: ["İkizler’in başı (Pollux)"], modern: "Pollux", bayer: "β Gem", constellation: "İkizler", group: "zodiac" },
  { hip: 40526, names: ["Nüşre / Al Tarf"], modern: "Al Tarf", bayer: "β Cnc", constellation: "Yengeç", group: "zodiac", note: "Nüşre aslında Praesepe (M44) kümesidir; burada Al Tarf (β Cancri) alınmıştır." },
  { hip: 49669, names: ["Kalbü’l-Esed"], modern: "Regulus", bayer: "α Leo", constellation: "Aslan", group: "zodiac" },
  { hip: 65474, names: ["Simak-i Âzil"], modern: "Spica", bayer: "α Vir", constellation: "Başak", group: "zodiac" },
  { hip: 72622, names: ["Zübanân (güney kefe)"], modern: "Zubenelgenubi", bayer: "α² Lib", constellation: "Terazi", group: "zodiac" },
  { hip: 74785, names: ["Zübanân (kuzey kefe)"], modern: "Zubeneschamali", bayer: "β Lib", constellation: "Terazi", group: "zodiac" },
  { hip: 78401, names: ["İklil"], modern: "Dschubba", bayer: "δ Sco", constellation: "Akrep", group: "zodiac", confidence: "approx", note: "İklil (Akrep’in tacı) δ Scorpii ile eşleştirildi; kesin değil." },
  { hip: 80763, names: ["Kalbü’l-Akrep"], modern: "Antares", bayer: "α Sco", constellation: "Akrep", group: "zodiac" },
  { hip: 90185, names: ["Urkub / Keos"], modern: "Kaus Australis", bayer: "ε Sgr", constellation: "Yay", group: "zodiac", confidence: "approx", note: "Keos ≈ Kaus; Urkub (Arkab) ayrı bir yıldızdır. Eşleştirme kesin değil." },
  { hip: 100345, names: ["Sadâs / Sadüzzâlim"], modern: "Dabih", bayer: "β Cap", constellation: "Oğlak", group: "zodiac", confidence: "approx", note: "Ad, Oğlak’ın Sa‘d yıldızlarından biriyle (Dabih) eşleştirildi; kesin değil." },
  { hip: 109074, names: ["Sa‘d-i Bula / Sadü’l-Mülk"], modern: "Sadalmelik", bayer: "α Aqr", constellation: "Kova", group: "zodiac", note: "Sadü’l-Mülk = Sadalmelik. “Sa‘d-i Bula” ayrı bir yıldızdır." },
  { hip: 8645, names: ["Batn-ı Hût"], modern: "Baten Kaitos", bayer: "ζ Cet", constellation: "Balina", group: "zodiac", confidence: "approx", note: "Batn-ı Hût “balığın/balinanın karnı” demektir; listede Balık takımyıldızı yazılmış, kontrol edin." },
  // Kuzey yarı küre ve kutup çevresi
  { hip: 11767, names: ["Kutup Yıldızı", "Cabir"], modern: "Polaris", bayer: "α UMi", constellation: "Küçük Ayı", group: "north" },
  { hip: 53910, names: ["Merâk"], modern: "Merak", bayer: "β UMa", constellation: "Büyük Ayı", group: "north" },
  { hip: 54061, names: ["Dubhe"], modern: "Dubhe", bayer: "α UMa", constellation: "Büyük Ayı", group: "north" },
  { hip: 67301, names: ["El-Kâide / Benetnaş"], modern: "Alkaid", bayer: "η UMa", constellation: "Büyük Ayı", group: "north" },
  { hip: 87833, names: ["Et-Tîn"], modern: "Eltanin", bayer: "γ Dra", constellation: "Ejderha", group: "north" },
  { hip: 91262, names: ["Nesr-i Vâki"], modern: "Vega", bayer: "α Lyr", constellation: "Çalgı", group: "north" },
  { hip: 97649, names: ["Nesr-i Tâir"], modern: "Altair", bayer: "α Aql", constellation: "Kartal", group: "north" },
  { hip: 102098, names: ["Deneb / Redîf"], modern: "Deneb", bayer: "α Cyg", constellation: "Kuğu", group: "north" },
  { hip: 6686, names: ["Rukbe"], modern: "Ruchbah", bayer: "δ Cas", constellation: "Kraliçe", group: "north" },
  { hip: 3179, names: ["Sadr"], modern: "Schedar", bayer: "α Cas", constellation: "Kraliçe", group: "north", confidence: "approx", note: "Schedar adı Arapça “sadr”dan gelir; Kuğu’daki Sadr (γ Cyg) ile karıştırılmamalı. Eşleştirme kesin değil." },
  { hip: 113963, names: ["Menkib-i Feres"], modern: "Markab", bayer: "α Peg", constellation: "Kanatlı At", group: "north" },
  { hip: 86032, names: ["Rasü’l-Hâc"], modern: "Rasalhague", bayer: "α Oph", constellation: "Yılancı", group: "north" },
  { hip: 80816, names: ["Rakka / Cebhe"], modern: "Kornephoros", bayer: "β Her", constellation: "Herkül", group: "north", confidence: "approx", note: "Herkül’ün Cebhe’si β Herculis ile eşleştirildi; kesin değil." },
  // Güney yarı küre ve parlak yıldızlar
  { hip: 32349, names: ["Şi‘râ-i Yemâniye"], modern: "Sirius", bayer: "α CMa", constellation: "Büyük Köpek", group: "south" },
  { hip: 37279, names: ["Şi‘râ-i Şâmiye"], modern: "Procyon", bayer: "α CMi", constellation: "Küçük Köpek", group: "south" },
  { hip: 24436, names: ["Râ’il"], modern: "Rigel", bayer: "β Ori", constellation: "Avcı", group: "south" },
  { hip: 27989, names: ["Menkib-i Cevzâ"], modern: "Betelgeuse", bayer: "α Ori", constellation: "Avcı", group: "south" },
  { hip: 26727, names: ["Nizam (doğu)"], modern: "Alnitak", bayer: "ζ Ori", constellation: "Avcı", group: "south" },
  { hip: 26311, names: ["Nizam (orta)"], modern: "Alnilam", bayer: "ε Ori", constellation: "Avcı", group: "south" },
  { hip: 25930, names: ["Nizam (batı)"], modern: "Mintaka", bayer: "δ Ori", constellation: "Avcı", group: "south" },
  { hip: 30438, names: ["Süheyl"], modern: "Canopus", bayer: "α Car", constellation: "Karina", group: "south", note: "Semerkand’dan (≈39,7°K) hiç görünmez; katalogdaki konumu gözlem değil, Batlamyus’tan al-Sûfî yoluyla türetilmiştir." },
  { hip: 113368, names: ["Fomalhaut"], modern: "Fomalhaut", bayer: "α PsA", constellation: "Güney Balığı", group: "south" },
  { hip: 13847, names: ["Ahâmer"], modern: "Acamar", bayer: "θ¹ Eri", constellation: "Eridanus", group: "south", confidence: "approx", note: "Eridanus için Batlamyus kataloğunun son yıldızı (θ¹ Eri) alınmıştır; “Ahâmer” eşleştirmesi kesin değil." },
];

const ABSENT = [
  { names: ["Rûb-i Centaur"], modern: "Rigil Kentaurus", bayer: "α Cen", reason: "Uluğ Bey kataloğunda yok: Semerkand’dan görünmeyen güney yıldızı." },
  { names: ["Ahır en-nehr"], modern: "Achernar", bayer: "α Eri", reason: "Uluğ Bey kataloğunda yok: Semerkand’dan görünmeyen güney yıldızı." },
];

function parseLon(s) {
  const [d, m] = s.split(":");
  return Number(d) + Number(m) / 60;
}
function parseLat(s) {
  const sign = s.trim().startsWith("-") ? -1 : 1;
  const [d, m] = s.replace(/^[+-]/, "").split(":");
  return sign * (Number(d) + Number(m) / 60);
}
const quantile = (arr, q) => {
  const a = [...arr].sort((x, y) => x - y);
  const i = (a.length - 1) * q;
  const lo = Math.floor(i);
  return a[lo] + (a[Math.ceil(i)] - a[lo]) * (i - lo);
};
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const round = (v, n = 1) => Math.round(v * 10 ** n) / 10 ** n;

async function loadText() {
  if (process.argv[2]) return readFile(process.argv[2], "utf8");
  for (const url of SOURCES) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (res.ok) return await res.text();
    } catch {
      /* try the next mirror */
    }
  }
  throw new Error("VizieR kaynağına ulaşılamadı");
}

const text = await loadText();
const lines = text.split(/\r?\n/);
const start = lines.findIndex((l) => l.startsWith("#Name: J/A+A/544/A31/ulughbeg"));
const head = lines.findIndex((l, i) => i > start && l.startsWith("U|"));
if (start < 0 || head < 0) throw new Error("Uluğ Bey tablosu bulunamadı");
const cols = lines[head].split("|").map((s) => s.trim());
const rows = [];
for (let i = head + 3; i < lines.length; i += 1) {
  const l = lines[i];
  if (!l.trim() || l.startsWith("#")) break;
  const v = l.split("|").map((s) => s.trim());
  const o = {};
  cols.forEach((c, j) => {
    o[c] = v[j];
  });
  rows.push(o);
}

const secure = rows.filter((r) => r.I === "1" && r.n_U !== "c" && r.dist !== "");
const dist = secure.map((r) => Number(r.dist));
const dl = secure.map((r) => Number(r.Dl));
const db = secure.map((r) => Number(r.Db));
const meanDl = mean(dl);
const meanDb = mean(db);
const resid = secure.map((r) => {
  const lat = (parseLat(r.Elat) * Math.PI) / 180;
  const x = (Number(r.Dl) - meanDl) * Math.cos(lat);
  const y = Number(r.Db) - meanDb;
  return Math.hypot(x, y);
});

const stars = STARS.map((s) => {
  const r = rows.find((x) => Number(x.HIP) === s.hip);
  if (!r) throw new Error(`HIP ${s.hip} (${s.modern}) tabloda yok`);
  const lon = parseLon(r.Elon);
  const lat = parseLat(r.Elat);
  const Dl = Number(r.Dl);
  const Db = Number(r.Db);
  return {
    id: s.modern.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    hip: s.hip,
    names: s.names,
    modern: s.modern,
    bayer: s.bayer,
    constellation: s.constellation,
    group: s.group,
    confidence: s.confidence ?? "high",
    note: s.note ?? null,
    catalogNo: Number(r.U),
    derivedFromPtolemy: r.n_U === "c",
    magUlugh: Number(r.VU),
    magModern: Number(r.Vmag),
    ulugh: { lon: round(lon, 4), lat: round(lat, 4) },
    modernPos: { lon: round(lon + Dl / 60, 4), lat: round(lat + Db / 60, 4) },
    dLonArcmin: Dl,
    dLatArcmin: Db,
    errorArcmin: Number(r.dist),
  };
});

const out = {
  source: {
    title: "Star catalogues of Ptolemaios and Ulugh Beg: machine-readable versions and comparison with the modern Hipparcos catalogue",
    authors: "Verbunt, F. & van Gent, R. H.",
    reference: "A&A 544, A31 (2012)",
    vizier: "J/A+A/544/A31/ulughbeg",
    epoch: 1437,
    note: "Modern konum = Hipparcos konumunun 1437 dönemine getirilmiş ekliptik hâli. Fark = Hipparcos − Uluğ Bey, yay dakikası.",
  },
  catalog: {
    stars: rows.length,
    secureStars: secure.length,
    medianErrorArcmin: round(quantile(dist, 0.5)),
    p25ErrorArcmin: round(quantile(dist, 0.25)),
    p75ErrorArcmin: round(quantile(dist, 0.75)),
    meanDLonArcmin: round(meanDl),
    meanDLatArcmin: round(meanDb),
    medianResidualArcmin: round(quantile(resid, 0.5)),
  },
  absent: ABSENT,
  stars,
};

// ---- Gökyüzü haritası için tüm katalog + takımyıldız çizgileri ----
const byHip = new Map(rows.filter((r) => r.HIP).map((r) => [Number(r.HIP), r]));
const modernOf = (r) => {
  const lon = parseLon(r.Elon);
  const lat = parseLat(r.Elat);
  if (!r.HIP || r.Dl === "" || r.Db === "") return { lon, lat };
  return { lon: lon + Number(r.Dl) / 60, lat: lat + Number(r.Db) / 60 };
};

// Yaklaşık B−V renk indeksleri (yalnızca iyi bilinen yıldızlar; diğerleri sahte-rastgele tonlanır).
const BV = {
  21421: 1.54, 27989: 1.85, 80763: 1.83, 69673: 1.23, 37826: 1.0, 24608: 0.8,
  24436: -0.03, 32349: 0.0, 91262: 0.0, 97649: 0.22, 102098: 0.09, 37279: 0.42,
  11767: 0.6, 113368: 0.09, 30438: 0.15, 36850: 0.03, 65474: -0.24, 49669: -0.09,
  25930: -0.22, 26311: -0.18, 26727: -0.21, 25336: -0.22, 54061: 1.06, 53910: 0.03,
  67301: -0.1, 87833: 1.52, 86032: 0.13, 113963: -0.04, 3179: 1.17, 6686: 0.13,
  14135: 1.64, 78401: -0.12, 72622: 0.15, 74785: -0.11, 109074: 0.98, 90185: -0.03,
  8903: 0.16, 40526: 1.48, 80816: 0.94, 13847: 0.0,
};

const skyStars = rows.map((r) => {
  const p = modernOf(r);
  const mag = r.Vmag !== "" ? Number(r.Vmag) : Number(r.VU);
  const hip = Number(r.HIP) || 0;
  return [round(p.lon, 2), round(p.lat, 2), round(mag, 1), hip in BV ? BV[hip] : null];
});

// [hip, beklenen V] — doğrulama: tabloda var mı, parlaklık ±0,6 içinde mi?
const FIGURES = [
  { id: "uma", name: "Büyük Ayı", edges: [[54061, 53910], [53910, 58001], [58001, 59774], [59774, 54061], [59774, 62956], [62956, 65378], [65378, 67301]], v: { 54061: 1.8, 53910: 2.4, 58001: 2.4, 59774: 3.3, 62956: 1.8, 65378: 2.2, 67301: 1.9 } },
  { id: "umi", name: "Küçük Ayı", edges: [[11767, 85822], [85822, 82080], [82080, 77055], [77055, 79822], [79822, 75097], [75097, 72607], [72607, 77055]], v: { 11767: 2.0, 85822: 4.3, 82080: 4.2, 77055: 4.3, 79822: 4.9, 75097: 3.0, 72607: 2.1 } },
  { id: "cas", name: "Kraliçe", edges: [[746, 3179], [3179, 4427], [4427, 6686], [6686, 8886]], v: { 746: 2.3, 3179: 2.2, 4427: 2.5, 6686: 2.7, 8886: 3.4 } },
  { id: "ori", name: "Avcı", edges: [[27989, 26207], [26207, 25336], [27989, 26727], [25336, 25930], [25930, 26311], [26311, 26727], [26727, 27366], [25930, 24436]], v: { 27989: 0.4, 25336: 1.6, 26207: 3.4, 25930: 2.2, 26311: 1.7, 26727: 1.7, 27366: 2.1, 24436: 0.1 } },
  { id: "cyg", name: "Kuğu", edges: [[102098, 100453], [100453, 95947], [102488, 100453], [100453, 97165]], v: { 102098: 1.3, 100453: 2.2, 95947: 3.2, 102488: 2.5, 97165: 2.9 } },
  { id: "tri", name: "Yaz Üçgeni", edges: [[91262, 97649], [97649, 102098], [102098, 91262]], v: { 91262: 0.0, 97649: 0.8, 102098: 1.3 } },
  { id: "aql", name: "Kartal", edges: [[98036, 97649], [97649, 97278]], v: { 98036: 3.7, 97649: 0.8, 97278: 2.7 } },
  { id: "sco", name: "Akrep", edges: [[78820, 78401], [78401, 78265], [78401, 80112], [80112, 80763], [80763, 81266], [81266, 82396], [82396, 82514], [82514, 82729], [82729, 84143], [84143, 86228], [86228, 85927], [85927, 85696]], v: { 78820: 2.6, 78401: 2.3, 78265: 2.9, 80112: 2.9, 80763: 1.1, 81266: 2.8, 82396: 2.3, 82514: 3.1, 82729: 3.6, 84143: 3.3, 86228: 1.9, 85927: 1.6, 85696: 2.7 } },
  { id: "sgr", name: "Yay", edges: [[88635, 90185], [90185, 89931], [89931, 90496], [90496, 92041], [92041, 92855], [92855, 93506], [93506, 90185], [92855, 93864], [93864, 93506]], v: { 88635: 3.0, 90185: 1.9, 89931: 2.7, 90496: 2.8, 92041: 3.2, 92855: 2.0, 93506: 2.6, 93864: 3.3 } },
  { id: "leo", name: "Aslan", edges: [[49669, 49583], [49583, 50583], [50583, 50335], [50335, 48455], [48455, 47908], [50583, 54872], [54872, 57632], [54872, 54879]], v: { 49669: 1.4, 49583: 3.5, 50583: 2.0, 50335: 3.4, 48455: 3.9, 47908: 3.0, 54872: 2.6, 57632: 2.1, 54879: 3.3 } },
  { id: "aur", name: "Arabacı", edges: [[24608, 28360], [28360, 28380], [28380, 25428], [25428, 23015], [23015, 24608]], v: { 24608: 0.1, 28360: 1.9, 28380: 2.7, 25428: 1.6, 23015: 2.7 } },
  { id: "cma", name: "Büyük Köpek", edges: [[32349, 30324], [32349, 34444], [34444, 33579], [34444, 35904]], v: { 32349: -1.4, 30324: 2.0, 34444: 1.8, 33579: 1.5, 35904: 2.5 } },
  { id: "cmi", name: "Küçük Köpek", edges: [[37279, 36188]], v: { 37279: 0.4, 36188: 2.9 } },
  { id: "peg", name: "Kanatlı At", edges: [[113963, 113881], [113881, 677], [677, 1067], [1067, 113963]], v: { 113963: 2.5, 113881: 2.4, 677: 2.1, 1067: 2.8 } },
  { id: "boo", name: "Çoban", edges: [[69673, 72105], [72105, 71075], [71075, 73555], [69673, 67927]], v: { 69673: -0.1, 72105: 2.3, 71075: 3.0, 73555: 3.5, 67927: 2.7 } },
  { id: "dra", name: "Ejderha", edges: [[85670, 87833], [87833, 87585]], v: { 85670: 2.8, 87833: 2.2, 87585: 3.7 } },
  { id: "her", name: "Herkül", edges: [[81693, 81833], [81833, 84380], [84380, 83207], [83207, 81693], [80816, 81693]], v: { 81693: 2.8, 81833: 3.5, 84380: 3.2, 83207: 3.9, 80816: 2.8 } },
  { id: "gem", name: "İkizler", edges: [[36850, 32246], [32246, 30343], [37826, 35550], [35550, 31681]], v: { 36850: 1.6, 32246: 3.1, 30343: 2.9, 37826: 1.1, 35550: 3.5, 31681: 1.9 } },
];

const figures = [];
for (const f of FIGURES) {
  const bad = Object.entries(f.v).filter(([hip, v]) => {
    const r = byHip.get(Number(hip));
    return !r || Math.abs(Number(r.Vmag) - v) > 0.6;
  });
  const badSet = new Set(bad.map(([h]) => Number(h)));
  if (bad.length) console.warn(`uyarı: ${f.name}: doğrulanamayan HIP ${[...badSet].join(", ")} — ilgili çizgiler atlandı`);
  const lines = [];
  const pts = [];
  for (const [a, b] of f.edges) {
    if (badSet.has(a) || badSet.has(b)) continue;
    const pa = modernOf(byHip.get(a));
    const pb = modernOf(byHip.get(b));
    lines.push([round(pa.lon, 2), round(pa.lat, 2), round(pb.lon, 2), round(pb.lat, 2)]);
    pts.push(pa, pb);
  }
  if (!lines.length) continue;
  // Etiket konumu: küre üzerinde vektör ortalaması
  let sx = 0;
  let sy = 0;
  let sz = 0;
  for (const p of pts) {
    const lo = (p.lon * Math.PI) / 180;
    const la = (p.lat * Math.PI) / 180;
    sx += Math.cos(la) * Math.cos(lo);
    sy += Math.cos(la) * Math.sin(lo);
    sz += Math.sin(la);
  }
  const lon = ((Math.atan2(sy, sx) * 180) / Math.PI + 360) % 360;
  const lat = (Math.atan2(sz, Math.hypot(sx, sy)) * 180) / Math.PI;
  figures.push({ id: f.id, name: f.name, label: [round(lon, 2), round(lat, 2)], lines });
}

await writeFile(
  path.join(process.cwd(), "data", "sky-catalog.json"),
  `${JSON.stringify({ epoch: 1437, stars: skyStars, figures })}\n`,
  "utf8",
);
console.log(`gökyüzü kataloğu: ${skyStars.length} yıldız, ${figures.length} takımyıldız, ${figures.reduce((s, f) => s + f.lines.length, 0)} çizgi`);

const target = path.join(process.cwd(), "data", "star-comparison.json");
await writeFile(target, `${JSON.stringify(out, null, 2)}\n`, "utf8");
console.log(`yazıldı: ${target}`);
console.log("katalog:", out.catalog);
const sel = stars.map((s) => s.errorArcmin);
console.log(`seçili ${stars.length} yıldız: medyan ${round(quantile(sel, 0.5))}′, en iyi ${Math.min(...sel)}′, en kötü ${Math.max(...sel)}′`);
