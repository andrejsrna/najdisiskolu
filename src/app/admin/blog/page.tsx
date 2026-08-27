import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { savePost, deletePost } from "@/lib/admin-actions";

const input =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
const label = "mb-1 block text-xs font-medium text-slate-600";

const TYPE_LABEL: Record<string, string> = {
  SUPER: "Moja stredná je super",
  NEWS: "Dobré správy zo školstva",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await requireUser();
  if (user.role !== Role.ADMIN && user.role !== Role.SCHOLSTVO) redirect("/admin");

  const { edit } = await searchParams;
  const editing = edit ? await prisma.post.findUnique({ where: { id: edit } }) : null;

  const posts = await prisma.post.findMany({
    include: { school: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const schools = await prisma.school.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Blog</h1>
        <p className="text-sm text-slate-500">
          „Dobré správy zo školstva“ a „Moja stredná je super“.
        </p>
      </div>

      <form
        action={savePost}
        className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">
            {editing ? "Upraviť článok" : "Nový článok"}
          </div>
          {editing && (
            <a href="/admin/blog" className="text-sm text-slate-500 hover:text-slate-900">
              Zrušiť úpravu
            </a>
          )}
        </div>
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Typ</label>
            <select name="type" defaultValue={editing?.type ?? "NEWS"} className={input}>
              <option value="NEWS">Dobré správy zo školstva</option>
              <option value="SUPER">Moja stredná je super</option>
            </select>
          </div>
          <div>
            <label className={label}>Škola (len pre „moja stredná je super“)</label>
            <select name="schoolId" defaultValue={editing?.schoolId ?? ""} className={input}>
              <option value="">— žiadna —</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={label}>Nadpis</label>
          <input name="title" defaultValue={editing?.title ?? ""} className={input} />
        </div>
        <div>
          <label className={label}>Text</label>
          <textarea name="body" rows={6} defaultValue={editing?.body ?? ""} className={input} />
        </div>
        <div>
          <label className={label}>Obrázok (URL)</label>
          <input name="coverUrl" defaultValue={editing?.coverUrl ?? ""} className={input} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="published"
            defaultChecked={editing?.published ?? false}
            className="h-4 w-4 rounded border-slate-300"
          />
          Zverejnené
        </label>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          {editing ? "Uložiť zmeny" : "Vytvoriť článok"}
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Nadpis</th>
              <th className="px-4 py-2.5 font-medium">Typ</th>
              <th className="px-4 py-2.5 font-medium">Stav</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {posts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Žiadne články.
                </td>
              </tr>
            )}
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <a
                    href={`/admin/blog?edit=${p.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {p.title}
                  </a>
                  {p.school && <div className="text-xs text-slate-400">{p.school.name}</div>}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{TYPE_LABEL[p.type] ?? p.type}</td>
                <td className="px-4 py-2.5">
                  {p.published ? (
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
                  <form action={deletePost.bind(null, p.id)}>
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
