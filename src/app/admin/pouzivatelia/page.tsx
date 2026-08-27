import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { ROLE_LABEL } from "@/lib/constants";
import { createUser, updateUser, resetUserPassword, deleteUser } from "@/lib/admin-actions";

const input =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
const label = "mb-1 block text-xs font-medium text-slate-600";

export default async function PouzivateliaPage() {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) redirect("/admin");

  const users = await prisma.user.findMany({
    include: { school: { select: { name: true } } },
    orderBy: { email: "asc" },
  });
  const schools = await prisma.school.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Používatelia</h1>
        <p className="text-sm text-slate-500">Roly: administrátor, odbor školstva, škola.</p>
      </div>

      <form
        action={createUser}
        className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-5"
      >
        <div>
          <label className={label}>Meno</label>
          <input name="name" className={input} />
        </div>
        <div>
          <label className={label}>Email</label>
          <input name="email" type="email" className={input} />
        </div>
        <div>
          <label className={label}>Heslo</label>
          <input name="password" type="password" className={input} />
        </div>
        <div>
          <label className={label}>Rola</label>
          <select name="role" defaultValue="SKOLA" className={input}>
            <option value="ADMIN">Administrátor</option>
            <option value="SCHOLSTVO">Odbor školstva</option>
            <option value="SKOLA">Škola</option>
          </select>
        </div>
        <div>
          <label className={label}>Škola (pre rolu škola)</label>
          <select name="schoolId" defaultValue="" className={input}>
            <option value="">— žiadna —</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-5">
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Vytvoriť používateľa
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Používateľ</th>
              <th className="px-4 py-2.5 font-medium">Rola</th>
              <th className="px-4 py-2.5 font-medium">Škola</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="align-top hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <div className="font-medium text-slate-900">{u.name ?? "—"}</div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </td>
                <td className="px-4 py-2.5">
                  <form action={updateUser.bind(null, u.id)} className="flex items-center gap-2">
                    <select name="role" defaultValue={u.role} className={input + " !w-auto"}>
                      <option value="ADMIN">Administrátor</option>
                      <option value="SCHOLSTVO">Odbor školstva</option>
                      <option value="SKOLA">Škola</option>
                    </select>
                    <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">
                      Uložiť
                    </button>
                  </form>
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  <form action={updateUser.bind(null, u.id)} className="flex items-center gap-2">
                    <input type="hidden" name="role" value={u.role} />
                    <input type="hidden" name="name" value={u.name ?? ""} />
                    <select name="schoolId" defaultValue={u.schoolId ?? ""} className={input + " !w-auto"}>
                      <option value="">— žiadna —</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">
                      Uložiť
                    </button>
                  </form>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <form action={resetUserPassword.bind(null, u.id)} className="flex items-center gap-2">
                      <input
                        name="password"
                        type="password"
                        placeholder="nové heslo"
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none"
                      />
                      <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">
                        Reset
                      </button>
                    </form>
                    {u.id !== user.id && (
                      <form action={deleteUser.bind(null, u.id)}>
                        <button className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                          Zmazať
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
