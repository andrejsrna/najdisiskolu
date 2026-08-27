import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COMPLETION_LABEL } from "@/lib/constants";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("sk-SK", { day: "numeric", month: "long", year: "numeric" });

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
    },
  });
  if (!school || !school.isPublished) notFound();

  const hasMat = school.odbory.some((o) => o.completion === "MATURITA" || o.completion === "MATURITA_A_VYUCNY_LIST");
  const hasVl = school.odbory.some((o) => o.completion === "VYUCNY_LIST" || o.completion === "MATURITA_A_VYUCNY_LIST");
  const totalAccepts = school.odbory.reduce((a, o) => a + (o.accepts ?? 0), 0);
  const maxApplied = school.odbory.reduce((m, o) => Math.max(m, o.appliedLastYear ?? 0), 0);
  const dod = school.dods[0];

  return (
    <>
      <div className="wrap">
        <div className="crumb">
          <Link href="/" style={{ textDecoration: "none" }}>
            ← Späť na výber školy
          </Link>
        </div>
      </div>

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
              {dod.time && <div>{dod.time}</div>}
            </div>
          )}

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
    </>
  );
}
