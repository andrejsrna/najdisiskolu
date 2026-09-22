"use client";

import { useMemo, useState } from "react";
import { saveSimilarSchools } from "@/lib/school-actions";
import { SaveButton } from "@/components/admin-buttons";

type Candidate = { id: string; name: string; city: string };

const MAX_SELECTED = 3;

export function SimilarSchoolsPicker({
  schoolId,
  slug,
  candidates,
  initialSelected,
}: {
  schoolId: string;
  slug: string;
  candidates: Candidate[];
  initialSelected: string[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(initialSelected);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)
    );
  }, [candidates, query]);

  const toggle = (id: string) => {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= MAX_SELECTED) return current;
      return [...current, id];
    });
  };

  const limitReached = selected.length >= MAX_SELECTED;

  return (
    <form action={saveSimilarSchools.bind(null, schoolId, slug)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hľadať školu podľa názvu alebo mesta…"
          className="block w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <span className={`shrink-0 text-xs font-medium ${limitReached ? "text-amber-600" : "text-slate-500"}`}>
          Vybrané {selected.length} / {MAX_SELECTED}
        </span>
      </div>

      <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-slate-100 p-2 sm:grid-cols-2">
        {filtered.length === 0 && (
          <p className="col-span-full py-4 text-center text-sm text-slate-400">Žiadna škola nenájdená.</p>
        )}
        {filtered.map((candidate) => {
          const isChecked = selected.includes(candidate.id);
          const disabled = !isChecked && limitReached;
          return (
            <label
              key={candidate.id}
              className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-700 ${
                disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                name="similarSchools"
                value={candidate.id}
                checked={isChecked}
                disabled={disabled}
                onChange={() => toggle(candidate.id)}
                className="h-4 w-4 rounded border-slate-300"
              />
              {candidate.name} <span className="text-slate-400">· {candidate.city}</span>
            </label>
          );
        })}
      </div>

      <SaveButton className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
        Uložiť podobné školy
      </SaveButton>
    </form>
  );
}
