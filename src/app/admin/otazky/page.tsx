import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { saveFaq, deleteFaq } from "@/lib/admin-actions";
import { SaveButton, DeleteButton } from "@/components/admin-buttons";
import RichTextEditor from "@/components/RichTextEditor";

const input =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
const label = "mb-1 block text-xs font-medium text-slate-600";

export const dynamic = "force-dynamic";

export default async function OtazkyPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await requireUser();
  if (user.role !== Role.ADMIN && user.role !== Role.SCHOLSTVO) redirect("/admin");

  const { edit } = await searchParams;
  const editing = edit ? await prisma.faq.findUnique({ where: { id: edit } }) : null;

  const faqs = await prisma.faq.findMany({ orderBy: [{ group: "asc" }, { sort: "asc" }] });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Často kladené otázky</h1>
        <p className="text-sm text-slate-500">
          Obsah stránky <strong>Otázky a odpovede</strong>. Otázky s rovnakou skupinou sa
          zobrazia v jednej sekcii a v rámci nej sa zoraďujú podľa Poradia.
        </p>
      </div>

      <form action={saveFaq} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">
            {editing ? "Upraviť otázku" : "Nová otázka"}
          </div>
          {editing && (
            <a href="/admin/otazky" className="text-sm text-slate-500 hover:text-slate-900">
              Zrušiť úpravu
            </a>
          )}
        </div>
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div>
          <label className={label}>Skupina</label>
          <input
            name="group"
            required
            placeholder="napr. Prihláška - kedy a ako"
            defaultValue={editing?.group ?? ""}
            className={input}
          />
          <p className="mt-1 text-xs text-slate-400">
            Napíš existujúci názov skupiny a otázka sa do nej zaradí; nový názov vytvorí novú
            sekciu.
          </p>
        </div>

        <div>
          <label className={label}>Otázka</label>
          <input name="question" required defaultValue={editing?.question ?? ""} className={input} />
        </div>

        <div>
          <label className={label}>Odpoveď</label>
          <RichTextEditor name="answer" defaultValue={editing?.answer ?? ""} />
        </div>

        <div className="w-32">
          <label className={label}>Poradie</label>
          <input type="number" name="sort" defaultValue={editing?.sort ?? 0} className={input} />
        </div>

        <SaveButton className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          {editing ? "Uložiť zmeny" : "Pridať otázku"}
        </SaveButton>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Skupina</th>
              <th className="px-4 py-2.5 font-medium">Otázka</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {faqs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Žiadne otázky. Pridaj prvú vyššie.
                </td>
              </tr>
            )}
            {faqs.map((f) => (
              <tr key={f.id} className="align-top hover:bg-slate-50">
                <td className="px-4 py-2.5 align-top text-xs font-medium text-slate-500">
                  {f.group}
                </td>
                <td className="px-4 py-2.5 align-top">
                  <a
                    href={`/admin/otazky?edit=${f.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {f.question}
                  </a>
                </td>
                <td className="px-4 py-2.5 text-right align-top">
                  <form action={deleteFaq.bind(null, f.id)}>
                    <DeleteButton message="Naozaj zmazať túto otázku?" />
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
