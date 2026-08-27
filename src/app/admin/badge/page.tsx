import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { BADGE_KIND_OPTIONS } from "@/lib/constants";
import { saveBadge, deleteBadge } from "@/lib/admin-actions";

const input =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
const label = "mb-1 block text-xs font-medium text-slate-600";

const KIND_DOT: Record<string, string> = {
  ok: "bg-emerald-400",
  mat: "bg-cyan-300",
  vl: "bg-orange-400",
  term: "bg-pink-600",
};

export const dynamic = "force-dynamic";

export default async function BadgePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await requireUser();
  if (user.role !== Role.ADMIN && user.role !== Role.SCHOLSTVO) redirect("/admin");

  const { edit } = await searchParams;
  const editing = edit ? await prisma.badge.findUnique({ where: { id: edit } }) : null;

  const badges = await prisma.badge.findMany({
    include: { school: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const schools = await prisma.school.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Odznaky na kartách</h1>
        <p className="text-sm text-slate-500">
          Zvýrazňujúce štítky, ktoré sa zobrazujú na kartách škôl (napr. „Voľné miesta&quot;).
        </p>
      </div>

      <form
        action={saveBadge}
        className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">
            {editing ? "Upraviť odznak" : "Nový odznak"}
          </div>
          {editing && (
            <a href="/admin/badge" className="text-sm text-slate-500 hover:text-slate-900">
              Zrušiť úpravu
            </a>
          )}
        </div>
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Škola</label>
            <select
              name="schoolId"
              required
              defaultValue={editing?.schoolId ?? ""}
              className={input}
            >
              <option value="">— vyber školu —</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Farba</label>
            <select name="kind" defaultValue={editing?.kind ?? "ok"} className={input}>
              {BADGE_KIND_OPTIONS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={label}>Text odznaku</label>
          <input name="label" required defaultValue={editing?.label ?? ""} className={input} />
        </div>
        <div>
          <label className={label}>Poznámka (nepovinné)</label>
          <input name="note" defaultValue={editing?.note ?? ""} className={input} />
        </div>

        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          {editing ? "Uložiť zmeny" : "Vytvoriť odznak"}
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Odznak</th>
              <th className="px-4 py-2.5 font-medium">Škola</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {badges.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Žiadne odznaky.
                </td>
              </tr>
            )}
            {badges.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <a
                    href={`/admin/badge?edit=${b.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    <span
                      className={`mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle ${
                        KIND_DOT[b.kind] ?? "bg-emerald-400"
                      }`}
                    />
                    {b.label}
                  </a>
                  {b.note && <div className="text-xs text-slate-400">{b.note}</div>}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{b.school?.name ?? "—"}</td>
                <td className="px-4 py-2.5 text-right">
                  <form action={deleteBadge.bind(null, b.id)}>
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