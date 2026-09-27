export function InfoCard({
  title,
  points,
}: {
  title: string;
  points: string[];
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <h3 className="font-serif text-xl text-gold-soft">{title}</h3>
      <ul className="grid gap-3">
        {points.map((point, i) => (
          <li
            key={`${i}-${point.slice(0, 24)}`}
            className="gold-border panel-glass flex gap-3 rounded-2xl p-4 text-sm leading-relaxed"
          >
            <span className="mt-0.5 text-gold">✦</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
