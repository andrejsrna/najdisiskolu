import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { DISTRICTS, COMPLETION_OPTIONS, COMPLETION_LABEL, LANGUAGE_OPTIONS } from "@/lib/constants";
import {
  updateSchoolBasic,
  addOdbor,
  updateOdbor,
  deleteOdbor,
  saveDod,
  addDownload,
  deleteDownload,
  addBadge,
  deleteBadge,
  addSchoolPhoto,
  deleteSchoolPhoto,
  setSchoolPhotoCover,
  saveSimilarSchools,
} from "@/lib/school-actions";

const input =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
const label = "mb-1 block text-xs font-medium text-slate-600";

const BADGE_KINDS = [
  { value: "ok", label: "ok — zelená (voľné miesta)" },
  { value: "term", label: "term — ružová (termín)" },
  { value: "mat", label: "mat — tyrkysová (maturita)" },
  { value: "vl", label: "vl — oranžová (výučný list)" },
  { value: "dual", label: "dual — fialová (duál)" },
];

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function SchoolEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();

  const school = await prisma.school.findUnique({
    where: { slug },
    include: {
      tags: true,
      odbory: { orderBy: { sort: "asc" } },
      dods: true,
      downloads: { orderBy: { sort: "asc" } },
      badges: { orderBy: { createdAt: "desc" } },
      photos: { orderBy: { sort: "asc" } },
      similarTo: { orderBy: { name: "asc" } },
    },
  });
  if (!school) notFound();

  const isAdmin = user.role === Role.ADMIN || user.role === Role.SCHOLSTVO;
  const canEdit = isAdmin || (user.role === Role.SKOLA && user.schoolId === school.id);
  if (!canEdit) redirect("/admin");

  const [allTags, allSchools] = await Promise.all([
    prisma.tag.findMany({ orderBy: { label: "asc" } }),
    isAdmin
      ? prisma.school.findMany({
          where: { id: { not: school.id }, isPublished: true },
          select: { id: true, name: true, city: true },
          orderBy: [{ name: "asc" }, { city: "asc" }],
        })
      : Promise.resolve([]),
  ]);
  const dod = school.dods[0];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/admin/skoly" className="text-sm text-slate-500 hover:text-slate-900">
          ← Späť na zoznam škôl
        </Link>
        <h1 className="mt-1 text-xl font-bold text-slate-900">{school.name}</h1>
        <p className="text-sm text-slate-500">
          {school.city} · okres {school.district}
        </p>
      </div>

      {/* ============ ZÁKLADNÉ ÚDAJE ============ */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Základné údaje</h2>
        <form action={updateSchoolBasic.bind(null, school.id, school.slug)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Názov školy</label>
            <input name="name" defaultValue={school.name} className={input} />
          </div>
          <div>
            <label className={label}>Mesto</label>
            <input name="city" defaultValue={school.city} className={input} />
          </div>
          <div>
            <label className={label}>Okres</label>
            <select name="district" defaultValue={school.district} className={input}>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Web</label>
            <input name="website" defaultValue={school.website ?? ""} className={input} />
          </div>
          <div>
            <label className={label}>Email</label>
            <input name="email" defaultValue={school.email ?? ""} className={input} />
          </div>
          <div>
            <label className={label}>Telefón</label>
            <input name="phone" defaultValue={school.phone ?? ""} className={input} />
          </div>
          <div>
            <label className={label}>Facebook</label>
            <input name="facebook" defaultValue={school.facebook ?? ""} className={input} />
          </div>
          <div>
            <label className={label}>Instagram</label>
            <input name="instagram" defaultValue={school.instagram ?? ""} className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Adresa</label>
            <input name="address" defaultValue={school.address ?? ""} className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Mapa (iframe embed URL)</label>
            <input name="mapUrl" defaultValue={school.mapUrl ?? ""} placeholder="https://www.openstreetmap.org/export/embed.html?…" className={input} />
          </div>
          <div>
            <label className={label}>INEKO — kraj</label>
            <input name="inekoKraj" defaultValue={school.inekoKraj ?? ""} className={input} />
          </div>
          <div>
            <label className={label}>INEKO — Slovensko</label>
            <input name="inekoSlovensko" defaultValue={school.inekoSlovensko ?? ""} className={input} />
          </div>
          <div>
            <label className={label}>Celkovo žiakov</label>
            <input name="totalStudents" defaultValue={school.totalStudents ?? ""} placeholder="napr. približne 550" className={input} />
          </div>
          <div>
            <label className={label}>Bezbariérovosť</label>
            <input name="accessibility" defaultValue={school.accessibility ?? ""} placeholder="áno / popis" className={input} />
          </div>
          <div>
            <label className={label}>Internát (popis)</label>
            <input name="internatInfo" defaultValue={school.internatInfo ?? ""} placeholder="Áno, na našom internáte" className={input} />
          </div>
          <div>
            <label className={label}>Erasmus+</label>
            <input name="erasmus" defaultValue={school.erasmus ?? ""} className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Predstavenie školy</label>
            <textarea name="intro" defaultValue={school.intro ?? ""} rows={4} className={input} />
          </div>

          <div className="sm:col-span-2">
            <label className={label}>Príznaky</label>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {[
                ["hasInternat", "internát"],
                ["hasCanteen", "školská jedáleň"],
                ["hasDual", "duálne vzdelávanie"],
                ["hasNadstavba", "nadstavbové štúdium"],
                ["hasNativeSpeaker", "native speaker"],
              ].map(([name, text]) => (
                <label key={name} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name={name}
                    defaultChecked={Boolean(school[name as keyof typeof school])}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {text}
                </label>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className={label}>Zameranie (tagy)</label>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {allTags.map((t) => (
                <label key={t.code} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="tags"
                    value={t.code}
                    defaultChecked={school.tags.some((s) => s.code === t.code)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className={label}>Vyučovací jazyk</label>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {LANGUAGE_OPTIONS.map((l) => (
                <label key={l.value} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="languages"
                    value={l.value}
                    defaultChecked={school.languages.includes(l.value)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {l.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={label}>Cudzie jazyky (čiarkou)</label>
            <input name="foreignLanguages" defaultValue={school.foreignLanguages.join(", ")} placeholder="anglický, nemecký, francúzsky" className={input} />
          </div>
          <div>
            <label className={label}>Podporný tím (čiarkou)</label>
            <input name="supportTeam" defaultValue={school.supportTeam.join(", ")} placeholder="školský psychológ, kariérny poradca" className={input} />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Uložiť základné údaje
            </button>
          </div>
        </form>
      </section>

      {/* ============ FOTOGALÉRIA ============ */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Fotogaléria</h2>
        <p className="mb-4 text-xs text-slate-500">
          Pridaj verejnú URL fotky. Označ zvlášť titulnú fotku pre detail a kartu v zozname škôl.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {school.photos.map((photo) => (
            <div key={photo.id} className="overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.alt ?? school.name} className="h-40 w-full object-cover" />
              <div className="space-y-2 p-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  {photo.isDetailCover && <span className="rounded-full bg-slate-900 px-2 py-1 text-white">Titulná detailu</span>}
                  {photo.isListCover && <span className="rounded-full bg-slate-900 px-2 py-1 text-white">Titulná zoznamu</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={setSchoolPhotoCover.bind(null, school.id, school.slug, photo.id, "detail")}>
                    <button className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">Titulná detailu</button>
                  </form>
                  <form action={setSchoolPhotoCover.bind(null, school.id, school.slug, photo.id, "list")}>
                    <button className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">Titulná zoznamu</button>
                  </form>
                  <form action={deleteSchoolPhoto.bind(null, school.id, school.slug, photo.id)}>
                    <button className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">Zmazať</button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>

        <form action={addSchoolPhoto.bind(null, school.id, school.slug)} className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-dashed border-slate-300 p-4 sm:grid-cols-2">
          <div>
            <label className={label}>URL fotky</label>
            <input name="url" type="url" required placeholder="https://…" className={input} />
          </div>
          <div>
            <label className={label}>Popis fotky (nepovinné)</label>
            <input name="alt" placeholder="Žiaci v laboratóriu" className={input} />
          </div>
          <div className="sm:col-span-2">
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">Pridať fotku</button>
          </div>
        </form>
      </section>

      {/* ============ PODOBNÉ ŠKOLY (len staff) ============ */}
      {isAdmin && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Podobné školy</h2>
          <p className="mb-4 text-xs text-slate-500">Vyber najviac 3 školy, ktoré sa zobrazia na konci verejného detailu.</p>
          <form action={saveSimilarSchools.bind(null, school.id, school.slug)}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {allSchools.map((candidate) => (
                <label key={candidate.id} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    name="similarSchools"
                    value={candidate.id}
                    defaultChecked={school.similarTo.some((item) => item.id === candidate.id)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {candidate.name} <span className="text-slate-400">· {candidate.city}</span>
                </label>
              ))}
            </div>
            <button className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">Uložiť podobné školy</button>
          </form>
        </section>
      )}

      {/* ============ ODBORY ============ */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Odbory</h2>
        <p className="mb-4 text-xs text-slate-500">
          Čísla „prijíma / prihlásených v lani / miest“ sú tie, čo sa v karte zobrazujú namiesto „???“.
        </p>

        <div className="space-y-3">
          {school.odbory.map((o) => (
            <div key={o.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <form
                action={updateOdbor.bind(null, school.id, school.slug, o.id)}
                className="grid grid-cols-2 gap-3 sm:grid-cols-7"
              >
                <div className="col-span-2">
                  <label className={label}>Kód</label>
                  <input name="code" defaultValue={o.code} className={input} />
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <label className={label}>Názov odboru</label>
                  <input name="name" defaultValue={o.name} className={input} />
                </div>
                <div>
                  <label className={label}>Dĺžka (roky)</label>
                  <input name="length" type="number" defaultValue={o.length} className={input} />
                </div>
                <div>
                  <label className={label}>Ukončenie</label>
                  <select name="completion" defaultValue={o.completion} className={input}>
                    {COMPLETION_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label}>Prijíma (žiakov)</label>
                  <input name="accepts" type="number" defaultValue={o.accepts ?? ""} className={input} />
                </div>
                <div>
                  <label className={label}>Vlani na 1 miesto</label>
                  <input name="appliedLastYear" type="number" defaultValue={o.appliedLastYear ?? ""} className={input} />
                </div>
                <div>
                  <label className={label}>Počet miest</label>
                  <input name="places" type="number" defaultValue={o.places ?? ""} className={input} />
                </div>
                <div className="col-span-2 sm:col-span-4">
                  <label className={label}>Uplatnenie („Uplatníš sa ako…“)</label>
                  <input name="employment" defaultValue={o.employment ?? ""} className={input} />
                </div>
                <div className="col-span-2 flex items-end gap-2 sm:col-span-3">
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                  >
                    Uložiť
                  </button>
                  <button
                    formAction={deleteOdbor.bind(null, school.id, school.slug, o.id)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Zmazať
                  </button>
                </div>
              </form>
            </div>
          ))}
        </div>

        <form
          action={addOdbor.bind(null, school.id, school.slug)}
          className="mt-4 rounded-lg border border-dashed border-slate-300 p-4"
        >
          <div className="mb-3 text-sm font-medium text-slate-700">Pridať odbor</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div>
              <label className={label}>Kód</label>
              <input name="code" placeholder="7902 J" className={input} />
            </div>
            <div className="col-span-2">
              <label className={label}>Názov odboru</label>
              <input name="name" className={input} />
            </div>
            <div>
              <label className={label}>Dĺžka</label>
              <input name="length" type="number" defaultValue={4} className={input} />
            </div>
            <div>
              <label className={label}>Ukončenie</label>
              <select name="completion" defaultValue="MATURITA" className={input}>
                {COMPLETION_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Prijíma</label>
              <input name="accepts" type="number" className={input} />
            </div>
            <div>
              <label className={label}>Vlani na 1 miesto</label>
              <input name="appliedLastYear" type="number" className={input} />
            </div>
            <div>
              <label className={label}>Počet miest</label>
              <input name="places" type="number" className={input} />
            </div>
            <div className="col-span-2">
              <label className={label}>Uplatnenie</label>
              <input name="employment" className={input} />
            </div>
          </div>
          <button
            type="submit"
            className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Pridať odbor
          </button>
        </form>
      </section>

      {/* ============ DEŇ OTVORENÝCH DVERÍ ============ */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Deň otvorených dverí</h2>
        <form action={saveDod.bind(null, school.id, school.slug)} className="flex flex-wrap items-end gap-3">
          <div>
            <label className={label}>Dátum</label>
            <input name="date" type="date" defaultValue={dod ? fmtDate(dod.date) : ""} className={input} />
          </div>
          <div>
            <label className={label}>Čas</label>
            <input name="time" defaultValue={dod?.time ?? ""} placeholder="8:00 - 12:00" className={input} />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Uložiť termín
          </button>
        </form>
      </section>

      {/* ============ NA STIAHNUTIE ============ */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Na stiahnutie</h2>
        <ul className="mb-4 space-y-2">
          {school.downloads.length === 0 && (
            <li className="text-sm text-slate-400">Žiadne súbory.</li>
          )}
          {school.downloads.map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-800">{d.title}</div>
                <div className="truncate text-xs text-slate-400">{d.fileUrl}</div>
              </div>
              <form action={deleteDownload.bind(null, school.id, school.slug, d.id)}>
                <button className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50">
                  Zmazať
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addDownload.bind(null, school.id, school.slug)} className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className={label}>Názov súboru</label>
            <input name="title" placeholder="Kritériá prijatia 2026/2027" className={input} />
          </div>
          <div>
            <label className={label}>URL</label>
            <input name="fileUrl" placeholder="https://…" className={input} />
          </div>
          <div>
            <label className={label}>&nbsp;</label>
            <button className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Pridať
            </button>
          </div>
        </form>
      </section>

      {/* ============ BADGE (len ADMIN/SCHOLSTVO) ============ */}
      {isAdmin && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Badge (do karty)</h2>
          <ul className="mb-4 space-y-2">
            {school.badges.length === 0 && (
              <li className="text-sm text-slate-400">Žiadne badge.</li>
            )}
            {school.badges.map((b) => (
              <li key={b.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <div className="text-sm">
                  <span className="font-medium text-slate-800">{b.label}</span>
                  <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{b.kind}</span>
                  {b.note && <span className="ml-2 text-xs text-slate-400">— {b.note}</span>}
                </div>
                <form action={deleteBadge.bind(null, school.id, school.slug, b.id)}>
                  <button className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50">
                    Zmazať
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <form action={addBadge.bind(null, school.id, school.slug)} className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className={label}>Text badge</label>
              <input name="label" placeholder="Voľné miesta" className={input} />
            </div>
            <div>
              <label className={label}>Farba</label>
              <select name="kind" defaultValue="ok" className={input}>
                {BADGE_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Poznámka</label>
              <input name="note" className={input} />
            </div>
            <div>
              <label className={label}>&nbsp;</label>
              <button className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
                Pridať
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
