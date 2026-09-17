"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Illustration } from "@/lib/illustrations";

type Odbor = {
  completion: string;
  accepts: number | null;
  appliedLastYear: number | null;
  name: string;
  code: string;
  length: number | null;
};
type School = {
  slug: string;
  name: string;
  city: string;
  district: string;
  languages: string[];
  hasCanteen: boolean;
  hasInternat: boolean;
  hasDual: boolean;
  hasNadstavba: boolean;
  inekoKrajRank: number | null;
  inekoKrajOf: string | null;
  odbory: Odbor[];
  tags: { code: string; label: string }[];
  badges: { label: string; kind: string }[];
  photoUrl: string | null;
  photoFocalX: number;
  photoFocalY: number;
};
type Tag = { code: string; label: string };

const DISTRICTS = [
  "Dunajská Streda",
  "Galanta",
  "Hlohovec",
  "Piešťany",
  "Senica",
  "Skalica",
  "Trnava",
];

const UK_OPTIONS: [string, string][] = [
  ["mat", "maturita"],
  ["vl", "výučný list"],
  ["matvl", "maturita + výučný list"],
];

const JAZ_OPTIONS: [string, string][] = [
  ["sk", "slovenský"],
  ["hu", "maďarský"],
  ["en", "anglický (bilingválne)"],
  ["ru", "ruský (bilingválne)"],
];

const JAZ_SHORT: Record<string, string> = { hu: "maďarský", en: "anglický", ru: "ruský" };

const hasMat = (o: Odbor) => o.completion === "MATURITA" || o.completion === "MATURITA_A_VYUCNY_LIST";
const hasVl = (o: Odbor) => o.completion === "VYUCNY_LIST" || o.completion === "MATURITA_A_VYUCNY_LIST";
const sklonOdbor = (n: number) => (n === 1 ? "odbor" : n < 5 ? "odbory" : "odborov");

/* keď škola nemá duál, internát, cudzí vyučovací jazyk ani nadstavbu,
   ukážeme na karte niečo, čo uchádzačovi reálne pomôže rozhodnúť sa (ako v návrhu) */
function benefit(s: School) {
  if (s.inekoKrajRank) return "INEKO rebríček";
  return s.odbory.length === 1 ? "jediný odbor" : "široký výber odborov";
}

function locTxt(m: string, o: string) {
  return m === o ? m : `${m} · okres ${o}`;
}

export function FilterExplorer({ schools, tags }: { schools: School[]; tags: Tag[] }) {
  const [tab, setTab] = useState<"zam" | "odb" | "sko">("zam");
  const [zam, setZam] = useState<string[]>([]);
  const [okres, setOkres] = useState<string[]>([]);
  const [uk, setUk] = useState<string[]>([]);
  const [jaz, setJaz] = useState<string[]>([]);
  const [prak, setPrak] = useState({ internat: false, strava: false, dual: false });
  const [odbCat, setOdbCat] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"abc" | "odbor">("abc");
  const [searched, setSearched] = useState(false);

  const toggle = (list: string[], v: string, set: (x: string[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  // počty (plné, statické) pre chipy
  const counts = useMemo(() => {
    const zamC = new Map<string, number>();
    const okrC = new Map<string, number>();
    const jazC = new Map<string, number>();
    const odbC = new Map<string, number>();
    for (const s of schools) {
      for (const t of s.tags) {
        zamC.set(t.code, (zamC.get(t.code) ?? 0) + 1);
        odbC.set(t.code, (odbC.get(t.code) ?? 0) + s.odbory.length);
      }
      okrC.set(s.district, (okrC.get(s.district) ?? 0) + 1);
      for (const l of s.languages) jazC.set(l, (jazC.get(l) ?? 0) + 1);
    }
    return { zamC, okrC, jazC, odbC };
  }, [schools]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const list = schools.filter((s) => {
      if (tab === "sko") {
        if (!ql) return true;
        return s.name.toLowerCase().includes(ql) || s.city.toLowerCase().includes(ql);
      }
      if (tab === "odb") {
        if (!odbCat) return true;
        return s.tags.some((t) => t.code === odbCat);
      }
      // tab zam
      if (zam.length && !s.tags.some((t) => zam.includes(t.code))) return false;
      if (okres.length && !okres.includes(s.district)) return false;
      if (uk.length && !uk.some((u) => {
        if (u === "mat") return s.odbory.some(hasMat);
        if (u === "vl") return s.odbory.some(hasVl);
        if (u === "matvl") return s.odbory.some(hasMat) && s.odbory.some(hasVl);
        return false;
      })) return false;
      if (jaz.length && !s.languages.some((l) => jaz.includes(l))) return false;
      if (prak.internat && !s.hasInternat) return false;
      if (prak.strava && !s.hasCanteen) return false;
      if (prak.dual && !s.hasDual) return false;
      return true;
    });
    const sorted = [...list];
    if (sort === "abc") sorted.sort((a, b) => a.name.localeCompare(b.name, "sk"));
    else sorted.sort((a, b) => b.odbory.length - a.odbory.length);
    return sorted;
  }, [schools, tab, zam, okres, uk, jaz, prak, odbCat, q, sort]);

  const suggestions = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return [];
    return schools
      .filter((s) => s.name.toLowerCase().includes(ql) || s.city.toLowerCase().includes(ql))
      .slice(0, 8);
  }, [schools, q]);

  const clearAll = () => {
    setZam([]); setOkres([]); setUk([]); setJaz([]);
    setPrak({ internat: false, strava: false, dual: false });
    setOdbCat(""); setQ(""); setSearched(false);
  };

  const chip = (on: boolean, onClick: () => void, label: string, cnt?: number, radio = false) => (
    <span
      key={label}
      className={`chip ${on ? "on" : ""} ${radio ? "radio" : ""}`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <span className="sq">{on ? "✓" : ""}</span>
      {label}
      {typeof cnt === "number" ? <span className="cnt">{cnt}</span> : null}
    </span>
  );

  const activeCount = zam.length + okres.length + uk.length + jaz.length + (prak.internat ? 1 : 0) + (prak.strava ? 1 : 0) + (prak.dual ? 1 : 0) + (odbCat ? 1 : 0) + (q ? 1 : 0);

  // Zvolené filtre ako odstrániteľné chipy v hlavičke výsledkov (1:1 s FINAL activeChips).
  const activeChips: { key: string; label: string; remove: () => void }[] = [
    ...zam.map((c) => ({ key: `zam-${c}`, label: tags.find((t) => t.code === c)?.label ?? c, remove: () => toggle(zam, c, setZam) })),
    ...okres.map((d) => ({ key: `okr-${d}`, label: d, remove: () => toggle(okres, d, setOkres) })),
    ...uk.map((u) => ({ key: `uk-${u}`, label: UK_OPTIONS.find(([v]) => v === u)?.[1] ?? u, remove: () => toggle(uk, u, setUk) })),
    ...jaz.map((l) => ({ key: `jaz-${l}`, label: JAZ_SHORT[l] ?? l, remove: () => toggle(jaz, l, setJaz) })),
    ...(prak.internat ? [{ key: "int", label: "internát", remove: () => setPrak({ ...prak, internat: false }) }] : []),
    ...(prak.strava ? [{ key: "str", label: "stravovanie", remove: () => setPrak({ ...prak, strava: false }) }] : []),
    ...(prak.dual ? [{ key: "dual", label: "duálne vzdelávanie", remove: () => setPrak({ ...prak, dual: false }) }] : []),
    ...(odbCat ? [{ key: "odb", label: tags.find((t) => t.code === odbCat)?.label ?? odbCat, remove: () => setOdbCat("") }] : []),
    ...(q ? [{ key: "q", label: `„${q}“`, remove: () => setQ("") }] : []),
  ];

  // Keď žiadny výsledok, ponúkni uvoľnenie jedného konkrétneho filtra (1:1 s FINAL suggestRelax).
  const relax = useMemo(() => {
    if (filtered.length !== 0) return { text: "", label: "", action: null as null | (() => void) };
    const set = (
      label: string,
      clear: (list: string[]) => void,
      list: string[],
    ) => ({ text: `Skús odstrániť filter „${label}“.`, label: `Uvoľniť: ${label}`, action: () => clear(list) });
    if (okres.length) return set(okres.length === 1 ? okres[0] : "okres", setOkres, []);
    if (zam.length) return set("zameranie", setZam, []);
    if (jaz.length) return set("vyučovací jazyk", setJaz, []);
    if (uk.length) return set("ukončenie", setUk, []);
    if (odbCat) return set("odbor", () => setOdbCat(""), []);
    if (q) return set("hľadanú školu", () => setQ(""), []);
    return {
      text: "Skús uvoľniť niektorý z filtrov.",
      label: "Zrušiť všetky filtre",
      action: () => {
        setZam([]); setOkres([]); setUk([]); setJaz([]);
        setPrak({ internat: false, strava: false, dual: false });
        setOdbCat(""); setQ("");
      },
    };
  }, [filtered, okres, zam, jaz, uk, odbCat, q]);

  return (
    <>
      {/* ===================== FILTER ===================== */}
      <section className="band-acid" id="filter">
        <Illustration name="filterArrow" />
        <Illustration name="filterQuestion" />
        <div className="wrap fsec">
          <h2>Vyber si svoju ideálnu školu.</h2>
          <p className="lead">Vyfiltruj si vhodné školy a vyberaj len z toho, čo ťa naozaj zaujíma.</p>

          <div className="tabs">
            <button className={tab === "zam" ? "on" : ""} onClick={() => setTab("zam")}>Vyhľadaj podľa zamerania</button>
            <button className={tab === "odb" ? "on" : ""} onClick={() => setTab("odb")}>Vyhľadaj podľa odboru</button>
            <button className={tab === "sko" ? "on" : ""} onClick={() => setTab("sko")}>Vyhľadaj konkrétnu školu</button>
          </div>

          {tab === "zam" && (
            <div>
              <div className="fb">
                <div className="lbl">Čo ťa zaujíma?</div>
                <div>
                  {tags.map((t) =>
                    chip(zam.includes(t.code), () => toggle(zam, t.code, setZam), t.label, counts.zamC.get(t.code))
                  )}
                </div>
              </div>

              <div className="fb">
                <div className="lbl">Vyber si okres / okresy, kde chceš študovať</div>
                <div>
                  {DISTRICTS.map((d) =>
                    chip(okres.includes(d), () => toggle(okres, d, setOkres), d, counts.okrC.get(d))
                  )}
                </div>
              </div>

              <div className="fb">
                <div className="lbl">Ako štúdium končí</div>
                <div>
                  {UK_OPTIONS.map(([v, l]) =>
                    chip(uk.includes(v), () => toggle(uk, v, setUk), l)
                  )}
                </div>
              </div>

              <div className="fb">
                <div className="lbl">Vyučovací jazyk</div>
                <div>
                  {JAZ_OPTIONS.map(([v, l]) =>
                    chip(jaz.includes(v), () => toggle(jaz, v, setJaz), l, counts.jazC.get(v))
                  )}
                </div>
              </div>

              <div className="fb">
                <div className="lbl">Praktické veci</div>
                <div className="prow">
                  <span className="pl">Internát</span>
                  <span>
                    {chip(prak.internat, () => setPrak({ ...prak, internat: !prak.internat }), "potrebujem", undefined, true)}
                    {chip(!prak.internat, () => setPrak({ ...prak, internat: false }), "nezáleží", undefined, true)}
                  </span>
                </div>
                <div className="prow">
                  <span className="pl">Stravovanie</span>
                  <span>
                    {chip(prak.strava, () => setPrak({ ...prak, strava: !prak.strava }), "potrebujem", undefined, true)}
                    {chip(!prak.strava, () => setPrak({ ...prak, strava: false }), "nezáleží", undefined, true)}
                  </span>
                </div>
                <div className="prow">
                  <span className="pl">Duálne vzdelávanie</span>
                  <span>
                    {chip(prak.dual, () => setPrak({ ...prak, dual: !prak.dual }), "áno", undefined, true)}
                    {chip(!prak.dual, () => setPrak({ ...prak, dual: false }), "nezáleží", undefined, true)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {tab === "odb" && (
            <div>
              <div className="fb">
                <div className="lbl">Kategória odborov</div>
                <select value={odbCat} onChange={(e) => setOdbCat(e.target.value)}>
                  <option value="">Vyber kategóriu odborov…</option>
                  {tags.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.label} ({counts.odbC.get(t.code) ?? 0} {sklonOdbor(counts.odbC.get(t.code) ?? 0)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {tab === "sko" && (
            <div>
              <div className="fb">
                <div className="lbl">Názov školy alebo mesto</div>
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Začni písať názov školy alebo mesto…"
                  autoComplete="off"
                />
                {suggestions.length > 0 && (
                  <div className="sugg">
                    {suggestions.map((s) => (
                      <div key={s.slug}>
                        <Link href={`/skola/${s.slug}`} onClick={() => setQ("")}>
                          <b>{s.name}</b> · {s.city}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="actions">
            <button
              className="btn solid"
              style={{ padding: "14px 30px", fontSize: "15.5px" }}
              onClick={() => {
                setSearched(true);
                document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Vyhľadať školu <b style={{ marginLeft: 6 }}>({filtered.length})</b>
            </button>
            <button className="clear" onClick={clearAll}>
              Zrušiť filtre
            </button>
          </div>
        </div>
      </section>

      {/* ===================== RESULTS ===================== */}
      {(searched || activeCount > 0) && (
      <section className="band-grey">
        <div className="wrap">
          <div className="results" id="results">
            <div className="rhead">
              <div>
                <h3>
                  Našli sme <span className="n">{filtered.length}</span>{" "}
                  {filtered.length === 1 ? "školu" : filtered.length < 5 ? "školy" : "škôl"}
                </h3>
                {activeChips.length > 0 && (
                  <div className="active" style={{ marginTop: 12 }}>
                    {activeChips.map((c) => (
                      <span key={c.key} className="chip on" onClick={c.remove} style={{ cursor: "pointer" }}>
                        <span className="sq">✓</span>
                        {c.label}
                        <span aria-hidden="true" style={{ marginLeft: 4 }}>×</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "abc" | "odbor")}
                style={{ width: "auto", fontSize: 14, padding: "8px 12px" }}
              >
                <option value="abc">Zoradiť: abecedne</option>
                <option value="odbor">Zoradiť: podľa počtu odborov</option>
              </select>
            </div>
            {filtered.length === 0 ? (
              <div className="empty">
                <div style={{ fontSize: 18, marginBottom: 8 }}>Tejto kombinácii nezodpovedá žiadna škola.</div>
                <div style={{ fontSize: 14, color: "var(--ink2)", marginBottom: 18 }}>{relax.text}</div>
                {relax.action && <button className="btn sm" onClick={relax.action}>{relax.label}</button>}
              </div>
            ) : (

                <div className="cards">
                  {filtered.map((s) => {
                    const mat = s.odbory.some(hasMat);
                    const vl = s.odbory.some(hasVl);
                    const ukon = mat && vl ? "maturita + výučný" : mat ? "maturita" : "výučný list";
                    const ukonCls = mat && vl ? "matvl" : mat ? "mat" : "vl";
                    const third = s.hasDual ? "duál"
                      : s.hasInternat ? "internát"
                      : !s.languages.includes("sk") && s.languages.length ? JAZ_SHORT[s.languages[0]] ?? "cudzí jazyk"
                      : s.hasNadstavba ? "nadstavbové štúdium"
                      : benefit(s);
                    const thirdCls = s.hasDual ? "dual" : s.hasInternat ? "dorm" : s.hasNadstavba ? "nad" : "";
                    const totalAccepts = s.odbory.reduce((a, o) => a + (o.accepts ?? 0), 0);
                    const maxApplied = s.odbory.some((o) => o.appliedLastYear) ? Math.max(...s.odbory.map((o) => o.appliedLastYear ?? 0)) : null;
                    const ineko = s.inekoKrajRank ? `${s.inekoKrajRank}. ${s.inekoKrajOf ?? "zo všetkých"}` : null;

                    return (
                      <Link className="scard" href={`/skola/${s.slug}`} key={s.slug} aria-label={`Zobraziť detail školy: ${s.name}`}>
                        {s.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.photoUrl} alt="" className="img" style={{ height: 200, width: "100%", objectFit: "cover", objectPosition: `${s.photoFocalX}% ${s.photoFocalY}%` }} />
                        ) : (
                          <div className="ph img">FOTO ŠKOLY</div>
                        )}
                        <div className="body">
                          <div className="name">{s.name}</div>
                          <div className="loc">{locTxt(s.city, s.district)}</div>
                          <div className="tags tags3">
                            <span className={`tag ${ukonCls}`}>{ukon}</span>
                            <span className="tag">{s.odbory.length} {sklonOdbor(s.odbory.length)}</span>
                            <span className={`tag ${thirdCls}`}>{third}</span>
                          </div>
                          {s.badges.length > 0 && (
                            <div className="tags">
                              {s.badges.map((b) => (
                                <span
                                  key={b.label}
                                  className={`tag hi ${b.kind && b.kind !== "ok" ? "k-" + b.kind : ""}`}
                                >
                                  {b.label}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="tags">
                            {totalAccepts > 0 && <span className="tag hi">prijímajú {totalAccepts} žiakov</span>}
                            {maxApplied != null && <span className="tag hi">vlani {maxApplied} prihlásených na 1 miesto</span>}
                          </div>
                          {ineko && (
                            <div className="tags">
                              <span className="tag hi">INEKO: {ineko.replace(/(ých|ich)$/, " škôl")}</span>
                            </div>
                          )}
                          <div className="foot">
                            <span className="btn sm">Detail školy</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
            )}
          </div>
        </div>
        </section>
      )}
    </>
  );
}
