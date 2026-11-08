import type { ComparedStar } from "../lib/starComparison";

const RADIUS_ARCMIN = 80;
const RINGS = [20, 40, 60, 80];

export function ErrorRadar({ star }: { star: ComparedStar }) {
  const size = 300;
  const c = size / 2;
  const r = 128;
  const k = r / RADIUS_ARCMIN;
  const cosB = Math.cos((star.ulugh.lat * Math.PI) / 180);
  // Uluğ Bey − modern = −(Hipparcos − Uluğ Bey); kuzey yukarı, doğu solda.
  const ux = c + star.dLonArcmin * cosB * k;
  const uy = c + star.dLatArcmin * k;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto h-auto w-full max-w-[320px]"
      role="img"
      aria-label={`${star.modern}: Uluğ Bey konumu modern konumdan ${star.errorArcmin.toFixed(1)} yay dakikası uzakta`}
    >
      <defs>
        <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a1440" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#07061a" stopOpacity="0.95" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={r} fill="url(#radar-bg)" />
      {RINGS.map((ring) => (
        <g key={ring}>
          <circle
            cx={c}
            cy={c}
            r={ring * k}
            fill="none"
            stroke="#e8d5a3"
            strokeOpacity={ring === RADIUS_ARCMIN ? 0.4 : 0.16}
            strokeDasharray={ring === RADIUS_ARCMIN ? undefined : "3 5"}
          />
          <text
            x={c + 4}
            y={c - ring * k + 11}
            fontSize="9"
            fill="#e8d5a3"
            fillOpacity="0.65"
          >
            {ring}′
          </text>
        </g>
      ))}
      <line x1={c - r} y1={c} x2={c + r} y2={c} stroke="#e8d5a3" strokeOpacity="0.14" />
      <line x1={c} y1={c - r} x2={c} y2={c + r} stroke="#e8d5a3" strokeOpacity="0.14" />
      <text x={c} y={c - r - 8} textAnchor="middle" fontSize="11" fill="#e8d5a3">
        K
      </text>
      <text x={c - r - 10} y={c + 4} textAnchor="middle" fontSize="11" fill="#e8d5a3">
        D
      </text>

      <line
        x1={c}
        y1={c}
        x2={ux}
        y2={uy}
        stroke="#d4af37"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <circle cx={c} cy={c} r="9" fill="#8fb8ff" fillOpacity="0.18" />
      <circle cx={c} cy={c} r="4.5" fill="#bcd6ff" />
      <circle cx={ux} cy={uy} r="9" fill="#d4af37" fillOpacity="0.2" />
      <circle cx={ux} cy={uy} r="4.5" fill="#d4af37" stroke="#fff3c4" strokeWidth="1" />
    </svg>
  );
}
