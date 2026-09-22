"use client";

import { useState } from "react";
import { setVeltrhSchools } from "@/lib/admin-actions";
import { SaveButton } from "@/components/admin-buttons";

type SchoolOption = { id: string; name: string };

export function VeltrhSchoolsPicker({
  veltrhId,
  schools,
  initialSelected,
}: {
  veltrhId: string;
  schools: SchoolOption[];
  initialSelected: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initialSelected);

  const allSelected = selected.length === schools.length && schools.length > 0;

  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  };

  const toggleAll = () => {
    setSelected(allSelected ? [] : schools.map((s) => s.id));
  };

  return (
    <form action={setVeltrhSchools.bind(null, veltrhId)} className="mt-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={toggleAll}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {allSelected ? "Zrušiť všetky" : "Vybrať všetky"}
        </button>
        <span className="text-xs text-slate-500">
          Vybrané {selected.length} / {schools.length}
        </span>
      </div>
      <div className="max-h-60 overflow-auto rounded-lg border border-slate-200 p-3">
        {schools.map((s) => (
          <label key={s.id} className="flex items-center gap-2 py-0.5 text-sm text-slate-700">
            <input
              type="checkbox"
              name="schools"
              value={s.id}
              checked={selected.includes(s.id)}
              onChange={() => toggle(s.id)}
              className="h-4 w-4 rounded border-slate-300"
            />
            {s.name}
          </label>
        ))}
      </div>
      <SaveButton savedLabel="Školy uložené ✓" className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
        Uložiť výber škôl
      </SaveButton>
    </form>
  );
}
