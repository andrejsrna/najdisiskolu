import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { addTag, deleteTag, updateTag } from "@/lib/admin-actions";
import { SaveButton, DeleteButton } from "@/components/admin-buttons";

const input =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
const label = "mb-1 block text-xs font-medium text-slate-600";

export default async function TagyPage() {
  const user = await requireUser();
  if (user.role !== Role.ADMIN && user.role !== Role.SCHOLSTVO) redirect("/admin");

  const tags = await prisma.tag.findMany({
    include: { _count: { select: { schools: true } } },
    orderBy: { label: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Tagy (zameranie)</h1>
        <p className="text-sm text-slate-500">
          Používajú sa na filtrovanie a vyhľadávanie na homepage.
        </p>
      </div>

      <form
        action={addTag}
        className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div>
          <label className={label}>Kód (bez diakritiky)</label>
          <input name="code" placeholder="napr. gym, tech, it" className={input} />
        </div>
        <div>
          <label className={label}>Popis</label>
          <input name="label" placeholder="Gymnáziá a všeobecné vzdelanie" className={input} />
        </div>
        <div className="col-span-2">
          <SaveButton className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Pridať tag
          </SaveButton>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Kód</th>
              <th className="px-4 py-2.5 font-medium">Popis</th>
              <th className="px-4 py-2.5 text-right font-medium">Škôl</th>
              <th className="px-4 py-2.5" />
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tags.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-2 py-1.5">
                  <form id={`tag-form-${t.id}`} action={updateTag.bind(null, t.id)}>
                    <input
                      name="code"
                      defaultValue={t.code}
                      className="w-full rounded border border-transparent bg-transparent px-2 py-1 font-mono text-xs text-slate-700 hover:border-slate-200 focus:border-slate-400 focus:bg-white focus:outline-none"
                    />
                  </form>
                </td>
                <td className="px-2 py-1.5">
                  <input
                    name="label"
                    form={`tag-form-${t.id}`}
                    defaultValue={t.label}
                    className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-slate-800 hover:border-slate-200 focus:border-slate-400 focus:bg-white focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2.5 text-right text-slate-600">{t._count.schools}</td>
                <td className="px-2 py-1.5 text-right">
                  <button
                    type="submit"
                    form={`tag-form-${t.id}`}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Uložiť
                  </button>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <form action={deleteTag.bind(null, t.id)}>
                    <DeleteButton message="Naozaj zmazať tento tag?" />
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
