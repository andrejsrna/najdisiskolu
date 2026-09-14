"use client";

import { useState } from "react";

/** Fulltext filter nad riadkami tabuľky škôl (data-name = názov + mesto). */
export function SearchBox() {
  const [q, setQ] = useState("");

  const filter = (value: string) => {
    const needle = value.trim().toLowerCase();
    const rows = document.querySelectorAll<HTMLTableRowElement>("tbody tr[data-name]");
    rows.forEach((row) => {
      row.style.display = !needle || row.dataset.name?.includes(needle) ? "" : "none";
    });
  };

  return (
    <div>
      <input
        type="text"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          filter(e.target.value);
        }}
        placeholder="Hľadať školu alebo mesto (napr. Rakovice)…"
        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />
    </div>
  );
}
