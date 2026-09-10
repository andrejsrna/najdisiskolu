import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { saveSettings } from "@/lib/admin-actions";

const input =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
const label = "mb-1 block text-xs font-medium text-slate-600";

export default async function NastaveniaPage() {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) redirect("/admin");

  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const get = (k: string, d: unknown): unknown => map.get(k) ?? d;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Nastavenia</h1>
        <p className="text-sm text-slate-500">Hero sekcia a štatistiky na homepage.</p>
      </div>

      <form
        action={saveSettings}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-5"
      >
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
              <label className={label}>URL videa alebo fotky</label>
              <input
                name="heroMediaUrl"
                type="url"
                defaultValue={String(get("hero.mediaUrl", ""))}
                placeholder="https://… (prázdne = pôvodné /hero.mp4)"
                className={input}
              />
              <p className="mt-1 text-xs text-slate-400">
                Vlož verejnú URL súboru. Pri videu odporúčame MP4, pri fotke široký formát aspoň 1920 × 1080 px.
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
          <div className="mb-2 text-sm font-semibold text-slate-900">
            Štatistiky (4 čísla v riadku)
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={label}>Škôl</label>
              <input name="credSchools" type="number" defaultValue={String(get("cred.schools", 44))} className={input} />
            </div>
            <div>
              <label className={label}>Odborov</label>
              <input name="credPrograms" type="number" defaultValue={String(get("cred.programs", 126))} className={input} />
            </div>
            <div>
              <label className={label}>Voľných miest</label>
              <input name="credPlaces" type="number" defaultValue={String(get("cred.places", 4403))} className={input} />
            </div>
            <div>
              <label className={label}>Žiakov v duáli</label>
              <input name="credDual" type="number" defaultValue={String(get("cred.dual", 911))} className={input} />
            </div>
          </div>
        </div>

        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          Uložiť nastavenia
        </button>
      </form>
    </div>
  );
}
