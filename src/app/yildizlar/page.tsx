import type { Metadata } from "next";
import Link from "next/link";
import { SkyBackground } from "../../components/SkyBackground";
import { StarCompare } from "../../components/StarCompare";
import { COMPARISON, arcminText, errorDegrees } from "../../lib/starComparison";

export const metadata: Metadata = {
  title: "Uluğ Bey ve Modern Gökyüzü · Yıldız Karşılaştırması",
  description:
    "Uluğ Bey’in Zîc-i Sultânî’de ölçtüğü yıldız konumları, Hipparcos verisiyle yan yana: ne kadar isabetliydi?",
};

export default function StarsPage() {
  const c = COMPARISON.catalog;
  const medianDeg = errorDegrees(c.medianErrorArcmin);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <SkyBackground />

      <main className="relative mx-auto max-w-6xl px-4 pb-24 pt-8 md:px-6">
        <nav className="flex items-center justify-between text-xs uppercase tracking-[0.25em]">
          <Link href="/" className="text-gold/80 transition hover:text-gold">
            ← Uluğ Bey ile sohbet
          </Link>
          <span className="hidden text-gold/60 sm:block">
            Semerkant · 1437 · Hipparcos
          </span>
        </nav>

        <header className="mx-auto max-w-3xl pb-12 pt-14 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            Zîc-i Sultânî · Modern gökyüzü
          </p>
          <h1 className="mt-5 font-serif text-4xl leading-tight text-gold-soft sm:text-6xl">
            Uluğ Bey’in yıldızları, bugünün ölçümüyle
          </h1>
          <p className="mt-6 text-base leading-relaxed text-foreground/80 sm:text-lg">
            Uluğ Bey ve ekibi, 1437’de teleskopsuz ölçtükleri yıldız
            konumlarını Zîc-i Sultânî’ye yazdı. Aynı yıldızların Hipparcos
            uydusuyla ölçülmüş konumlarını 1437 dönemine taşıyıp yan yana
            koyduk: Semerkand’ın gözlemleri ne kadar isabetliydi?
          </p>
        </header>

        <StarCompare />

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          <Insight title="Tipik hata yarım derece civarı">
            Katalogun kimliği kesin {c.secureStars} yıldızında medyan sapma{" "}
            <strong className="text-gold-soft">
              {arcminText(c.medianErrorArcmin)}
            </strong>{" "}
            (≈ {medianDeg}°). Yıldızların yarısı {arcminText(c.p25ErrorArcmin)}{" "}
            ile {arcminText(c.p75ErrorArcmin)} arasında. Karşılaştırma için
            Ay’ın görünen çapı yaklaşık 31′.
          </Insight>
          <Insight title="Hata sabit bir kayma değil">
            Hipparcos − Uluğ Bey boylam farkının ortalaması{" "}
            {arcminText(c.meanDLonArcmin)}: Uluğ Bey’in boylamları ortalama
            biraz fazla. Bu ortak kayma çıkarıldığında bile medyan hata{" "}
            {arcminText(c.medianResidualArcmin)} kalıyor. Yani sapmanın büyük
            kısmı tek bir sabit hatadan değil, yıldız yıldız ölçüm dağılımından
            geliyor.
          </Insight>
          <Insight title="Her sapma gözlem hatası değil">
            Bazı konumlar Semerkand’da ölçülmedi: Canopus gibi güney yıldızları
            Batlamyus’tan al-Sûfî yoluyla aktarıldı. Achernar ve α Centauri ise
            Semerkand’dan görünmediği için katalogda hiç yok.
          </Insight>
        </section>

        <section className="gold-border panel-glass mt-8 rounded-3xl p-5 md:p-7">
          <h2 className="font-serif text-2xl text-gold-soft">
            Veri ve yöntem
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground/75">
            <p>
              Uluğ Bey konumları, {COMPARISON.source.authors}{" "}
              {COMPARISON.source.reference} çalışmasındaki makine-okunur
              katalogdan ({COMPARISON.source.vizier}, VizieR) alındı; her yıldız
              Hipparcos numarasıyla eşleştirilmiş durumda. Konumlar ekliptik
              boylam (λ) ve enlem (β) olarak, {COMPARISON.source.epoch} dönemi
              için verilir.
            </p>
            <p>
              <em>Modern konum</em>, Hipparcos konumunun 1437 dönemine
              getirilmiş (presesyon ve özhareket dâhil) ekliptik hâlidir.{" "}
              <em>Fark</em> = Hipparcos − Uluğ Bey, yay dakikası (′) cinsinden;{" "}
              <em>toplam sapma</em> ise iki konum arasındaki açısal uzaklıktır.
              Yaklaşık 1′ çıplak gözün ayırt etme sınırıdır.
            </p>
            <p>
              Yıldız adları, listendeki Türkçe/Arapça gelenek adlarından modern
              yıldızlara eşleştirilmiştir. <span className="text-gold">≈</span>{" "}
              işaretliler tahmini eşleştirmedir ve tarihî kaynaktan
              doğrulanmalıdır.
            </p>
          </div>

          <h3 className="mt-6 font-serif text-xl text-gold-soft">
            Katalogda bulunmayan yıldızlar
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-foreground/75">
            {COMPARISON.absent.map((a) => (
              <li key={a.modern}>
                <strong className="text-gold-soft">
                  {a.modern} ({a.bayer})
                </strong>{" "}
                — {a.names.join(", ")}: {a.reason}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

function Insight({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="gold-border panel-glass rounded-2xl p-5">
      <h3 className="font-serif text-xl text-gold-soft">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground/75">
        {children}
      </p>
    </article>
  );
}
