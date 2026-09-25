"use client";

import { useState } from "react";

/**
 * Editor CSV zoznamu (napr. zamestnávatelia v duáli) s chipmi a × tlačidlom na odstránenie.
 * Synchronizuje hodnotu do skrytého inputu s daným `name`, ktorý sa odošle
 * spolu s okolitým <form> (žiadna vlastná server action).
 */
export function TagListEditor({
  name,
  initialItems,
  placeholder,
}: {
  name: string;
  initialItems: string[];
  placeholder?: string;
}) {
  const [items, setItems] = useState<string[]>(initialItems);
  const [draft, setDraft] = useState("");

  const commit = (next: string[]) => setItems(next);

  const addFromDraft = () => {
    const parts = draft
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    commit([...items, ...parts]);
    setDraft("");
  };

  const remove = (idx: number) => {
    commit(items.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <input type="hidden" name={name} value={items.join(", ")} />
      <div className="mb-2 flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span
            key={`${item}-${idx}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
          >
            {item}
            <button
              type="button"
              onClick={() => remove(idx)}
              aria-label={`Odstrániť ${item}`}
              className="text-slate-400 hover:text-red-600"
            >
              ×
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="text-xs text-slate-400">Žiadne položky.</span>}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addFromDraft();
            }
          }}
          placeholder={placeholder ?? "Napíš a stlač Enter…"}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={addFromDraft}
          className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Pridať
        </button>
      </div>
    </div>
  );
}
