"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import skyJson from "../../data/sky-catalog.json";
import {
  LAT_MIN,
  angleOfLon,
  buildMilkyWay,
  colorFromBV,
  mulberry32,
  project,
  radiusOfLat,
  type MilkyWay,
} from "../lib/sky";
import {
  GROUP_COLOR,
  SIGNS,
  arcminText,
  type ComparedStar,
} from "../lib/starComparison";

type SkyData = {
  stars: [number, number, number, number | null][];
  figures: {
    id: string;
    name: string;
    label: [number, number];
    lines: [number, number, number, number][];
  }[];
};
const SKY = skyJson as unknown as SkyData;

const SIGN_DATES = [
  "21 Mar – 19 Nis",
  "20 Nis – 20 May",
  "21 May – 20 Haz",
  "21 Haz – 22 Tem",
  "23 Tem – 22 Ağu",
  "23 Ağu – 22 Eyl",
  "23 Eyl – 22 Eki",
  "23 Eki – 21 Kas",
  "22 Kas – 21 Ara",
  "22 Ara – 19 Oca",
  "20 Oca – 18 Şub",
  "19 Şub – 20 Mar",
];

const MAX_SCALE = 60;
const ZOOM_BTN =
  "h-9 w-9 rounded-full border border-gold/40 bg-night/80 text-lg leading-none text-gold-soft backdrop-blur transition hover:border-gold hover:bg-gold/20";
const TWO_PI = Math.PI * 2;

type Props = {
  stars: ComparedStar[];
  visibleIds: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  exaggeration: number;
  showFigures: boolean;
  showMilkyWay: boolean;
  showCatalog: boolean;
};

type View = { cx: number; cy: number; scale: number };

type Hover = { id: string; x: number; y: number } | null;

type CatalogData = {
  u: Float32Array;
  v: Float32Array;
  r: Float32Array;
  c: string[];
  mag: Float32Array;
};

type ChartState = {
  size: number;
  dpr: number;
  view: View;
  target: View | null;
  raf: number;
  props: Props | null;
  hoverId: string | null;
  hits: { id: string; x: number; y: number }[];
  fonts: { serif: string; sans: string };
  pointers: Map<number, { x: number; y: number }>;
  drag: null | { x: number; y: number; moved: boolean };
  pinch: number;
  lastReadout: string;
};

export function SkyChart({
  stars,
  visibleIds,
  selectedId,
  onSelect,
  exaggeration,
  showFigures,
  showMilkyWay,
  showCatalog,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<Hover>(null);
  const [readout, setReadout] = useState("");
  const [chartSize, setChartSize] = useState(0);

  // Çizim döngüsünün okuduğu değişken durum (React yeniden çizimini tetiklemez).
  const S = useRef<ChartState>({
    size: 0,
    dpr: 1,
    view: { cx: 0, cy: 0, scale: 1 },
    target: null,
    raf: 0,
    props: null,
    hoverId: null,
    hits: [],
    fonts: { serif: "Georgia, serif", sans: "system-ui, sans-serif" },
    pointers: new Map(),
    drag: null,
    pinch: 0,
    lastReadout: "",
  });

  const milky = useRef<MilkyWay>({ dust: [], glows: [] });
  const catalog = useRef<CatalogData | null>(null);

  const invalidate = useCallback(() => {
    const st = S.current;
    if (st.raf) return;
    const frame = () => {
      st.raf = 0;
      const canvas = canvasRef.current;
      const cat = catalog.current;
      if (!canvas || !cat) return;
      if (drawChart(canvas, st, cat, milky.current, setReadout)) {
        st.raf = requestAnimationFrame(frame);
      }
    };
    st.raf = requestAnimationFrame(frame);
  }, []);

  // ---- Başlangıç verisi ------------------------------------------------
  useEffect(() => {
    milky.current = buildMilkyWay();
    const n = SKY.stars.length;
    const u = new Float32Array(n);
    const v = new Float32Array(n);
    const r = new Float32Array(n);
    const mag = new Float32Array(n);
    const c: string[] = [];
    const rand = mulberry32(7);
    SKY.stars.forEach(([lon, lat, m, bv], i) => {
      const p = project(lon, lat);
      u[i] = p.u;
      v[i] = p.v;
      mag[i] = m;
      r[i] = Math.max(0.45, Math.min(3.4, 0.45 + (6.3 - m) * 0.4));
      let tone = bv;
      if (tone === null) {
        const x = rand();
        tone = x < 0.55 ? 0.1 + rand() * 0.35 : x < 0.8 ? -0.2 + rand() * 0.25 : 0.7 + rand() * 0.7;
      }
      const [R, G, B] = colorFromBV(tone);
      c.push(`${R},${G},${B}`);
    });
    catalog.current = { u, v, r, c, mag };

    const cs = getComputedStyle(document.documentElement);
    const serif = cs.getPropertyValue("--font-cormorant").trim();
    const sans = cs.getPropertyValue("--font-outfit").trim();
    S.current.fonts = {
      serif: serif ? `${serif}, Georgia, serif` : "Georgia, serif",
      sans: sans ? `${sans}, system-ui, sans-serif` : "system-ui, sans-serif",
    };
    document.fonts?.ready.then(() => invalidate());
    invalidate();
  }, [invalidate]);

  // ---- Boyut -----------------------------------------------------------
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const resize = () => {
      const size = Math.max(280, Math.min(wrap.clientWidth, 860));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const st = S.current;
      st.size = size;
      st.dpr = dpr;
      setChartSize(size);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      invalidate();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [invalidate]);

  // ---- Props → durum ---------------------------------------------------
  useEffect(() => {
    S.current.props = {
      stars,
      visibleIds,
      selectedId,
      onSelect,
      exaggeration,
      showFigures,
      showMilkyWay,
      showCatalog,
    };
    invalidate();
  }, [stars, visibleIds, selectedId, onSelect, exaggeration, showFigures, showMilkyWay, showCatalog, invalidate]);

  // Seçilen yıldıza yumuşak yakınlaşma (ilk yüklemede değil).
  const firstSelect = useRef(true);
  useEffect(() => {
    if (firstSelect.current) {
      firstSelect.current = false;
      return;
    }
    const star = stars.find((s) => s.id === selectedId);
    if (!star) return;
    const p = project(star.modernPos.lon, star.modernPos.lat);
    S.current.target = { cx: p.u, cy: p.v, scale: 9 };
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // ---- Etkileşim -------------------------------------------------------
  const geometry = () => {
    const st = S.current;
    const c = st.size / 2;
    const band = Math.max(34, Math.min(62, st.size * 0.075));
    const Rd = c - 3 - band;
    return { c, Rd, unit: st.view.scale * Rd };
  };

  const localPoint = (e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const zoomAt = (px: number, py: number, factor: number) => {
    const st = S.current;
    const g = geometry();
    const v = st.view;
    const uu = v.cx + (px - g.c) / g.unit;
    const vv = v.cy - (py - g.c) / g.unit;
    const next = Math.max(1, Math.min(MAX_SCALE, v.scale * factor));
    const unit2 = next * (g.unit / v.scale);
    v.scale = next;
    v.cx = uu - (px - g.c) / unit2;
    v.cy = vv + (py - g.c) / unit2;
    clampView();
    st.target = null;
    invalidate();
  };

  const clampView = () => {
    const v = S.current.view;
    if (v.scale <= 1.001) {
      v.cx = 0;
      v.cy = 0;
      return;
    }
    const r = Math.hypot(v.cx, v.cy);
    if (r > 1) {
      v.cx /= r;
      v.cy /= r;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = localPoint(e);
      zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0016));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nearest = (x: number, y: number): string | null => {
    let best: string | null = null;
    let bestD = 16;
    for (const h of S.current.hits) {
      const d = Math.hypot(h.x - x, h.y - y);
      if (d < bestD) {
        bestD = d;
        best = h.id;
      }
    }
    return best;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = S.current;
    const p = localPoint(e);
    st.pointers.set(e.pointerId, p);
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    if (st.pointers.size === 2) {
      const [a, b] = [...st.pointers.values()];
      st.pinch = Math.hypot(a.x - b.x, a.y - b.y);
      st.drag = null;
    } else {
      st.drag = { x: p.x, y: p.y, moved: false };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = S.current;
    const p = localPoint(e);
    if (st.pointers.has(e.pointerId)) st.pointers.set(e.pointerId, p);

    if (st.pointers.size === 2) {
      const [a, b] = [...st.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (st.pinch > 0 && d > 0) {
        zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / st.pinch);
      }
      st.pinch = d;
      return;
    }

    if (st.drag && st.pointers.has(e.pointerId)) {
      const dx = p.x - st.drag.x;
      const dy = p.y - st.drag.y;
      if (Math.hypot(dx, dy) > 3) st.drag.moved = true;
      if (st.drag.moved && st.view.scale > 1.001) {
        const g = geometry();
        st.view.cx -= dx / g.unit;
        st.view.cy += dy / g.unit;
        st.target = null;
        clampView();
        st.drag.x = p.x;
        st.drag.y = p.y;
        invalidate();
      }
      return;
    }

    const id = nearest(p.x, p.y);
    if (id !== st.hoverId) {
      st.hoverId = id;
      setHover(id ? { id, x: p.x, y: p.y } : null);
      invalidate();
    } else if (id) {
      setHover({ id, x: p.x, y: p.y });
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = S.current;
    const p = localPoint(e);
    const wasDrag = st.drag?.moved ?? false;
    st.pointers.delete(e.pointerId);
    if (st.pointers.size < 2) st.pinch = 0;
    if (!wasDrag && st.pointers.size === 0) {
      const id = nearest(p.x, p.y);
      if (id) st.props?.onSelect(id);
    }
    st.drag = null;
    invalidate();
  };

  const onPointerLeave = () => {
    const st = S.current;
    if (st.hoverId) {
      st.hoverId = null;
      setHover(null);
      invalidate();
    }
  };

  const zoomButton = (factor: number) => {
    const g = geometry();
    zoomAt(g.c, g.c, factor);
  };

  const reset = () => {
    S.current.target = { cx: 0, cy: 0, scale: 1 };
    invalidate();
  };

  const hovered = hover ? stars.find((s) => s.id === hover.id) : null;

  return (
    <div ref={wrapRef} className="relative mx-auto w-full max-w-[860px]">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Ekliptik koordinatlarda dairesel gök haritası: Uluğ Bey ve modern yıldız konumları"
        className="block max-w-full select-none rounded-full"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
      />

      <div className="pointer-events-none absolute left-1 top-1 rounded-full border border-gold/30 bg-night/70 px-3 py-1 text-[11px] tabular-nums text-gold-soft/90 backdrop-blur">
        {readout}
      </div>

      <div className="absolute bottom-1 right-1 flex flex-col gap-1.5">
        <button type="button" title="Yakınlaştır" aria-label="Yakınlaştır" onClick={() => zoomButton(1.6)} className={ZOOM_BTN}>
          +
        </button>
        <button type="button" title="Uzaklaştır" aria-label="Uzaklaştır" onClick={() => zoomButton(1 / 1.6)} className={ZOOM_BTN}>
          −
        </button>
        <button type="button" title="Tüm gökyüzü" aria-label="Tüm gökyüzü" onClick={reset} className={ZOOM_BTN}>
          ⌂
        </button>
      </div>

      {hovered && hover ? (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-gold/40 bg-night/95 px-3 py-2 text-xs shadow-lg"
          style={{
            left: Math.min(hover.x + 14, (chartSize || 300) - 170),
            top: Math.max(hover.y - 52, 4),
          }}
        >
          <p className="font-medium text-gold-soft">
            {hovered.modern} <span className="text-gold-soft/60">({hovered.bayer})</span>
          </p>
          <p className="text-foreground/75">
            Sapma {arcminText(hovered.errorArcmin)}
          </p>
        </div>
      ) : null}
    </div>
  );
}


function drawChart(
  canvas: HTMLCanvasElement,
  st: ChartState,
  cat: CatalogData,
  milkyWay: MilkyWay,
  setReadout: (text: string) => void,
): boolean {
  const props = st.props;
  if (!props || !st.size) return false;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  // Yumuşak kamera
  let animating = false;
  if (st.target) {
    const v = st.view;
    const t = st.target;
    const k = 0.16;
    v.cx += (t.cx - v.cx) * k;
    v.cy += (t.cy - v.cy) * k;
    v.scale *= Math.pow(t.scale / v.scale, k);
    if (
      Math.abs(t.cx - v.cx) < 0.0004 &&
      Math.abs(t.cy - v.cy) < 0.0004 &&
      Math.abs(t.scale / v.scale - 1) < 0.003
    ) {
      v.cx = t.cx;
      v.cy = t.cy;
      v.scale = t.scale;
      st.target = null;
    } else {
      animating = true;
    }
  }

  const { size, dpr, view } = st;
  const c = size / 2;
  const band = Math.max(34, Math.min(62, size * 0.075));
  const Rf = c - 3;
  const Rd = Rf - band;
  const unit = view.scale * Rd;
  const sx = (u: number) => c + (u - view.cx) * unit;
  const sy = (v: number) => c - (v - view.cy) * unit;
  const p0x = sx(0);
  const p0y = sy(0);
  const zoomed = view.scale > 1.6;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  canvas.style.touchAction = view.scale > 1.05 ? "none" : "pan-y";
  canvas.style.cursor = st.hoverId ? "pointer" : st.drag ? "grabbing" : "grab";

  // Disk içi
  ctx.save();
  ctx.beginPath();
  ctx.arc(c, c, Rd, 0, TWO_PI);
  ctx.clip();

  const bg = ctx.createRadialGradient(c, c, 0, c, c, Rd);
  bg.addColorStop(0, "#0d0a24");
  bg.addColorStop(0.7, "#070618");
  bg.addColorStop(1, "#04040e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Samanyolu
  if (props.showMilkyWay) {
    ctx.globalCompositeOperation = "lighter";
    const px = Math.max(1, Math.min(2.4, 0.9 + view.scale * 0.14));
    for (const group of milkyWay.dust) {
      ctx.fillStyle = group.color;
      const pts = group.coords;
      for (let i = 0; i < pts.length; i += 2) {
        const x = sx(pts[i]);
        const y = sy(pts[i + 1]);
        if (x < -4 || x > size + 4 || y < -4 || y > size + 4) continue;
        ctx.fillRect(x, y, px, px);
      }
    }
    for (const m of milkyWay.glows) {
      const x = sx(m.u);
      const y = sy(m.v);
      const rad = (0.05 + m.w * 0.05) * unit * (0.7 + 0.3 * Math.min(view.scale, 3));
      if (x < -rad || x > size + rad || y < -rad || y > size + rad) continue;
      const rr = Math.round(150 + m.warm * 95);
      const gg = Math.round(165 + m.warm * 50);
      const bb = Math.round(232 - m.warm * 100);
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, `rgba(${rr},${gg},${bb},${0.018 + m.w * 0.03})`);
      g.addColorStop(1, `rgba(${rr},${gg},${bb},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  // Izgara: enlem daireleri
  const latStep = view.scale > 3 ? 10 : 30;
  ctx.lineWidth = 1;
  for (let lat = -80; lat <= 80; lat += latStep) {
    if (lat === 0) continue;
    ctx.beginPath();
    ctx.arc(p0x, p0y, radiusOfLat(lat) * unit, 0, TWO_PI);
    ctx.strokeStyle = "rgba(232,213,163,0.09)";
    ctx.setLineDash([2, 6]);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Boylam ışınları
  const lonStep = view.scale > 3 ? 10 : 30;
  ctx.strokeStyle = "rgba(232,213,163,0.08)";
  for (let lon = 0; lon < 360; lon += lonStep) {
    const a = angleOfLon(lon);
    ctx.beginPath();
    ctx.moveTo(p0x, p0y);
    ctx.lineTo(p0x + Math.cos(a) * unit, p0y - Math.sin(a) * unit);
    ctx.stroke();
  }

  // Ekliptik kuşağı (±8°) ve ekliptik
  const rEcl = radiusOfLat(0) * unit;
  const rIn = radiusOfLat(8) * unit;
  const rOut = radiusOfLat(-8) * unit;
  ctx.beginPath();
  ctx.arc(p0x, p0y, rOut, 0, TWO_PI);
  ctx.arc(p0x, p0y, rIn, 0, TWO_PI, true);
  ctx.fillStyle = "rgba(212,175,55,0.045)";
  ctx.fill("evenodd");
  ctx.beginPath();
  ctx.arc(p0x, p0y, rEcl, 0, TWO_PI);
  ctx.strokeStyle = "rgba(212,175,55,0.6)";
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Ekliptik üzerindeki derece işaretleri
  const tickStep = view.scale > 5 ? 1 : view.scale > 2.2 ? 5 : 10;
  ctx.strokeStyle = "rgba(240,215,140,0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let lon = 0; lon < 360; lon += tickStep) {
    const a = angleOfLon(lon);
    const len = lon % 30 === 0 ? 11 : lon % 10 === 0 ? 7 : lon % 5 === 0 ? 5 : 3;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    ctx.moveTo(p0x + ca * (rEcl - len), p0y - sa * (rEcl - len));
    ctx.lineTo(p0x + ca * (rEcl + len), p0y - sa * (rEcl + len));
  }
  ctx.stroke();
  if (view.scale > 2.2) {
    ctx.fillStyle = "rgba(240,215,140,0.75)";
    ctx.font = `10px ${st.fonts.sans}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labStep = view.scale > 5 ? 5 : 10;
    for (let lon = 0; lon < 360; lon += labStep) {
      const a = angleOfLon(lon);
      const lx = p0x + Math.cos(a) * (rEcl + 20);
      const ly = p0y - Math.sin(a) * (rEcl + 20);
      if (lx < -20 || lx > size + 20 || ly < -20 || ly > size + 20) continue;
      ctx.fillText(`${lon}°`, lx, ly);
    }
  }

  // Takımyıldız çizgileri
  if (props.showFigures) {
    ctx.strokeStyle = "rgba(150,190,255,0.5)";
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    for (const f of SKY.figures) {
      for (const [lo1, la1, lo2, la2] of f.lines) {
        const a = project(lo1, la1);
        const b = project(lo2, la2);
        ctx.moveTo(sx(a.u), sy(a.v));
        ctx.lineTo(sx(b.u), sy(b.v));
      }
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(180,208,255,0.62)";
    ctx.font = `italic ${Math.max(11, Math.min(15, size * 0.017))}px ${st.fonts.serif}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const f of SKY.figures) {
      const p = project(f.label[0], f.label[1]);
      ctx.fillText(f.name, sx(p.u), sy(p.v) + 16 + Math.min(view.scale, 3) * 3);
    }
  }

  // Katalog yıldızları
  const grow = 1 + 0.22 * Math.log2(Math.max(1, view.scale));
  ctx.globalCompositeOperation = "lighter";
  if (props.showCatalog) {
    for (let i = 0; i < cat.u.length; i += 1) {
      const x = sx(cat.u[i]);
      const y = sy(cat.v[i]);
      if (x < -10 || x > size + 10 || y < -10 || y > size + 10) continue;
      const r = cat.r[i] * grow;
      const m = cat.mag[i];
      const alpha = m > 4.6 ? 0.62 : m > 3.5 ? 0.82 : 1;
      if (m < 2.7) {
        const hr = r * 5.5;
        const g = ctx.createRadialGradient(x, y, 0, x, y, hr);
        g.addColorStop(0, `rgba(${cat.c[i]},${0.38 * alpha})`);
        g.addColorStop(1, `rgba(${cat.c[i]},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x - hr, y - hr, hr * 2, hr * 2);
      }
      ctx.fillStyle = `rgba(${cat.c[i]},${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TWO_PI);
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = "source-over";

  // Karşılaştırılan yıldızlar
  st.hits = [];
  const ex = props.exaggeration;
  const labelAll = view.scale >= 3.2;
  const ordered = [...props.stars].sort(
    (a, b) =>
      Number(a.id === props.selectedId) - Number(b.id === props.selectedId),
  );
  ctx.textBaseline = "alphabetic";
  for (const s of ordered) {
    const visible = props.visibleIds.has(s.id);
    const sel = s.id === props.selectedId;
    const m = project(s.modernPos.lon, s.modernPos.lat);
    const u = project(s.ulugh.lon, s.ulugh.lat);
    const mx = sx(m.u);
    const my = sy(m.v);
    const ux = mx + (u.u - m.u) * unit * ex;
    const uy = my - (u.v - m.v) * unit * ex;
    if (mx < -60 || mx > size + 60 || my < -60 || my > size + 60) continue;
    if (!visible && !sel) {
      continue;
    }
    st.hits.push({ id: s.id, x: mx, y: my });
    const hov = st.hoverId === s.id;
    const col = GROUP_COLOR[s.group];

    // Uluğ Bey ↔ modern bağlantı çizgisi
    ctx.strokeStyle = sel ? "rgba(255,230,150,0.95)" : "rgba(212,175,55,0.7)";
    ctx.lineWidth = sel ? 1.6 : 1;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(ux, uy);
    ctx.stroke();

    // Modern konum: açık mavi halka
    ctx.strokeStyle = "rgba(188,214,255,0.95)";
    ctx.lineWidth = sel || hov ? 1.8 : 1.2;
    ctx.beginPath();
    ctx.arc(mx, my, sel ? 7 : 5, 0, TWO_PI);
    ctx.stroke();

    // Uluğ Bey konumu: altın nokta
    ctx.fillStyle = "#d4af37";
    ctx.strokeStyle = "#fff3c4";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ux, uy, sel ? 4.2 : 3, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();

    if (sel) {
      ctx.strokeStyle = "rgba(255,243,196,0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(mx, my, 15, 0, TWO_PI);
      ctx.stroke();
    }

    if (sel || hov || labelAll || s.magModern < 1.4) {
      ctx.font = `${sel ? "600 " : ""}12px ${st.fonts.sans}`;
      ctx.textAlign = "left";
      ctx.fillStyle = sel ? "#fff3c4" : col;
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 4;
      ctx.fillText(s.modern, mx + 11, my - 9);
      ctx.shadowBlur = 0;
    }
  }

  ctx.restore();

  // Çerçeve halkası
  const frame = ctx.createRadialGradient(c, c, Rd, c, c, Rf);
  frame.addColorStop(0, "#0a0820");
  frame.addColorStop(1, "#14103a");
  ctx.beginPath();
  ctx.arc(c, c, Rf, 0, TWO_PI);
  ctx.arc(c, c, Rd, 0, TWO_PI, true);
  ctx.fillStyle = frame;
  ctx.fill("evenodd");

  const frameAlpha = zoomed ? 0.45 : 1;
  ctx.globalAlpha = frameAlpha;
  ctx.strokeStyle = "rgba(212,175,55,0.75)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(c, c, Rf, 0, TWO_PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(c, c, Rd, 0, TWO_PI);
  ctx.stroke();

  // Dış halkada 5° / 10° / 30° işaretleri ve burç bölmeleri
  ctx.strokeStyle = "rgba(232,213,163,0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let lon = 0; lon < 360; lon += 5) {
    const a = angleOfLon(lon);
    const len = lon % 30 === 0 ? band : lon % 10 === 0 ? band * 0.2 : band * 0.11;
    ctx.moveTo(c + Math.cos(a) * Rd, c - Math.sin(a) * Rd);
    ctx.lineTo(c + Math.cos(a) * (Rd + len), c - Math.sin(a) * (Rd + len));
  }
  ctx.stroke();

  // Burç adları ve tarihleri (yay üzerinde)
  const nameFs = Math.max(12, Math.min(19, band * 0.3));
  const dateFs = Math.max(8, Math.min(11, band * 0.18));
  for (let i = 0; i < 12; i += 1) {
    const phi = angleOfLon(i * 30 + 15);
    const bottom = Math.sin(phi) < 0;
    ctx.fillStyle = "#f1dfae";
    arcText(ctx, SIGNS[i], phi, bottom ? Rd + band * 0.6 : Rd + band * 0.5, `${nameFs}px ${st.fonts.serif}`, bottom, 1.2);
    ctx.fillStyle = "rgba(232,213,163,0.7)";
    arcText(ctx, SIGN_DATES[i], phi, bottom ? Rd + band * 0.9 : Rd + band * 0.14, `${dateFs}px ${st.fonts.sans}`, bottom, 0.4);
  }
  ctx.globalAlpha = 1;

  // Yön göstergesi merkezde
  if (!zoomed) {
    ctx.fillStyle = "rgba(212,175,55,0.9)";
    ctx.beginPath();
    ctx.arc(p0x, p0y, 2.2, 0, TWO_PI);
    ctx.fill();
  }

  // Görünüm okuması
  const vr = Math.hypot(view.cx, view.cy);
  const lat = 90 - vr * (90 - LAT_MIN);
  const lon = vr < 1e-4 ? 0 : (((Math.atan2(view.cy, view.cx) * 180) / Math.PI - 180) % 360 + 360) % 360;
  const text =
    view.scale < 1.05
      ? "Tüm gökyüzü"
      : `×${view.scale.toFixed(1)} · λ ${lon.toFixed(1)}° · β ${lat.toFixed(1)}°`;
  if (text !== st.lastReadout) {
    st.lastReadout = text;
    setReadout(text);
  }

  return animating;
}

/** Yay boyunca metin: üst yarıda dışa, alt yarıda içe dönük okunur. */
function arcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  phiCenter: number,
  radius: number,
  font: string,
  bottom: boolean,
  letterSpacing: number,
) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const widths = [...text].map((ch) => ctx.measureText(ch).width + letterSpacing);
  const total = widths.reduce((s, w) => s + w, 0);
  const cx0 = ctx.canvas.width / (2 * (ctx.getTransform().a || 1));
  let acc = 0;
  [...text].forEach((ch, i) => {
    const mid = acc + widths[i] / 2 - total / 2;
    acc += widths[i];
    const dPhi = mid / radius;
    const phi = bottom ? phiCenter + dPhi : phiCenter - dPhi;
    const x = cx0 + Math.cos(phi) * radius;
    const y = cx0 - Math.sin(phi) * radius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bottom ? -Math.PI / 2 - phi : Math.PI / 2 - phi);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}
