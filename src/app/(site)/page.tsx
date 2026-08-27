import { prisma } from "@/lib/prisma";
import { FilterExplorer } from "./FilterExplorer";

export const dynamic = "force-dynamic";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("sk-SK", { day: "numeric", month: "long", year: "numeric" });

export default async function HomePage() {
  const [settingsRows, tags, schools, reviews, news] = await Promise.all([
    prisma.setting.findMany(),
    prisma.tag.findMany({ orderBy: { label: "asc" } }),
    prisma.school.findMany({
      where: { isPublished: true },
      include: { tags: true, odbory: true, badges: true },
      orderBy: { name: "asc" },
    }),
    prisma.review.findMany({
      where: { published: true },
      include: { school: { select: { name: true } } },
      orderBy: { sort: "asc" },
    }),
    prisma.post.findMany({
      where: { published: true, type: "NEWS" },
      include: { school: { select: { name: true } } },
      orderBy: { publishedAt: "desc" },
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
    badges: s.badges.map((b) => ({ label: b.label, kind: b.kind })),
  }));

  const stories = reviews;

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

      {/* TIMEBAR + ŠTATISTIKY */}
      <section className="band-ink">
        <div className="timebar">
          <strong>⏱ Prihlášky na stredné školy: <span className="hl">do 20. februára 2027</span></strong>
          <span>Teraz je čas chodiť na dni otvorených dverí →</span>
        </div>
        <div className="wrap">
          <div className="creds">
            {creds.map((c) => (
              <div className="cred" key={c.t}>
                <div className="n">{c.n}</div>
                <div className="t">{c.t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FILTER + RESULTS (klientsky interaktívny) */}
      <FilterExplorer schools={schoolData} tags={tagData} />

      {/* HOME MODULY: príbehy + blog */}
      {(stories.length > 0 || news.length > 0) && (
        <section className="band-page">
          <div className="wrap">
            <div id="homeModules">
              {stories.length > 0 && (
                <div className="modul">
                  <div className="mhead">
                    <h3>Moja stredná je super</h3>
                  </div>
                  <div className="g3">
                    {stories.map((s) => (
                      <div className="story" key={s.id}>
                        {s.photoUrl ? (
                          <img src={s.photoUrl} alt={s.name} className="img" style={{ height: 200, width: "100%", objectFit: "cover" }} />
                        ) : (
                          <div className="ph img">PORTRÉT</div>
                        )}
                        <div className="q">{s.quote}</div>
                        <div className="who">
                          {s.name}
                          {s.age ? `, ${s.age}` : ""}
                          {s.school ? ` · ${s.school.name}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {news.length > 0 && (
                <>
                  <div className="rule hand" aria-hidden="true" />
                  <div className="modul">
                    <div className="mhead">
                      <h3>Dobré správy zo školstva</h3>
                    </div>
                    <div className="g3">
                      {news.map((p) => (
                        <div className="post" key={p.id}>
                          <div className="ph img">FOTO</div>
                          {p.publishedAt && <div className="date">{fmtDate(p.publishedAt)}</div>}
                          <div className="t">{p.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
