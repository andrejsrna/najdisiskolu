import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import {
  DISTRICTS,
  COMPLETION_OPTIONS,
  LANGUAGE_OPTIONS,
  ACCESSIBILITY_OPTIONS,
  ERASMUS_OPTIONS,
  INTERNAT_OPTIONS,
} from "@/lib/constants";
import { PhotoReorder } from "./PhotoReorder";
import { PhotoUpload } from "./PhotoUpload";
import { SimilarSchoolsPicker } from "./SimilarSchoolsPicker";
import { TagListEditor } from "./TagListEditor";
import { OdborReorder } from "./OdborReorder";
import { SaveButton, DeleteButton } from "@/components/admin-buttons";
import {
  updateSchoolBasic,
  addOdbor,
  updateOdbor,
  deleteOdbor,
  addDod,
  updateDod,
  deleteDod,
  addDownload,
  deleteDownload,
  addProject,
  updateProject,
  deleteProject,
} from "@/lib/school-actions";

const input =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
const label = "mb-1 block text-xs font-medium text-slate-600";

const INEKO_CATEGORIES = [
  "zo všetkých škôl",
  "z gymnázií",
  "z odborných škôl",
  "zo športových škôl",
  "z hotelových akadémií",
  "z umeleckých škôl",
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
      dods: { orderBy: { date: "asc" } },
      downloads: { orderBy: { sort: "asc" } },
      projects: { orderBy: { sort: "asc" } },
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
        <a
          href={`/skola/${school.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Zobraziť školu na stránke ↗
        </a>
      </div>

      {/*
        Poradie sekcií nižšie kopíruje tok verejného detailu školy zhora nadol:
        Základné údaje (hlavička + rýchly prehľad) → Deň otvorených dverí (bočný panel hore) →
        Odbory → Projekty → Fotogaléria → Podobné školy → Na stiahnutie (bočný panel dole).
        Všetky polia „Základných údajov“ zostávajú v jednom formulári/jednom uložení —
        vnútri sú len preusporiadané podľa toho, v akom poradí sa rovnaké údaje objavujú na fronte.
      */}

      {/* ============ ZÁKLADNÉ ÚDAJE ============ */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Základné údaje</h2>
        <form action={updateSchoolBasic.bind(null, school.id, school.slug)} className="space-y-6">
          {/* Identifikácia — zodpovedá nadpisu a podnadpisu na detaile */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>

          {/* Rýchly prehľad + tagy — zodpovedá bočnému panelu „Rýchly prehľad“ a tagom pod nadpisom */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Rýchly prehľad a tagy</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>INEKO — poradie v kraji</label>
                <div className="flex gap-2">
                  <input name="inekoKrajRank" type="number" min={1} defaultValue={school.inekoKrajRank ?? ""} placeholder="poradie" className={input} />
                  <select name="inekoKrajOf" defaultValue={school.inekoKrajOf ?? "zo všetkých škôl"} className={input}>
                    {INEKO_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={label}>INEKO — poradie na Slovensku</label>
                <div className="flex gap-2">
                  <input name="inekoSkRank" type="number" min={1} defaultValue={school.inekoSkRank ?? ""} placeholder="poradie" className={input} />
                  <select name="inekoSkOf" defaultValue={school.inekoSkOf ?? "zo všetkých škôl"} className={input}>
                    {INEKO_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={label}>Celkovo žiakov</label>
                <input name="totalStudents" defaultValue={school.totalStudents ?? ""} placeholder="napr. približne 550" className={input} />
              </div>
              <div>
                <label className={label}>Bezbariérovosť</label>
                <select name="accessibility" defaultValue={school.accessibility ?? "Nie"} className={input}>
                  {ACCESSIBILITY_OPTIONS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Internát — typ</label>
                <select name="internatType" defaultValue={school.internatType ?? ""} className={input}>
                  <option value="">— žiadny —</option>
                  {INTERNAT_OPTIONS.map((i) => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Ubytovanie — doplnkový popis</label>
                <input name="internatInfo" defaultValue={school.internatInfo ?? ""} placeholder="napr. na internáte SOŠ v areáli" className={input} />
              </div>
            </div>

            <div className="mt-4">
              <label className={label}>Highlighty školy (zobrazujú sa v Rýchlom prehľade aj v tagoch)</label>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {[
                  ["hasMaturita", "maturita"],
                  ["hasVl", "výučný list"],
                  ["hasInternat", "internát"],
                  ["hasCanteen", "jedáleň"],
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

            <div className="mt-4">
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

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Cudzie jazyky (čiarkou)</label>
                <input name="foreignLanguages" defaultValue={school.foreignLanguages.join(", ")} placeholder="anglický, nemecký, francúzsky" className={input} />
              </div>
              <div>
                <label className={label}>Podporný tím (čiarkou)</label>
                <input name="supportTeam" defaultValue={school.supportTeam.join(", ")} placeholder="školský psychológ, kariérny poradca" className={input} />
              </div>
            </div>

            <div className="mt-4">
              <label className={label}>Zameranie školy</label>
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
          </div>

          {/* O škole */}
          <div>
            <label className={label}>Predstavenie školy (sekcia „O škole“)</label>
            <textarea name="intro" defaultValue={school.intro ?? ""} rows={4} className={input} />
          </div>

          {/* Prečo práve sem */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Prečo práve sem</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={label}>Prečo práve sem (jeden dôvod na riadok)</label>
                <textarea name="whyUs" defaultValue={school.whyUs.join("\n")} rows={4} className={input} placeholder={"Moderné odborné učebne\nIndividuálny prístup"} />
              </div>
              <div>
                <label className={label}>Kurzy a certifikáty (čiarkou)</label>
                <input name="certificates" defaultValue={school.certificates.join(", ")} className={input} />
              </div>
              <div>
                <label className={label}>Krúžky (čiarkou)</label>
                <input name="clubs" defaultValue={school.clubs.join(", ")} className={input} />
              </div>
            </div>
          </div>

          {/* Erasmus+ */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Erasmus+</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={label}>Erasmus+ krajiny (CTRL+klik pre viac; nechaj prázdne ak žiadne)</label>
                <select name="erasmusCountries" multiple defaultValue={school.erasmusCountries as string[]} className={input} size={5}>
                  {ERASMUS_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Erasmus+ — doplnkový text (nepovinné)</label>
                <textarea name="erasmus" defaultValue={school.erasmus ?? ""} rows={3} className={input} />
              </div>
            </div>
          </div>

          {/* Partnerstvá a spolupráce */}
          <div>
            <label className={label}>Partnerstvá a spolupráce</label>
            <textarea name="partners" defaultValue={school.partners ?? ""} rows={3} className={input} />
          </div>

          {/* Duálne vzdelávanie */}
          <div>
            <label className={label}>Zamestnávatelia v duáli</label>
            <TagListEditor
              name="dualCompanies"
              initialItems={school.dualCompanies}
              placeholder="Napíš názov firmy a stlač Enter…"
            />
          </div>
          <div>
            <label className={label}>Praktické vyučovanie (nepovinné)</label>
            <textarea name="practice" defaultValue={school.practice ?? ""} rows={2} className={input} placeholder="kde prebieha odborná prax" />
          </div>
          <div>
            <label className={label}>Duálne vzdelávanie — info (nepovinné)</label>
            <textarea name="dualInfo" defaultValue={school.dualInfo ?? ""} rows={2} className={input} placeholder="doplnkový text o duáli" />
          </div>

          {/* Priestory a vybavenie */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Priestory a vybavenie</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={label}>Priestory a vybavenie (popis)</label>
                <textarea name="modernization" defaultValue={school.modernization ?? ""} rows={3} className={input} />
              </div>
              <div>
                <label className={label}>Športoviská (čiarkou)</label>
                <input name="sports" defaultValue={school.sports.join(", ")} className={input} placeholder="telocvičňa, ihrisko" />
              </div>
              <div>
                <label className={label}>Ponuka školského bufetu (čiarkou)</label>
                <input name="canteenOptions" defaultValue={school.canteenOptions.join(", ")} className={input} placeholder="školská jedáleň, bufet" />
              </div>
            </div>
          </div>

          {/* Úspechy žiakov */}
          <div>
            <label className={label}>Úspechy žiakov (nepovinné)</label>
            <textarea name="achievements" defaultValue={school.achievements ?? ""} rows={2} className={input} />
          </div>

          {/* Čo po škole? */}
          <div>
            <label className={label}>Čo po škole?</label>
            <textarea name="graduates" defaultValue={school.graduates ?? ""} rows={3} className={input} placeholder="Kde sa absolventi uplatnia alebo pokračujú v štúdiu." />
          </div>

          {/* Kontakt a sídlo — zodpovedá sekcii „Kde škola sídli“ na konci detailu */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Kontakt a sídlo</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Weby školy (jeden na riadok, bez https://)</label>
                <textarea
                  name="websites"
                  defaultValue={(school.websites ?? []).join("\n")}
                  rows={2}
                  placeholder={"www.skola.sk\nwww.druhyweb.sk"}
                  className={input}
                />
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
                <label className={label}>Facebook (napr. facebook.com/skola)</label>
                <input name="facebook" defaultValue={school.facebook ?? ""} placeholder="facebook.com/skola" className={input} />
              </div>
              <div>
                <label className={label}>Instagram (handle bez @, napr. skola.tt)</label>
                <input name="instagram" defaultValue={school.instagram ?? ""} placeholder="skola.tt" className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Adresa</label>
                <input name="address" defaultValue={school.address ?? ""} className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Mapa (iframe embed URL)</label>
                <input name="mapUrl" defaultValue={school.mapUrl ?? ""} placeholder="https://www.openstreetmap.org/export/embed.html?…" className={input} />
              </div>
            </div>
          </div>

          <div>
            <SaveButton className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Uložiť základné údaje
            </SaveButton>
          </div>
        </form>
      </section>

      {/* ============ DNI OTVORENÝCH DVERÍ (bočný panel hore) ============ */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Dni otvorených dverí</h2>
        <div className="space-y-3">
          {school.dods.length === 0 && (
            <p className="text-sm text-slate-400">Žiadne termíny.</p>
          )}
          {school.dods.map((d) => (
            <form
              key={d.id}
              action={updateDod.bind(null, school.id, school.slug, d.id)}
              className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <div>
                <label className={label}>Dátum</label>
                <input name="date" type="date" defaultValue={fmtDate(d.date)} className={input} />
              </div>
              <div>
                <label className={label}>Čas</label>
                <input name="time" defaultValue={d.time ?? ""} placeholder="8:00 - 12:00" className={input} />
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className={label}>Poznámka (voliteľné)</label>
                <input name="note" defaultValue={d.note ?? ""} placeholder="napr. len pre 9. ročník" className={input} />
              </div>
              <div className="flex gap-2">
                <SaveButton className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">
                  Uložiť
                </SaveButton>
                <DeleteButton
                  formAction={deleteDod.bind(null, school.id, school.slug, d.id)}
                  message="Naozaj zmazať tento termín DOD?"
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                />
              </div>
            </form>
          ))}
        </div>
        <form
          action={addDod.bind(null, school.id, school.slug)}
          className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-slate-300 p-4"
        >
          <div className="mb-1 w-full text-sm font-medium text-slate-700">Pridať termín</div>
          <div>
            <label className={label}>Dátum</label>
            <input name="date" type="date" className={input} />
          </div>
          <div>
            <label className={label}>Čas</label>
            <input name="time" placeholder="8:00 - 12:00" className={input} />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className={label}>Poznámka (voliteľné)</label>
            <input name="note" placeholder="napr. len pre 9. ročník" className={input} />
          </div>
          <SaveButton className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Pridať termín
          </SaveButton>
        </form>
      </section>

      {/* ============ ODBORY ============ */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Odbory</h2>
        <p className="mb-4 text-xs text-slate-500">
          Čísla „prijíma / prihlásených v lani / miest“ sú tie, čo sa v karte zobrazujú namiesto „???“.
        </p>

        <OdborReorder
          schoolId={school.id}
          slug={school.slug}
          odbory={school.odbory.map((o) => ({ id: o.id, code: o.code, name: o.name }))}
        />

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
                  <label className={label}>Uchádzačov vlani</label>
                  <input name="appliedLastYear" type="number" defaultValue={o.appliedLastYear ?? ""} className={input} />
                </div>
                <div>
                  <label className={label}>Počet miest vlani</label>
                  <input name="places" type="number" defaultValue={o.places ?? ""} className={input} />
                </div>
                <div className="col-span-2 sm:col-span-4">
                  <label className={label}>Uplatnenie („Uplatníš sa ako…“)</label>
                  <input name="employment" defaultValue={o.employment ?? ""} className={input} />
                </div>
                <div className="col-span-2 flex items-end gap-2 sm:col-span-3">
                  <SaveButton className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">
                    Uložiť
                  </SaveButton>
                  <DeleteButton
                    formAction={deleteOdbor.bind(null, school.id, school.slug, o.id)}
                    message="Naozaj zmazať tento odbor?"
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  />
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
              <label className={label}>Počet miest vlani</label>
              <input name="places" type="number" className={input} />
            </div>
            <div className="col-span-2">
              <label className={label}>Uplatnenie</label>
              <input name="employment" className={input} />
            </div>
          </div>
            <SaveButton className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Pridať odbor
            </SaveButton>
        </form>
      </section>

      {/* ============ PROJEKTY ŠKOLY ============ */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Projekty školy</h2>
        <p className="mb-4 text-xs text-slate-500">Tieto projekty sa zobrazujú na verejnom profile školy.</p>
        <div className="space-y-3">
          {school.projects.map((project) => (
            <form key={project.id} action={updateProject.bind(null, school.id, school.slug, project.id)} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={label}>Názov projektu</label>
                  <input name="title" defaultValue={project.title} className={input} />
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>Popis</label>
                  <textarea name="description" defaultValue={project.description} rows={3} className={input} />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <SaveButton className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">Uložiť</SaveButton>
                <DeleteButton
                  formAction={deleteProject.bind(null, school.id, school.slug, project.id)}
                  message="Naozaj zmazať tento projekt?"
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                />
              </div>
            </form>
          ))}
        </div>
        <form action={addProject.bind(null, school.id, school.slug)} className="mt-4 rounded-lg border border-dashed border-slate-300 p-4">
          <div className="mb-3 text-sm font-medium text-slate-700">Pridať projekt</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={label}>Názov projektu</label>
              <input name="title" className={input} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Popis</label>
              <textarea name="description" rows={3} className={input} />
            </div>
          </div>
          <SaveButton className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">Pridať projekt</SaveButton>
        </form>
      </section>

      {/* ============ FOTOGALÉRIA ============ */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Fotogaléria</h2>
        <p className="mb-4 text-xs text-slate-500">
          Nahraj JPEG, PNG alebo WebP do 10 MB. Označ zvlášť titulnú fotku pre detail a kartu v zozname škôl.
        </p>

        <div className="mt-4">
          <PhotoReorder
            schoolId={school.id}
            slug={school.slug}
            photos={school.photos.map((p) => ({
              id: p.id, url: p.url, alt: p.alt, isDetailCover: p.isDetailCover, isListCover: p.isListCover,
              focalX: p.focalX, focalY: p.focalY,
            }))}
            schoolName={school.name}
          />
        </div>

        <div className="mt-4">
          <PhotoUpload schoolId={school.id} slug={school.slug} />
        </div>
      </section>

      {/* ============ PODOBNÉ ŠKOLY (len staff) ============ */}
      {isAdmin && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Podobné školy</h2>
          <p className="mb-4 text-xs text-slate-500">Vyhľadaj a vyber najviac 3 školy, ktoré sa zobrazia na konci verejného detailu.</p>
          <SimilarSchoolsPicker
            schoolId={school.id}
            slug={school.slug}
            candidates={allSchools}
            initialSelected={school.similarTo.map((item) => item.id)}
          />
        </section>
      )}

      {/* ============ NA STIAHNUTIE (bočný panel dole) ============ */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Na stiahnutie</h2>
        <p className="mb-4 text-xs font-medium text-red-600">
          ⚠️ Tieto súbory (napr. kritériá prijímacieho konania) treba každý rok aktualizovať na aktuálny školský rok!
        </p>
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
                <DeleteButton message="Naozaj zmazať tento súbor zo stiahnutia?" />
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
            <SaveButton className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Pridať
            </SaveButton>
          </div>
        </form>
      </section>

    </div>
  );
}
