"use client";

import { useMemo, useState } from "react";
import { SkyChart } from "./SkyChart";
import { ErrorRadar } from "./ErrorRadar";
import {
  COMPARISON,
  GROUP_COLOR,
  GROUP_LABEL,
  arcminText,
  errorDegrees,
  formatDeg,
  type ComparedStar,
  type StarGroup,
} from "../lib/starComparison";

type GroupFilter = StarGroup | "all";
type SortKey = "error" | "mag" | "lon" | "name";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "error", label: "Sapma" },
  { key: "mag", label: "Parlaklık" },
  { key: "lon", label: "Boylam" },
  { key: "name", label: "Ad" },
];

const MAX_BAR = 75;

function median(values: number[]): number {
  const a = [...values].sort((x, y) => x - y);
  if (!a.length) return 0;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function mag(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

function chipClass(active: boolean): string {
  return `rounded-full border px-3 py-1.5 text-xs transition ${
    active
      ? "border-gold bg-gold/20 text-gold-soft"
      : "border-gold/30 bg-night/50 text-gold-soft/80 hover:border-gold/70"
  }`;
}

export function StarCompare() {
  const [group, setGroup] = useState<GroupFilter>("all");
  const [sort, setSort] = useState<SortKey>("error");
  const [hideApprox, setHideApprox] = useState(false);
  const [exaggeration, setExaggeration] = useState(10);
  const [showFigures, setShowFigures] = useState(true);
  const [showMilkyWay, setShowMilkyWay] = useState(true);
  const [showCatalog, setShowCatalog] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("sirius");

  const visible = useMemo(() => {
    const list = COMPARISON.stars.filter(
      (s) =>
        (group === "all" || s.group === group) &&
        !(hideApprox && s.confidence === "approx"),
    );
    const sorted = [...list];
    if (sort === "error") sorted.sort((a, b) => a.errorArcmin - b.errorArcmin);
    if (sort === "mag") sorted.sort((a, b) => a.magModern - b.magModern);
    if (sort === "lon") sorted.sort((a, b) => a.ulugh.lon - b.ulugh.lon);
    if (sort === "name")
      sorted.sort((a, b) => a.modern.localeCompare(b.modern, "tr"));
    return sorted;
  }, [group, sort, hideApprox]);

  const visibleIds = useMemo(
    () => new Set(visible.map((s) => s.id)),
    [visible],
  );

  const selected: ComparedStar | undefined =
    COMPARISON.stars.find((s) => s.id === selectedId) ?? visible[0];

  const errors = visible.map((s) => s.errorArcmin);
  const best = visible.reduce<ComparedStar | null>(
    (acc, s) => (!acc || s.errorArcmin < acc.errorArcmin ? s : acc),
    null,
  );
  const worst = visible.reduce<ComparedStar | null>(
    (acc, s) => (!acc || s.errorArcmin > acc.errorArcmin ? s : acc),
    null,
  );
  const med = median(errors);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Karşılaştırılan yıldız" value={String(visible.length)} />
        <Stat
          label="Medyan sapma"
          value={visible.length ? arcminText(med) : "—"}
          hint={visible.length ? `≈ ${errorDegrees(med)}°` : undefined}
        />
        <Stat
          label="En isabetli"
          value={best ? arcminText(best.errorArcmin) : "—"}
          hint={best?.modern}
        />
        <Stat
          label="En büyük sapma"
          value={worst ? arcminText(worst.errorArcmin) : "—"}
          hint={worst?.modern}
        />
      </div>

      <section className="gold-border panel-glass rounded-3xl p-5 md:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={chipClass(group === "all")}
            onClick={() => setGroup("all")}
          >
            Tümü
          </button>
          {(Object.keys(GROUP_LABEL) as StarGroup[]).map((g) => (
            <button
              key={g}
              type="button"
              className={chipClass(group === g)}
              onClick={() => setGroup(g)}
            >
              <span
                className="mr-1.5 inline-block h-2 w-2 rounded-full"
                style={{ background: GROUP_COLOR[g] }}
              />
              {GROUP_LABEL[g]}
            </button>
          ))}
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-gold-soft/80">
            <input
              type="checkbox"
              checked={hideApprox}
              onChange={(e) => setHideApprox(e.target.checked)}
              className="accent-[#d4af37]"
            />
            Tahmini eşleştirmeleri gizle
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
              Gök haritası · ekliptik koordinatlar · 1437 dönemi
            </p>
            <h2 className="font-serif text-2xl text-gold-soft">
              Aradaki fark gözle görülmez — o yüzden büyütüyoruz
            </h2>
          </div>
          <label className="flex items-center gap-3 text-xs text-gold-soft/80">
            Fark ×{exaggeration}
            <input
              type="range"
              min={1}
              max={40}
              value={exaggeration}
              onChange={(e) => setExaggeration(Number(e.target.value))}
              className="w-36 accent-[#d4af37]"
              aria-label="Farkı büyütme katsayısı"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gold-soft/80">
          <Toggle label="Takımyıldız çizgileri" checked={showFigures} onChange={setShowFigures} />
          <Toggle label="Samanyolu" checked={showMilkyWay} onChange={setShowMilkyWay} />
          <Toggle label="Katalogdaki tüm yıldızlar" checked={showCatalog} onChange={setShowCatalog} />
        </div>

        <div className="mt-4">
          <SkyChart
            stars={COMPARISON.stars}
            visibleIds={visibleIds}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
            exaggeration={exaggeration}
            showFigures={showFigures}
            showMilkyWay={showMilkyWay}
            showCatalog={showCatalog}
          />
        </div>
        <p className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-gold-soft/70">
          <Legend color="#bcd6ff" label="Modern konum (Hipparcos, 1437’ye getirilmiş)" />
          <Legend color="#d4af37" label="Uluğ Bey’in Zîc-i Sultânî konumu" />
          <span>Aradaki çizgi ×{exaggeration} büyütülmüştür. Tekerlek/çimdik ile yakınlaş, sürükleyerek gez.</span>
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="gold-border panel-glass rounded-3xl p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-2xl text-gold-soft">
              Sapma sıralaması
            </h2>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Sırala">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={chipClass(sort === s.key)}
                  onClick={() => setSort(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <ul className="mt-4 space-y-1.5">
            {visible.map((s) => {
              const active = s.id === selected?.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedId(s.id)}
                    className={`grid w-full grid-cols-[8.5rem_1fr_3.6rem] items-center gap-3 rounded-xl border px-3 py-2 text-left transition sm:grid-cols-[10rem_1fr_3.8rem] ${
                      active
                        ? "border-gold/70 bg-gold/10"
                        : "border-transparent hover:border-gold/30 hover:bg-white/5"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-foreground">
                        {s.modern}
                        {s.confidence === "approx" ? (
                          <span
                            className="ml-1 text-gold"
                            title="Eşleştirme tahmini"
                          >
                            ≈
                          </span>
                        ) : null}
                      </span>
                      <span className="block truncate text-[11px] text-gold-soft/60">
                        {s.names[0]} · {s.bayer}
                      </span>
                    </span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-white/10">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (s.errorArcmin / MAX_BAR) * 100)}%`,
                          background: GROUP_COLOR[s.group],
                        }}
                      />
                    </span>
                    <span className="text-right text-sm tabular-nums text-gold-soft">
                      {arcminText(s.errorArcmin)}
                    </span>
                  </button>
                </li>
              );
            })}
            {!visible.length ? (
              <li className="py-6 text-center text-sm text-foreground/60">
                Bu filtreyle yıldız kalmadı.
              </li>
            ) : null}
          </ul>
        </section>

        {selected ? <Detail star={selected} /> : null}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="gold-border panel-glass rounded-2xl p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-gold/90">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl text-gold-soft">{value}</p>
      <p className="mt-0.5 h-4 text-xs text-gold-soft/60">{hint ?? ""}</p>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[#d4af37]"
      />
      {label}
    </label>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

function Detail({ star }: { star: ComparedStar }) {
  return (
    <section className="gold-border panel-glass self-start rounded-3xl p-5 md:p-7 lg:sticky lg:top-6">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
        {GROUP_LABEL[star.group]} · {star.constellation}
      </p>
      <h2 className="mt-1 font-serif text-3xl text-gold-soft">
        {star.modern}{" "}
        <span className="text-xl text-gold-soft/60">({star.bayer})</span>
      </h2>
      <p className="mt-1 text-sm text-foreground/70">
        Geleneksel ad: {star.names.join(" · ")}
      </p>
      {star.confidence === "approx" ? (
        <p className="mt-2 inline-block rounded-full border border-gold/40 px-3 py-1 text-[11px] text-gold">
          ≈ Eşleştirme tahmini
        </p>
      ) : null}

      <div className="mt-4">
        <ErrorRadar star={star} />
        <p className="mt-2 text-center text-[11px] text-gold-soft/60">
          Merkez = modern konum · altın nokta = Uluğ Bey · Kuzey ↑ Doğu ←
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm">
        <dt className="text-gold-soft/70">Uluğ Bey (1437)</dt>
        <dd className="tabular-nums">
          λ {formatDeg(star.ulugh.lon)} · β {formatDeg(star.ulugh.lat, true)}
        </dd>
        <dt className="text-gold-soft/70">Modern (Hipparcos)</dt>
        <dd className="tabular-nums">
          λ {formatDeg(star.modernPos.lon)} · β{" "}
          {formatDeg(star.modernPos.lat, true)}
        </dd>
        <dt className="text-gold-soft/70">Boylam farkı</dt>
        <dd className="tabular-nums">
          {star.dLonArcmin > 0 ? "+" : ""}
          {arcminText(star.dLonArcmin)}
        </dd>
        <dt className="text-gold-soft/70">Enlem farkı</dt>
        <dd className="tabular-nums">
          {star.dLatArcmin > 0 ? "+" : ""}
          {arcminText(star.dLatArcmin)}
        </dd>
        <dt className="text-gold-soft/70">Toplam sapma</dt>
        <dd className="tabular-nums text-gold-soft">
          {arcminText(star.errorArcmin)} ≈ {errorDegrees(star.errorArcmin)}°
        </dd>
        <dt className="text-gold-soft/70">Parlaklık</dt>
        <dd className="tabular-nums">
          Uluğ Bey: {star.magUlugh}. kadir · Modern: {mag(star.magModern)} mag
        </dd>
        <dt className="text-gold-soft/70">Katalog sırası</dt>
        <dd className="tabular-nums">
          #{star.catalogNo} · HIP {star.hip}
        </dd>
      </dl>

      {star.derivedFromPtolemy ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-3 text-xs leading-relaxed text-gold-soft">
          Bu yıldızın konumu Semerkand’da ölçülmemiş; Batlamyus kataloğundan
          al-Sûfî yoluyla türetilmiştir. Sapma bu yüzden gözlem hatası değil,
          aktarım hatasıdır.
        </p>
      ) : null}
      {star.note ? (
        <p className="mt-3 text-xs leading-relaxed text-foreground/70">
          {star.note}
        </p>
      ) : null}
    </section>
  );
}
