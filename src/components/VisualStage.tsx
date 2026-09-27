"use client";

import { ComparisonCard } from "./ComparisonCard";
import { InfoCard } from "./InfoCard";
import { ObservatoryDiagram } from "./ObservatoryDiagram";
import { StarMap } from "./StarMap";
import { TimelineVisual } from "./TimelineVisual";
import {
  DEFAULT_COMPARISON_ROWS,
  DEFAULT_TIMELINE,
  type ChatVisual,
} from "../lib/visuals";

export function VisualStage({ visual }: { visual: ChatVisual | null }) {
  const isEmptyInfo =
    visual?.type === "info" && !(visual.points && visual.points.length);
  if (!visual || visual.type === "none" || isEmptyInfo) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-6 text-center">
        <p className="font-serif text-2xl text-gold-soft">Gökyüzü sahnesi</p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-foreground/70">
          Soru sordukça yanıtın görseli burada açılır: yıldız diski, ölçüm
          kartları, zaman çizelgesi veya gözlemevi şeması.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-1 scrollbar-night">
      {visual.type === "star_map" ? (
        <StarMap
          title={visual.title}
          highlightIds={visual.stars?.map((s) => s.id)}
        />
      ) : null}
      {visual.type === "comparison" ? (
        <ComparisonCard
          title={visual.title}
          rows={
            visual.rows && visual.rows.length
              ? visual.rows
              : DEFAULT_COMPARISON_ROWS
          }
        />
      ) : null}
      {visual.type === "timeline" ? (
        <TimelineVisual
          title={visual.title}
          events={
            visual.events && visual.events.length
              ? visual.events
              : DEFAULT_TIMELINE
          }
        />
      ) : null}
      {visual.type === "observatory" ? (
        <ObservatoryDiagram title={visual.title} />
      ) : null}
      {visual.type === "info" && visual.points && visual.points.length ? (
        <InfoCard title={visual.title} points={visual.points} />
      ) : null}
    </div>
  );
}
