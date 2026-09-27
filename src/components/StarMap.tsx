"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATALOG_STARS, type CatalogStar } from "../lib/stars";

type Props = {
  highlightIds?: string[];
  title?: string;
};

function project(star: CatalogStar, cx: number, cy: number, r: number) {
  const dec = (star.dec * Math.PI) / 180;
  const ra = (star.ra / 24) * 2 * Math.PI;
  const dec0 = (25 * Math.PI) / 180;
  const ra0 = (12 / 24) * 2 * Math.PI;
  const cosC =
    Math.sin(dec0) * Math.sin(dec) +
    Math.cos(dec0) * Math.cos(dec) * Math.cos(ra - ra0);
  if (cosC <= 0.05) return null;
  const k = r / (1 + cosC);
  const x = k * Math.cos(dec) * Math.sin(ra - ra0);
  const y =
    k *
    (Math.cos(dec0) * Math.sin(dec) -
      Math.sin(dec0) * Math.cos(dec) * Math.cos(ra - ra0));
  return { x: cx + x, y: cy - y };
}

export function StarMap({ highlightIds, title }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{
    star: CatalogStar;
    x: number;
    y: number;
  } | null>(null);

  const hi = useMemo(
    () => new Set((highlightIds ?? []).map((id) => id.toLowerCase())),
    [highlightIds],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const paint = () => {
      const size = Math.min(wrap.clientWidth, 520);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.42;

      ctx.clearRect(0, 0, size, size);
      const bg = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
      bg.addColorStop(0, "#14103a");
      bg.addColorStop(1, "#05040f");
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = "rgba(212,175,55,0.35)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.strokeStyle = "rgba(232,213,163,0.12)";
      ctx.lineWidth = 1;
      [0.33, 0.66, 1].forEach((f) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r * f, 0, Math.PI * 2);
        ctx.stroke();
      });

      CATALOG_STARS.forEach((star) => {
        const p = project(star, cx, cy, r);
        if (!p) return;
        const lit = hi.size === 0 || hi.has(star.id);
        const rad = Math.max(1.2, 4.2 - star.mag * 0.7);
        ctx.beginPath();
        ctx.fillStyle = lit
          ? "rgba(244,234,216,0.95)"
          : "rgba(160,170,200,0.28)";
        ctx.arc(p.x, p.y, lit ? rad : rad * 0.7, 0, Math.PI * 2);
        ctx.fill();
        if (hi.has(star.id)) {
          ctx.beginPath();
          ctx.strokeStyle = "rgba(212,175,55,0.85)";
          ctx.lineWidth = 1.2;
          ctx.arc(p.x, p.y, rad + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    };

    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [hi]);

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const size = rect.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.42;
    let best: CatalogStar | null = null;
    let bestD = 14;
    for (const star of CATALOG_STARS) {
      const p = project(star, cx, cy, r);
      if (!p) continue;
      const d = Math.hypot(p.x - mx, p.y - my);
      if (d < bestD) {
        bestD = d;
        best = star;
      }
    }
    if (best) setHover({ star: best, x: mx, y: my });
    else setHover(null);
  };

  return (
    <div ref={wrapRef} className="relative flex flex-col items-center gap-3">
      {title ? (
        <h3 className="font-serif text-xl text-gold-soft">{title}</h3>
      ) : null}
      <canvas
        ref={canvasRef}
        className="max-w-full cursor-crosshair"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      />
      <p className="text-center text-xs text-gold-soft/70">
        Stereografik gök diski — vurgulananlar Zîc bağlamındaki parlak yıldızlar
      </p>
      {hover ? (
        <div
          className="pointer-events-none absolute max-w-xs rounded-lg border border-gold/30 bg-night/95 px-3 py-2 text-xs text-foreground shadow-lg"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          <p className="font-medium text-gold">{hover.star.name}</p>
          <p className="text-gold-soft/80">{hover.star.constellation}</p>
          <p className="mt-1">{hover.star.ulugh}</p>
          <p className="mt-1 text-gold-soft/70">{hover.star.modern}</p>
        </div>
      ) : null}
    </div>
  );
}
