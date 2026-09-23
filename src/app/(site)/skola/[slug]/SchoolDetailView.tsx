import { Illustration } from "@/lib/illustrations";
import Link from "next/link";
import { COMPLETION_LABEL, LANGUAGE_LABEL } from "@/lib/constants";
import { SITE_URL } from "@/lib/site";
import { PrintButton } from "./PrintButton";
import { SchoolGallery } from "./SchoolGallery";
import { SchoolCard } from "../../SchoolCard";
import type { SchoolDetailData } from "@/lib/school-query";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("sk-SK", { day: "numeric", month: "long", year: "numeric" });

const sklonOdbor = (n: number) => (n === 1 ? "odbor" : n < 5 ? "odbory" : "odborov");
const ktore = (n: number) => (n === 1 ? "ktorý" : n < 5 ? "ktoré" : "ktorých");
const sklonRok = (n: number) => (n === 1 ? "rok" : n < 5 ? "roky" : "rokov");

/* HRULE je HTML string – v JSX ho musíme vyrenderovať neescapovane */
const HandRule = () => <div dangerouslySetInnerHTML={{ __html: HRULE }} />;
const HRULE = '<div class="rule hand"><svg viewBox="0 125 283 10" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" fill="currentColor" aria-hidden="true" focusable="false"><path d="M8.49,132.98c0-.06-.08-.1-.25-.11l-.45-.02h-.31s-.24,0-.24,0c-.09,0-.19,0-.31,0h-.15s-.4.02-.4.02h-.17c-.09,0-.19,0-.31,0h-.06s-.06,0-.11,0h-.04s-.18,0-.18,0c-.09,0-.15,0-.18,0h-.13s-.18.01-.18.01l-.29.02s-.09,0-.16,0h-.06c-.13,0-.24,0-.32.02l-.24.03c-.14.01-.22.05-.24.12l-.02.05c-.02.06.05.1.21.12l.4.03h.2c.1,0,.2,0,.31,0h.16s.06-.01.11-.02h.04s.09,0,.09,0c.05,0,.11,0,.18,0,.06,0,.1,0,.13,0h.13s.07,0,.07,0h.08s.05,0,.05,0c.12,0,.23,0,.32,0l.22-.02h.31c.07,0,.12,0,.15,0h.08s.07,0,.12,0c.03,0,.1,0,.19,0h.21s.2-.01.2-.01c.11,0,.21,0,.31-.02l.28-.03c.08,0,.14-.02.18-.04.04-.02.05-.05.05-.08v-.05Z"/><path d="M15.1,132.78c0-.06-.08-.1-.25-.11l-.45-.02h-.31s-.24,0-.24,0c-.09,0-.19,0-.31,0h-.15s-.4.02-.4.02h-.17c-.09,0-.19,0-.31,0h-.06s-.06,0-.11,0h-.04s-.18,0-.18,0c-.09,0-.15,0-.18,0h-.13s-.18.01-.18.01l-.29.02s-.09,0-.16,0h-.06c-.13,0-.24,0-.32.02l-.24.03c-.14.01-.22.05-.24.12l-.02.05c-.02.06.05.1.21.12l.4.03h.2c.1,0,.2,0,.31,0h.16s.06-.01.11-.02h.04s.09,0,.09,0c.05,0,.11,0,.18,0,.06,0,.1,0,.13,0h.13s.07,0,.07,0h.08s.05,0,.05,0c.12,0,.23,0,.32,0l.22-.02h.31c.07,0,.12,0,.15,0h.08s.07,0,.12,0c.03,0,.1,0,.19,0h.21s.2-.01.2-.01c.11,0,.21,0,.31-.02l.28-.03c.08,0,.14-.02.18-.04.04-.02.05-.05.05-.08v-.05Z"/><path d="M21.71,132.59c0-.06-.08-.1-.25-.11l-.45-.02h-.31s-.24,0-.24,0c-.09,0-.19,0-.31,0h-.15s-.4.02-.4.02h-.17c-.09,0-.19,0-.31,0h-.06s-.06,0-.11,0h-.04s-.18,0-.18,0c-.09,0-.15,0-.18,0h-.13s-.18.01-.18.01l-.29.02s-.09,0-.16,0h-.06c-.13,0-.24,0-.32.02l-.24.03c-.14.01-.22.05-.24.12l-.02.05c-.02.06.05.1.21.12l.4.03h.2c.1,0,.2,0,.31,0h.16s.06-.01.11-.02h.04s.09,0,.09,0c.05,0,.11,0,.18,0,.06,0,.1,0,.13,0h.13s.07,0,.07,0h.08s.05,0,.05,0c.12,0,.23,0,.32,0l.22-.02h.31c.07,0,.12,0,.15,0h.08s.07,0,.12,0c.03,0,.1,0,.19,0h.21s.2-.01.2-.01c.11,0,.21,0,.31-.02l.28-.03c.08,0,.14-.02.18-.04.04-.02.05-.05.05-.08v-.05Z"/></svg></div>';

/**
 * Jednotný "template" pre detail školy — používa ho jednotlivý detail
 * (`/skola/[slug]`) aj hromadná tlač vyfiltrovaných škôl. Upravuj len tu.
 */
export function SchoolDetailView({
  school,
  from,
  printMode = false,
}: {
  school: SchoolDetailData;
  from?: string;
  printMode?: boolean;
}) {
  const hasMat = school.odbory.some((o) => o.completion === "MATURITA" || o.completion === "MATURITA_A_VYUCNY_LIST");
  const hasVl = school.odbory.some((o) => o.completion === "VYUCNY_LIST" || o.completion === "MATURITA_A_VYUCNY_LIST");
  const totalAccepts = school.odbory.reduce((a, o) => a + (o.accepts ?? 0), 0);
  const totalApplicantsLastYear = school.odbory.reduce((a, o) => a + (o.appliedLastYear ?? 0), 0);
  const totalPlacesLastYear = school.odbory.reduce((a, o) => a + (o.places ?? 0), 0);
  const applicantsPerPlace = totalPlacesLastYear ? Math.round((totalApplicantsLastYear / totalPlacesLastYear) * 10) / 10 : null;
  const studentsNumber = school.totalStudents?.match(/\d[\d\s]*/)?.[0]?.replace(/\s/g, "") ?? "";
  const studentsApprox = Boolean(studentsNumber) && /približ/i.test(school.totalStudents ?? "");
  const inekoK = school.inekoKrajRank ? `${school.inekoKrajRank}. ${school.inekoKrajOf ?? "zo všetkých škôl"}` : null;
  const inekoS = school.inekoSkRank ? `${school.inekoSkRank}. ${school.inekoSkOf ?? "zo všetkých škôl"}` : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingDods = school.dods.filter((d) => d.date >= today);
  const dod = upcomingDods[0];
  const dodIcal = dod ? dod.date.toISOString().slice(0, 10).replace(/-/g, "") : "";
  const gmapQuery = [school.address, school.name, school.city].filter(Boolean).join(", ");
  const gmapSrc = gmapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(gmapQuery)}&output=embed&hl=sk`
    : null;
  const chunk = (items: string[], label: string, label2: string, limit: number) => {
    const clean = items.map((x) => x.trim()).filter(Boolean);
    if (!clean.length) return [];
    const all = clean.join(", ");
    if (all.length <= limit) return [label + all];
    const half = all.length / 2;
    let acc = 0, cut = 1;
    for (let i = 0; i < clean.length; i++) {
      acc += clean[i].length + 2;
      if (acc >= half) { cut = Math.min(Math.max(i + 1, 1), clean.length - 1); break; }
    }
    return [label + clean.slice(0, cut).join(", "), label2 + clean.slice(cut).join(", ")];
  };
  const extras = [
    ...chunk(school.certificates, "Kurzy a certifikáty: ", "Ďalšie certifikáty: ", 170),
    ...chunk(school.clubs, "Krúžky: ", "Ďalšie krúžky: ", 170),
  ].slice(0, 3);
  const preco = [...school.whyUs];
  if (school.otherTop) preco.push(school.otherTop);
  preco.length = Math.min(preco.length, 6 - extras.length);
  extras.forEach((x) => preco.push(x));
  const galleryPhotos = [...school.photos].sort((a, b) => a.sort - b.sort);
  const detailCover = galleryPhotos.find((photo) => photo.isDetailCover);
  const heroSource = detailCover ?? galleryPhotos[0];
  const heroPhoto = heroSource
    ? { url: heroSource.url, alt: heroSource.alt ?? school.name, focalX: heroSource.focalX, focalY: heroSource.focalY }
    : school.photoUrl
      ? { url: school.photoUrl, alt: school.name, focalX: 50, focalY: 50 }
      : null;
  const gcalUrl = dod
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        `Deň otvorených dverí — ${school.name}`,
      )}&dates=${dodIcal}/${dodIcal}&ctz=Europe/Bratislava`
    : "";

  return (
    <div id="detail" className={printMode ? "print-school" : undefined}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            name: school.name,
            url: `${SITE_URL}/skola/${school.slug}`,
            address: {
              "@type": "PostalAddress",
              addressLocality: school.city,
              addressRegion: school.district,
              addressCountry: "SK",
            },
            ...(school.websites.length || school.facebook || school.instagram
      ? {
          sameAs: [
            ...school.websites.map((w) => `https://${w.replace(/^https?:\/\//, "")}`),
            ...(school.facebook
              ? [`https://www.facebook.com/${school.facebook.replace(/^@/, "")}`]
              : []),
            ...(school.instagram
              ? [`https://www.instagram.com/${school.instagram.replace(/^@/, "")}`]
              : []),
          ],
        }
      : {}),
          }),
        }}
      />
      {!printMode && (
        <div className="wrap">
          <div className="crumb">
            <Link href={from === "filter" ? "/?restoreFilters=1#results" : "/"} style={{ textDecoration: "none" }}>
              ← Späť na výber školy
            </Link>
            <span aria-hidden="true">&nbsp; · &nbsp;</span>
            Vyber si strednú / {school.city} / <span style={{ color: "var(--ink)" }}>{school.name}</span>
          </div>
        </div>
      )}

      {heroPhoto && !printMode && (
        <div className="school-hero-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroPhoto.url}
            alt={heroPhoto.alt}
            style={{ objectPosition: `${heroPhoto.focalX}% ${heroPhoto.focalY}%` }}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </div>
      )}

      <div className="wrap dcols">
        {!(inekoK || inekoS) && <Illustration name="detailShoe" />}
        {/* HLAVNÝ STĹPEC */}
        <div>
          <div className="p-head">
            <h1 style={{ fontSize: 30, lineHeight: 1.26, letterSpacing: "-.026em", margin: "0 0 7px" }}>
              {school.name}
            </h1>
            <div style={{ color: "var(--ink2)", fontSize: 15, marginBottom: 16 }}>
              {school.city === school.district ? school.city : `${school.city} · okres ${school.district}`}
            </div>
            <div className="tags" style={{ marginBottom: 20 }}>
              {(school.hasMaturita || hasMat) && (school.hasVl || hasVl) && <span className="tag matvl">maturita + výučný list</span>}
              {!(school.hasMaturita || hasMat) && (school.hasVl || hasVl) && <span className="tag vl">výučný list</span>}
              {(school.hasMaturita || hasMat) && !(school.hasVl || hasVl) && <span className="tag mat">maturita</span>}
              {school.hasDual && <span className="tag dual">duálne vzdelávanie</span>}
              {school.hasInternat && <span className="tag dorm">internát</span>}
              {school.hasNadstavba && <span className="tag nad">nadstavba</span>}
              {school.accessibility === "Áno" && <span className="tag bez">bezbariérový prístup</span>}
              {school.accessibility === "Čiastočne" && <span className="tag bez">čiastočne bezbariérová</span>}
            </div>
          </div>

          {/* Tagy pod názvom — v tlači aj na obrazovke */}
          {(inekoK || inekoS) && (
            <div className="ineko">
              <Illustration name="inekoPodium" />
              <div className="itxt">
                <div className="lb">Umiestnenie v rebríčku INEKO 2024/25</div>
                {inekoK && <div className="ir"><span className="ik">TT kraj:</span> {inekoK}</div>}
                {inekoS && <div className="ir"><span className="ik">Celá SR:</span> {inekoS}</div>}
              </div>
            </div>
          )}

          <div className="numbers" style={{ marginTop: (inekoK || inekoS) ? 0 : 24 }} aria-label="Základné údaje o škole">
            <div className={`num ${totalAccepts ? "" : "nodata"}`}>
              <div className={`n ${totalAccepts ? "" : "nodata"}`}>{totalAccepts || "—"}</div>
              <div className="t">miest pre prvákov<br />v šk. roku 2027/28</div>
            </div>
            <div className={`num ${applicantsPerPlace !== null ? "" : "nodata"}`}>
              <div className={`n ${applicantsPerPlace !== null ? "" : "nodata"}`}>{applicantsPerPlace ?? "—"}</div>
              <div className="t">uchádzačov na 1 miesto<br />vlani</div>
            </div>
            <div className="num">
              <div className="n">{school.odbory.length}</div>
              <div className="t">{sklonOdbor(school.odbory.length)}, {ktore(school.odbory.length)}<br />škola otvára</div>
            </div>
            <div className={`num ${school.totalStudents ? "" : "nodata"}`}>
              <div className={`n ${school.totalStudents ? "" : "nodata"}`}>
                {studentsNumber
                  ? <>
                      {studentsApprox && <span className="approx">približne</span>}
                      {studentsApprox && <br />}
                      {studentsNumber}
                    </>
                  : "—"}
              </div>
              <div className="t">žiakov<br />celkovo</div>
            </div>
          </div>

          {/* ODBORY */}
          <div className="p-odb">
            <div className="rule" />
            <h2 className="dh">Čo sa tu dá študovať</h2>
            <p className="dl">Odbory, ktoré škola otvára pre absolventov základnej školy.</p>
            {school.odbory.length === 0 ? (
              <p className="dl">Zoznam odborov zatiaľ nie je doplnený.</p>
            ) : (
              <div className="scroll">
                <table className="od">
                  <thead>
                    <tr>
                      <th>Odbor</th>
                      <th>Prijíma</th>
                      <th>Uchádzačov vlani</th>
                      <th>Dĺžka</th>
                      <th>Ukončenie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {school.odbory.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <span className="kod">{o.code}</span>
                          <span className="on">{o.name}</span>
                          {o.employment && <span className="upl">Uplatníš sa ako: <b>{o.employment}</b></span>}
                        </td>
                        <td className="c">{o.accepts ?? "—"}</td>
                        <td className="c">{o.appliedLastYear ?? "—"}</td>
                        <td className="c">{o.length} {sklonRok(o.length)}</td>
                        <td className="c">{COMPLETION_LABEL[o.completion] ?? o.completion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* O ŠKOLE */}
          {school.intro && (
            <div className="p-sec">
              <div className="rule" />
              <h2 className="dh">O škole</h2>
              <div className="txtblk" dangerouslySetInnerHTML={{ __html: school.intro }} />
            </div>
          )}

          {/* PREČO PRÁVE SEM */}
          {preco.length > 0 && (
            <>
              {<HandRule />}
              <h2 className="dh"><Illustration name="sectionIcon" />Prečo práve sem</h2>
              <div className="duo" style={{ marginTop: 16 }}>
                {preco.map((w, i) => (
                  <div className="cell" key={i}>{w}</div>
                ))}
              </div>
            </>
          )}

          {/* ERASMUS+ */}
          {(school.erasmusCountries.length > 0 || school.erasmus) && (
            <>
              <div className="rule" />
              <h2 className="dh">Erasmus+</h2>
              <p className="dl">Škola je zapojená do európskeho programu Erasmus+.</p>
              {school.erasmusCountries.length > 0 && (
                <div className="txtblk">{school.erasmusCountries.join(", ")}</div>
              )}
              <div className="txtblk" style={{ whiteSpace: "pre-line" }}>{school.erasmus}</div>
            </>
          )}

          {/* PROJEKTY ŠKOLY */}
          {school.projects.length > 0 && (
            <>
              <div className="rule" />
              <h2 className="dh">Projekty školy</h2>
              {school.projects.map((p) => (
                <div key={p.id} className="projcard">
                  {p.title && <div className="pname">{p.title}</div>}
                  {p.description && <p style={{ whiteSpace: "pre-line", margin: 0 }}>{p.description}</p>}
                </div>
              ))}
            </>
          )}

          {/* PARTNERSTVÁ A SPOLUPRÁCE */}
          {school.partners && (
            <>
              <div className="rule" />
              <h2 className="dh">Partnerstvá a spolupráce</h2>
              <div className="txtblk" style={{ whiteSpace: "pre-line" }}>{school.partners}</div>
            </>
          )}

          {/* DUÁLNE VZDELÁVANIE */}
          {(school.dualCompanies.filter(Boolean).length > 0 || school.practice) && (
            <>
              <div className="rule" />
              <h2 className="dh">Duálne vzdelávanie</h2>
              <p className="dl">V duáli sa učíš priamo vo firme a dostávaš za to zaplatené.</p>
              {school.dualCompanies.filter(Boolean).length > 0 && (
                <>
                  <div className="lbl" style={{ marginTop: 16 }}>Zamestnávatelia v duáli</div>
                  <ul className="bul">
                    {school.dualCompanies.filter(Boolean).map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </>
              )}
              {school.practice && (
                <>
                  <div className="lbl" style={{ marginTop: 20 }}>Pracoviská praktického vyučovania</div>
                  <div className="txtblk" style={{ marginTop: 6, whiteSpace: "pre-line" }}>{school.practice}</div>
                </>
              )}
            </>
          )}

          {/* PRIESTORY A VYBAVENIE */}
          {(school.modernization || school.sports.filter(Boolean).length > 0 || school.canteenOptions.filter(Boolean).length > 0) && (
            <>
              <div className="rule" />
              <h2 className="dh">Priestory a vybavenie</h2>
              {school.modernization && (
                <div className="txtblk" style={{ whiteSpace: "pre-line" }}>{school.modernization}</div>
              )}
              {school.sports.filter(Boolean).length > 0 && (
                <>
                  <div className="lbl" style={{ marginTop: 20 }}>Športoviská</div>
                  <div className="tags">
                    {school.sports.filter(Boolean).map((x, i) => (
                      <span className="tag" key={i}>{x}</span>
                    ))}
                  </div>
                </>
              )}
              {school.canteenOptions.filter(Boolean).length > 0 && (
                <>
                  <div className="lbl" style={{ marginTop: 20 }}>Stravovanie</div>
                  <div className="tags">
                    {school.canteenOptions.filter(Boolean).map((x, i) => (
                      <span className="tag" key={i}>{x}</span>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* ÚSPECHY ABSOLVENTOV */}
          {school.achievements && (
            <div className="p-sec">
              <div className="rule" />
              <h2 className="dh">Úspechy absolventov</h2>
              <div className="txtblk" style={{ whiteSpace: "pre-line" }}>{school.achievements}</div>
            </div>
          )}

          {/* ČO PO ŠKOLE */}
          {school.graduates && (
            <div className="p-sec">
              <div className="rule" />
              <h2 className="dh">Čo po škole?</h2>
              <p className="dl">Kam odchádzajú naši absolventi a kde sa uplatnia.</p>
              <div className="txtblk" style={{ whiteSpace: "pre-line" }}>{school.graduates}</div>
            </div>
          )}

          {!printMode && <SchoolGallery photos={galleryPhotos} schoolName={school.name} />}

          {/* KDE ŠKOLA SÍDLI */}
          {(school.address || school.phone || school.email || school.websites.length > 0 || school.facebook || school.instagram) && (
            <>
              <div className="rule" />
              <h2 className="dh">Kde škola sídli</h2>
              {!printMode && (school.mapUrl ? (
                <iframe
                  src={school.mapUrl}
                  title={`Mapa — ${school.name}`}
                  className="gmap"
                  style={{ width: "100%", height: 260, border: 0, margin: "16px 0 14px" }}
                  loading="lazy"
                />
              ) : gmapSrc ? (
                <iframe
                  src={gmapSrc}
                  title={`Mapa — ${school.name}`}
                  className="gmap"
                  style={{ width: "100%", height: 260, border: 0, margin: "16px 0 14px" }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : null)}
              <div className="p-only">
                <table className="p-tab">
                  <tbody>
                    <tr><th>Ukončenie</th><td>{hasMat && hasVl ? "maturita + výučný list" : hasMat ? "maturita" : "výučný list"}</td></tr>
                    <tr><th>Vyučovací jazyk</th><td>{school.languages.map((l) => LANGUAGE_LABEL[l] ?? l).join(", ") || "-"}</td></tr>
                    <tr><th>Native speaker</th><td>{school.hasNativeSpeaker ? "áno" : "nie"}</td></tr>
                    <tr><th>Ubytovanie</th><td>{school.internatType ?? (school.internatInfo && !/^(nie|nemá|neposkyt|neponúk)/i.test(school.internatInfo) ? school.internatInfo : "nie")}</td></tr>
                    <tr><th>Bezbariérovosť</th><td>{school.accessibility ?? "-"}</td></tr>
                    <tr><th>Podporný tím</th><td>{school.supportTeam.join(", ") || "-"}</td></tr>
                  </tbody>
                </table>
                <div className="p-cols">
                  <div><b>Zriaďovateľ:</b> Trnavský samosprávny kraj</div>
                  {dod && <div><b>Deň otvorených dverí:</b> {fmtDate(dod.date)}{dod.time ? `, ${dod.time}` : ""}</div>}
                  <div><b>Kontakt:</b> {[school.phone?.split("\n")[0], school.email, school.websites[0]].filter(Boolean).join(" · ")}</div>
                </div>
              </div>

              <div className="loc">
                <div className="loccols">
                  <div>
                    <div className="lbl">Adresa</div>
                    <div className="contact">
                      {school.name}<br />
                      {school.address && <>{school.address}<br /></>}
                      okres {school.district}
                    </div>
                  </div>
                  <div>
                    <div className="lbl">Kontakt</div>
                    <div className="contact">
                      {school.phone && <>{school.phone.split("\n").map((t, i) => (
                        <span key={i}>{i > 0 && "tel. "}{t.trim()}<br /></span>
                      ))}</>}
                      {school.email && <><a href={`mailto:${school.email}`}>{school.email}</a><br /></>}
                      {school.websites.map((w) => (
                        <span key={w}>
                          <a href={`https://${w.replace(/^https?:\/\//, "")}`} target="_blank" rel="noopener noreferrer">
                            {w.replace(/^https?:\/\//, "").replace(/^www\./, "")}
                          </a>
                          <br />
                        </span>
                      ))}
                      {school.facebook && (
                        <>
                          <a
                            href={
                              school.facebook.startsWith("http")
                                ? school.facebook
                                : `https://www.facebook.com/${school.facebook.replace(/^@/, "")}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Facebook
                          </a>
                          {school.instagram ? " · " : <><br /></>}
                        </>
                      )}
                      {school.instagram && (
                        <a
                          href={
                            school.instagram.startsWith("http")
                              ? school.instagram
                              : `https://www.instagram.com/${school.instagram.replace(/^@/, "")}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Instagram
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <Illustration name="contactStar" />
              </div>
            </>
          )}

          {/* Deň otvorených dverí – tlačený highlight (na obrazovke skrytý, len do tlače) */}
          {dod && (
            <div className="p-sec dod-print" aria-hidden="true">
              <b>Deň otvorených dverí:</b> {fmtDate(dod.date)}
              {dod.time ? `, ${dod.time}` : ""}
            </div>
          )}
        </div>

        {/* BOČNÝ PANEL */}
        {!printMode && (
          <div className="side">
            {upcomingDods.length > 0 && (
              <div className="sidebox dod">
                <div className="lbl">{upcomingDods.length > 1 ? "Dni otvorených dverí" : "Deň otvorených dverí"}</div>
                {upcomingDods.map((d, i) => (
                  <div key={d.id} style={{ marginBottom: i < upcomingDods.length - 1 ? 12 : 0 }}>
                    <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 2 }}>{fmtDate(d.date)}</div>
                    {d.time && <div style={{ fontSize: 13.5, color: "var(--ink2)", margin: "4px 0 4px" }}>{d.time}</div>}
                    {d.note && <div style={{ fontSize: 12.5, color: "var(--ink2)" }}>{d.note}</div>}
                  </div>
                ))}
                <a className="btn sm full" style={{ marginTop: 10 }} href={gcalUrl} target="_blank" rel="noopener noreferrer">
                  Pridať do kalendára
                </a>
              </div>
            )}

            <div className="sidebox">
              <a className="btn solid full" style={{ marginBottom: 10 }} href="https://eprihlasky.iedu.sk/" target="_blank" rel="noopener noreferrer">
                Podať prihlášku →
              </a>
              {school.email && (
                <a className="btn full" style={{ marginBottom: 10 }} href={`mailto:${school.email}`}>
                  Napísať škole
                </a>
              )}
              <PrintButton />
            </div>

            <div className="sidebox">
              <div className="lbl">Rýchly prehľad</div>
              <div className="kv">
                <div><span>Okres</span><b>{school.district}</b></div>
                <div><span>Zameranie</span><b>{school.tags.map((t) => t.label).join(", ")}</b></div>
                <div>
                  <span>Ukončenie</span>
                  <b>{hasMat && hasVl ? "maturita + výučný list" : hasMat ? "maturita" : "výučný list"}</b>
                </div>
                <div><span>Jazyk</span><b>{school.languages.map((l) => LANGUAGE_LABEL[l] ?? l).join(", ")}</b></div>
                {school.accessibility && !/^nie/i.test(school.accessibility) && (
                  <div><span>Bezbariérovosť</span><b>{school.accessibility}</b></div>
                )}
                {school.hasDual && <div><span>Duálne vzdelávanie</span><b>áno</b></div>}
                {school.hasNadstavba && <div><span>Nadstavbové štúdium</span><b>áno</b></div>}
                {(school.internatType || (school.internatInfo && !/^(nie|nemá|neposkyt|neponúk)/i.test(school.internatInfo))) && (
                  <div>
                    <span>Ubytovanie</span>
                    <b>{[school.internatType, school.internatInfo].filter((x) => x && !/^(nie|nemá|neposkyt|neponúk)/i.test(x)).join(" — ")}</b>
                  </div>
                )}
                {school.foreignLanguages.length > 0 && (
                  <div><span>Cudzie jazyky</span><b>{school.foreignLanguages.join(", ")}</b></div>
                )}
                {school.hasNativeSpeaker && <div><span>Native speaker</span><b>áno</b></div>}
                {school.supportTeam.length > 0 && (
                  <div><span>Podporný tím</span><b>{school.supportTeam.join(", ")}</b></div>
                )}
              </div>
            </div>

            {school.downloads.length > 0 && (
              <div className="sidebox downloads">
                <div className="lbl">Na stiahnutie</div>
                <div>
                  {school.downloads.map((download) => (
                    <a
                      key={download.id}
                      href={download.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="download-link"
                    >
                      ↓ {download.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {school.badges.length > 0 && (
              <div className="sidebox">
                {school.badges.map((b) => (
                  <span key={b.id} className="tag hi" style={{ marginRight: 6, marginBottom: 6 }}>
                    {b.label}
                  </span>
                ))}
              </div>
            )}

          </div>
        )}
      </div>

      {!printMode && school.similarTo.length > 0 && (
        <div className="wrap" style={{ padding: "0 30px 56px" }}>
          {<HandRule />}
          <h2 className="dh">Podobné školy v kraji</h2>
          <p className="dl">Ak ťa zaujala táto škola, pozri sa aj na tieto.</p>
          <div className="cards">
            {school.similarTo.map((similar) => {
              const listPhoto = similar.photos.find((p) => p.isListCover) ?? similar.photos.find((p) => p.isDetailCover) ?? similar.photos[0];
              return (
                <SchoolCard
                  key={similar.id}
                  s={{
                    slug: similar.slug,
                    name: similar.name,
                    city: similar.city,
                    district: similar.district,
                    languages: similar.languages,
                    hasInternat: similar.hasInternat,
                    hasDual: similar.hasDual,
                    hasNadstavba: similar.hasNadstavba,
                    inekoKrajRank: similar.inekoKrajRank,
                    inekoKrajOf: similar.inekoKrajOf,
                    odbory: similar.odbory,
                    badges: similar.badges,
                    photoUrl: listPhoto?.url ?? similar.photoUrl,
                    photoFocalX: listPhoto?.focalX ?? 50,
                    photoFocalY: listPhoto?.focalY ?? 50,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
      {!printMode && (
        <div className="mobbar">
          <span>{dod ? `DOD ${fmtDate(dod.date)}` : "Vyber si svoju školu"}</span>
          <a className="btn sm" style={{ background: "#fff", borderColor: "#fff", marginLeft: "auto" }} href="https://eprihlasky.iedu.sk/" target="_blank" rel="noopener noreferrer">
            Podať prihlášku
          </a>
        </div>
      )}
    </div>
  );
}
