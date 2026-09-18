import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { saveReview, deleteReview } from "@/lib/admin-actions";
import { SaveButton, DeleteButton } from "@/components/admin-buttons";

const input =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
const label = "mb-1 block text-xs font-medium text-slate-600";

export const dynamic = "force-dynamic";

export default async function RecenziePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await requireUser();
  if (user.role !== Role.ADMIN && user.role !== Role.SCHOLSTVO) redirect("/admin");

  const { edit } = await searchParams;
  const editing = edit ? await prisma.review.findUnique({ where: { id: edit } }) : null;

  const reviews = await prisma.review.findMany({
    include: { school: { select: { name: true } } },
    orderBy: { sort: "asc" },
  });
  const schools = await prisma.school.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Recenzie — Moja stredná je super</h1>
        <p className="text-sm text-slate-500">
          Príbehy žiakov a absolventov, ktoré sa zobrazujú na domovskej stránke.
        </p>
      </div>

      <form
        action={saveReview}
        className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">
            {editing ? "Upraviť príbeh" : "Nový príbeh"}
          </div>
          {editing && (
            <a href="/admin/recenzie" className="text-sm text-slate-500 hover:text-slate-900">
              Zrušiť úpravu
            </a>
          )}
        </div>
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Meno autora</label>
            <input name="name" required defaultValue={editing?.name ?? ""} className={input} />
          </div>
          <div>
            <label className={label}>Vek / ročník</label>
            <input name="age" defaultValue={editing?.age ?? ""} className={input} />
          </div>
        </div>
        <div>
          <label className={label}>Nadpis príbehu (titulok karty)</label>
          <input name="title" defaultValue={editing?.title ?? ""} className={input} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Škola</label>
            <select name="schoolId" defaultValue={editing?.schoolId ?? ""} className={input}>
              <option value="">— žiadna —</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Poradie (menšie = skôr)</label>
            <input
              name="sort"
              type="number"
              defaultValue={editing?.sort ?? reviews.length}
              className={input}
            />
          </div>
        </div>

        <div>
          <label className={label}>Citát / text</label>
          <textarea
            name="quote"
            rows={4}
            defaultValue={editing?.quote ?? ""}
            className={input}
          />
        </div>
        <div>
          <label className={label}>Portrét (URL)</label>
          <input name="photoUrl" defaultValue={editing?.photoUrl ?? ""} className={input} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="published"
            defaultChecked={editing?.published ?? true}
            className="h-4 w-4 rounded border-slate-300"
          />
          Zverejnené
        </label>
        <SaveButton className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          {editing ? "Uložiť zmeny" : "Vytvoriť príbeh"}
        </SaveButton>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Autor</th>
              <th className="px-4 py-2.5 font-medium">Škola</th>
              <th className="px-4 py-2.5 font-medium">Citát</th>
              <th className="px-4 py-2.5 font-medium">Stav</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reviews.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Žiadne príbehy.
                </td>
              </tr>
            )}
            {reviews.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <a
                    href={`/admin/recenzie?edit=${r.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {r.name}
                    {r.age ? `, ${r.age}` : ""}
                  </a>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{r.school?.name ?? "—"}</td>
                <td className="px-4 py-2.5 text-slate-500">
                  {r.quote.length > 60 ? r.quote.slice(0, 60) + "…" : r.quote}
                </td>
                <td className="px-4 py-2.5">
                  {r.published ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      zverejnené
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      koncept
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <form action={deleteReview.bind(null, r.id)}>
                    <DeleteButton message="Naozaj zmazať tento príbeh?" />
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