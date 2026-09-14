import { Illustration } from "@/lib/illustrations";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DodFilter from "./DodFilter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Veľtrhy škôl",
  description:
    "Termíny veľtrhov a dní otvorených dverí stredných škôl v Trnavskom kraji. Príď si pozrieť školy naživo.",
  alternates: { canonical: "/veltrhy" },
};

export default async function VeltrhyPage() {
  const [veltrhy, dodSchools] = await Promise.all([
    prisma.veltrh.findMany({
      include: { schools: { orderBy: { name: "asc" } } },
      orderBy: { date: "asc" },
    }),
    prisma.school.findMany({
      where: { dods: { some: {} }, isPublished: true },
      include: { dods: { orderBy: { date: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const dodData = dodSchools
    .map((s) => {
      const dod = s.dods[0];
      return {
        slug: s.slug,
        name: s.name,
        city: s.city,
        district: s.district,
        dodDate: dod ? dod.date.toISOString() : null,
        dodTime: dod?.time ?? null,
      };
    })
    .filter((s) => s.dodDate);

  return (
    <>
      {/* ===== Veľtrhy ===== */}
      <section className="band-acid">
        <Illustration name="fairFlag" />
        <div className="wrap phead">
          <h1>Veľtrhy škôl</h1>
          <p className="plead">
            Raz do roka sa všetkých 44 župných stredných škôl stretne na jednom mieste. Za jedno
            popoludnie sa porozprávaš s toľkými školami, koľko by si inak obchádzal celú jeseň – a
            hlavne so žiakmi, ktorí na nich naozaj študujú.
          </p>
        </div>
      </section>

      <section className="wrap page">
        {veltrhy.length === 0 ? (
          <div className="empty">Termíny veľtrhov zatiaľ nie sú zverejnené.</div>
        ) : (
          <div className="fest" style={{ marginTop: 4 }}>
            {veltrhy.map((v) => (
              <div className="fcard" key={v.id}>
                <div className="top">
                  <div className="d">
                    {v.date.toLocaleDateString("sk-SK", { day: "numeric", month: "long" })}
                  </div>
                  <div className="c">
                    {v.date.toLocaleDateString("sk-SK", { weekday: "long" })} · {v.time}
                  </div>
                </div>
                <div className="bd">
                  <div className="mm">{v.city}</div>
                  <div className="ad">
                    {v.place}
                    <br />
                    {v.address}
                  </div>
                  {(v.extra ?? v.description) && (
                    <div className="ex">{v.extra ?? v.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rule" />
        <h2 className="dh">Čo tam na teba čaká</h2>
        <div className="infolist">
          <div className="cell">Stánok každej zo 44 župných stredných škôl – na jednom mieste, bez cestovania</div>
          <div className="cell">Ukážky prác a praktické dielne – uvidíš, čo sa v odbore naozaj robí</div>
          <div className="cell">Študenti škôl, ktorí odpovedia na to, na čo sa učiteľa spýtať nechceš</div>
          <div className="cell">Zástupcovia firiem, ktoré berú žiakov do duálneho vzdelávania</div>
          <div className="cell">Talentcentrum – pomôže ti zistiť, v čom máš predpoklady</div>
          <div className="cell">Kariérové poradenstvo pre teba aj pre rodičov</div>
        </div>

        <div className="rule" />
        <h2 className="dh">Ako z toho vyťažiť čo najviac</h2>
        <p className="dl">
          Väčšina deviatakov prejde halu za dvadsať minút a odnesie si tašku letákov. Škoda – dá sa
          to aj inak.
        </p>
        <div className="infolist">
          <div className="cell">Pozri si vopred, ktoré školy ťa zaujímajú, a vyber si tri až päť stánkov, kde sa naozaj zastavíš</div>
          <div className="cell">Priprav si otázky – čo presne budem robiť na praxi, kam idú absolventi, koľko vás vlani prijali</div>
          <div className="cell">Choď s rodičom, ale nechaj sa pýtať sám – ide o tvoje štyri roky</div>
          <div className="cell">Pýtaj sa študentov, nie len učiteľov pri stánku</div>
          <div className="cell">Zapíš si termín dňa otvorených dverí škôl, ktoré ťa zaujali</div>
          <div className="cell">Nerozhoduj sa na mieste – doma si to v pokoji porovnaj</div>
        </div>

        <div className="rule" />
        <h2 className="dh">Dni otvorených dverí</h2>
        <p className="dl">
          Veľtrh ti dá prehľad, deň otvorených dverí ti dá pocit z konkrétnej školy. Choď aspoň na
          dve – porovnanie ti povie viac než ktorýkoľvek leták.
        </p>
        <DodFilter schools={dodData} />

        <div className="helpbox">
          <div>
            <h4>Nestíhaš ani jeden veľtrh?</h4>
            <p>Nevadí. Prejdi si ponuku škôl online a napíš priamo tej, ktorá ťa zaujme.</p>
          </div>
          <Link className="btn solid" href="/#filter">
            Vyber si školu online →
          </Link>
        </div>
      </section>
    </>
  );
}