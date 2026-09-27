export function ObservatoryDiagram({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-serif text-xl text-gold-soft">{title}</h3>
      <svg
        viewBox="0 0 640 360"
        className="h-auto w-full"
        role="img"
        aria-label="Semerkant meridyen kadranının şematik kesiti"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c1650" />
            <stop offset="100%" stopColor="#07061a" />
          </linearGradient>
        </defs>
        <rect width="640" height="360" rx="18" fill="url(#sky)" />
        <circle cx="90" cy="70" r="2" fill="#f4ead8" />
        <circle cx="160" cy="40" r="1.5" fill="#f4ead8" />
        <circle cx="240" cy="55" r="2.2" fill="#f4ead8" />
        <circle cx="400" cy="36" r="1.8" fill="#f4ead8" />
        <circle cx="520" cy="64" r="2" fill="#f4ead8" />
        <circle cx="580" cy="42" r="1.4" fill="#f4ead8" />
        <path
          d="M40 210 L120 210 L150 150 L490 150 L520 210 L600 210 L600 250 L40 250 Z"
          fill="#2a2248"
          stroke="#d4af37"
          strokeWidth="1.5"
        />
        <path
          d="M200 250 L200 310 A140 140 0 0 0 440 310 L440 250"
          fill="#0c0a1c"
          stroke="#d4af37"
          strokeWidth="2"
        />
        <path
          d="M210 250 A130 130 0 0 0 430 250"
          fill="none"
          stroke="#e8d5a3"
          strokeWidth="3"
          strokeDasharray="6 8"
        />
        <line
          x1="320"
          y1="48"
          x2="320"
          y2="318"
          stroke="#d4af37"
          strokeOpacity="0.55"
          strokeDasharray="4 6"
        />
        <circle cx="320" cy="48" r="6" fill="#f4ead8" />
        <text
          x="332"
          y="44"
          fill="#e8d5a3"
          fontSize="12"
          fontFamily="serif"
        >
          Güneş / yıldız
        </text>
        <text
          x="150"
          y="338"
          fill="#e8d5a3"
          fontSize="13"
          fontFamily="serif"
        >
          Yer altı meridyen yayı (~40 m yarıçap)
        </text>
        <text x="70" y="180" fill="#d4af37" fontSize="12" fontFamily="serif">
          Gözlemevi yapısı
        </text>
      </svg>
      <p className="text-sm leading-relaxed text-gold-soft/80">
        Teleskop yoktur. Gök cismi meridyenden geçerken büyük kavisli ölçek
        üzerinde yükseklik okunur; büyük yarıçap açı hatasını küçültür.
      </p>
    </div>
  );
}
