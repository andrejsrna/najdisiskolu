import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("sk-SK", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default async function VeltrhyPage() {
  const [veltrhy, dodSchools] = await Promise.all([
    prisma.veltrh.findMany({
      include: { schools: { orderBy: { name: "asc" } } },
      orderBy: { date: "asc" },
    }),
    prisma.school.findMany({
      where: { dods: { some: {} }, isPublished: true },
      include: { dods: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <section className="band-acid">
        <div className="wrap" style={{ paddingTop: 56, paddingBottom: 56 }}>
          <h1 style={{ fontSize: "clamp(30px,4.5vw,54px)", letterSpacing: "-.03em", margin: 0 }}>
            Veľtrhy škôl
          </h1>
          <p style={{ fontSize: 19, maxWidth: "62ch", margin: "12px 0 0" }}>
            Raz do roka sa všetky župné stredné školy stretnú na jednom mieste — za jedno
            popoludnie spoznáš školy, ktoré by si inak obchádzal celú jeseň.
          </p>
        </div>
      </section>

      <section>
        <div className="wrap" style={{ paddingTop: 40, paddingBottom: 40 }}>
          {veltrhy.length === 0 ? (
            <div className="empty">Termíny veľtrhov zatiaľ nie sú zverejnené.</div>
          ) : (
            <div className="g3">
              {veltrhy.map((v) => (
                <div className="scard" key={v.id} style={{ padding: 20 }}>
                  <div className="name" style={{ fontSize: 20 }}>{v.city}</div>
                  <div className="loc" style={{ marginBottom: 10 }}>
                    {fmtDate(v.date)} · {v.time}
                  </div>
                  <div style={{ fontSize: 14, marginBottom: 4 }}>
                    <b>{v.place}</b>
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--ink2)", marginBottom: 10 }}>
                    {v.address}
                  </div>
                  {v.description && (
                    <p style={{ fontSize: 14, margin: "0 0 12px" }}>{v.description}</p>
                  )}
                  {v.extra && <p style={{ fontSize: 13, color: "var(--term-ink)" }}>{v.extra}</p>}
                  {v.schools.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink2)", marginBottom: 6 }}>
                        Zúčastnené školy ({v.schools.length})
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>
                        {v.schools.map((s) => (
                          <li key={s.id}>
                            <Link href={`/skola/${s.slug}`} style={{ textDecoration: "underline" }}>
                              {s.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* DNI OTVORENÝCH DVERÍ */}
      {dodSchools.length > 0 && (
        <section className="band-grey">
          <div className="wrap" style={{ paddingTop: 40, paddingBottom: 48 }}>
            <h2 style={{ fontSize: 26, margin: "0 0 6px" }}>Dni otvorených dverí</h2>
            <p style={{ color: "var(--ink2)", margin: "0 0 20px", maxWidth: "62ch" }}>
              Veľtrh ti dá prehľad, deň otvorených dverí ti dá pocit z konkrétnej školy.
            </p>
            <div style={{ display: "grid", gap: 1, background: "var(--line2)" }}>
              {dodSchools.map((s) => {
                const dod = s.dods[0];
                return (
                  <div
                    key={s.id}
                    style={{
                      background: "#fff",
                      padding: "14px 18px",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <Link href={`/skola/${s.slug}`} style={{ fontWeight: 600, textDecoration: "underline" }}>
                        {s.name}
                      </Link>
                      <div style={{ fontSize: 13, color: "var(--ink2)" }}>
                        {s.city === s.district ? s.city : `${s.city} · okres ${s.district}`}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {fmtDate(dod.date)}{dod.time ? ` · ${dod.time}` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
