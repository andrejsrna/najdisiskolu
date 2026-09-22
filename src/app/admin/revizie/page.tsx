import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  create: "Vytvorené",
  update: "Upravené",
  delete: "Zmazané",
};

const ACTION_BADGE: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-sky-100 text-sky-700",
  delete: "bg-rose-100 text-rose-700",
};

const ENTITY_LABEL: Record<string, string> = {
  School: "Škola",
  SchoolPhoto: "Fotka školy",
  User: "Používateľ",
  Post: "Blog",
  Review: "Recenzia",
  Badge: "Odznak",
  Faq: "FAQ",
  Veltrh: "Veľtrh",
  Tag: "Tag",
  Priestor: "Priestor",
  Setting: "Nastavenia",
  Odbor: "Odbor",
  Download: "Na stiahnutie",
  Project: "Projekt",
  Dod: "Deň otvorených dverí",
};

export default async function ReviziePage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; entity?: string }>;
}) {
  const user = await requireUser();
  if (user.role !== Role.ADMIN && user.role !== Role.SCHOLSTVO) redirect("/admin");

  const { user: userFilter, entity: entityFilter } = await searchParams;

  const [logs, users, entities] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        ...(userFilter ? { userEmail: userFilter } : {}),
        ...(entityFilter ? { entity: entityFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.auditLog.findMany({
      where: { userEmail: { not: null } },
      distinct: ["userEmail"],
      select: { userEmail: true, userName: true },
      orderBy: { userEmail: "asc" },
    }),
    prisma.auditLog.findMany({
      distinct: ["entity"],
      select: { entity: true },
      orderBy: { entity: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Revízie — kto čo urobil</h1>
        <p className="text-sm text-slate-500">
          Posledných 300 zmien v administrácii, najnovšie navrchu.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Používateľ</label>
          <select
            name="user"
            defaultValue={userFilter ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Všetci</option>
            {users.map((u) => (
              <option key={u.userEmail} value={u.userEmail ?? ""}>
                {u.userName ?? u.userEmail}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Oblasť</label>
          <select
            name="entity"
            defaultValue={entityFilter ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Všetky</option>
            {entities.map((e) => (
              <option key={e.entity} value={e.entity}>
                {ENTITY_LABEL[e.entity] ?? e.entity}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Filtrovať
        </button>
        {(userFilter || entityFilter) && (
          <a href="/admin/revizie" className="text-sm text-slate-500 hover:text-slate-900">
            Zrušiť filter
          </a>
        )}
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Kedy</th>
              <th className="px-4 py-2">Kto</th>
              <th className="px-4 py-2">Akcia</th>
              <th className="px-4 py-2">Oblasť</th>
              <th className="px-4 py-2">Popis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap px-4 py-2 text-slate-500">
                  {log.createdAt.toLocaleString("sk-SK", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="px-4 py-2 text-slate-900">{log.userName ?? log.userEmail ?? "—"}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_BADGE[log.action] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {ACTION_LABEL[log.action] ?? log.action}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-700">{ENTITY_LABEL[log.entity] ?? log.entity}</td>
                <td className="px-4 py-2 text-slate-700">{log.label ?? "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Žiadne záznamy.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
