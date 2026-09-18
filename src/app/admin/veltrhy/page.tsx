import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { addVeltrh, deleteVeltrh, setVeltrhSchools } from "@/lib/admin-actions";
import { SaveButton, DeleteButton } from "@/components/admin-buttons";

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
              <form action={setVeltrhSchools.bind(null, v.id)} className="mt-3">
                <div className="max-h-60 overflow-auto rounded-lg border border-slate-200 p-3">
                  {schools.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 py-0.5 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        name="schools"
                        value={s.id}
                        defaultChecked={v.schools.some((vs) => vs.id === s.id)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
                <SaveButton savedLabel="Školy uložené ✓" className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
                  Uložiť výber škôl
                </SaveButton>
              </form>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
