import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { ROLE_LABEL } from "@/lib/constants";
import { creatableRolesFor } from "@/lib/roles";
import { updateUser, resetUserPassword, deleteUser } from "@/lib/admin-actions";
import { SaveButton, DeleteButton } from "@/components/admin-buttons";
import CreateUserForm from "./CreateUserForm";

const input =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: Role.ADMIN, label: ROLE_LABEL.ADMIN },
  { value: Role.SCHOLSTVO, label: ROLE_LABEL.SCHOLSTVO },
  { value: Role.SKOLA, label: ROLE_LABEL.SKOLA },
];

export default async function PouzivateliaPage() {
  const user = await requireUser();
  const isAdmin = user.role === Role.ADMIN;
  // Správu účtov majú iba admin a odbor školstva (editor).
  if (!isAdmin && user.role !== Role.SCHOLSTVO) redirect("/admin");

  const creatable = creatableRolesFor(user.role);
  const creatableOptions = ROLE_OPTIONS.filter((o) => creatable.includes(o.value));

  const allUsers = await prisma.user.findMany({
    include: { school: { select: { name: true, city: true } } },
    orderBy: { email: "asc" },
  });
  // Editor nevidí administrátorov.
  const users = isAdmin ? allUsers : allUsers.filter((u) => u.role !== Role.ADMIN);

  const schools = await prisma.school.findMany({
    select: { id: true, name: true, city: true },
    orderBy: [{ name: "asc" }, { city: "asc" }],
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Používatelia</h1>
        <p className="text-sm text-slate-500">
          {isAdmin
            ? "Administrátor vytvára účty pre všetky roly."
            : "Odbor školstva vytvára účty pre editorov a školy."}
        </p>
      </div>

      <CreateUserForm schools={schools} creatableRoles={creatableOptions} />

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
                      {ROLE_OPTIONS.filter((o) => creatable.includes(o.value)).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <SaveButton savedLabel="Uložené ✓" className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">
                      Uložiť
                    </SaveButton>
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
                          {s.name} · {s.city}
                        </option>
                      ))}
                    </select>
                    <SaveButton savedLabel="Uložené ✓" className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">
                      Uložiť
                    </SaveButton>
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
                        <DeleteButton
                          message="Naozaj zmazať tohto používateľa?"
                          className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        />
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
