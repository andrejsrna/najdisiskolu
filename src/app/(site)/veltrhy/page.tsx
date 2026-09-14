import { Illustration } from "@/lib/illustrations";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  VELTRHY_SECTIONS_DEFAULT,
  VELTRHY_SECTIONS_KEY,
  type VeltrhySections,
} from "@/lib/veltrhy-content";
import DodFilter from "./DodFilter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Veľtrhy škôl",
  description:
    "Termíny veľtrhov a dní otvorených dverí stredných škôl v Trnavskom kraji. Príď si pozrieť školy naživo.",
  alternates: { canonical: "/veltrhy" },
};

export default async function VeltrhyPage() {
  const [veltrhy, dodSchools, settings] = await Promise.all([
    prisma.veltrh.findMany({
      include: { schools: { orderBy: { name: "asc" } } },
      orderBy: { date: "asc" },
    }),
    prisma.school.findMany({
      where: { dods: { some: {} }, isPublished: true },
      include: { dods: { orderBy: { date: "asc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.setting.findUnique({ where: { key: VELTRHY_SECTIONS_KEY } }),
  ]);

  const stored = (settings?.value ?? {}) as Partial<VeltrhySections>;
  const s: VeltrhySections = {
    lead: stored.lead ?? VELTRHY_SECTIONS_DEFAULT.lead,
    whatCells:
      (stored.whatCells?.length ? stored.whatCells : VELTRHY_SECTIONS_DEFAULT.whatCells) ??
      VELTRHY_SECTIONS_DEFAULT.whatCells,
    tipsIntro: stored.tipsIntro ?? VELTRHY_SECTIONS_DEFAULT.tipsIntro,
    tipsCells:
      (stored.tipsCells?.length ? stored.tipsCells : VELTRHY_SECTIONS_DEFAULT.tipsCells) ??
      VELTRHY_SECTIONS_DEFAULT.tipsCells,
    dodIntro: stored.dodIntro ?? VELTRHY_SECTIONS_DEFAULT.dodIntro,
    helpHeading: stored.helpHeading ?? VELTRHY_SECTIONS_DEFAULT.helpHeading,
    helpText: stored.helpText ?? VELTRHY_SECTIONS_DEFAULT.helpText,
  };

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
          <p className="plead">{s.lead}</p>
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
          {s.whatCells.map((cell) => (
            <div className="cell" key={cell}>{cell}</div>
          ))}
        </div>

        <div className="rule" />
        <h2 className="dh">Ako z toho vyťažiť čo najviac</h2>
        <p className="dl">{s.tipsIntro}</p>
        <div className="infolist">
          {s.tipsCells.map((cell) => (
            <div className="cell" key={cell}>{cell}</div>
          ))}
        </div>

        <div className="rule" />
        <h2 className="dh">Dni otvorených dverí</h2>
        <p className="dl">{s.dodIntro}</p>
        <DodFilter schools={dodData} />

        <div className="helpbox">
          <div>
            <h4>{s.helpHeading}</h4>
            <p>{s.helpText}</p>
          </div>
          <Link className="btn solid" href="/#filter">
            Vyber si školu online →
          </Link>
        </div>
      </section>
    </>
  );
}