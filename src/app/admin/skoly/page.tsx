import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";
import { SearchBox } from "./SearchBox";

export default async function SchoolsPage() {
  const user = await requireUser();

  // SKOLA vidí len svoju školu — presmeruj na ňu
  if (user.role === Role.SKOLA) {
    const own = await prisma.school.findUnique({ where: { id: user.schoolId ?? "" } });
    if (own) redirect(`/admin/skoly/${own.slug}`);
    redirect("/admin");
  }

  const schools = await prisma.school.findMany({
    include: {
      tags: { orderBy: { code: "asc" } },
      _count: { select: { odbory: true } },
    },
    orderBy: { name: "asc" },
  });

  const stats = [
    { label: "Škôl", value: schools.length },
    { label: "Odborov", value: schools.reduce((a, s) => a + s._count.odbory, 0) },
    { label: "Kompletných", value: schools.filter((s) => s.isComplete).length },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Školy</h1>
        <p className="text-sm text-slate-500">{schools.length} škôl · kliknutím na názov otvoríš editáciu.</p>
      </div>

      {/* pás so súhrnnými číslami */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="mt-0.5 text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <SearchBox />

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Názov</th>
              <th className="px-4 py-2.5 font-medium">Okres</th>
              <th className="px-4 py-2.5 font-medium">Zameranie</th>
              <th className="px-4 py-2.5 text-right font-medium">Odborov</th>
              <th className="px-4 py-2.5 text-right font-medium">Stav</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {schools.map((s) => (
              <tr key={s.id} data-name={`${s.name} ${s.city}`.toLowerCase()} className="hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/skoly/${s.slug}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {s.name} <span className="font-normal text-slate-500">{s.city}</span>
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{s.district}</td>
                <td className="px-4 py-2.5 text-slate-600">
                  {s.tags.map((t) => t.code).join(", ") || "—"}
                </td>
                <td className="px-4 py-2.5 text-right text-slate-600">{s._count.odbory}</td>
                <td className="px-4 py-2.5 text-right">
                  {s.isComplete ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      kompletný
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      neúplný
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
