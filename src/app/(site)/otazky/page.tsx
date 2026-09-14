import { Illustration } from "@/lib/illustrations";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { QaClient } from "./QaClient";
import type { QAItem, QAGroup } from "@/lib/qa-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Otázky a odpovede",
  description:
    "Často kladené otázky o prijímačkách na stredné školy — termíny prihlášok, prijímacie skúšky, druhé kolo aj praktické veci.",
  alternates: { canonical: "/otazky" },
};

export default async function OtazkyPage() {
  const faqs = await prisma.faq.findMany({ orderBy: { sort: "asc" } });

  // Zoskupim ploché záznamy do [skupina, [otázka, odpoveď]][], zachovať poradie.
  const groups: QAGroup[] = [];
  const index = new Map<string, QAGroup>();
  for (const f of faqs) {
    let g = index.get(f.group);
    if (!g) {
      g = [f.group, []];
      index.set(f.group, g);
      groups.push(g);
    }
    g[1].push([f.question, f.answer] as QAItem);
  }

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <section className="band-mat">
        <Illustration name="faqQuestion" />
        <div className="wrap" style={{ paddingTop: 56, paddingBottom: 56 }}>
          <h1 style={{ fontSize: "clamp(30px,4.5vw,54px)", letterSpacing: "-.03em", margin: 0 }}>
            Otázky a odpovede
          </h1>
          <p style={{ fontSize: 19, maxWidth: "62ch", margin: "12px 0 0", color: "var(--ink)", opacity: 0.8 }}>
            Všetko, čo sa deviataci a ich rodičia pýtajú najčastejšie — od prihlášky po prvý
            september.
          </p>
        </div>
      </section>

      <section className="band-page">
        <div className="wrap" style={{ paddingTop: 36, paddingBottom: 56 }}>
          <QaClient qa={groups} />

          <div className="helpbox">
            <div>
              <h4>Nenašiel si odpoveď?</h4>
              <p>
                Napíš na odbor školstva Trnavského samosprávneho kraja alebo sa spýtaj priamo školy,
                ktorá ťa zaujíma.
              </p>
            </div>
            <Link className="btn solid" href="/#filter">
              Nájdi si školu →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}