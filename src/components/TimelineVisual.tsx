import type { TimelineEvent } from "../lib/visuals";

export function TimelineVisual({
  title,
  events,
}: {
  title: string;
  events: TimelineEvent[];
}) {
  return (
    <div>
      <h3 className="font-serif text-xl text-gold-soft">{title}</h3>
      <ol className="relative mt-6 border-l border-gold/35 pl-6">
        {events.map((ev) => (
          <li key={`${ev.year}-${ev.text}`} className="mb-6 last:mb-0">
            <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-gold" />
            <p className="text-sm font-medium text-gold">{ev.year}</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/90">
              {ev.text}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
