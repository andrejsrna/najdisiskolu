import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DISTRICTS } from "@/lib/constants";

const arr = (v: unknown): string[] =>
  Array.isArray(v) ? (v as string[]) : v ? [v as string] : [];

const COMPLETION_TAG: Record<string, string> = {
  MATURITA: "maturita",
  VYUCNY_LIST: "výučný list",
  MATURITA_A_VYUCNY_LIST: "maturita + výučný list",
  ZAVERECNA_SKUSKA: "záverečná skúška",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const zam = arr(sp.zam);
  const okresy = arr(sp.okres);
  const jazyky = arr(sp.jaz);
  const uk = arr(sp.uk);

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
  const heroTitle = String(get("hero.title", "Vyber si strednú"));
  const heroSubtitle = String(get("hero.subtitle", "Nájdi školu, ktorá ťa posunie ďalej."));
  const heroLink = String(get("hero.link", "") || "");
  const heroHidden = Boolean(get("hero.hidden", false));

  const creds = [
    { n: String(get("cred.schools", schools.length)), t: "župných stredných škôl" },
    { n: String(get("cred.programs", "-")), t: "študijných a učebných odborov" },
    { n: String(get("cred.places", "-")), t: "voľných miest pre prvákov" },
    { n: String(get("cred.dual", "-")), t: "žiakov v duálnom vzdelávaní" },
  ];

  // filter
  const filtered = schools.filter((s) => {
    if (q && !s.name.toLowerCase().includes(q) && !s.odbory.some((o) => o.name.toLowerCase().includes(q)))
      return false;
    if (zam.length && !zam.every((c) => s.tags.some((t) => t.code === c))) return false;
    if (okresy.length && !okresy.includes(s.district)) return false;
    if (jazyky.length && !jazyky.every((j) => s.languages.includes(j))) return false;
    if (uk.length) {
      const hasMat = s.odbory.some((o) => o.completion === "MATURITA" || o.completion === "MATURITA_A_VYUCNY_LIST");
      const hasVl = s.odbory.some((o) => o.completion === "VYUCNY_LIST" || o.completion === "MATURITA_A_VYUCNY_LIST");
      if (uk.includes("mat") && !hasMat) return false;
      if (uk.includes("vl") && !hasVl) return false;
    }
    return true;
  });

  // toggle helper for chips
  const toggleHref = (key: string, value: string): string => {
    const p = new URLSearchParams();
    for (const k of ["q", "zam", "okres", "jaz", "uk"]) {
      if (k === "q" && q) p.set("q", q);
      for (const v of (k === "zam" ? zam : k === "okres" ? okresy : k === "jaz" ? jazyky : uk)) {
        p.append(k, v);
      }
    }
    const existing = p.getAll(key);
    p.delete(key);
    if (!existing.includes(value)) p.append(key, value);
    else for (const v of existing) if (v !== value) p.append(key, v);
    const s = p.toString();
    return s ? `/?${s}` : "/";
  };

  const isChipOn = (key: string, value: string) =>
    (key === "zam" ? zam : key === "okres" ? okresy : key === "jaz" ? jazyky : uk).includes(value);

  const hasFilter = q || zam.length || okresy.length || jazyky.length || uk.length;

  const tagLabel = (code: string) => tags.find((t) => t.code === code)?.label ?? code;

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

      {/* FILTER */}
      <section className="band-grey" id="filter">
        <div className="wrap fsec">
          <h2>Nájdi si školu</h2>
          <p className="lead">
            Odpovedz na pár otázok a my ti ukážeme školy, ktoré ti sedia.
          </p>

          <form method="get" action="/" style={{ marginBottom: 18 }}>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Hľadaj školu alebo odbor…"
              style={{ maxWidth: 480 }}
            />
            {zam.map((z) => <input key={z} type="hidden" name="zam" value={z} />)}
            {okresy.map((o) => <input key={o} type="hidden" name="okres" value={o} />)}
            {jazyky.map((j) => <input key={j} type="hidden" name="jaz" value={j} />)}
            {uk.map((u) => <input key={u} type="hidden" name="uk" value={u} />)}
            <button type="submit" className="btn sm" style={{ marginLeft: 8 }}>
              Hľadať
            </button>
          </form>

          <div className="lbl">Zameranie</div>
          <div>
            {tags.map((t) => (
              <Link key={t.code} href={toggleHref("zam", t.code)} className={`chip${isChipOn("zam", t.code) ? " on" : ""}`}>
                <span className="sq">{isChipOn("zam", t.code) ? "✓" : ""}</span>
                {t.label}
              </Link>
            ))}
          </div>

          <div className="lbl" style={{ marginTop: 22 }}>Okres</div>
          <div>
            {DISTRICTS.map((o) => (
              <Link key={o} href={toggleHref("okres", o)} className={`chip${isChipOn("okres", o) ? " on" : ""}`}>
                <span className="sq">{isChipOn("okres", o) ? "✓" : ""}</span>
                {o}
              </Link>
            ))}
          </div>

          <div className="lbl" style={{ marginTop: 22 }}>Ukončenie štúdia</div>
          <div>
            {[
              ["mat", "maturita"],
              ["vl", "výučný list"],
            ].map(([v, l]) => (
              <Link key={v} href={toggleHref("uk", v)} className={`chip${isChipOn("uk", v) ? " on" : ""}`}>
                <span className="sq">{isChipOn("uk", v) ? "✓" : ""}</span>
                {l}
              </Link>
            ))}
          </div>

          <div className="lbl" style={{ marginTop: 22 }}>Vyučovací jazyk</div>
          <div>
            {[
              ["sk", "slovenský"],
              ["hu", "maďarský"],
              ["en", "anglický (bilingválne)"],
              ["ru", "ruský (bilingválne)"],
            ].map(([v, l]) => (
              <Link key={v} href={toggleHref("jaz", v)} className={`chip${isChipOn("jaz", v) ? " on" : ""}`}>
                <span className="sq">{isChipOn("jaz", v) ? "✓" : ""}</span>
                {l}
              </Link>
            ))}
          </div>

          {hasFilter && (
            <div className="actions">
              <Link className="clear" href="/">Zrušiť všetky filtre</Link>
            </div>
          )}
        </div>
      </section>

      {/* VÝSLEDKY */}
      <section className="results">
        <div className="wrap">
          <div className="rhead">
            <h3>
              Našli sme <span className="n">{filtered.length}</span>{" "}
              {filtered.length === 1 ? "školu" : filtered.length < 5 ? "školy" : "škôl"}
            </h3>
          </div>

          {filtered.length === 0 ? (
            <div className="empty">
              Tejto kombinácii nezodpovedá žiadna škola. Skús zrušiť niektorý filter.
            </div>
          ) : (
            <div className="cards">
              {filtered.map((s) => {
                const hasMat = s.odbory.some((o) => o.completion === "MATURITA" || o.completion === "MATURITA_A_VYUCNY_LIST");
                const hasVl = s.odbory.some((o) => o.completion === "VYUCNY_LIST" || o.completion === "MATURITA_A_VYUCNY_LIST");
                const ukon = hasMat && hasVl ? "maturita + výučný" : hasMat ? "maturita" : "výučný list";
                const third = s.hasDual ? "duál" : s.hasInternat ? "internát" : s.hasNadstavba ? "nadstavbové štúdium" : s.languages.length && !s.languages.includes("sk") ? "maďarský" : "školská jedáleň";
                const totalAccepts = s.odbory.reduce((a, o) => a + (o.accepts ?? 0), 0);
                const ineko = s.inekoKraj?.split(",")[0]?.trim();

                return (
                  <div className="scard" key={s.id}>
                    <div className="body">
                      <div className="name">{s.name}</div>
                      <div className="loc">{s.city === s.district ? s.city : `${s.city} · okres ${s.district}`}</div>
                      <div className="tags tags3">
                        <span className={`tag ${hasMat && hasVl ? "matvl" : hasMat ? "mat" : "vl"}`}>{ukon}</span>
                        <span className="tag">{s.odbory.length} {s.odbory.length === 1 ? "odbor" : s.odbory.length < 5 ? "odbory" : "odborov"}</span>
                        <span className="tag">{third}</span>
                      </div>
                      <div className="tags">
                        {totalAccepts > 0 && <span className="tag hi">prijímajú {totalAccepts} žiakov</span>}
                        {s.odbory.some((o) => o.appliedLastYear) && (
                          <span className="tag hi">vlani {Math.max(...s.odbory.map((o) => o.appliedLastYear ?? 0))} prihlásených na 1 miesto</span>
                        )}
                      </div>
                      {ineko && (
                        <div className="tags">
                          <span className="tag hi">INEKO: {ineko.replace(/(ých|ich)$/, " škôl")}</span>
                        </div>
                      )}
                      <div className="foot">
                        <Link className="btn sm" href={`/skola/${s.slug}`}>Detail školy</Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
