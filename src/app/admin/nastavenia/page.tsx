import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { HeroMediaUpload } from "./HeroMediaUpload";
import { SettingsForm } from "./SettingsForm";

const input =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
const label = "mb-1 block text-xs font-medium text-slate-600";

export default async function NastaveniaPage() {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) redirect("/admin");

  const [rows, schools] = await Promise.all([
    prisma.setting.findMany(),
    prisma.school.findMany({
      where: { isPublished: true },
      select: { hasDual: true, odbory: { select: { code: true, accepts: true } } },
    }),
  ]);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const get = (k: string, d: unknown): unknown => map.get(k) ?? d;

  const autoStats = {
    schools: schools.length,
    programs: new Set(schools.flatMap((s) => s.odbory.map((o) => o.code))).size,
    places: schools.reduce((sum, s) => sum + s.odbory.reduce((a, o) => a + (o.accepts ?? 0), 0), 0),
    dual: schools
      .filter((s) => s.hasDual)
      .reduce((sum, s) => sum + s.odbory.reduce((a, o) => a + (o.accepts ?? 0), 0), 0),
  };
  // Manuálny override existuje len vtedy, keď je v DB explicitne uložený Setting záznam.
  const credSchoolsValue = map.has("cred.schools") ? String(map.get("cred.schools")) : "";
  const credProgramsValue = map.has("cred.programs") ? String(map.get("cred.programs")) : "";
  const credPlacesValue = map.has("cred.places") ? String(map.get("cred.places")) : "";
  const credDualValue = map.has("cred.dual") ? String(map.get("cred.dual")) : "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Nastavenia</h1>
        <p className="text-sm text-slate-500">Hero sekcia a štatistiky na homepage.</p>
      </div>

      <SettingsForm>
        <div>
          <div className="mb-2 text-sm font-semibold text-slate-900">Hero (úvodná sekcia)</div>
          <div className="space-y-3">
            <div>
              <label className={label}>Nadpis</label>
              <input name="heroTitle" defaultValue={String(get("hero.title", ""))} className={input} />
            </div>
            <div>
              <label className={label}>Podnadpis</label>
              <input name="heroSubtitle" defaultValue={String(get("hero.subtitle", ""))} className={input} />
            </div>
            <div>
              <label className={label}>Odkaz (link tlačidla)</label>
              <input name="heroLink" defaultValue={String(get("hero.link", ""))} className={input} />
            </div>
            <div>
              <label className={label}>Typ pozadia</label>
              <select name="heroMediaType" defaultValue={String(get("hero.mediaType", "video"))} className={input}>
                <option value="video">Video</option>
                <option value="image">Fotka</option>
              </select>
            </div>
            <div>
              <label className={label}>Video alebo fotka (nahraj, alebo vlož URL)</label>
              <HeroMediaUpload name="heroMediaUrl" initial={String(get("hero.mediaUrl", ""))} />
              <p className="mt-1 text-xs text-slate-400">
                Pretiahni video (MP4, do 60 MB) alebo fotku (do 10 MB), alebo vlož verejnú URL. Prázdne = pôvodné /hero.mp4.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="heroHidden"
                defaultChecked={Boolean(get("hero.hidden", false))}
                className="h-4 w-4 rounded border-slate-300"
              />
              Skryť hero sekciu
            </label>
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold text-slate-900">Lišta pod hero</div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="timebarEnabled" defaultChecked={Boolean(get("timebar.enabled", true))} className="h-4 w-4 rounded border-slate-300" />
              Zobraziť informačný pruh
            </label>
            <div>
              <label className={label}>Úvod lišty</label>
              <input name="timebarTitle" defaultValue={String(get("timebar.title", "⏱ Prihlášky na stredné školy:"))} className={input} />
            </div>
            <div>
              <label className={label}>Zvýraznený termín (žltý)</label>
              <input name="timebarHighlight" defaultValue={String(get("timebar.highlight", "do 20. februára"))} className={input} />
            </div>
            <div>
              <label className={label}>Klikateľný text</label>
              <input name="timebarLinkText" defaultValue={String(get("timebar.linkText", "Chystáš sa na deň otvorených dverí? Pozri si všetky termíny."))} className={input} />
            </div>
            <div>
              <label className={label}>Aktívny odkaz</label>
              <input name="timebarLinkHref" defaultValue={String(get("timebar.linkHref", "/veltrhy"))} placeholder="/veltrhy alebo https://…" className={input} />
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold text-slate-900">
            Štatistiky (4 čísla v riadku)
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Nechaj pole prázdne = číslo sa automaticky dopočíta z aktuálnych dát škôl (počet škôl, odborov, voľných
            miest a žiakov v duáli). Zadaj číslo = použije sa vždy toto manuálne číslo namiesto výpočtu.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={label}>Škôl</label>
              <input name="credSchools" type="number" placeholder={`auto: ${autoStats.schools}`} defaultValue={credSchoolsValue} className={input} />
            </div>
            <div>
              <label className={label}>Odborov</label>
              <input name="credPrograms" type="number" placeholder={`auto: ${autoStats.programs}`} defaultValue={credProgramsValue} className={input} />
            </div>
            <div>
              <label className={label}>Voľných miest</label>
              <input name="credPlaces" type="number" placeholder={`auto: ${autoStats.places}`} defaultValue={credPlacesValue} className={input} />
            </div>
            <div>
              <label className={label}>Žiakov v duáli</label>
              <input name="credDual" type="number" placeholder={`auto: ${autoStats.dual}`} defaultValue={credDualValue} className={input} />
            </div>
          </div>
        </div>

      </SettingsForm>
    </div>
  );
}
