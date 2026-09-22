import Link from "next/link";

export type SchoolCardOdbor = {
  completion: string;
  accepts: number | null;
  appliedLastYear: number | null;
  places: number | null;
};

export type SchoolCardData = {
  slug: string;
  name: string;
  city: string;
  district: string;
  languages: string[];
  hasInternat: boolean;
  hasDual: boolean;
  hasNadstavba: boolean;
  inekoKrajRank: number | null;
  inekoKrajOf: string | null;
  odbory: SchoolCardOdbor[];
  badges: { label: string; kind: string }[];
  photoUrl: string | null;
  photoFocalX: number;
  photoFocalY: number;
};

const JAZ_SHORT: Record<string, string> = { hu: "maďarský", en: "anglický", ru: "ruský" };

const hasMat = (o: SchoolCardOdbor) => o.completion === "MATURITA" || o.completion === "MATURITA_A_VYUCNY_LIST";
const hasVl = (o: SchoolCardOdbor) => o.completion === "VYUCNY_LIST" || o.completion === "MATURITA_A_VYUCNY_LIST";
const sklonOdbor = (n: number) => (n === 1 ? "odbor" : n < 5 ? "odbory" : "odborov");

function benefit(s: SchoolCardData) {
  if (s.inekoKrajRank) return "INEKO rebríček";
  return s.odbory.length === 1 ? "jediný odbor" : "široký výber odborov";
}

function locTxt(m: string, o: string) {
  return m === o ? m : `${m} · okres ${o}`;
}

/** Zdieľaná karta školy — používa ju filter na homepage aj "Podobné školy" na detaile,
 * aby obe miesta zobrazovali presne tie isté údaje a rovnaký vzhľad. */
export function SchoolCard({ s, onClick }: { s: SchoolCardData; onClick?: () => void }) {
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
  const totalApplied = s.odbory.reduce((a, o) => a + (o.appliedLastYear ?? 0), 0);
  const totalPlaces = s.odbory.reduce((a, o) => a + (o.places ?? 0), 0);
  const applicantsPerPlace = totalPlaces ? Math.round((totalApplied / totalPlaces) * 10) / 10 : null;
  const ineko = s.inekoKrajRank ? `${s.inekoKrajRank}. ${s.inekoKrajOf ?? "zo všetkých škôl"}` : null;

  return (
    <Link className="scard" href={`/skola/${s.slug}?from=filter`} onClick={onClick} aria-label={`Zobraziť detail školy: ${s.name}`}>
      {s.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={s.photoUrl}
          alt=""
          className="img"
          style={{ height: 200, width: "100%", objectFit: "cover", objectPosition: `${s.photoFocalX}% ${s.photoFocalY}%` }}
          loading="lazy"
          decoding="async"
        />
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
              <span key={b.label} className={`tag hi ${b.kind && b.kind !== "ok" ? "k-" + b.kind : ""}`}>
                {b.label}
              </span>
            ))}
          </div>
        )}
        <div className="tags">
          {totalAccepts > 0 && <span className="tag hi">prijímajú {totalAccepts} žiakov</span>}
          {applicantsPerPlace != null && <span className="tag hi">vlani {applicantsPerPlace} uchádzačov na 1 miesto</span>}
        </div>
        {ineko && (
          <div className="tags">
            <span className="tag hi">INEKO: {ineko}</span>
          </div>
        )}
        <div className="foot">
          <span className="btn sm">Detail školy</span>
        </div>
      </div>
    </Link>
  );
}
