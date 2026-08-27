import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";

export default async function AdminDashboard() {
  const user = await requireUser();
  const isSchool = user.role === Role.SKOLA;

  const where = isSchool && user.schoolId ? { id: user.schoolId } : {};
  const schools = await prisma.school.findMany({
    where,
    include: {
      tags: { orderBy: { code: "asc" } },
      _count: { select: { odbory: true, projects: true } },
    },
    orderBy: { name: "asc" },
  });

  const totals = isSchool
    ? null
    : {
        skoly: await prisma.school.count(),
        odbory: await prisma.odbor.count(),
        projekty: await prisma.project.count(),
        tagy: await prisma.tag.count(),
      };

  const stats = isSchool
    ? [
        { label: "Moja škola", value: schools.length ? "1" : "0" },
        {
          label: "Odbory",
          value: String(schools.reduce((a, s) => a + s._count.odbory, 0)),
        },
        {
          label: "Projekty",
          value: String(schools.reduce((a, s) => a + s._count.projects, 0)),
        },
      ]
    : [
        { label: "Škôl", value: String(totals!.skoly) },
        { label: "Odborov", value: String(totals!.odbory) },
        { label: "Projektov", value: String(totals!.projekty) },
        { label: "Tagov (zameraní)", value: String(totals!.tagy) },
      ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          {isSchool ? "Moja škola" : "Prehľad"}
        </h1>
        <p className="text-sm text-slate-500">
          {isSchool
            ? "Profil vašej školy — editácia pribudne v ďalšom kroku."
            : "Dáta naimportované z prototypu. Editácia sekcií pribudne ďalej."}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="mt-0.5 text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-900">
          Školy
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Názov</th>
              <th className="px-4 py-2.5 font-medium">Okres</th>
              <th className="px-4 py-2.5 font-medium">Zameranie</th>
              <th className="px-4 py-2.5 text-right font-medium">Odborov</th>
              <th className="px-4 py-2.5 text-right font-medium">Projektov</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {schools.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/skoly/${s.slug}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {s.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{s.district}</td>
                <td className="px-4 py-2.5 text-slate-600">
                  {s.tags.map((t) => t.code).join(", ") || "—"}
                </td>
                <td className="px-4 py-2.5 text-right text-slate-600">{s._count.odbory}</td>
                <td className="px-4 py-2.5 text-right text-slate-600">{s._count.projects}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
