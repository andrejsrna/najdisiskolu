import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { COMPLETION_LABEL, LANGUAGE_LABEL } from "@/lib/constants";
import { SITE_URL, stripHtml } from "@/lib/site";
import { PrintButton } from "./PrintButton";
import { SchoolGallery } from "./SchoolGallery";

export const dynamic = "force-dynamic";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("sk-SK", { day: "numeric", month: "long", year: "numeric" });

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const school = await prisma.school.findUnique({
    where: { slug },
    select: {
      name: true,
      city: true,
      district: true,
      intro: true,
      logoUrl: true,
      isPublished: true,
    },
  });
  if (!school || !school.isPublished) return {};

  const title = `${school.name} — ${school.city}`;
  const description =
    stripHtml(school.intro) ||
    `Stredná škola ${school.name} v okrese ${school.district}. Prehľad odborov, kritérií prijatia a dňa otvorených dverí.`;

  return {
    title,
    description,
    alternates: { canonical: `/skola/${slug}` },
    openGraph: {
      title,
      description,
      url: `/skola/${slug}`,
      type: "website",
      images: school.logoUrl ? [{ url: school.logoUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SchoolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const school = await prisma.school.findUnique({
    where: { slug },
    include: {
      tags: { orderBy: { label: "asc" } },
      odbory: { orderBy: { sort: "asc" } },
      projects: { orderBy: { sort: "asc" } },
      dods: true,
      downloads: { orderBy: { sort: "asc" } },
      badges: { orderBy: { createdAt: "desc" } },
      photos: { orderBy: { sort: "asc" } },
      similarTo: {
        where: { isPublished: true },
        include: { photos: { where: { isListCover: true }, take: 1 } },
        take: 3,
      },
    },
  });
  if (!school || !school.isPublished) notFound();

  const hasMat = school.odbory.some((o) => o.completion === "MATURITA" || o.completion === "MATURITA_A_VYUCNY_LIST");
  const hasVl = school.odbory.some((o) => o.completion === "VYUCNY_LIST" || o.completion === "MATURITA_A_VYUCNY_LIST");
  const totalAccepts = school.odbory.reduce((a, o) => a + (o.accepts ?? 0), 0);
  const totalApplied = school.odbory.reduce((a, o) => a + (o.appliedLastYear ?? 0), 0);
  const dod = school.dods[0];
  const dodIcal = dod ? dod.date.toISOString().slice(0, 10).replace(/-/g, "") : "";
  const orderedPhotos = [...school.photos].sort((a, b) =>
    Number(b.isDetailCover) - Number(a.isDetailCover) || a.sort - b.sort,
  );
  const heroPhoto = orderedPhotos[0]
    ? { url: orderedPhotos[0].url, alt: orderedPhotos[0].alt ?? school.name }
    : school.photoUrl
      ? { url: school.photoUrl, alt: school.name }
      : null;
  const gcalUrl = dod
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        `Deň otvorených dverí — ${school.name}`,
      )}&dates=${dodIcal}/${dodIcal}&ctz=Europe/Bratislava`
    : "";

  return (
    <>
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
            ...(school.website ? { sameAs: [school.website] } : {}),
          }),
        }}
      />
      <div className="wrap">
        <div className="crumb">
          <Link href="/" style={{ textDecoration: "none" }}>
            ← Späť na výber školy
          </Link>
          <span aria-hidden="true">&nbsp; · &nbsp;</span>
          Vyber si strednú / {school.city} / <span style={{ color: "var(--ink)" }}>{school.name}</span>
        </div>
      </div>

      {heroPhoto && (
        <div className="school-hero-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroPhoto.url} alt={heroPhoto.alt} />
        </div>
      )}

      <div className="wrap dcols">
        {/* HLAVNÝ STĹPEC */}
        <div>
          <div className="p-head">
            <h1 style={{ fontSize: "clamp(28px,4vw,44px)", letterSpacing: "-.02em", margin: "0 0 8px" }}>
              {school.name}
            </h1>
            <div style={{ color: "var(--ink2)", marginBottom: 14 }}>
              {school.city === school.district ? school.city : `${school.city} · okres ${school.district}`}
            </div>
            <div className="tags" style={{ marginBottom: 20 }}>
              <span className={`tag ${hasMat && hasVl ? "matvl" : hasMat ? "mat" : "vl"}`}>
                {hasMat && hasVl ? "maturita + výučný list" : hasMat ? "maturita" : "výučný list"}
              </span>
              {school.hasDual && <span className="tag dual">duálne vzdelávanie</span>}
              {school.hasInternat && <span className="tag dorm">internát</span>}
              {school.hasNadstavba && <span className="tag nad">nadstavbové štúdium</span>}
              {school.accessibility?.toLowerCase().startsWith("áno") && (
                <span className="tag bez">bezbariérový prístup</span>
              )}
            </div>
          </div>

          {school.intro && <p style={{ fontSize: 17, color: "var(--ink2)", maxWidth: "72ch" }}>{school.intro}</p>}

          <SchoolGallery photos={orderedPhotos} schoolName={school.name} />

          <div className="numbers" style={{ marginTop: 24 }} aria-label="Základné údaje o škole">
            <div className="num">
              <div className={`n ${totalAccepts ? "" : "nodata"}`}>{totalAccepts || "—"}</div>
              <div className="t">miest pre prvákov<br />v aktuálnej ponuke</div>
            </div>
            <div className="num">
              <div className={`n ${totalApplied ? "" : "nodata"}`}>{totalApplied || "—"}</div>
              <div className="t">prihlásených<br />vlani celkovo</div>
            </div>
            <div className="num">
              <div className="n">{school.odbory.length}</div>
              <div className="t">{school.odbory.length === 1 ? "odbor" : school.odbory.length < 5 ? "odbory" : "odborov"}<br />škola otvára</div>
            </div>
            <div className="num">
              <div className={`n ${school.totalStudents ? "" : "nodata"}`}>{school.totalStudents ?? "—"}</div>
              <div className="t">žiakov<br />celkovo</div>
            </div>
          </div>

          {/* ODBORY */}
          <h2 className="dh" style={{ marginTop: 34 }}>Čo sa dá študovať</h2>
          {school.odbory.length === 0 ? (
            <p className="dl">Zoznam odborov zatiaľ nie je doplnený.</p>
          ) : (
            <div className="scroll">
              <table className="od">
                <thead>
                  <tr>
                    <th>Odbor</th>
                    <th>Prijíma</th>
                    <th>Vlani prihlásených</th>
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
                      <td className="c">{o.length} {o.length === 1 ? "rok" : "roky"}</td>
                      <td className="c">{COMPLETION_LABEL[o.completion] ?? o.completion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PREČO PRÁVE SEM */}
          {school.whyUs.length > 0 && (
            <>
              <h2 className="dh" style={{ marginTop: 34 }}>Prečo práve sem</h2>
              <div className="duo">
                {school.whyUs.map((w, i) => (
                  <div className="cell" key={i}>{w}</div>
                ))}
              </div>
            </>
          )}

          {/* PROJEKTY */}
          {school.projects.length > 0 && (
            <>
              <h2 className="dh" style={{ marginTop: 34 }}>Projekty</h2>
              {school.projects.map((p) => (
                <div key={p.id} style={{ marginBottom: 16 }}>
                  <b>{p.title}</b>
                  <p className="dl" style={{ margin: "4px 0 0" }}>{p.description}</p>
                </div>
              ))}
            </>
          )}

          {/* ERASMUS */}
          {school.erasmus && (
            <>
              <h2 className="dh" style={{ marginTop: 34 }}>Erasmus+</h2>
              <p className="dl">{school.erasmus}</p>
            </>
          )}

          {/* KRÚŽKY */}
          {school.clubs.length > 0 && (
            <>
              <h2 className="dh" style={{ marginTop: 34 }}>Krúžky a voľný čas</h2>
              <ul>
                {school.clubs.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </>
          )}

          {/* ÚSPECHY */}
          {school.achievements && (
            <>
              <h2 className="dh" style={{ marginTop: 34 }}>Úspechy</h2>
              <p className="dl" style={{ whiteSpace: "pre-line" }}>{school.achievements}</p>
            </>
          )}

          {/* PARTNERI */}
          {school.partners && (
            <>
              <h2 className="dh" style={{ marginTop: 34 }}>Partneri</h2>
              <p className="dl" style={{ whiteSpace: "pre-line" }}>{school.partners}</p>
            </>
          )}

          {/* ABSOLVENTI */}
          {school.graduates && (
            <>
              <h2 className="dh" style={{ marginTop: 34 }}>Absolventi</h2>
              <p className="dl">{school.graduates}</p>
            </>
          )}
        </div>

        {/* BOČNÝ PANEL */}
        <div className="side">
          {dod && (
            <div className="sidebox dod">
              <div className="lbl">Deň otvorených dverí</div>
              <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 2 }}>{fmtDate(dod.date)}</div>
              {dod.time && <div style={{ fontSize: 13.5, color: "var(--ink2)", margin: "4px 0 14px" }}>{dod.time}</div>}
              <a className="btn sm full" href={gcalUrl} target="_blank" rel="noopener noreferrer">
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
              {school.internatInfo && !/^(nie|nemá|neposkyt|neponúk)/i.test(school.internatInfo) && (
                <div><span>Ubytovanie</span><b>{school.internatInfo}</b></div>
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

          <div className="sidebox">
            <div className="lbl">Kontakt</div>
            <div style={{ fontSize: 14 }}>
              {school.address && <div style={{ marginBottom: 8 }}>{school.address}</div>}
              {school.website && (
                <div><b>Web:</b> <a href={`https://${school.website.replace(/^https?:\/\//, "")}`}>{school.website}</a></div>
              )}
              {school.email && <div><b>Email:</b> {school.email}</div>}
              {school.phone && <div style={{ whiteSpace: "pre-line" }}><b>Tel:</b> {school.phone}</div>}
              {school.facebook && <div><b>FB:</b> {school.facebook}</div>}
              {school.instagram && <div><b>IG:</b> {school.instagram}</div>}
            </div>
          </div>

          {school.badges.length > 0 && (
            <div className="sidebox">
              {school.badges.map((b) => (
                <span key={b.id} className="tag hi" style={{ marginRight: 6, marginBottom: 6 }}>
                  {b.label}
                </span>
              ))}
            </div>
          )}

          {school.downloads.length > 0 && (
            <div className="sidebox">
              <div className="lbl">Na stiahnutie</div>
              {school.downloads.map((d) => (
                <div key={d.id} style={{ marginBottom: 8 }}>
                  <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
                    ↓ {d.title}
                  </a>
                </div>
              ))}
            </div>
          )}

          {school.mapUrl && (
            <div className="sidebox">
              <div className="lbl">Kde nás nájdeš</div>
              <iframe
                src={school.mapUrl}
                title={`Mapa — ${school.name}`}
                style={{ width: "100%", height: 200, border: 0, borderRadius: 5 }}
                loading="lazy"
              />
            </div>
          )}
        </div>
      </div>

      {school.similarTo.length > 0 && (
        <section className="band-page" style={{ marginTop: 44 }}>
          <div className="wrap">
            <h2 className="dh">Podobné školy, ktoré by ťa mohli zaujímať</h2>
            <div className="g3">
              {school.similarTo.map((similar) => {
                const photo = similar.photos[0];
                return (
                  <Link
                    key={similar.id}
                    href={`/skola/${similar.slug}`}
                    className="post"
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo.url} alt={photo.alt ?? similar.name} className="img" style={{ height: 180, width: "100%", objectFit: "cover" }} />
                    ) : (
                      <div className="ph img">FOTO ŠKOLY</div>
                    )}
                    <div className="t">{similar.name}</div>
                    <div className="date">{similar.city} · okres {similar.district}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
