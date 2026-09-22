import Link from "next/link";
import { BlockIllustration, Illustration } from "@/lib/illustrations";
import { prisma } from "@/lib/prisma";
import { FilterExplorer } from "./FilterExplorer";

export const dynamic = "force-dynamic";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("sk-SK", { day: "numeric", month: "long", year: "numeric" });

/** Rok, do ktorého platí termín prihlášok (20. február). Nábor začína v septembri
 *  predchádzajúceho roka, preto od septembra ukazujeme termín nasledujúceho roka. */
function deadlineYear(): number {
  const now = new Date();
  return now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear();
}

export default async function HomePage() {
  const [settingsRows, tags, schools, reviews, news] = await Promise.all([
    prisma.setting.findMany(),
    prisma.tag.findMany({ orderBy: { label: "asc" } }),
    prisma.school.findMany({
      where: { isPublished: true },
      include: {
        tags: true,
        odbory: true,
        badges: true,
        photos: { where: { isListCover: true }, take: 1 },
      },
      orderBy: { name: "asc" },
    }),
    prisma.review.findMany({
      where: { published: true },
      include: { school: { select: { name: true } } },
      orderBy: { sort: "asc" },
    }),
    prisma.post.findMany({
      where: { published: true, type: "NEWS", slug: { not: null } },
      include: { school: { select: { name: true } } },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
  ]);

  const set = new Map(settingsRows.map((r) => [r.key, r.value]));
  const get = (k: string, d: unknown) => (set.has(k) ? set.get(k) : d);
  const heroTitle = String(get("hero.title", "Nájdi si strednú, ktorá ťa bude baviť"));
  const heroSubtitle = String(get("hero.subtitle", "Trnavská župa ti ponúka 44 skvelých možností."));
  const heroLink = String(get("hero.link", "") || "");
  const heroHidden = Boolean(get("hero.hidden", false));
  const heroMediaType = get("hero.mediaType", "video") === "image" ? "image" : "video";
  const heroMediaUrl = String(get("hero.mediaUrl", "") || "");
  const heroPosterUrl = String(get("hero.posterUrl", "") || "");
    const timebarEnabled = Boolean(get("timebar.enabled", true));
    const timebarTitle = String(get("timebar.title", "⏱ Prihlášky na stredné školy:") || "");
    const timebarHighlight = String(get("timebar.highlight", `do 20. februára ${deadlineYear()}`) || "");
    const timebarLinkText = String(get("timebar.linkText", "Teraz je čas chodiť na dni otvorených dverí →") || "");
    const rawTimebarLink = String(get("timebar.linkHref", "/veltrhy") || "");
    const timebarLink = rawTimebarLink.startsWith("/") || /^https:\/\//.test(rawTimebarLink) ? rawTimebarLink : "";

  // Automatický dopočet zo živých dát škôl — použije sa vždy, keď v nastaveniach
  // nie je vyplnený manuálny override (ten má prednosť, keď je zadaný).
  const autoSchools = schools.length;
  const autoPrograms = new Set(schools.flatMap((s) => s.odbory.map((o) => o.code))).size;
  const autoPlaces = schools.reduce((sum, s) => sum + s.odbory.reduce((a, o) => a + (o.accepts ?? 0), 0), 0);
  const autoDual = schools
    .filter((s) => s.hasDual)
    .reduce((sum, s) => sum + s.odbory.reduce((a, o) => a + (o.accepts ?? 0), 0), 0);

  const creds = [
    { n: String(get("cred.schools", autoSchools)), t: "župných stredných škôl", icon: "credIcon1" as const, iconClass: "ico-wide" },
    { n: String(get("cred.programs", autoPrograms)), t: "študijných a učebných odborov", icon: "credIcon2" as const, iconClass: "ico-sq" },
    { n: String(get("cred.places", autoPlaces)), t: "voľných miest pre prvákov", icon: "credIcon3" as const, iconClass: "ico-mid" },
    { n: String(get("cred.dual", autoDual)), t: "žiakov v duálnom vzdelávaní", icon: "credIcon4" as const, iconClass: "" },
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
    inekoKrajRank: s.inekoKrajRank,
    inekoKrajOf: s.inekoKrajOf,
    odbory: s.odbory.map((o) => ({
      completion: o.completion,
      accepts: o.accepts,
      appliedLastYear: o.appliedLastYear,
      places: o.places,
      name: o.name,
      code: o.code,
      length: o.length,
    })),
    tags: s.tags.map((t) => ({ code: t.code, label: t.label })),
    badges: s.badges.map((b) => ({ label: b.label, kind: b.kind })),
    photoUrl: s.photos[0]?.url ?? s.photoUrl,
    photoFocalX: s.photos[0]?.focalX ?? 50,
    photoFocalY: s.photos[0]?.focalY ?? 50,
  }));

  const stories = reviews;

  return (
    <>
      {/* HERO */}
      {!heroHidden && (
        <section className="hero">
          {heroMediaType === "image" && heroMediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroMediaUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
          ) : (
            <video autoPlay muted loop playsInline preload="auto" poster={heroPosterUrl || undefined} aria-hidden="true" tabIndex={-1}>
              <source src={heroMediaUrl || "/hero.mp4"} type="video/mp4" />
            </video>
          )}
          <Illustration name="heroBlob" />
          <Illustration name="heroBeams" />
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
        {timebarEnabled && (
          <div className="timebar">
            <strong>{timebarTitle} <span className="hl">{timebarHighlight}</span></strong>
            {timebarLink ? <Link href={timebarLink}>{timebarLinkText} <span aria-hidden="true">→</span></Link> : <span>{timebarLinkText}</span>}
          </div>
        )}
        <div className="creds">
          {creds.map((c) => (
            <div className="cred" key={c.t}>
              <div className={`ico ico-svg ${c.iconClass}`}><Illustration name={c.icon} className="illustration" /></div>
              <div className="n">{c.n}</div>
              <div className="t">{c.t}</div>
            </div>
          ))}
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
                          // S3 fotografie sú dynamický CMS obsah; Next remote optimizer tu nie je nakonfigurovaný.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.photoUrl} alt={s.name} className="img" style={{ height: 200, width: "100%", objectFit: "cover" }} loading="lazy" decoding="async" />
                        ) : (
                          <div className="ph img">PORTRÉT</div>
                        )}
                        {s.title && <div className="st">{s.title}</div>}
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
                  <BlockIllustration name="handRule" />
                  <div className="modul">
                    <div className="mhead">
                      <h3>Dobré správy zo školstva</h3>
                      <Link href="/spravy">Všetky články →</Link>
                    </div>
                    <div className="g3">
                      {news.map((p) => (
                        <article className="post" key={p.id}>
                          <Link href={`/spravy/${p.slug}`} className="photo" aria-label={`Prečítať: ${p.title}`}>
                            {p.coverUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.coverUrl} alt="" loading="lazy" decoding="async" />
                            ) : <span>FOTO</span>}
                          </Link>
                          {p.publishedAt && <div className="date">{fmtDate(p.publishedAt)}</div>}
                          <div className="t"><Link href={`/spravy/${p.slug}`}>{p.title}</Link></div>
                        </article>
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
