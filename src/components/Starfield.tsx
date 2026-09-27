"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  a: number;
  tw: number;
  tw2: number;
  sp: number;
  depth: number;
  color: [number, number, number];
  glow: boolean;
  flare: boolean;
};

type Meteor = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  life: number;
};

type Planet = {
  x: number;
  y: number;
  r: number;
  hue: [string, string];
  ring: boolean;
  driftR: number;
  driftSpeed: number;
  driftPhase: number;
};

type Nebula = {
  x: number;
  y: number;
  r: number;
  color: string;
  phase: number;
  speed: number;
};

const STAR_COLORS: [number, number, number][] = [
  [244, 234, 216],
  [244, 234, 216],
  [244, 234, 216],
  [210, 224, 255],
  [255, 226, 185],
];

export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let cx = 0;
    let cy = 0;
    let stars: Star[] = [];
    let planets: Planet[] = [];
    let nebulas: Nebula[] = [];
    let meteors: Meteor[] = [];
    let raf = 0;
    let t = 0;
    let nextMeteorAt = 2.5;
    let mouseNX = 0;
    let mouseNY = 0;
    let curNX = 0;
    let curNY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseNX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseNY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    const resize = () => {
      const parent = canvas.parentElement;
      w = parent?.clientWidth ?? window.innerWidth;
      h = parent?.clientHeight ?? window.innerHeight;
      cx = w / 2;
      cy = h / 2;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.floor((w * h) / 2000);
      stars = Array.from({ length: count }, () => {
        const depth = Math.random();
        const r = 0.3 + depth * depth * 1.7;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r,
          a: Math.random(),
          tw: Math.random() * 1.6 + 0.4,
          tw2: Math.random() * 3 + 1,
          sp: (0.15 + depth * 0.35) * 0.12,
          depth,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          glow: r > 1.3,
          flare: false,
        };
      });
      [...stars]
        .sort((a, b) => b.r - a.r)
        .slice(0, 5)
        .forEach((s) => {
          s.flare = true;
        });

      planets = [
        {
          x: w * 0.86,
          y: h * 0.18,
          r: Math.max(22, Math.min(w, h) * 0.05),
          hue: ["#e7c27d", "#8a5a2b"],
          ring: true,
          driftR: 10,
          driftSpeed: 0.05,
          driftPhase: Math.random() * Math.PI * 2,
        },
        {
          x: w * 0.1,
          y: h * 0.72,
          r: Math.max(14, Math.min(w, h) * 0.028),
          hue: ["#9fd3e8", "#2b5a78"],
          ring: false,
          driftR: 14,
          driftSpeed: 0.035,
          driftPhase: Math.random() * Math.PI * 2,
        },
        {
          x: w * 0.32,
          y: h * 0.12,
          r: Math.max(8, Math.min(w, h) * 0.015),
          hue: ["#d7b8e8", "#5a3878"],
          ring: false,
          driftR: 6,
          driftSpeed: 0.07,
          driftPhase: Math.random() * Math.PI * 2,
        },
      ];

      nebulas = [
        {
          x: w * 0.22,
          y: h * 0.35,
          r: Math.max(w, h) * 0.42,
          color: "88,70,190",
          phase: 0,
          speed: 0.015,
        },
        {
          x: w * 0.75,
          y: h * 0.6,
          r: Math.max(w, h) * 0.36,
          color: "50,90,150",
          phase: 2.1,
          speed: 0.012,
        },
        {
          x: w * 0.55,
          y: h * 0.15,
          r: Math.max(w, h) * 0.3,
          color: "150,80,130",
          phase: 4.2,
          speed: 0.018,
        },
      ];
    };

    let lines: { a: Star; b: Star }[] = [];
    const rebuildLines = () => {
      const bright = stars.filter((s) => s.r > 1.3).slice(0, 34);
      const next: { a: Star; b: Star }[] = [];
      for (let i = 0; i < bright.length; i += 1) {
        const a = bright[i];
        const near = bright
          .map((b) => ({ b, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 }))
          .filter((x) => x.d > 900 && x.d < 26000)
          .sort((p, q) => p.d - q.d)
          .slice(0, 2);
        near.forEach((n) => next.push({ a, b: n.b }));
      }
      lines = next;
    };

    const spawnMeteor = () => {
      const fromLeft = Math.random() > 0.5;
      const startX = fromLeft
        ? Math.random() * w * 0.4
        : w * 0.6 + Math.random() * w * 0.4;
      const startY = Math.random() * h * 0.35;
      const angle = fromLeft
        ? (Math.PI / 180) * (35 + Math.random() * 20)
        : (Math.PI / 180) * (145 - Math.random() * 20);
      const speed = 6 + Math.random() * 5;
      meteors.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: 90 + Math.random() * 70,
        life: 1,
      });
    };

    const drawNebula = (n: Nebula) => {
      const nx = n.x + Math.cos(t * n.speed + n.phase) * n.r * 0.08;
      const ny = n.y + Math.sin(t * n.speed * 0.8 + n.phase) * n.r * 0.06;
      const breathe = 0.55 + 0.15 * Math.sin(t * n.speed * 1.4 + n.phase);
      const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, n.r);
      grad.addColorStop(0, `rgba(${n.color},${0.16 * breathe})`);
      grad.addColorStop(0.5, `rgba(${n.color},${0.07 * breathe})`);
      grad.addColorStop(1, `rgba(${n.color},0)`);
      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(nx, ny, n.r, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawPlanet = (p: Planet) => {
      const dx = Math.cos(t * p.driftSpeed + p.driftPhase) * p.driftR;
      const dy = Math.sin(t * p.driftSpeed * 0.7 + p.driftPhase) * p.driftR;
      const px = p.x + dx;
      const py = p.y + dy;

      if (p.ring) {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-0.32);
        ctx.scale(1, 0.32);
        ctx.beginPath();
        ctx.arc(0, 0, p.r * 1.9, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(232,213,163,0.35)";
        ctx.lineWidth = p.r * 0.16;
        ctx.stroke();
        ctx.restore();
      }

      const grad = ctx.createRadialGradient(
        px - p.r * 0.35,
        py - p.r * 0.35,
        p.r * 0.1,
        px,
        py,
        p.r,
      );
      grad.addColorStop(0, p.hue[0]);
      grad.addColorStop(1, p.hue[1]);
      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.5;
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fill();

      const glow = ctx.createRadialGradient(px, py, p.r * 0.8, px, py, p.r * 2.4);
      glow.addColorStop(0, "rgba(232,213,163,0.12)");
      glow.addColorStop(1, "rgba(232,213,163,0)");
      ctx.beginPath();
      ctx.fillStyle = glow;
      ctx.globalAlpha = 0.6;
      ctx.arc(px, py, p.r * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const drawFlare = (s: Star, sx: number, sy: number, tw: number) => {
      const len = s.r * 15;
      const alpha = tw * 0.55;
      const h1 = ctx.createLinearGradient(sx - len, sy, sx + len, sy);
      h1.addColorStop(0, "rgba(255,250,235,0)");
      h1.addColorStop(0.5, `rgba(255,250,235,${alpha})`);
      h1.addColorStop(1, "rgba(255,250,235,0)");
      ctx.strokeStyle = h1;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx - len, sy);
      ctx.lineTo(sx + len, sy);
      ctx.stroke();

      const v1 = ctx.createLinearGradient(sx, sy - len, sx, sy + len);
      v1.addColorStop(0, "rgba(255,250,235,0)");
      v1.addColorStop(0.5, `rgba(255,250,235,${alpha})`);
      v1.addColorStop(1, "rgba(255,250,235,0)");
      ctx.strokeStyle = v1;
      ctx.beginPath();
      ctx.moveTo(sx, sy - len);
      ctx.lineTo(sx, sy + len);
      ctx.stroke();
    };

    const drawMeteor = (m: Meteor) => {
      const dist = Math.hypot(m.vx, m.vy);
      const dirX = m.vx / dist;
      const dirY = m.vy / dist;
      const tailX = m.x - dirX * m.len;
      const tailY = m.y - dirY * m.len;
      const fade = m.life;

      const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
      grad.addColorStop(0, "rgba(244,234,216,0)");
      grad.addColorStop(0.7, `rgba(244,234,216,${0.35 * fade})`);
      grad.addColorStop(1, `rgba(255,250,240,${0.9 * fade})`);
      ctx.beginPath();
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();

      const headGlow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 7);
      headGlow.addColorStop(0, `rgba(255,252,240,${fade})`);
      headGlow.addColorStop(1, "rgba(255,252,240,0)");
      ctx.beginPath();
      ctx.fillStyle = headGlow;
      ctx.arc(m.x, m.y, 7, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = () => {
      t += 0.016;
      curNX += (mouseNX - curNX) * 0.04;
      curNY += (mouseNY - curNY) * 0.04;
      ctx.clearRect(0, 0, w, h);

      const g = ctx.createRadialGradient(w * 0.5, h * 0.28, 0, w * 0.5, h * 0.4, w * 0.7);
      g.addColorStop(0, "rgba(70, 55, 140, 0.22)");
      g.addColorStop(0.45, "rgba(30, 40, 90, 0.08)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "lighter";
      nebulas.forEach(drawNebula);
      ctx.globalCompositeOperation = "source-over";

      planets.forEach(drawPlanet);

      // whole sky drifts very slowly around its centre, like real celestial rotation
      const rot = t * 0.0009;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.translate(-cx, -cy);

      const parX = curNX * 16;
      const parY = curNY * 11;

      ctx.strokeStyle = "rgba(212, 175, 55, 0.07)";
      ctx.lineWidth = 1;
      lines.forEach(({ a, b }) => {
        ctx.beginPath();
        ctx.moveTo(a.x + parX * a.depth, a.y + parY * a.depth);
        ctx.lineTo(b.x + parX * b.depth, b.y + parY * b.depth);
        ctx.stroke();
      });

      ctx.globalCompositeOperation = "lighter";
      for (const s of stars) {
        const flicker1 = 0.5 + 0.5 * Math.sin(t * s.tw + s.a * 8);
        const flicker2 = 0.5 + 0.5 * Math.sin(t * s.tw2 + s.a * 3.3);
        const tw = 0.32 + 0.68 * (flicker1 * 0.65 + flicker2 * 0.35);
        const [r, gc, b] = s.color;
        const sx = s.x + parX * s.depth;
        const sy = s.y + parY * s.depth;

        if (s.glow) {
          const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.r * 5);
          halo.addColorStop(0, `rgba(${r},${gc},${b},${tw * 0.32})`);
          halo.addColorStop(1, `rgba(${r},${gc},${b},0)`);
          ctx.beginPath();
          ctx.fillStyle = halo;
          ctx.arc(sx, sy, s.r * 5, 0, Math.PI * 2);
          ctx.fill();
        }
        if (s.flare) {
          drawFlare(s, sx, sy, tw);
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(${r},${gc},${b},${tw})`;
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fill();

        s.y += s.sp;
        if (s.y > h) s.y = 0;
      }
      ctx.globalCompositeOperation = "source-over";

      ctx.restore();

      if (t >= nextMeteorAt && meteors.length < 2) {
        spawnMeteor();
        nextMeteorAt = t + 4 + Math.random() * 5;
      }
      ctx.globalCompositeOperation = "lighter";
      meteors = meteors.filter((m) => {
        m.x += m.vx;
        m.y += m.vy;
        m.life -= 0.011;
        const offscreen = m.x < -100 || m.x > w + 100 || m.y > h + 100;
        if (m.life <= 0 || offscreen) return false;
        drawMeteor(m);
        return true;
      });
      ctx.globalCompositeOperation = "source-over";

      const vignette = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.35, cx, cy, Math.max(w, h) * 0.75);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(draw);
    };

    resize();
    rebuildLines();
    draw();
    const onResize = () => {
      resize();
      rebuildLines();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
