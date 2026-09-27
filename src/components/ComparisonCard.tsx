import type { ComparisonRow } from "../lib/visuals";

export function ComparisonCard({
  title,
  rows,
}: {
  title: string;
  rows: ComparisonRow[];
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <h3 className="font-serif text-xl text-gold-soft">{title}</h3>
      <div className="grid gap-3">
        {rows.map((row) => (
          <article
            key={row.label}
            className="gold-border panel-glass rounded-2xl p-4"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-gold">
              {row.label}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] text-gold-soft/60">Uluğ Bey</p>
                <p className="mt-1 leading-snug">{row.ulugh}</p>
              </div>
              <div>
                <p className="text-[11px] text-gold-soft/60">Günümüz</p>
                <p className="mt-1 leading-snug">{row.modern}</p>
              </div>
            </div>
            {row.note ? (
              <p className="mt-3 text-xs text-gold-soft/70">{row.note}</p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
