import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { addPriestor, deletePriestor } from "@/lib/admin-actions";

const input =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
const label = "mb-1 block text-xs font-medium text-slate-600";

export default async function PriestoryPage() {
  const user = await requireUser();
  if (user.role !== Role.ADMIN && user.role !== Role.SCHOLSTVO) redirect("/admin");

  const priestory = await prisma.priestor.findMany({
    include: { _count: { select: { schools: true } } },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Priestory a vybavenie</h1>
        <p className="text-sm text-slate-500">
          Predvybraté možnosti, z ktorých školy označia, čo majú. Je možné vytvoriť nové.
        </p>
      </div>

      <form
        action={addPriestor}
        className="flex items-end gap-3 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="flex-1">
          <label className={label}>Názov priestoru / vybavenia</label>
          <input name="name" placeholder="napr. telocvičňa, laboratóriá, dielne" className={input} />
        </div>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          Pridať
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Názov</th>
              <th className="px-4 py-2.5 text-right font-medium">Škôl</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {priestory.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-800">
                  {p.name}
                  {p.isDefault && (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
                      predvolené
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right text-slate-600">{p._count.schools}</td>
                <td className="px-4 py-2.5 text-right">
                  <form action={deletePriestor.bind(null, p.id)}>
                    <button className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50">
                      Zmazať
                    </button>
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
