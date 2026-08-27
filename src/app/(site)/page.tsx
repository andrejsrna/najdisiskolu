import { prisma } from "@/lib/prisma";
import { FilterExplorer } from "./FilterExplorer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settingsRows, tags, schools] = await Promise.all([
    prisma.setting.findMany(),
    prisma.tag.findMany({ orderBy: { label: "asc" } }),
    prisma.school.findMany({
      where: { isPublished: true },
      include: { tags: true, odbory: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const set = new Map(settingsRows.map((r) => [r.key, r.value]));
  const get = (k: string, d: unknown) => (set.has(k) ? set.get(k) : d);
  const heroTitle = String(get("hero.title", "Nájdi si strednú, ktorá ťa bude baviť"));
  const heroSubtitle = String(get("hero.subtitle", "Trnavská župa ti ponúka 44 skvelých možností."));
  const heroLink = String(get("hero.link", "") || "");
  const heroHidden = Boolean(get("hero.hidden", false));

  const creds = [
    { n: String(get("cred.schools", schools.length)), t: "župných stredných škôl" },
    { n: String(get("cred.programs", "-")), t: "študijných a učebných odborov" },
    { n: String(get("cred.places", "-")), t: "voľných miest pre prvákov" },
    { n: String(get("cred.dual", "-")), t: "žiakov v duálnom vzdelávaní" },
  ];

  const tagData = tags.map((t) => ({ code: t.code, label: t.label }));
  const schoolData = schools.map((s) => ({
    slug: s.slug,
    name: s.name,
    city: s.city,
    district: s.district,
    languages: s.languages,
    hasCanteen: s.hasCanteen,
    hasInternat: s.hasInternat,
    hasDual: s.hasDual,
    hasNadstavba: s.hasNadstavba,
    inekoKraj: s.inekoKraj,
    odbory: s.odbory.map((o) => ({
      completion: o.completion,
      accepts: o.accepts,
      appliedLastYear: o.appliedLastYear,
      name: o.name,
      code: o.code,
      length: o.length,
    })),
    tags: s.tags.map((t) => ({ code: t.code, label: t.label })),
  }));

  return (
    <>
      {/* HERO */}
      {!heroHidden && (
        <section className="hero">
          <video autoPlay muted loop playsInline preload="auto" aria-hidden="true" tabIndex={-1}>
            <source src="/hero.mp4" type="video/mp4" />
          </video>
          <div className="claim">
            <h1>{heroTitle}</h1>
            <p className="sub">{heroSubtitle}</p>
            <a className="btn solid" style={{ padding: "12px 26px", fontSize: "15.5px" }} href={heroLink || "#filter"}>
              Vyber si školu
            </a>
          </div>
        </section>
      )}

      {/* ŠTATISTIKY */}
      <div className="creds">
        {creds.map((c) => (
          <div className="cred" key={c.t}>
            <div className="n">{c.n}</div>
            <div className="t">{c.t}</div>
          </div>
        ))}
      </div>

      {/* FILTER + RESULTS (klientsky interaktívny) */}
      <FilterExplorer schools={schoolData} tags={tagData} />
    </>
  );
}
