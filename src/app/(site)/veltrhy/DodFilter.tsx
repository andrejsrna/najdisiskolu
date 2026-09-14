"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type DodSchool = {
  slug: string;
  name: string;
  city: string;
  district: string;
  dodDate: string | null; // ISO
  dodTime: string | null;
};

const DISTRICT_ORDER = [
  "Dunajská Streda",
  "Galanta",
  "Hlohovec",
  "Piešťany",
  "Senica",
  "Skalica",
  "Trnava",
];

const fmtDd = (iso: string) =>
  new Date(iso).toLocaleDateString("sk-SK", { day: "numeric", month: "long", year: "numeric" });

export default function DodFilter({ schools }: { schools: DodSchool[] }) {
  const [okres, setOkres] = useState("");

  const districts = useMemo(() => {
    const present = new Set(schools.map((s) => s.district));
    return DISTRICT_ORDER.filter((d) => present.has(d));
  }, [schools]);

  const list = useMemo(() => {
    const shown = okres ? schools.filter((s) => s.district === okres) : schools;
    return shown
      .filter((s) => s.dodDate)
      .slice()
      .sort((a, b) => (a.dodDate! < b.dodDate! ? -1 : a.dodDate! > b.dodDate! ? 1 : a.name.localeCompare(b.name, "sk")));
  }, [schools, okres]);

  return (
    <>
      <div style={{ marginTop: 16 }}>
        <span
          className={`chip ${!okres ? "on" : ""}`}
          onClick={() => setOkres("")}
          style={{ cursor: "pointer" }}
        >
          <span className="sq">{!okres ? "✓" : ""}</span>
          všetky okresy
        </span>
        {districts.map((o) => (
          <span
            key={o}
            className={`chip ${okres === o ? "on" : ""}`}
            onClick={() => setOkres(o)}
            style={{ cursor: "pointer" }}
          >
            <span className="sq">{okres === o ? "✓" : ""}</span>
            {o}
          </span>
        ))}
      </div>

      <div className="dodbox">
        {list.map((s) => (
          <Link href={`/skola/${s.slug}`} className="dodrow" key={s.slug} style={{ textDecoration: "none", color: "inherit" }}>
            <div>
              <div className="dn">{s.name}</div>
              <div className="dm">{s.city === s.district ? s.city : `${s.city} · okres ${s.district}`}</div>
            </div>
            <div className="dd">{fmtDd(s.dodDate!)}{s.dodTime ? ` · ${s.dodTime}` : ""}</div>
          </Link>
        ))}
        {list.length === 0 && (
          <div className="qnone">Pre túto kombináciu zatiaľ nemáme zverejnený deň otvorených dverí.</div>
        )}
      </div>
    </>
  );
}