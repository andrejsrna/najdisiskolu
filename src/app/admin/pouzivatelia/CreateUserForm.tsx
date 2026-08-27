"use client";

import { useState } from "react";
import { createUser } from "@/lib/admin-actions";

const input =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400";
const label = "mb-1 block text-xs font-medium text-slate-600";

export type RoleOption = { value: string; label: string };

export default function CreateUserForm({
  schools,
  creatableRoles,
}: {
  schools: { id: string; name: string }[];
  creatableRoles: RoleOption[];
}) {
  const [role, setRole] = useState(creatableRoles.at(-1)?.value ?? "SKOLA");
  const needSchool = role === "SKOLA";

  return (
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
        <input name="email" type="email" required className={input} />
      </div>
      <div>
        <label className={label}>Heslo</label>
        <input name="password" type="password" required className={input} />
      </div>
      <div>
        <label className={label}>Rola</label>
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className={input}
        >
          {creatableRoles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={label}>
          Škola {needSchool && <span className="text-red-500">*</span>}
        </label>
        <select
          name="schoolId"
          defaultValue=""
          required={needSchool}
          disabled={!needSchool}
          className={input}
        >
          <option value="">— žiadna —</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2 sm:col-span-5">
        {needSchool && (
          <p className="mb-2 text-xs text-slate-500">
            Pri školskom účte je povinné priradiť konkrétnu školu.
          </p>
        )}
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          Vytvoriť používateľa
        </button>
      </div>
    </form>
  );
}
