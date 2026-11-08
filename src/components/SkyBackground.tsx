import { Starfield } from "./Starfield";

export function SkyBackground() {
  return (
    <div className="fixed inset-0 z-0 bg-[#050510]">
      <div className="milky-haze absolute inset-0" />
      <Starfield />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050510] to-transparent" />
    </div>
  );
}
