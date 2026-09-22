import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { addVeltrh, deleteVeltrh, saveVeltrhySections } from "@/lib/admin-actions";
import { SaveButton, DeleteButton } from "@/components/admin-buttons";
import { VeltrhSchoolsPicker } from "./VeltrhSchoolsPicker";
import {
  VELTRHY_SECTIONS_DEFAULT,
  VELTRHY_SECTIONS_KEY,
  type VeltrhySections,
} from "@/lib/veltrhy-content";

const input =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
const label = "mb-1 block text-xs font-medium text-slate-600";

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function VeltrhyPage() {
  const user = await requireUser();
  if (user.role !== Role.ADMIN && user.role !== Role.SCHOLSTVO) redirect("/admin");

  const veltrhy = await prisma.veltrh.findMany({
    include: { schools: { select: { id: true, name: true }, orderBy: { name: "asc" } } },
    orderBy: { date: "asc" },
  });
  const schools = await prisma.school.findMany({ orderBy: { name: "asc" } });
  const setting = await prisma.setting.findUnique({ where: { key: VELTRHY_SECTIONS_KEY } });
  const stored = (setting?.value ?? {}) as Partial<VeltrhySections>;
  const sections: VeltrhySections = {
    lead: stored.lead ?? VELTRHY_SECTIONS_DEFAULT.lead,
    whatCells: stored.whatCells?.length ? stored.whatCells : VELTRHY_SECTIONS_DEFAULT.whatCells,
    tipsIntro: stored.tipsIntro ?? VELTRHY_SECTIONS_DEFAULT.tipsIntro,
    tipsCells: stored.tipsCells?.length ? stored.tipsCells : VELTRHY_SECTIONS_DEFAULT.tipsCells,
    dodIntro: stored.dodIntro ?? VELTRHY_SECTIONS_DEFAULT.dodIntro,
    helpHeading: stored.helpHeading ?? VELTRHY_SECTIONS_DEFAULT.helpHeading,
    helpText: stored.helpText ?? VELTRHY_SECTIONS_DEFAULT.helpText,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Veľtrhy škôl</h1>
        <p className="text-sm text-slate-500">
          Dátum, čas, miesto a popis. Školy s vyplneným profilom sa zobrazia v zozname.
        </p>
      </div>

      <form
        action={addVeltrh}
        className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3"
      >
        <div>
          <label className={label}>Mesto</label>
          <input name="city" placeholder="Trnava" className={input} />
        </div>
        <div>
          <label className={label}>Dátum</label>
          <input name="date" type="date" className={input} />
        </div>
        <div>
          <label className={label}>Čas</label>
          <input name="time" placeholder="8:00 - 17:00" className={input} />
        </div>
        <div>
          <label className={label}>Miesto</label>
          <input name="place" placeholder="Športová hala" className={input} />
        </div>
        <div className="col-span-2">
          <label className={label}>Adresa</label>
          <input name="address" placeholder="Rybníková 15, Trnava" className={input} />
        </div>
        <div className="col-span-3">
          <label className={label}>Popis</label>
          <textarea name="description" rows={2} className={input} />
        </div>
        <div className="col-span-3">
          <label className={label}>Sprievodné podujatie (voliteľné)</label>
          <input name="extra" className={input} />
        </div>
        <div className="col-span-3">
          <SaveButton className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Pridať veľtrh
          </SaveButton>
        </div>
      </form>

      <div className="space-y-4">
        {veltrhy.map((v) => (
          <div key={v.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold text-slate-900">
                  {v.city} · {v.place}
                </div>
                <div className="text-sm text-slate-600">
                  {fmtDate(v.date)} · {v.time}
                </div>
                <div className="text-sm text-slate-500">{v.address}</div>
                {v.description && <p className="mt-1 text-sm text-slate-600">{v.description}</p>}
                {v.extra && <p className="mt-1 text-xs text-slate-400">{v.extra}</p>}
              </div>
              <form action={deleteVeltrh.bind(null, v.id)}>
                <DeleteButton message="Naozaj zmazať tento veľtrh?" />
              </form>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-700">
                Školy na tomto veľtrhu ({v.schools.length})
              </summary>
              <VeltrhSchoolsPicker
                veltrhId={v.id}
                schools={schools.map((s) => ({ id: s.id, name: s.name }))}
                initialSelected={v.schools.map((vs) => vs.id)}
              />
            </details>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Karty na stránke Veľtrhy</h2>
        <p className="mb-4 text-sm text-slate-500">
          Statické texty na verejnej stránke <code>/veltrhy</code> — úvod, karty „Čo tam na teba
          čaká“ a „Ako z toho vyťažiť čo najviac“, a box na konci stránky. Jedna položka na riadok.
        </p>
        <form action={saveVeltrhySections} className="space-y-4">
          <div>
            <label className={label}>Úvodný text (pod nadpisom „Veľtrhy škôl“)</label>
            <textarea name="lead" defaultValue={sections.lead} rows={3} className={input} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>„Čo tam na teba čaká“ — karty (jedna na riadok)</label>
              <textarea
                name="whatCells"
                defaultValue={sections.whatCells.join("\n")}
                rows={6}
                className={input}
              />
            </div>
            <div>
              <label className={label}>„Ako z toho vyťažiť čo najviac“ — karty (jedna na riadok)</label>
              <textarea
                name="tipsCells"
                defaultValue={sections.tipsCells.join("\n")}
                rows={6}
                className={input}
              />
            </div>
          </div>

          <div>
            <label className={label}>Úvod k tipom (nad kartami vyššie vpravo)</label>
            <textarea name="tipsIntro" defaultValue={sections.tipsIntro} rows={2} className={input} />
          </div>

          <div>
            <label className={label}>Úvod k dňom otvorených dverí</label>
            <textarea name="dodIntro" defaultValue={sections.dodIntro} rows={2} className={input} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Nadpis pomocného boxu na konci stránky</label>
              <input name="helpHeading" defaultValue={sections.helpHeading} className={input} />
            </div>
            <div>
              <label className={label}>Text pomocného boxu</label>
              <input name="helpText" defaultValue={sections.helpText} className={input} />
            </div>
          </div>

          <SaveButton className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Uložiť karty
          </SaveButton>
        </form>
      </div>
    </div>
  );
}
